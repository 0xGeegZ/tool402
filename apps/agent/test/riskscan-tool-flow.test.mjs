import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { runRiskScanQuickFlow } = require("../src/riskscan-tool-flow.ts");

const base = new URL("http://service.test/example");
const input = {
  requestRef: "request-agent-42",
  subjectRef: "service:tool402",
  context: "caller disclosure review",
  declarations: { identity: true, pricing: true, limitations: true, evidence: true },
};

function directory() {
  return {
    version: "v1",
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
              identity: { type: "boolean" }, pricing: { type: "boolean" },
              limitations: { type: "boolean" }, evidence: { type: "boolean" },
            },
          },
        },
      },
      limitations: ["quick_assessment_only", "caller_declarations_are_not_external_verification"],
      payment: {
        state: "locally_configured", protocol: "x402", network: "hedera:testnet", asset: "0.0.429274", amount: "10000",
      },
    }],
  };
}

function response(status, challenge) {
  return {
    status,
    headers: { get(name) { return name === "payment-required" ? challenge : null; } },
    json() { throw new Error("response body must not be read"); },
    text() { throw new Error("response body must not be read"); },
    arrayBuffer() { throw new Error("response body must not be read"); },
    blob() { throw new Error("response body must not be read"); },
    formData() { throw new Error("response body must not be read"); },
  };
}

test("delegates the exact credential-free GET then unsigned POST and hides the challenge", async () => {
  const directoryCalls = [];
  const challengeCalls = [];
  const result = await runRiskScanQuickFlow(
    base,
    input,
    async (target, init) => {
      directoryCalls.push([target, init]);
      return Response.json(directory());
    },
    async (target, init) => {
      challengeCalls.push([target, init]);
      return response(402, "controlled-challenge-value");
    },
  );
  assert.deepEqual(result, { kind: "payment_required" });
  assert.deepEqual(directoryCalls, [[
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]]);
  assert.deepEqual(challengeCalls, [[
    new URL("http://service.test/api/riskscan"),
    { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(input), credentials: "omit", redirect: "error" },
  ]]);
});

test("does not call the challenge sender when discovery cannot select the tool", async () => {
  const directoryCases = [
    async () => { throw new Error("offline"); },
    async () => response(503),
    async () => Response.json({ version: "v1", tools: [] }),
  ];
  for (const fetcher of directoryCases) {
    let challengeCalls = 0;
    const result = await runRiskScanQuickFlow(base, input, fetcher, async () => {
      challengeCalls += 1;
      return response(402, "controlled-challenge-value");
    });
    assert.ok(["directory_unavailable", "directory_invalid"].includes(result.kind));
    assert.equal(challengeCalls, 0);
  }
});

test("lets the challenge boundary reject invalid input and base without a POST", async () => {
  for (const [serviceBase, value, expected] of [
    [base, { ...input, context: "   " }, "input_invalid"],
    [new URL("ftp://service.test/"), input, "directory_invalid"],
  ]) {
    let challengeCalls = 0;
    const result = await runRiskScanQuickFlow(serviceBase, value, async () => Response.json(directory()), async () => {
      challengeCalls += 1;
      return response(402, "controlled-challenge-value");
    });
    assert.deepEqual(result, { kind: expected });
    assert.equal(challengeCalls, 0);
  }
});

test("preserves challenge terminal mappings after selected discovery", async () => {
  const cases = [
    [async () => { throw new Error("offline"); }, { kind: "transport_failure" }],
    [async () => response(503), { kind: "unavailable" }],
    [async () => response(402, "  "), { kind: "unexpected_response" }],
    [async () => response(402), { kind: "unexpected_response" }],
    [async () => response(200), { kind: "unexpected_response" }],
  ];
  for (const [sender, expected] of cases) {
    const result = await runRiskScanQuickFlow(base, input, async () => Response.json(directory()), sender);
    assert.deepEqual(result, expected);
  }
});

test("uses independent request objects after injected sender mutation", async () => {
  const calls = [];
  const fetcher = async (target, init) => {
    calls.push([new URL(target), structuredClone(init)]);
    target.pathname = "/mutated";
    init.method = "POST";
    init.headers = { authorization: "not-allowed" };
    return Response.json(directory());
  };
  const sender = async (target, init) => {
    calls.push([new URL(target), structuredClone(init)]);
    target.pathname = "/mutated";
    init.method = "GET";
    init.headers = { authorization: "not-allowed" };
    return response(503);
  };
  await runRiskScanQuickFlow(base, input, fetcher, sender);
  await runRiskScanQuickFlow(base, input, fetcher, sender);
  assert.deepEqual(calls.slice(2), [
    [new URL("http://service.test/api/tools"), { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" }],
    [new URL("http://service.test/api/riskscan"), { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(input), credentials: "omit", redirect: "error" }],
  ]);
});
