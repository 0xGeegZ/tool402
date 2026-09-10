import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { encodePaymentRequiredHeader } = require("@x402/core/http");
const { assessRiskScanQuick } = require("@tool402/core");
const paymentSource = new URL("../src/riskscan-tool-payment.ts", import.meta.url);
const cliSource = new URL("../src/riskscan-pay-cli.ts", import.meta.url);
const paymentModuleSpecifier = "../src/riskscan-tool-payment.ts";
let paymentModule;
let paymentModuleError;
let cliResolutionError;
try {
  require.resolve(paymentModuleSpecifier);
  paymentModule = require(paymentModuleSpecifier);
} catch (error) {
  paymentModuleError = error;
}
try {
  require.resolve("../src/riskscan-pay-cli.ts");
} catch (error) {
  cliResolutionError = error;
}
const createRiskScanQuickPaymentAgent = paymentModule?.createRiskScanQuickPaymentAgent;
const boundaryTest = paymentModuleError === undefined && cliResolutionError === undefined
  ? test
  : test.skip;

test("resolves the declared Agent payment CLI before boundary contracts run", () => {
  if (cliResolutionError !== undefined) throw cliResolutionError;
  assert.equal(fileURLToPath(cliSource).endsWith("/apps/agent/src/riskscan-pay-cli.ts"), true);
});
const acceptedM05Files = new Map([
  [new URL("../src/riskscan-tool-challenge.ts", import.meta.url), "b8334efc67b239d0bccc2b3faf38152991b998e123b145790b0671af3e10028d"],
  [new URL("../test/riskscan-tool-challenge.test.mjs", import.meta.url), "b3f67be47a8c5737acab0042b9fd79f4f7e077effa525514a25ed58ccad68a69"],
  [new URL("../test/riskscan-tool-challenge-boundary.test.mjs", import.meta.url), "88fdfd1fd07e09d2b5314ff4114f2f849fd88bc20590e87ce39a391f02c77854"],
]);

const base = new URL("http://service.test/example");
const input = {
  requestRef: "request-boundary-42",
  subjectRef: "service:tool402",
  context: "caller disclosure review",
  declarations: { identity: true, pricing: true, limitations: true, evidence: true },
};
const policy = { network: "hedera:testnet", asset: "0.0.429274", maximumAmount: "10000" };

function entityCheckDescriptor() {
  return {
    id: "entitycheck.fr",
    name: "EntityCheck France",
    request: { method: "POST", path: "/api/entitycheck", contentType: "application/json" },
    input: { type: "object", required: ["requestRef", "jurisdiction", "query"], properties: { requestRef: { type: "string", minLength: 1, maxLength: 96 }, jurisdiction: { type: "string", enum: ["FR"] }, query: { type: "string", minLength: 1, maxLength: 160 }, registrationNumber: { type: "string", pattern: "^[0-9]{9}$" } }, additionalProperties: false },
    result: { dispositions: ["found", "ambiguous", "not_found"], sanctionsScreen: ["clear", "hit", "not_screened"] },
    sources: ["FR_RECHERCHE_ENTREPRISES", "OFAC_SDN"],
    limitations: ["EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion."],
    configuration: { state: "configuration_required" },
  };
}

function directory() {
  return {
    version: "v2",
    tools: [{
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
      payment: {
        state: "locally_configured",
        protocol: "x402",
        network: "hedera:testnet",
        asset: "0.0.429274",
        amount: "10000",
      },
    }, entityCheckDescriptor()],
  };
}

function requirements() {
  return {
    scheme: "exact",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
    payTo: "0.0.1002",
    maxTimeoutSeconds: 60,
    extra: {},
  };
}

function safeFailureHarness(failureSource) {
  let signerCalls = 0;
  const signer = {
    accountId: "0.0.1001",
    async createPartiallySignedTransferTransaction() {
      signerCalls += 1;
      throw new Error("SECRET_SENTINEL_B03");
    },
  };
  const client = {
    getPaymentRequiredResponse() {
      return {
        x402Version: 2,
        resource: { url: "http://service.test/api/riskscan" },
        accepts: [requirements()],
      };
    },
    async createPaymentPayload() {
      if (failureSource === "sdk") throw new Error("SECRET_SENTINEL_B03");
      return signer.createPartiallySignedTransferTransaction(requirements());
    },
    encodePaymentSignatureHeader() {
      throw new Error("SECRET_SENTINEL_B03");
    },
    getPaymentSettleResponse() {
      throw new Error("SECRET_SENTINEL_B03");
    },
  };
  const agent = createRiskScanQuickPaymentAgent({
    signer,
    directoryFetcher: async () => Response.json(directory()),
    requestSender: async () => ({
      status: 402,
      headers: { get(name) { return name === "payment-required" ? "required-header" : null; } },
      async json() { throw new Error("response body is not part of a challenge"); },
    }),
    paymentClientFactory() { return client; },
  });
  return { agent, signerCalls: () => signerCalls };
}

