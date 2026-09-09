import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/ats/mirror-transaction-verifier.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1/";
const expectedTarget = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const candidateAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
let api;

function expectation(overrides = {}) {
  return {
    operationKind: "HEDERA_FUNDING",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget,
    ...overrides,
  };
}

function contractResult(overrides = {}) {
  return {
    result: "SUCCESS",
    timestamp: "1735689600.123456789",
    chain_id: "0x0128",
    to: expectedTarget,
    created_contract_ids: ["0.0.123"],
    ...overrides,
  };
}

async function read(reader, candidateTransactionId) {
  if (typeof reader === "function") return reader(candidateTransactionId);
  assert.equal(typeof reader?.read, "function", "bounded reader must be callable or expose read");
  return reader.read(candidateTransactionId);
}

function jsonResponse(value, options = {}) {
  return new Response(JSON.stringify(value), {
    status: options.status ?? 200,
    headers: { "content-type": options.contentType ?? "application/json" },
  });
}

test("requires the declared private Mirror transaction verifier source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest("exports only the pure verifier and injected bounded reader", () => {
  assert.deepEqual(Object.keys(api).sort(), [
    "createBoundedMirrorTransactionReader",
    "verifyMirrorTransactionReceipt",
  ]);
});

implementedTest("pins the raw ContractResult fixture and verifies a matching non-create result", () => {
  assert.deepEqual(
    api.verifyMirrorTransactionReceipt(expectation(), contractResult()),
    { outcome: "VERIFIED" },
  );
});

implementedTest("fails closed for every raw Mirror response mismatch without normalizing values", () => {
  const cases = [
    ["unsuccessful result", contractResult({ result: "REVERT" }), { outcome: "REJECTED", reason: "RESULT_NOT_SUCCESS" }],
    ["uppercase target", contractResult({ to: expectedTarget.toUpperCase() }), { outcome: "REJECTED", reason: "TARGET_MISMATCH" }],
    ["wrong chain", contractResult({ chain_id: "0x0127" }), { outcome: "REJECTED", reason: "NETWORK_MISMATCH" }],
    ["missing consensus timestamp", contractResult({ timestamp: undefined }), { outcome: "UNKNOWN", reason: "CONSENSUS_TIMESTAMP_MISSING" }],
  ];
  for (const [name, document, result] of cases) {
    assert.deepEqual(api.verifyMirrorTransactionReceipt(expectation(), document), result, name);
  }

  const accessor = contractResult();
  let getterReads = 0;
  Object.defineProperty(accessor, "result", {
    enumerable: true,
    get() {
      getterReads += 1;
      throw new Error("Mirror accessor must not be read");
    },
  });
  assert.deepEqual(
    api.verifyMirrorTransactionReceipt(expectation(), accessor),
    { outcome: "UNKNOWN", reason: "DOCUMENT_UNSAFE" },
  );
  assert.equal(getterReads, 0);
});

implementedTest("never mistakes a generic address or Hedera entity id for the created ATS EVM address", () => {
  const raw = contractResult({ address: candidateAddress });
  assert.deepEqual(
    api.verifyMirrorTransactionReceipt(
      expectation({ operationKind: "ATS_CREATE", candidateEvmAddress: candidateAddress }),
      raw,
    ),
    { outcome: "REJECTED", reason: "CREATED_ADDRESS_MISMATCH" },
  );
});

implementedTest("uses exactly one credential-free GET against the fixed Mirror ContractResult path", async () => {
  const calls = [];
  const reader = api.createBoundedMirrorTransactionReader({
    mirrorNodeBaseUrl,
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return jsonResponse(contractResult());
    },
  });

  assert.deepEqual(
    await read(reader, "0.0.123-1735689600-123456789"),
    { status: "DOCUMENT", document: contractResult() },
  );
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://testnet.mirrornode.hedera.com/api/v1/contracts/results/0.0.123-1735689600-123456789",
  );
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "omit");
  assert.ok(["error", "manual"].includes(calls[0].init.redirect), "reader must not follow redirects");
  assert.ok(calls[0].init.signal instanceof AbortSignal, "reader must own an abort signal");
});

