import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/ats/provider-tool-receipt-reader.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1/";
const rpcNodeBaseUrl = "https://testnet.hashio.io/api";
let api;

test("requires the pinned provider-tool receipt reader source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest("exports only the fixed-endpoint reader", () => {
  assert.deepEqual(Object.keys(api), ["createBoundedProviderToolReceiptReader"]);
});

implementedTest("uses a credential-free fixed Mirror request and fails closed before RPC when it cannot derive a canonical EVM hash", async () => {
  const calls = [];
  const reader = api.createBoundedProviderToolReceiptReader({
    mirrorNodeBaseUrl,
    rpcNodeBaseUrl,
    async fetch(url, init) {
      calls.push({ url, init });
      return new Response(JSON.stringify({ hash: "not-a-hash" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.deepEqual(
    await reader("0.0.123@1735689600.123456789"),
    { status: "UNKNOWN" },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://testnet.mirrornode.hedera.com/api/v1/contracts/results/0.0.123-1735689600-123456789");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
  assert.ok(calls[0].init.signal instanceof AbortSignal);
});

implementedTest("rejects every endpoint override before any read", () => {
  assert.throws(() => api.createBoundedProviderToolReceiptReader({
    mirrorNodeBaseUrl: "https://example.invalid/",
    rpcNodeBaseUrl,
    fetch: async () => assert.fail("untrusted endpoint must not be used"),
  }));
  assert.throws(() => api.createBoundedProviderToolReceiptReader({
    mirrorNodeBaseUrl,
    rpcNodeBaseUrl: "https://example.invalid/",
    fetch: async () => assert.fail("untrusted endpoint must not be used"),
  }));
  const source = readFileSync(sourcePath, "utf8");
  assert.match(source, /https:\/\/testnet\.mirrornode\.hedera\.com\/api\/v1\//u);
  assert.match(source, /https:\/\/testnet\.hashio\.io\/api/u);
  assert.doesNotMatch(source, /\b(?:process\s*\.\s*env|import\.meta\.env|httpAction|scheduler\s*\.)\b/u);
});
