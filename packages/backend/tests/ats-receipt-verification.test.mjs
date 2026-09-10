import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getFunctionName } from "convex/server";

const sourceUrl = new URL("../convex/ats_receipt_verification.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const attemptId = "externalPrepareCommandAttempts:submitted";
const expectedTarget = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const candidateAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const atsOperations = [
  "ATS_CREATE", "ATS_CONTROL_LIST", "ATS_ISSUE", "ATS_TRANSFER", "ATS_COUPON",
];
const string = { type: "string" };
const literal = (value) => ({ type: "literal", value });
const id = (tableName) => ({ type: "id", tableName });
const object = (fields) => ({
  type: "object",
  value: Object.fromEntries(Object.entries(fields).map(([key, fieldType]) => [
    key,
    { fieldType, optional: false },
  ])),
});
const union = (...fieldTypes) => ({ type: "union", value: fieldTypes });
let api;

function context(overrides = {}) {
  return {
    attemptId,
    state: "SUBMITTED",
    operationKind: "HEDERA_FUNDING",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget,
    candidateTransactionId: "0.0.123@1735689600.123456789",
    ...overrides,
  };
}

function runtime({
  verificationContext = context(),
  readerResult = { status: "DOCUMENT", document: { result: "SUCCESS" } },
  verificationResult = { outcome: "VERIFIED" },
} = {}) {
  const queries = [];
  const mutations = [];
  const mirrorReads = [];
  const verifierInputs = [];
  const ctx = {
    async runQuery(reference, args) {
      queries.push({ name: getFunctionName(reference), args: structuredClone(args) });
      return verificationContext;
    },
    async runMutation(reference, args) {
      mutations.push({ name: getFunctionName(reference), args: structuredClone(args) });
      return undefined;
    },
    runAction() { throw new Error("receipt verification must not resubmit an action"); },
    db: {
      query() { throw new Error("action must use the bounded internal context query"); },
      get() { throw new Error("action must use the bounded internal context query"); },
      insert() { throw new Error("action must use the outcome mutation"); },
      patch() { throw new Error("action must use the outcome mutation"); },
    },
    scheduler: {
      runAfter() { throw new Error("receipt verification must not schedule retries"); },
      runAt() { throw new Error("receipt verification must not schedule retries"); },
    },
  };
  const seams = {
    async readMirrorTransaction(candidateTransactionId) {
      mirrorReads.push(candidateTransactionId);
      return readerResult;
    },
    verifyMirrorTransactionReceipt(expectation, document) {
      verifierInputs.push({ expectation: structuredClone(expectation), document: structuredClone(document) });
      return verificationResult;
    },
  };
  return { ctx, seams, queries, mutations, mirrorReads, verifierInputs };
}

function expectedContextRead() {
  return [{
    name: "ats_candidate_receipts:readAtsCandidateVerificationContext",
    args: { attemptId },
  }];
}

function expectedOutcome(outcome) {
  return [{
    name: "ats_candidate_receipts:recordAtsCandidateOutcome",
    args: { attemptId, outcome },
  }];
}

test("requires the declared Node ATS receipt verification source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest("exposes exactly one internal action plus its direct-test seam", () => {
  assert.deepEqual(Object.keys(api).sort(), [
    "verifyAtsCandidateReceipt",
    "verifyAtsCandidateReceiptForTest",
  ]);
  assert.equal(api.verifyAtsCandidateReceipt.isInternal, true);
  assert.equal(api.verifyAtsCandidateReceipt.isAction, true);
  assert.equal(api.verifyAtsCandidateReceipt.isPublic, undefined);
  assert.deepEqual(JSON.parse(api.verifyAtsCandidateReceipt.exportArgs()), object({
    attemptId: id("externalPrepareCommandAttempts"),
  }));
  assert.deepEqual(JSON.parse(api.verifyAtsCandidateReceipt.exportReturns()), union(
    object({ outcome: literal("CONFIRMED") }),
    object({ outcome: literal("REJECTED") }),
    object({ outcome: literal("OUTCOME_UNKNOWN") }),
    object({ outcome: literal("NOT_CONFIGURED") }),
    object({ outcome: literal("NOT_ELIGIBLE") }),
  ));
  assert.equal(typeof api.verifyAtsCandidateReceiptForTest, "function");
});

implementedTest("stops absent or non-submitted candidates before Mirror or durable outcome work", async () => {
  for (const verificationContext of [null, context({ state: "PREPARED" }), context({ state: "CONFIRMED" })]) {
    const state = runtime({ verificationContext });
    assert.deepEqual(
      await api.verifyAtsCandidateReceiptForTest(state.ctx, { attemptId }, state.seams),
      { outcome: "NOT_ELIGIBLE" },
    );
    assert.deepEqual(state.queries, expectedContextRead());
    assert.deepEqual(state.mirrorReads, []);
    assert.deepEqual(state.mutations, []);
  }
});

