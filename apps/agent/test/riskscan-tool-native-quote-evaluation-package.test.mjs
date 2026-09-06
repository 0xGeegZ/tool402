import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);

function directory(payment) {
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
              identity: { type: "boolean" },
              pricing: { type: "boolean" },
              limitations: { type: "boolean" },
              evidence: { type: "boolean" },
            },
          },
        },
      },
      limitations: ["quick_assessment_only", "caller_declarations_are_not_external_verification"],
      payment,
    }],
  };
}

test("evaluates a discovered native quote through the public Agent subpath", async () => {
  const { evaluateDiscoveredRiskScanNativeQuote } = require("@tool402/agent/riskscan-tool-native-quote-evaluation");
  const calls = [];
  const result = await evaluateDiscoveredRiskScanNativeQuote(
    new URL("http://service.test/example"),
    {
      network: "hedera:testnet",
      asset: "0.0.429274",
      maximumAmount: "9007199254740993",
    },
    async (input, init) => {
      calls.push([input, init]);
      return Response.json(directory({
        state: "locally_configured",
        protocol: "x402",
        network: "hedera:testnet",
        asset: "0.0.429274",
        amount: "9007199254740993",
      }));
    },
  );

  assert.deepEqual(calls, [[
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]]);
  assert.deepEqual(result, {
    kind: "eligible",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: 9007199254740993n,
  });
});
