import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { buildToolDirectory, toolDirectoryResponse } = require("../src/lib/tool-directory.ts");

const configuredEnvironment = {
  RISKSCAN_X402_PAY_TO: `0x${"1".repeat(40)}`,
  RISKSCAN_X402_FACILITATOR_URL: "https://facilitator.invalid/controlled-private-path",
  RISKSCAN_X402_NETWORK: "eip155:84532",
  RISKSCAN_X402_PRICE: "$0.01",
};

const expectedDescriptor = {
  id: "riskscan.quick",
  name: "RiskScan Quick",
  request: { method: "POST", path: "/api/riskscan", contentType: "application/json" },
  input: {
    type: "object",
    required: ["requestRef", "subjectRef", "context", "declarations"],
    properties: {
      requestRef: { type: "string", minLength: 1, maxLength: 96 },
      subjectRef: { type: "string", minLength: 1, maxLength: 160 },
      context: { type: "string", minLength: 1, maxLength: 280 },
      declarations: {
        type: "object",
        additionalProperties: false,
        required: ["identity", "pricing", "limitations", "evidence"],
        properties: {
          identity: { type: "boolean" },
          pricing: { type: "boolean" },
          limitations: { type: "boolean" },
          evidence: { type: "boolean" },
        },
      },
    },
  },
  limitations: ["quick_assessment_only", "caller_declarations_are_not_external_verification"],
};

test("describes exactly one Quick tool with the accepted bounded input and limitations", () => {
  assert.deepEqual(buildToolDirectory({}), {
    version: "v1",
    tools: [{ ...expectedDescriptor, payment: { state: "configuration_required" } }],
  });
});

test("fails closed when any configuration field is missing or malformed", () => {
  const malformed = {
    RISKSCAN_X402_PAY_TO: ["", "recipient", `0x${"1".repeat(39)}`],
    RISKSCAN_X402_FACILITATOR_URL: ["", "http://facilitator.invalid", "https://user:secret@facilitator.invalid"],
    RISKSCAN_X402_NETWORK: ["", "eip155:0", "eip155:01", "other:1"],
    RISKSCAN_X402_PRICE: ["", "$0", "0.01", "$-1"],
  };
  for (const [key, values] of Object.entries(malformed)) {
    for (const value of [undefined, ...values]) {
      const directory = buildToolDirectory({ ...configuredEnvironment, [key]: value });
      assert.deepEqual(directory, {
        version: "v1",
        tools: [{ ...expectedDescriptor, payment: { state: "configuration_required" } }],
      });
    }
  }
});

test("exposes only parsed local protocol, network and price for valid configuration", () => {
  const directory = buildToolDirectory({
    ...configuredEnvironment,
    RISKSCAN_X402_NETWORK: " eip155:11155111 ",
    RISKSCAN_X402_PRICE: " $1.25 ",
  });
  assert.deepEqual(directory, {
    version: "v1",
    tools: [{
      ...expectedDescriptor,
      payment: { state: "locally_configured", protocol: "x402", network: "eip155:11155111", price: "$1.25" },
    }],
  });
});

test("returns JSON with no-store and never serializes controlled private environment values", async () => {
  const privateEnvironment = {
    CREDENTIAL: "controlled-credential-secret",
    PAYMENT_SIGNATURE: "controlled-payment-header",
    PAYMENT_PAYLOAD: "controlled-payment-payload",
    WALLET: "controlled-wallet-material",
    ACCOUNT: "controlled-account-material",
    TRANSACTION: "controlled-transaction-reference",
    RECEIPT: "controlled-receipt-reference",
    EVIDENCE: "controlled-evidence-reference",
    RESULT: "controlled-result-content",
  };
  for (const environment of [privateEnvironment, { ...configuredEnvironment, ...privateEnvironment }]) {
    const response = toolDirectoryResponse(Object.freeze(environment));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^application\/json(?:;|$)/u);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), buildToolDirectory(environment));
    for (const secret of [
      ...Object.values(privateEnvironment),
      configuredEnvironment.RISKSCAN_X402_PAY_TO,
      configuredEnvironment.RISKSCAN_X402_FACILITATOR_URL,
    ]) {
      assert.equal(body.includes(secret), false);
    }
  }
});

test("uses one parser pass and keeps separate directory builds independent", () => {
  const reads = [];
  const environment = new Proxy(Object.freeze({ ...configuredEnvironment }), {
    get(target, key) {
      assert.ok(Object.hasOwn(target, key), `unexpected environment read: ${String(key)}`);
      reads.push(key);
      return target[key];
    },
    set() { throw new Error("environment mutation is forbidden"); },
  });
  const directory = buildToolDirectory(environment);
  assert.deepEqual(reads, Object.keys(configuredEnvironment));
  directory.tools[0].input.required.push("unexpected");
  directory.tools[0].input.properties.declarations.required.length = 0;
  assert.deepEqual(buildToolDirectory({}), {
    version: "v1",
    tools: [{ ...expectedDescriptor, payment: { state: "configuration_required" } }],
  });
});

test("constructs directory responses without network, tool, payment, backend, clock or random calls", (t) => {
  const forbidden = () => { throw new Error("external or state-changing operation is forbidden"); };
  const Module = require("node:module");
  t.mock.method(Module, "_load", forbidden);
  for (const name of ["fetch", "Date", "setTimeout", "setInterval", "setImmediate"]) {
    t.mock.method(globalThis, name, forbidden);
  }
  t.mock.method(Math, "random", forbidden);
  for (const environment of [{}, configuredEnvironment]) {
    assert.equal(buildToolDirectory(Object.freeze(environment)).tools.length, 1);
    assert.equal(toolDirectoryResponse(environment).status, 200);
  }
});

test("registers only a GET route with request-time environment access and no legacy cache configuration", () => {
  const route = readFileSync(new URL("../src/app/api/tools/route.ts", import.meta.url), "utf8");
  assert.match(route, /import\s*\{\s*connection\s*\}\s*from\s*["']next\/server["']/u);
  assert.match(route, /import\s*\{\s*toolDirectoryResponse\s*\}\s*from\s*["']\.\.\/\.\.\/\.\.\/lib\/tool-directory(?:\.ts)?["']/u);
  assert.match(route, /export\s+async\s+function\s+GET\(\)\s*\{\s*await\s+connection\(\);\s*return\s+toolDirectoryResponse\(process\.env\);\s*\}/u);
  assert.equal((route.match(/\bexport\b/gu) ?? []).length, 1);
  assert.equal((route.match(/\bimport\b/gu) ?? []).length, 2);
  assert.equal((route.match(/process\.env/gu) ?? []).length, 1);
  assert.doesNotMatch(route, /\b(?:dynamic|revalidate|fetchCache)\b/u);
  const builder = readFileSync(new URL("../src/lib/tool-directory.ts", import.meta.url), "utf8");
  const imports = builder.match(/^import .+;$/gmu);
  assert.deepEqual(imports, ['import { readRiskScanX402Configuration } from "./riskscan-x402.ts";']);
  assert.equal((builder.match(/readRiskScanX402Configuration\(/gu) ?? []).length, 1);
  assert.doesNotMatch(builder, /\b(?:process|fetch|require|import\(|Date|setTimeout|setInterval|Math\.random)\b/u);
});