implementedTest("routes the real internal action through the same safe not-eligible stop", async () => {
  const state = runtime({ verificationContext: null });
  assert.deepEqual(
    await api.verifyAtsCandidateReceipt._handler(state.ctx, { attemptId }),
    { outcome: "NOT_ELIGIBLE" },
  );
  assert.deepEqual(state.queries, expectedContextRead());
  assert.deepEqual(state.mirrorReads, []);
  assert.deepEqual(state.mutations, []);
});

implementedTest("stops every ATS operation not configured for receipt verification before any Mirror read or durable outcome mutation", async () => {
  for (const operationKind of atsOperations) {
    const state = runtime({
      verificationContext: context({
        operationKind,
        ...(operationKind === "ATS_CREATE" ? { candidateEvmAddress: candidateAddress } : {}),
      }),
    });
    assert.deepEqual(
      await api.verifyAtsCandidateReceiptForTest(state.ctx, { attemptId }, state.seams),
      { outcome: "NOT_CONFIGURED" },
      operationKind,
    );
    assert.deepEqual(state.queries, expectedContextRead(), `${operationKind}: context read only`);
    assert.deepEqual(state.mirrorReads, [], `${operationKind}: no Mirror read`);
    assert.deepEqual(state.verifierInputs, [], `${operationKind}: no verifier`);
    assert.deepEqual(state.mutations, [], `${operationKind}: no outcome mutation`);
  }

  for (const operationKind of atsOperations) {
    const direct = runtime({
      verificationContext: context({
        operationKind,
        ...(operationKind === "ATS_CREATE" ? { candidateEvmAddress: candidateAddress } : {}),
      }),
    });
    assert.deepEqual(
      await api.verifyAtsCandidateReceipt._handler(direct.ctx, { attemptId }),
      { outcome: "NOT_CONFIGURED" },
      `${operationKind}: direct action`,
    );
    assert.deepEqual(direct.queries, expectedContextRead(), `${operationKind}: direct context read only`);
    assert.deepEqual(direct.mirrorReads, [], `${operationKind}: direct no Mirror read`);
    assert.deepEqual(direct.mutations, [], `${operationKind}: direct no outcome mutation`);
  }
});

implementedTest("records one verified HEDERA_FUNDING candidate as CONFIRMED after exactly one bounded read", async () => {
  const state = runtime();
  assert.deepEqual(
    await api.verifyAtsCandidateReceiptForTest(state.ctx, { attemptId }, state.seams),
    { outcome: "CONFIRMED" },
  );
  assert.deepEqual(state.queries, expectedContextRead());
  assert.deepEqual(state.mirrorReads, ["0.0.123@1735689600.123456789"]);
  assert.deepEqual(state.verifierInputs, [{
    expectation: {
      operationKind: "HEDERA_FUNDING",
      network: "hedera:testnet",
      chainId: 296,
      expectedTarget,
    },
    document: { result: "SUCCESS" },
  }]);
  assert.deepEqual(state.mutations, expectedOutcome("CONFIRMED"));
});

implementedTest("records a rejected verifier result once and maps unavailable Mirror states to outcome unknown", async () => {
  const rejected = runtime({ verificationResult: { outcome: "REJECTED", reason: "TARGET_MISMATCH" } });
  assert.deepEqual(
    await api.verifyAtsCandidateReceiptForTest(rejected.ctx, { attemptId }, rejected.seams),
    { outcome: "REJECTED" },
  );
  assert.deepEqual(rejected.mutations, expectedOutcome("REJECTED"));
  assert.equal(rejected.mirrorReads.length, 1);

  for (const readerResult of [{ status: "NOT_FOUND" }, { status: "UNAVAILABLE" }]) {
    const unknown = runtime({ readerResult });
    assert.deepEqual(
      await api.verifyAtsCandidateReceiptForTest(unknown.ctx, { attemptId }, unknown.seams),
      { outcome: "OUTCOME_UNKNOWN" },
    );
    assert.deepEqual(unknown.mutations, expectedOutcome("OUTCOME_UNKNOWN"));
    assert.equal(unknown.mirrorReads.length, 1);
    assert.deepEqual(unknown.verifierInputs, []);
  }
});

implementedTest("keeps the action Node-only, internal-only, and free of provider, SDK, and environment authority", () => {
  const source = readFileSync(sourceUrl, "utf8");
  assert.match(source, /^"use node";/u);
  assert.doesNotMatch(
    source,
    /\b(?:process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|MetaMask|WalletConnect|createWalletClient|createPublicClient|Bond\s*\.\s*create|CreateBondRequest|httpRouter|httpAction|scheduler\s*\.)\b/u,
  );
  const actionStart = source.indexOf("export const verifyAtsCandidateReceipt");
  assert.notEqual(actionStart, -1);
  const actionSource = source.slice(actionStart);
  assert.match(actionSource, /verifyAtsCandidateReceiptForTest/u);
  assert.doesNotMatch(actionSource, /(?:isAtsCreateConfigured|markAssetReady)/u);
  assert.doesNotMatch(readFileSync(new URL("../src/index.ts", import.meta.url), "utf8"), /ats_receipt_verification/u);
});
