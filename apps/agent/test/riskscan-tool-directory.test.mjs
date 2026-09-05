import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { discoverRiskScanQuick } = require("../src/riskscan-tool-directory.ts");

function directory(payment = { state: "configuration_required" }) {
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
      payment,
    }],
  };
}

const base = new URL("http://service.test/example");

async function select(value = directory()) {
  let calls = 0;
  const result = await discoverRiskScanQuick(base, async () => {
    calls += 1;
    return Response.json(value);
  });
  return { result, calls };
}

test("selects the canonical descriptor", async () => {
  const { result } = await select();
  assert.deepEqual(result, {
    kind: "tool_selected",
    tool: directory().tools[0],
  });
});

test("makes exactly one credential-free GET request to the directory", async () => {
  const calls = [];
  await discoverRiskScanQuick(base, async (input, init) => {
    calls.push([input, init]);
    return Response.json(directory());
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]);
});

test("uses a fresh exact request shape after a fetcher mutates its init", async () => {
  const calls = [];
  await discoverRiskScanQuick(base, async (input, init) => {
    calls.push([input, structuredClone(init)]);
    init.method = "POST";
    init.headers = { authorization: "not-allowed", "payment-required": "not-allowed" };
    init.body = "not-allowed";
    return Response.json(directory());
  });
  await discoverRiskScanQuick(base, async (input, init) => {
    calls.push([input, init]);
    return Response.json(directory());
  });
  assert.deepEqual(calls, [
    [new URL("http://service.test/api/tools"), { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" }],
    [new URL("http://service.test/api/tools"), { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" }],
  ]);
});

test("accepts both approved payment states", async () => {
  for (const payment of [
    { state: "configuration_required" },
    { state: "locally_configured", protocol: "x402", network: "eip155:8453", price: "$0.01" },
  ]) {
    const { result } = await select(directory(payment));
    assert.equal(result.kind, "tool_selected");
  }
});

test("accepts and clones the native Hedera payment summary", async () => {
  const payment = {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
  };
  const value = directory(payment);
  const { result } = await select(value);

  assert.deepEqual(result.tool.payment, payment);
  assert.notEqual(result.tool.payment, payment);
  payment.amount = "99999";
  assert.deepEqual(result.tool.payment, {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
  });
});

test("accepts the native Hedera zero account asset", async () => {
  const { result } = await select(directory({
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.0",
    amount: "1",
  }));

  assert.equal(result.kind, "tool_selected");
  assert.deepEqual(result.tool.payment, {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.0",
    amount: "1",
  });
});

test("rejects malformed native Hedera payment summaries", async () => {
  const valid = {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
  };
  const invalid = [
    { ...valid, network: "hedera:mainnet" },
    { ...valid, asset: "0.0" },
    { ...valid, asset: "00.0.429274" },
    { ...valid, asset: "0.00.429274" },
    { ...valid, asset: "0.0.0429274" },
    { ...valid, amount: "0" },
    { ...valid, amount: "010000" },
    { ...valid, amount: "10000.0" },
    { ...valid, price: "$0.01" },
  ];
  for (const payment of invalid) {
    const { result, calls } = await select(directory(payment));
    assert.deepEqual(result, { kind: "directory_invalid" });
    assert.equal(calls, 1);
  }
});

test("rejects native Hedera payment summaries with missing, extra, accessor, or hostile proxy fields", async () => {
  const valid = {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
  };
  const accessor = { ...valid };
  Object.defineProperty(accessor, "asset", { enumerable: true, get: () => "0.0.429274" });
  const proxy = new Proxy({ ...valid }, {
    getOwnPropertyDescriptor() { throw new Error("proxy descriptors are not trusted"); },
  });
  const invalid = [
    (() => { const { amount, ...payment } = valid; return payment; })(),
    { ...valid, recipient: "0.0.1111" },
    accessor,
    proxy,
  ];
  for (const payment of invalid) {
    const value = directory(payment);
    const result = await discoverRiskScanQuick(base, async () => ({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => value,
    }));
    assert.deepEqual(result, { kind: "directory_invalid" });
  }
});

test("rejects invalid bases without fetching", async () => {
  for (const invalidBase of [new URL("ftp://service.test/"), new URL("http://user@service.test/")]) {
    let calls = 0;
    const result = await discoverRiskScanQuick(invalidBase, async () => {
      calls += 1;
      return Response.json(directory());
    });
    assert.deepEqual(result, { kind: "directory_invalid" });
    assert.equal(calls, 0);
  }
});

test("fails closed without fetching when an allowed URL facade throws on inspection", async () => {
  const hostileBase = new Proxy(base, { get() { throw new Error("URL inspection must not escape"); } });
  let calls = 0;
  let result;
  await assert.doesNotReject(async () => {
    result = await discoverRiskScanQuick(hostileBase, async () => {
      calls += 1;
      return Response.json(directory());
    });
  });
  assert.deepEqual(result, { kind: "directory_invalid" });
  assert.equal(calls, 0);
});

test("rejects a base that throws while constructing the directory target", async () => {
  class ThrowingUrl extends URL {
    toString() { throw new Error("target conversion must not become unavailable"); }
  }
  let calls = 0;
  const result = await discoverRiskScanQuick(new ThrowingUrl("http://service.test/"), async () => {
    calls += 1;
    return Response.json(directory());
  });
  assert.deepEqual(result, { kind: "directory_invalid" });
  assert.equal(calls, 0);
});

test("rejects a constructed directory target with a different protocol without fetching", async () => {
  class DifferentProtocolUrl extends URL {
    toString() { return "ftp://service.test/"; }
  }
  let calls = 0;
  const result = await discoverRiskScanQuick(new DifferentProtocolUrl("https://service.test/"), async () => {
    calls += 1;
    return Response.json(directory());
  });
  assert.deepEqual(result, { kind: "directory_invalid" });
  assert.equal(calls, 0);
});

test("rejects a constructed directory target with user-info without fetching", async () => {
  class UserInfoUrl extends URL {
    toString() { return "https://user:secret@service.test/"; }
  }
  let calls = 0;
  const result = await discoverRiskScanQuick(new UserInfoUrl("https://service.test/"), async () => {
    calls += 1;
    return Response.json(directory());
  });
  assert.deepEqual(result, { kind: "directory_invalid" });
  assert.equal(calls, 0);
});

test("maps fetch failures and non-200 responses to unavailable", async () => {
  for (const fetcher of [
    async () => { throw new Error("offline"); },
    async () => new Response(null, { status: 503 }),
  ]) {
    const result = await discoverRiskScanQuick(base, fetcher);
    assert.deepEqual(result, { kind: "directory_unavailable" });
  }
});

test("fails closed for hostile response metadata facades after one fetch", async () => {
  const responses = [
    { get status() { throw new Error("status must not escape"); } },
    { status: 200, get headers() { throw new Error("headers must not escape"); } },
    { status: 200, headers: { get() { throw new Error("header get must not escape"); } } },
  ];
  for (const response of responses) {
    let calls = 0;
    let result;
    await assert.doesNotReject(async () => {
      result = await discoverRiskScanQuick(base, async () => {
        calls += 1;
        return response;
      });
    });
    assert.deepEqual(result, { kind: "directory_invalid" });
    assert.equal(calls, 1);
  }
});

test("rejects invalid directory representations without another request", async () => {
  const invalid = [
    async () => new Response(JSON.stringify(directory()), { headers: { "content-type": "text/plain" } }),
    async () => new Response("{", { headers: { "content-type": "application/json" } }),
    async () => Response.json({ ...directory(), unexpected: true }),
    async () => Response.json({ ...directory(), tools: [] }),
    async () => Response.json({ ...directory(), tools: [{ ...directory().tools[0], request: { method: "POST" } }] }),
    async () => Response.json({ ...directory(), tools: [{ ...directory().tools[0], payment: { state: "locally_configured", protocol: "x402", network: "eip155:0", price: "$0.01" } }] }),
    async () => Response.json({ ...directory(), tools: [{ ...directory().tools[0], payment: { state: "locally_configured", protocol: "x402", network: "eip155:01", price: "$0.01" } }] }),
    async () => Response.json({ ...directory(), tools: [{ ...directory().tools[0], payment: { state: "locally_configured", protocol: "x402", network: "", price: "$0.01" } }] }),
    async () => Response.json({ ...directory(), tools: [{ ...directory().tools[0], payment: { state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$0.00" } }] }),
    async () => Response.json({ ...directory(), tools: [{ ...directory().tools[0], payment: { state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$" } }] }),
  ];
  for (const fetcher of invalid) {
    let calls = 0;
    const result = await discoverRiskScanQuick(base, async (...arguments_) => {
      calls += 1;
      return fetcher(...arguments_);
    });
    assert.deepEqual(result, { kind: "directory_invalid" });
    assert.equal(calls, 1);
  }
});

test("rejects non-data own properties returned by a fetcher", async () => {
  const value = directory();
  Object.defineProperty(value, "version", { enumerable: true, get: () => "v1" });
  const result = await discoverRiskScanQuick(base, async () => ({
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => value,
  }));
  assert.deepEqual(result, { kind: "directory_invalid" });
});

test("rejects a directory whose tools array has a custom prototype", async () => {
  const value = directory();
  Object.setPrototypeOf(value.tools, {});
  const result = await discoverRiskScanQuick(base, async () => ({
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => value,
  }));
  assert.deepEqual(result, { kind: "directory_invalid" });
});

test("rejects accessor-backed and non-enumerable array entries", async () => {
  const cases = [
    () => {
      const value = directory();
      Object.defineProperty(value.tools, "0", { enumerable: true, get: () => directory().tools[0] });
      return value;
    },
    () => {
      const value = directory();
      Object.defineProperty(value.tools[0].input.required, "0", { enumerable: false, value: "requestRef" });
      return value;
    },
    () => {
      const value = directory();
      Object.defineProperty(value.tools[0].limitations, "0", { enumerable: true, get: () => "quick_assessment_only" });
      return value;
    },
  ];
  for (const createValue of cases) {
    const result = await discoverRiskScanQuick(base, async () => ({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => createValue(),
    }));
    assert.deepEqual(result, { kind: "directory_invalid" });
  }
});

test("uses captured payment descriptor values rather than proxy property reads", async () => {
  const value = directory({ state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$1" });
  value.tools[0].payment = new Proxy(value.tools[0].payment, {
    get(target, key, receiver) {
      if (key === "network") return "eip155:999";
      if (key === "price") return "$999";
      return Reflect.get(target, key, receiver);
    },
  });
  const result = await discoverRiskScanQuick(base, async () => ({
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => value,
  }));
  assert.deepEqual(result.tool.payment, { state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$1" });
});

test("fails closed without throwing when a payment proxy throws on property access", async () => {
  const value = directory({ state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$1" });
  value.tools[0].payment = new Proxy(value.tools[0].payment, {
    get() { throw new Error("provider getter must not run"); },
  });
  let result;
  await assert.doesNotReject(async () => {
    result = await discoverRiskScanQuick(base, async () => ({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => value,
    }));
  });
  assert.deepEqual(result.tool.payment, { state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$1" });
});

test("returns a cloned selection rather than retaining decoded directory data", async () => {
  const value = directory({ state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$1" });
  const { result } = await select(value);
  value.tools[0].payment.price = "$999";
  assert.deepEqual(result.tool.payment, { state: "locally_configured", protocol: "x402", network: "eip155:1", price: "$1" });
});
