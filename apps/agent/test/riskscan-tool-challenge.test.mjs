import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { requestRiskScanQuickChallenge } = require("../src/riskscan-tool-challenge.ts");

const base = new URL("http://service.test/example");
const input = {
  requestRef: "request-agent-42",
  subjectRef: "service:tool402",
  context: "caller disclosure review",
  declarations: { identity: true, pricing: true, limitations: true, evidence: true },
};
const selected = { kind: "tool_selected", tool: { deliberately: "opaque" } };
const failures = [
  { kind: "directory_unavailable" },
  { kind: "directory_invalid" },
];

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

test("sends the one exact unsigned Quick request for a selected opaque tool", async () => {
  const calls = [];
  const result = await requestRiskScanQuickChallenge(base, selected, input, async (target, init) => {
    calls.push([target, init]);
    return response(402, "challenge");
  });
  assert.deepEqual(result, { kind: "payment_required" });
  assert.deepEqual(calls, [[
    new URL("http://service.test/api/riskscan"),
    {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(input),
      credentials: "omit",
      redirect: "error",
    },
  ]]);
});

test("propagates discovery failures without validating input or making a request", async () => {
  for (const selection of failures) {
    let calls = 0;
    const result = await requestRiskScanQuickChallenge(base, selection, new Proxy({}, { get() { throw new Error("input must not be read"); } }), async () => {
      calls += 1;
      return response(402, "challenge");
    });
    assert.deepEqual(result, selection);
    assert.equal(calls, 0);
  }
});

test("rejects malformed or hostile selection facades without I/O", async () => {
  const inherited = Object.create({ tool: {} });
  inherited.kind = "tool_selected";
  const accessor = { kind: "tool_selected" };
  Object.defineProperty(accessor, "tool", { enumerable: true, get() { return {}; } });
  const nonEnumerable = { kind: "tool_selected", tool: {} };
  Object.defineProperty(nonEnumerable, "tool", { enumerable: false });
  const symbol = { kind: "tool_selected", tool: {}, [Symbol("extra")]: true };
  const throwingKind = { tool: {} };
  Object.defineProperty(throwingKind, "kind", { enumerable: true, get() { throw new Error("kind must not be read"); } });
  const cases = [
    {}, { kind: "tool_selected" }, { kind: "tool_selected", tool: {}, extra: true }, inherited, accessor, nonEnumerable, symbol,
    throwingKind, new Proxy({}, { ownKeys() { throw new Error("selection facade"); } }),
  ];
  for (const selection of cases) {
    let calls = 0;
    const result = await requestRiskScanQuickChallenge(base, selection, input, async () => { calls += 1; return response(402, "challenge"); });
    assert.deepEqual(result, { kind: "directory_invalid" });
    assert.equal(calls, 0);
  }
});

test("never reads the selected tool contents", async () => {
  const opaque = new Proxy({}, { get() { throw new Error("tool must remain opaque"); } });
  let calls = 0;
  const result = await requestRiskScanQuickChallenge(base, { kind: "tool_selected", tool: opaque }, input, async () => {
    calls += 1;
    return response(503);
  });
  assert.deepEqual(result, { kind: "unavailable" });
  assert.equal(calls, 1);
});

test("rejects noncanonical or hostile input without I/O", async () => {
  const missing = { ...input };
  delete missing.context;
  const extra = { ...input, extra: true };
  const inherited = Object.create(input);
  const accessor = { ...input };
  Object.defineProperty(accessor, "context", { enumerable: true, get() { return input.context; } });
  const nonEnumerable = { ...input };
  Object.defineProperty(nonEnumerable, "context", { enumerable: false });
  const unsafeDeclarations = { ...input, declarations: { ...input.declarations, extra: true } };
  const badText = { ...input, requestRef: "   " };
  const cases = [null, [], missing, extra, inherited, accessor, nonEnumerable, { ...input, [Symbol("extra")]: true }, unsafeDeclarations, badText,
    new Proxy({}, { ownKeys() { throw new Error("input facade"); } })];
  for (const value of cases) {
    let calls = 0;
    const result = await requestRiskScanQuickChallenge(base, selected, value, async () => { calls += 1; return response(402, "challenge"); });
    assert.deepEqual(result, { kind: "input_invalid" });
    assert.equal(calls, 0);
  }
});

test("trims text into an isolated local input snapshot", async () => {
  const calls = [];
  const result = await requestRiskScanQuickChallenge(base, selected, { ...input, requestRef: " request-agent-42 ", declarations: { ...input.declarations } }, async (target, init) => {
    calls.push([target, init]);
    return response(503);
  });
  assert.deepEqual(result, { kind: "unavailable" });
  assert.equal(calls[0][1].body, JSON.stringify(input));
});

test("rejects invalid, hostile, and unsafe base or derived targets without I/O", async () => {
  class ThrowingUrl extends URL { toString() { throw new Error("target conversion"); } }
  class FtpUrl extends URL { toString() { return "ftp://service.test/"; } }
  class UserInfoUrl extends URL { toString() { return "https://user:secret@service.test/"; } }
  const cases = [new URL("ftp://service.test/"), new URL("http://user@service.test/"), new Proxy(base, { get() { throw new Error("base facade"); } }), new ThrowingUrl("http://service.test/"), new FtpUrl("https://service.test/"), new UserInfoUrl("https://service.test/")];
  for (const value of cases) {
    let calls = 0;
    const result = await requestRiskScanQuickChallenge(value, selected, input, async () => { calls += 1; return response(402, "challenge"); });
    assert.deepEqual(result, { kind: "directory_invalid" });
    assert.equal(calls, 0);
  }
});

test("uses a fresh request init after sender mutation", async () => {
  const calls = [];
  await requestRiskScanQuickChallenge(base, selected, input, async (target, init) => {
    calls.push([target, structuredClone(init)]);
    init.method = "GET";
    init.headers = { authorization: "not-allowed" };
    init.body = "not-allowed";
    return response(503);
  });
  await requestRiskScanQuickChallenge(base, selected, input, async (target, init) => {
    calls.push([target, init]);
    return response(503);
  });
  assert.deepEqual(calls[1], [new URL("http://service.test/api/riskscan"), {
    method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(input), credentials: "omit", redirect: "error",
  }]);
});

test("maps sender, status, and hostile response metadata without reading a body", async () => {
  const cases = [
    [async () => { throw new Error("offline"); }, { kind: "transport_failure" }],
    [async () => response(503), { kind: "unavailable" }],
    [async () => response(402, "challenge"), { kind: "payment_required" }],
    [async () => response(402, "  "), { kind: "unexpected_response" }],
    [async () => response(402), { kind: "unexpected_response" }],
    [async () => response(200), { kind: "unexpected_response" }],
    [async () => response(400), { kind: "unexpected_response" }],
    [async () => ({ get status() { throw new Error("hostile status"); } }), { kind: "unexpected_response" }],
    [async () => ({ status: 402, get headers() { throw new Error("hostile headers"); } }), { kind: "unexpected_response" }],
    [async () => ({ status: 402, headers: { get() { throw new Error("hostile header"); } } }), { kind: "unexpected_response" }],
  ];
  for (const [sender, expected] of cases) {
    const result = await requestRiskScanQuickChallenge(base, selected, input, sender);
    assert.deepEqual(result, expected);
  }
});