function runCliWithoutConfiguration() {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [fileURLToPath(cliSource)],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        env: {
          B03_SECRET_SENTINEL: "SECRET_SENTINEL_B03",
          NODE_NO_WARNINGS: "1",
        },
        timeout: 2_000,
      },
      (error, stdout, stderr) => resolve({ error, stdout, stderr }),
    );
  });
}

function runCliPreflightWithoutConfiguration() {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ["--experimental-strip-types", fileURLToPath(cliSource), "--preflight"],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        env: {
          B03_SECRET_SENTINEL: "SECRET_SENTINEL_B03",
          NODE_NO_WARNINGS: "1",
        },
        timeout: 2_000,
      },
      (error, stdout, stderr) => resolve({ error, stdout, stderr }),
    );
  });
}

function runCliPreflight({
  paymentRequiredHeader,
  omitPaymentRequiredHeader = false,
  directoryFails = false,
  preflightPolicy = policy,
  defaultPayment = false,
} = {}) {
  const paymentRequired = {
    x402Version: 2,
    resource: { url: new URL("/api/riskscan", base).href },
    accepts: [requirements()],
  };
  const coreClientStub = [
    "const boundaries = globalThis.__B03_TEST_PAYMENT_BOUNDARIES;",
    "export class x402Client {",
    "  constructor() { boundaries.push('payment_client'); }",
    "  register() { boundaries.push('payment_register'); return this; }",
    "  setSpendControls() { boundaries.push('payment_spend_controls'); return this; }",
    "}",
    "export class x402HTTPClient {",
    "  constructor() { boundaries.push('factory'); }",
    "  getPaymentRequiredResponse() { boundaries.push('challenge_decode'); return globalThis.__B03_TEST_PAYMENT_REQUIRED; }",
    "  async createPaymentPayload() { boundaries.push('payment_payload'); return {}; }",
    "  encodePaymentSignatureHeader() { boundaries.push('payment_header'); return { 'payment-signature': 'test' }; }",
    "  getPaymentSettleResponse() { boundaries.push('settlement_decode'); return { success: true, network: 'hedera:testnet', transaction: '0.0.1@1.2' }; }",
    "}",
  ].join("\n");
  const coreClientStubUrl = `data:text/javascript,${encodeURIComponent(coreClientStub)}`;
  const moduleLoader = [
    "export async function resolve(specifier, context, nextResolve) {",
    `  if (specifier === '@x402/core/client') return { shortCircuit: true, url: ${JSON.stringify(coreClientStubUrl)} };`,
    "  return nextResolve(specifier, context);",
    "}",
  ].join("\n");
  const loader = [
    "import Module, { register } from 'node:module';",
    `register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(moduleLoader)}`)});`,
    `const directory = ${JSON.stringify(directory())};`,
    `const paymentRequired = ${JSON.stringify(paymentRequired)};`,
    `const paymentRequiredHeader = ${JSON.stringify(paymentRequiredHeader ?? encodePaymentRequiredHeader(paymentRequired))};`,
    `const omitPaymentRequiredHeader = ${JSON.stringify(omitPaymentRequiredHeader)};`,
    `const directoryFails = ${JSON.stringify(directoryFails)};`,
    `const paymentResult = ${JSON.stringify(assessRiskScanQuick(input))};`,
    `const payerAccessAllowed = ${JSON.stringify(defaultPayment)};`,
    "const originalProcess = process;",
    "const originalLoad = Module._load;",
    "const boundaries = [];",
    "globalThis.__B03_TEST_PAYMENT_BOUNDARIES = boundaries;",
    "globalThis.__B03_TEST_PAYMENT_REQUIRED = paymentRequired;",
    "Module._load = function(request, parent, isMain) {",
    "  if (request !== '@x402/hedera') return originalLoad.call(this, request, parent, isMain);",
    "  return {",
    "    ExactHederaScheme: class { constructor() { boundaries.push('scheme'); } },",
    "    PrivateKey: { fromString() { boundaries.push('private_key'); return {}; } },",
    "    createClientHederaSigner() { boundaries.push('signer'); return { accountId: '0.0.1001', async createPartiallySignedTransferTransaction() { boundaries.push('sign'); return 'test'; } }; },",
    "  };",
    "};",
    "globalThis.process = new Proxy(originalProcess, { get(target, key) {",
    "  if (key !== 'env') return Reflect.get(target, key, target);",
    "  return new Proxy(target.env, { get(environment, name) {",
    "    if (!payerAccessAllowed && (name === 'RISKSCAN_PAY_PAYER_ACCOUNT_ID' || name === 'RISKSCAN_PAY_PAYER_PRIVATE_KEY')) throw new Error('B03_TEST_PAYER_READ');",
    "    return Reflect.get(environment, name);",
    "  } });",
    "} });",
    "const requests = [];",
    "let riskScanRequests = 0;",
    "globalThis.fetch = async (target, init = {}) => {",
    "  const url = new URL(String(target));",
    "  const headers = new Headers(init.headers);",
    "  requests.push({ method: init.method ?? 'GET', path: url.pathname, body: init.body ?? null, authorization: headers.get('authorization'), paymentSignature: headers.get('payment-signature') });",
    "  if (url.pathname === '/api/tools' && (init.method ?? 'GET') === 'GET') {",
    "    if (directoryFails) throw new Error('SECRET_SENTINEL_B03');",
    "    return Response.json(directory);",
    "  }",
    "  if (url.pathname === '/api/riskscan' && init.method === 'POST' && ++riskScanRequests === 1) {",
    "    const response = new Response(null, { status: 402, headers: omitPaymentRequiredHeader ? {} : { 'payment-required': paymentRequiredHeader } });",
    "    response.json = async () => { throw new Error('B03_TEST_RESULT_PARSE'); };",
    "    return response;",
    "  }",
    "  if (url.pathname === '/api/riskscan' && init.method === 'POST' && riskScanRequests === 2) {",
    "    const response = new Response(null, { status: 200 });",
    "    response.json = async () => paymentResult;",
    "    return response;",
    "  }",
    "  throw new Error('B03_TEST_UNEXPECTED_REQUEST');",
    "};",
    "originalProcess.on('beforeExit', () => {",
    "  originalProcess.stdout.write(`B03_TEST_FETCHES ${JSON.stringify(requests)}\\n`);",
    "  originalProcess.stdout.write(`B03_TEST_PAYMENT_BOUNDARIES ${JSON.stringify(boundaries)}\\n`);",
    "});",
  ].join("\n");

  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ["--import", `data:text/javascript,${encodeURIComponent(loader)}`, "--experimental-strip-types", fileURLToPath(cliSource), ...(defaultPayment ? [] : ["--preflight"])],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        env: {
          B03_SECRET_SENTINEL: "SECRET_SENTINEL_B03",
          NODE_NO_WARNINGS: "1",
          RISKSCAN_PAY_SERVICE_BASE_URL: base.href,
          RISKSCAN_PAY_INPUT_JSON: JSON.stringify(input),
          RISKSCAN_PAY_POLICY_JSON: JSON.stringify(preflightPolicy),
          ...(defaultPayment ? {
            RISKSCAN_PAY_PAYER_ACCOUNT_ID: "0.0.1001",
            RISKSCAN_PAY_PAYER_PRIVATE_KEY: "test-private-key",
          } : {}),
        },
        timeout: 2_000,
      },
      (error, stdout, stderr) => resolve({ error, stdout, stderr }),
    );
  });
}

function preflightTrace(stdout) {
  const lines = stdout.trimEnd().split("\n");
  const fetchesLine = lines.at(-2);
  const boundariesLine = lines.at(-1);
  assert.match(fetchesLine, /^B03_TEST_FETCHES /u);
  assert.match(boundariesLine, /^B03_TEST_PAYMENT_BOUNDARIES /u);
  const requests = JSON.parse(fetchesLine.slice("B03_TEST_FETCHES ".length));
  const boundaries = JSON.parse(boundariesLine.slice("B03_TEST_PAYMENT_BOUNDARIES ".length));
  return { diagnostic: lines.slice(0, -2), requests, boundaries };
}

function assertUnsignedPreflightRequests(requests) {
  assert.deepEqual(requests, [
    { method: "GET", path: "/api/tools", body: null, authorization: null, paymentSignature: null },
    { method: "POST", path: "/api/riskscan", body: JSON.stringify(input), authorization: null, paymentSignature: null },
  ]);
}

async function assertPreflightChallengeRejected(options) {
  const { error, stdout, stderr } = await runCliPreflight(options);
  assert.notEqual(error, null);
  assert.equal(stderr, "");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03|B03_TEST_PAYER_READ|B03_TEST_RESULT_PARSE/u);
  const { diagnostic, requests, boundaries } = preflightTrace(stdout);
  assert.deepEqual(diagnostic, ["RISKSCAN_PAY_DIAGNOSTIC INITIAL_REQUEST_OR_CHALLENGE_FAILED"]);
  assertUnsignedPreflightRequests(requests);
  assert.deepEqual(boundaries, []);
}

boundaryTest("keeps the B03 library to injected capabilities and the single approved Agent/Core composition", async () => {
  const text = await readFile(paymentSource, "utf8");

  assert.match(text, /discoverRiskScanQuick/u);
  assert.match(text, /evaluateRiskScanNativeQuote/u);
  for (const forbidden of [
    /riskscan-tool-challenge|requestRiskScanQuickChallenge|riskscan-tool-flow|evaluateDiscoveredRiskScanNativeQuote/u,
    /process\.env|createClientHederaSigner|PrivateKey|Hedera.*Client|Network\.(?:init|connect)/u,
    /(?:node:)?fs|child_process|worker_threads|localStorage|sessionStorage|indexedDB/u,
    /\bconsole\.(?:log|info|warn|error|debug)\b/u,
    /\bfetch\b|import\s*\(/u,
    /setTimeout|setInterval|setImmediate|queueMicrotask|Promise\.race/u,
  ]) assert.doesNotMatch(text, forbidden);
});

boundaryTest("preserves the accepted M05 observe-only source and tests byte-for-byte", async () => {
  for (const [path, expectedHash] of acceptedM05Files) {
    const content = await readFile(path);
    const actualHash = createHash("sha256").update(content).digest("hex");
    assert.equal(actualHash, expectedHash, fileURLToPath(path));
  }
});

boundaryTest("publishes the payment boundary and its exact direct x402 dependencies through the Agent manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const lockfile = JSON.parse(await readFile(new URL("../../../package-lock.json", import.meta.url), "utf8"));

  assert.equal(manifest.exports["./riskscan-tool-payment"], "./src/riskscan-tool-payment.ts");
  assert.match(manifest.scripts["riskscan:pay"], /^node(?: --experimental-strip-types)? src\/riskscan-pay-cli\.ts$/u);
  assert.equal(manifest.dependencies["@x402/core"], "2.25.0");
  assert.equal(manifest.dependencies["@x402/hedera"], "2.25.0");
  assert.equal(lockfile.packages["apps/agent"].dependencies["@x402/core"], "2.25.0");
  assert.equal(lockfile.packages["apps/agent"].dependencies["@x402/hedera"], "2.25.0");

  const published = require("@tool402/agent/riskscan-tool-payment");
  assert.equal(published.createRiskScanQuickPaymentAgent, createRiskScanQuickPaymentAgent);
});

boundaryTest("never falls back to global fetch when both request seams are supplied", async () => {
  let globalFetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    globalFetchCalls += 1;
    throw new Error("global fetch must remain unused");
  };

  try {
    const agent = createRiskScanQuickPaymentAgent({
      signer: {
        accountId: "0.0.1001",
        async createPartiallySignedTransferTransaction() { throw new Error("must not sign"); },
      },
      directoryFetcher: async () => Response.json(directory()),
      requestSender: async () => ({ status: 503, headers: { get() { return null; } } }),
      paymentClientFactory() {
        return {
          getPaymentRequiredResponse() { throw new Error("must not decode a 503 response"); },
          async createPaymentPayload() { throw new Error("must not create a 503 payload"); },
          encodePaymentSignatureHeader() { throw new Error("must not encode a 503 payload"); },
          getPaymentSettleResponse() { throw new Error("must not settle a 503 response"); },
        };
      },
    });
    const result = await agent.pay(base, input, policy);
    assert.deepEqual(result, { kind: "unavailable" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(globalFetchCalls, 0);
});

boundaryTest("maps signer or SDK sentinels to a closed safe outcome without process output", async () => {
  const writes = [];
  const originalConsole = Object.fromEntries(
    ["log", "info", "warn", "error", "debug"].map((name) => [name, console[name]]),
  );
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;

  for (const name of Object.keys(originalConsole)) {
    console[name] = (...values) => { writes.push(values); };
  }
  process.stdout.write = (...values) => { writes.push(values); return true; };
  process.stderr.write = (...values) => { writes.push(values); return true; };

  const outcomes = [];
  try {
    for (const failureSource of ["signer", "sdk"]) {
      const { agent, signerCalls } = safeFailureHarness(failureSource);
      const result = await agent.pay(base, input, policy);
      outcomes.push(result);
      assert.equal(signerCalls(), failureSource === "signer" ? 1 : 0);
    }
  } finally {
    for (const [name, original] of Object.entries(originalConsole)) console[name] = original;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }

  assert.deepEqual(outcomes, [
    { kind: "payment_failed", reason: "payment_payload_rejected" },
    { kind: "payment_failed", reason: "payment_payload_rejected" },
  ]);
  assert.doesNotMatch(JSON.stringify(outcomes), /SECRET_SENTINEL_B03/u);
  assert.deepEqual(writes, []);
});

boundaryTest("keeps the CLI as the only runtime configuration edge and redacts a missing-config failure", async () => {
  const text = await readFile(cliSource, "utf8");
  assert.match(text, /process\.env/u);
  for (const forbidden of [
    /(?:node:)?fs|child_process|worker_threads|localStorage|sessionStorage|indexedDB/u,
    /console\.(?:log|info|warn|error|debug)\s*\([^)]*process\.env/u,
    /console\.(?:log|info|warn|error|debug)\s*\([^)]*(?:error|exception)\.(?:message|stack)/u,
  ]) assert.doesNotMatch(text, forbidden);

  const { error, stdout, stderr } = await runCliWithoutConfiguration();
  assert.notEqual(error, null);
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03/u);
});

boundaryTest("maps a missing preflight configuration to a closed nonzero diagnostic", async () => {
  const { error, stdout, stderr } = await runCliPreflightWithoutConfiguration();

  assert.notEqual(error, null);
  assert.equal(stderr, "");
  assert.equal(stdout, "RISKSCAN_PAY_DIAGNOSTIC CONFIGURATION_INVALID\n");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03/u);
});

boundaryTest("maps a preflight directory failure before every payment boundary", async () => {
  const { error, stdout, stderr } = await runCliPreflight({ directoryFails: true });

  assert.notEqual(error, null);
  assert.equal(stderr, "");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03|B03_TEST_PAYER_READ/u);
  const { diagnostic, requests, boundaries } = preflightTrace(stdout);
  assert.deepEqual(diagnostic, ["RISKSCAN_PAY_DIAGNOSTIC DIRECTORY_FAILED"]);
  assert.deepEqual(requests, [
    { method: "GET", path: "/api/tools", body: null, authorization: null, paymentSignature: null },
  ]);
  assert.deepEqual(boundaries, []);
});

boundaryTest("maps a policy-declined preflight quote before every payment boundary", async () => {
  const { error, stdout, stderr } = await runCliPreflight({
    preflightPolicy: { ...policy, maximumAmount: "9999" },
  });

  assert.notEqual(error, null);
  assert.equal(stderr, "");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03|B03_TEST_PAYER_READ/u);
  const { diagnostic, requests, boundaries } = preflightTrace(stdout);
  assert.deepEqual(diagnostic, ["RISKSCAN_PAY_DIAGNOSTIC QUOTE_DECLINED"]);
  assert.deepEqual(requests, [
    { method: "GET", path: "/api/tools", body: null, authorization: null, paymentSignature: null },
  ]);
  assert.deepEqual(boundaries, []);
});

boundaryTest("runs the opt-in preflight through one unsigned Directory and initial request before the guard", async () => {
  const { error, stdout, stderr } = await runCliPreflight();

  assert.equal(error, null);
  assert.equal(stderr, "");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03|B03_TEST_PAYER_READ|B03_TEST_RESULT_PARSE/u);
  const { diagnostic, requests, boundaries } = preflightTrace(stdout);
  assert.deepEqual(diagnostic, ["RISKSCAN_PAY_DIAGNOSTIC PREFLIGHT_GUARD_REACHED"]);
  assertUnsignedPreflightRequests(requests);
  assert.deepEqual(boundaries, []);
});

boundaryTest("rejects a malformed challenge during preflight before every payment boundary", async () => {
  const { error, stdout, stderr } = await runCliPreflight({ paymentRequiredHeader: "not-a-payment-required-header" });

  assert.notEqual(error, null);
  assert.equal(stderr, "");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03|B03_TEST_PAYER_READ|B03_TEST_RESULT_PARSE/u);
  const { diagnostic, requests, boundaries } = preflightTrace(stdout);
  assert.deepEqual(diagnostic, ["RISKSCAN_PAY_DIAGNOSTIC INITIAL_REQUEST_OR_CHALLENGE_FAILED"]);
  assertUnsignedPreflightRequests(requests);
  assert.deepEqual(boundaries, []);
});

boundaryTest("rejects an exact-quote mismatch during preflight before every payment boundary", async () => {
  const mismatch = {
    x402Version: 2,
    resource: { url: new URL("/api/riskscan", base).href },
    accepts: [{ ...requirements(), amount: "10001" }],
  };
  const { error, stdout, stderr } = await runCliPreflight({
    paymentRequiredHeader: encodePaymentRequiredHeader(mismatch),
  });

  assert.notEqual(error, null);
  assert.equal(stderr, "");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03|B03_TEST_PAYER_READ|B03_TEST_RESULT_PARSE/u);
  const { diagnostic, requests, boundaries } = preflightTrace(stdout);
  assert.deepEqual(diagnostic, ["RISKSCAN_PAY_DIAGNOSTIC INITIAL_REQUEST_OR_CHALLENGE_FAILED"]);
  assertUnsignedPreflightRequests(requests);
  assert.deepEqual(boundaries, []);
});

boundaryTest("rejects a missing preflight challenge before every payment boundary", async () => {
  await assertPreflightChallengeRejected({ omitPaymentRequiredHeader: true });
});

for (const [field, value] of [
  ["scheme", "upto"],
  ["network", "hedera:mainnet"],
  ["asset", "0.0.429275"],
]) {
  boundaryTest(`rejects a preflight challenge with a mismatched ${field} before every payment boundary`, async () => {
    const mismatch = {
      x402Version: 2,
      resource: { url: new URL("/api/riskscan", base).href },
      accepts: [{ ...requirements(), [field]: value }],
    };
    await assertPreflightChallengeRejected({
      paymentRequiredHeader: encodePaymentRequiredHeader(mismatch),
    });
  });
}

boundaryTest("preserves normal payment output and exit behavior while adding only the paid diagnostic", async () => {
  const { error, stdout, stderr } = await runCliPreflight({ defaultPayment: true });

  assert.equal(error, null);
  assert.equal(stderr, "");
  assert.doesNotMatch(`${stdout}${stderr}`, /SECRET_SENTINEL_B03|B03_TEST_RESULT_PARSE/u);
  const { diagnostic, requests, boundaries } = preflightTrace(stdout);
  assert.deepEqual(diagnostic, [
    "RISKSCAN_PAY_OUTCOME paid",
    "RISKSCAN_PAY_SETTLEMENT 0.0.1@1.2",
    "RISKSCAN_PAY_DIAGNOSTIC PAID",
  ]);
  assert.equal(requests.length, 3);
  assert.deepEqual(requests.slice(0, 2), [
    { method: "GET", path: "/api/tools", body: null, authorization: null, paymentSignature: null },
    { method: "POST", path: "/api/riskscan", body: JSON.stringify(input), authorization: null, paymentSignature: null },
  ]);
  assert.equal(requests[2].method, "POST");
  assert.equal(requests[2].path, "/api/riskscan");
  assert.match(String(requests[2].paymentSignature), /test/u);
  assert.deepEqual(boundaries, [
    "private_key",
    "signer",
    "scheme",
    "payment_client",
    "payment_register",
    "payment_spend_controls",
    "factory",
    "challenge_decode",
    "payment_payload",
    "payment_header",
    "settlement_decode",
  ]);
});