implementedTest("converts only the accepted canonical at-sign form to the one lossless Mirror path form", async () => {
  const calls = [];
  const reader = api.createBoundedMirrorTransactionReader({
    mirrorNodeBaseUrl,
    fetch: async (url) => {
      calls.push(String(url));
      return jsonResponse(contractResult());
    },
  });

  assert.deepEqual(
    await read(reader, "0.0.123@1735689600.123456789"),
    { status: "DOCUMENT", document: contractResult() },
  );
  assert.deepEqual(calls, [
    "https://testnet.mirrornode.hedera.com/api/v1/contracts/results/0.0.123-1735689600-123456789",
  ]);
});

implementedTest("aborts a stalled bounded read through its own fixed timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let aborts = 0;
  const reader = api.createBoundedMirrorTransactionReader({
    mirrorNodeBaseUrl,
    fetch: async (_url, init) => new Promise((resolve) => {
      init.signal.addEventListener("abort", () => {
        aborts += 1;
        resolve(jsonResponse({}, { status: 503 }));
      }, { once: true });
    }),
  });
  const result = read(reader, "0.0.123-1735689600-123456789");
  await Promise.resolve();
  t.mock.timers.runAll();
  assert.deepEqual(await result, { status: "UNAVAILABLE" });
  assert.equal(aborts, 1);
});

implementedTest("stops an oversized response stream at the byte cap instead of consuming it whole", async () => {
  let pulls = 0;
  let cancelled = false;
  const chunk = new Uint8Array(65_536);
  const reader = api.createBoundedMirrorTransactionReader({
    mirrorNodeBaseUrl,
    fetch: async () => new Response(new ReadableStream({
      pull(controller) {
        pulls += 1;
        controller.enqueue(chunk);
        if (pulls === 256) controller.close();
      },
      cancel() {
        cancelled = true;
      },
    }), { headers: { "content-type": "application/json" } }),
  });

  assert.deepEqual(
    await read(reader, "0.0.123-1735689600-123456789"),
    { status: "UNAVAILABLE" },
  );
  assert.equal(cancelled, true);
  assert.ok(pulls < 256, "reader must stop once its cap is crossed");
});

implementedTest("maps bounded non-documents to closed reader outcomes without reaching another host", async () => {
  for (const [name, response, expected] of [
    ["not found", jsonResponse({}), { status: "NOT_FOUND" }],
    ["server failure", jsonResponse({}, { status: 503 }), { status: "UNAVAILABLE" }],
    ["non-json", jsonResponse(contractResult(), { contentType: "text/plain" }), { status: "UNAVAILABLE" }],
    ["missing content type", new Response(JSON.stringify(contractResult())), { status: "UNAVAILABLE" }],
    ["invalid JSON", new Response("{not-json", { headers: { "content-type": "application/json" } }), { status: "UNAVAILABLE" }],
    ["oversized body", new Response("x".repeat(1_048_576), { headers: { "content-type": "application/json" } }), { status: "UNAVAILABLE" }],
  ]) {
    let calls = 0;
    const reader = api.createBoundedMirrorTransactionReader({
      mirrorNodeBaseUrl,
      fetch: async () => {
        calls += 1;
        return response;
      },
    });
    assert.deepEqual(await read(reader, "0.0.123-1735689600-123456789"), expected, name);
    assert.equal(calls, 1, `${name}: reader must make one request at most`);
  }
});

implementedTest("rejects arbitrary configuration and keeps all network access injected", () => {
  assert.throws(() => api.createBoundedMirrorTransactionReader({
    mirrorNodeBaseUrl: "https://attacker.invalid/",
    fetch: async () => jsonResponse(contractResult()),
  }));
  const source = readFileSync(sourceUrl, "utf8");
  assert.doesNotMatch(
    source,
    /\b(?:globalThis\s*\.\s*fetch|process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|MetaMask|WalletConnect|createWalletClient|createPublicClient|httpRouter|httpAction|convex\/nextjs)\b/u,
  );
});
