import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { evaluateDiscoveredRiskScanNativeQuote } = require("../src/riskscan-tool-native-quote-evaluation.ts");

const base = new URL("http://service.test/example");

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

function unreadablePolicy() {
  const accesses = [];
  const policy = new Proxy({}, {
    get() {
      accesses.push("get");
      throw new Error("policy property reads are forbidden");
    },
    getPrototypeOf() {
      accesses.push("getPrototypeOf");
      throw new Error("policy reflection is forbidden");
    },
    ownKeys() {
      accesses.push("ownKeys");
      throw new Error("policy enumeration is forbidden");
    },
    getOwnPropertyDescriptor() {
      accesses.push("getOwnPropertyDescriptor");
      throw new Error("policy descriptors are forbidden");
    },
  });
  return {
    policy,
    assertUntouched() {
      assert.deepEqual(accesses, []);
    },
  };
}

const nativePayment = {
  state: "locally_configured",
  protocol: "x402",
  network: "hedera:testnet",
  asset: "0.0.429274",
  amount: "9007199254740993",
};

const eligible = {
  kind: "eligible",
  network: "hedera:testnet",
  asset: "0.0.429274",
  amount: 9007199254740993n,
};

test("evaluates a selected native summary after one exact injected directory GET", async () => {
  const calls = [];
  const result = await evaluateDiscoveredRiskScanNativeQuote(
    base,
    {
      network: "hedera:testnet",
      asset: "0.0.429274",
      maximumAmount: "9007199254740993",
    },
    async (input, init) => {
      calls.push([input, init]);
      return Response.json(directory(nativePayment));
    },
  );

  assert.deepEqual(calls, [[
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]]);
  assert.deepEqual(result, eligible);
});

test("returns directory failures without inspecting the opaque policy", async () => {
  const cases = [
    [async () => { throw new Error("offline"); }, { kind: "directory_unavailable" }],
    [async () => Response.json({ version: "v1", tools: [] }), { kind: "directory_invalid" }],
  ];

  for (const [respond, expected] of cases) {
    const unreadable = unreadablePolicy();
    let calls = 0;
    const result = await evaluateDiscoveredRiskScanNativeQuote(
      base,
      unreadable.policy,
      async (...arguments_) => {
        calls += 1;
        return respond(...arguments_);
      },
    );

    assert.deepEqual(result, expected);
    assert.equal(calls, 1);
    unreadable.assertUntouched();
  }
});

test("returns unavailable native summaries without inspecting the opaque policy", async () => {
  const cases = [
    { state: "configuration_required" },
    { state: "locally_configured", protocol: "x402", network: "eip155:8453", price: "$0.01" },
  ];

  for (const payment of cases) {
    const unreadable = unreadablePolicy();
    let calls = 0;
    const result = await evaluateDiscoveredRiskScanNativeQuote(
      base,
      unreadable.policy,
      async () => {
        calls += 1;
        return Response.json(directory(payment));
      },
    );

    assert.deepEqual(result, { kind: "native_summary_unavailable" });
    assert.equal(calls, 1);
    unreadable.assertUntouched();
  }
});

test("requires a function fetcher before global fetch or opaque policy inspection", async () => {
  const originalFetch = globalThis.fetch;
  let globalFetchCalls = 0;
  globalThis.fetch = async () => {
    globalFetchCalls += 1;
    throw new Error("global fetch is forbidden");
  };

  try {
    for (const fetcher of [undefined, null, 42, {}]) {
      const unreadable = unreadablePolicy();
      const result = await evaluateDiscoveredRiskScanNativeQuote(base, unreadable.policy, fetcher);
      assert.deepEqual(result, { kind: "directory_invalid" });
      unreadable.assertUntouched();
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(globalFetchCalls, 0);
});

test("returns the core native policy declines unchanged", async () => {
  const cases = [
    [
      { network: "hedera:testnet", asset: "0.0.429274" },
      { kind: "declined", reason: "invalid_policy" },
    ],
    [
      { network: "hedera:testnet", asset: "0.0.429274", maximumAmount: "9007199254740992" },
      { kind: "declined", reason: "amount_exceeds_maximum" },
    ],
    [
      { network: "hedera:testnet", asset: "0.0.429275", maximumAmount: "9007199254740993" },
      { kind: "declined", reason: "asset_mismatch" },
    ],
  ];

  for (const [policy, expected] of cases) {
    let calls = 0;
    const result = await evaluateDiscoveredRiskScanNativeQuote(
      base,
      policy,
      async () => {
        calls += 1;
        return Response.json(directory(nativePayment));
      },
    );

    assert.deepEqual(result, expected);
    assert.equal(calls, 1);
  }
});

test("uses independent directory request objects after fetcher mutation", async () => {
  const calls = [];
  const fetcher = async (input, init) => {
    calls.push([new URL(input), structuredClone(init)]);
    input.pathname = "/mutated";
    init.method = "POST";
    init.headers = { authorization: "not-allowed", "payment-required": "not-allowed" };
    init.body = "not-allowed";
    return Response.json(directory(nativePayment));
  };
  const policy = {
    network: "hedera:testnet",
    asset: "0.0.429274",
    maximumAmount: "9007199254740993",
  };

  const results = [
    await evaluateDiscoveredRiskScanNativeQuote(base, policy, fetcher),
    await evaluateDiscoveredRiskScanNativeQuote(base, policy, fetcher),
  ];

  assert.deepEqual(results, [eligible, eligible]);
  assert.deepEqual(calls, [
    [new URL("http://service.test/api/tools"), { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" }],
    [new URL("http://service.test/api/tools"), { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" }],
  ]);
});
