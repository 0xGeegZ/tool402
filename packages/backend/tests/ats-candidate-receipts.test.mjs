import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../convex/ats_candidate_receipts.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;

const string = { type: "string" };
const literal = (value) => ({ type: "literal", value });
const id = (tableName) => ({ type: "id", tableName });
const union = (...values) => ({ type: "union", value: values.map(literal) });
const optional = (fieldType) => ({ fieldType, optional: true });
const object = (fields) => ({
  type: "object",
  value: Object.fromEntries(Object.entries(fields).map(([key, fieldType]) => [
    key,
    fieldType?.fieldType !== undefined && typeof fieldType.optional === "boolean"
      ? fieldType
      : { fieldType, optional: false },
  ])),
});
const operations = [
  "ATS_CREATE", "ATS_CONTROL_LIST", "ATS_ISSUE", "ATS_TRANSFER", "ATS_COUPON", "HEDERA_FUNDING",
];
const signer = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const otherSigner = "0xcccccccccccccccccccccccccccccccccccccccc";
const candidateAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const expectedTarget = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const attemptId = "externalPrepareCommandAttempts:prepared";
const attemptPublicId = "DDDDDDDDDDDDDDDDDDDDDw";
const firstNonce = "AAAAAAAAAAAAAAAAAAAAAA";
const secondNonce = "AQEBAQEBAQEBAQEBAQEBAQ";
let api;

const ineligibleReceiptError = {
  name: "RangeError",
  message: "ATS candidate receipt is not eligible for this attempt",
};

function replayIdentity(nonce = firstNonce) {
  return `tool402:wallet-command:v1:296:${signer}:${nonce}`;
}

function attempt(overrides = {}) {
  return {
    _id: attemptId,
    _creationTime: 1,
    version: 1,
    type: "external.prepare",
    chainId: 296,
    canonicalSignerAddress: signer,
    principalPublicId: "issuer_42",
    role: "ISSUER",
    authorityVersion: "issuer_v1",
    payloadHash: "0x" + "a".repeat(64),
    operationKind: "ATS_CREATE",
    subjectPublicId: "riskscan_revenue_note_demo",
    network: "hedera:testnet",
    expectedTarget,
    canonicalParametersHash: "b".repeat(64),
    idempotencyKey: attemptPublicId,
    expiresAt: "2026-09-09T12:05:00.000Z",
    state: "PREPARED",
    acceptedAt: 1n,
    ...overrides,
  };
}

function input(overrides = {}) {
  return {
    attemptPublicId,
    operationKind: "ATS_CREATE",
    candidateTransactionId: "0.0.123@1735689600.123456789",
    candidateEvmAddress: candidateAddress,
    canonicalSignerAddress: signer,
    principalPublicId: "issuer_42",
    role: "ISSUER",
    authorityVersion: "issuer_v1",
    replayIdentity: replayIdentity(),
    ...overrides,
  };
}

function database({ attempts = [attempt()], claims = [] } = {}) {
  const rows = {
    externalPrepareCommandAttempts: attempts,
    walletCommandReplayClaims: claims,
  };
  const reads = [];
  const writes = [];
  const accesses = [];
  const db = {
    query(table) {
      accesses.push({ kind: "query", table });
      assert.ok(Object.hasOwn(rows, table), `unexpected query table: ${table}`);
      return {
        withIndex(index, select) {
          const filters = [];
          const range = {
            eq(field, value) {
              filters.push([field, value]);
              return range;
            },
          };
          select(range);
          return {
            async take(limit) {
              reads.push({ table, index, filters, limit });
              assert.equal(limit, 2, "M43 bounded lookups must take exactly two rows");
              return rows[table].slice(0, limit);
            },
          };
        },
      };
    },
    async get(rowId) {
      accesses.push({ kind: "get", rowId });
      return rows.externalPrepareCommandAttempts.find((row) => row?._id === rowId) ?? null;
    },
    async insert(table, document) {
      accesses.push({ kind: "insert", table });
      assert.equal(table, "walletCommandReplayClaims");
      const copy = structuredClone(document);
      const rowId = `walletCommandReplayClaims:${rows.walletCommandReplayClaims.length}`;
      rows.walletCommandReplayClaims.push({ _id: rowId, _creationTime: 1, ...copy });
      writes.push({ kind: "insert", table, document: copy, rowId });
      return rowId;
    },
    async patch(rowId, patch) {
      accesses.push({ kind: "patch", rowId });
      const row = rows.externalPrepareCommandAttempts.find((candidate) => candidate?._id === rowId);
      assert.notEqual(row, undefined, "patch must target the resolved attempt only");
      const copy = structuredClone(patch);
      Object.assign(row, copy);
      writes.push({ kind: "patch", rowId, patch: copy });
    },
    replace() { throw new Error("unexpected replace"); },
    delete() { throw new Error("unexpected delete"); },
  };
  return {
    rows,
    reads,
    writes,
    accesses,
    ctx: {
      db,
      runAction() { throw new Error("unexpected action"); },
      runMutation() { throw new Error("unexpected mutation"); },
      runQuery() { throw new Error("unexpected query"); },
      scheduler: {
        runAfter() { throw new Error("unexpected scheduled retry"); },
        runAt() { throw new Error("unexpected scheduled retry"); },
      },
    },
  };
}

function expectAttemptLookup(db) {
  assert.deepEqual(db.reads.find(({ table }) => table === "externalPrepareCommandAttempts"), {
    table: "externalPrepareCommandAttempts",
    index: "by_idempotency_key",
    filters: [["idempotencyKey", attemptPublicId]],
    limit: 2,
  });
}

test("requires the declared internal ATS candidate receipt source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest("exposes only closed internal receipt attachment, read-context, and outcome handlers", () => {
  assert.deepEqual(Object.keys(api).sort(), [
    "attachAtsCandidateReceipt",
    "readAtsCandidateVerificationContext",
    "recordAtsCandidateOutcome",
  ]);
  for (const handler of Object.values(api)) {
    assert.equal(handler.isInternal, true);
    assert.equal(handler.isPublic, undefined);
  }
  assert.deepEqual(JSON.parse(api.attachAtsCandidateReceipt.exportArgs()), object({
    attemptPublicId: string,
    operationKind: union(...operations),
    candidateTransactionId: string,
    candidateEvmAddress: optional(string),
    canonicalSignerAddress: string,
    principalPublicId: string,
    role: union("ISSUER", "BACKER"),
    authorityVersion: string,
    replayIdentity: string,
  }));
  assert.deepEqual(JSON.parse(api.readAtsCandidateVerificationContext.exportArgs()), object({
    attemptId: id("externalPrepareCommandAttempts"),
  }));
  assert.deepEqual(JSON.parse(api.recordAtsCandidateOutcome.exportArgs()), object({
    attemptId: id("externalPrepareCommandAttempts"),
    outcome: union("CONFIRMED", "OUTCOME_UNKNOWN", "REJECTED"),
  }));
});

implementedTest("rejects malformed attachment inputs before any database access", async () => {
  const cases = [
    ["noncanonical attempt id", input({ attemptPublicId: "short" })],
    ["unknown operation", input({ operationKind: "ATS_UNKNOWN" })],
    ["malformed candidate transaction", input({ candidateTransactionId: "0.0.123@bad" })],
    ["uppercase signer", input({ canonicalSignerAddress: signer.toUpperCase() })],
    ["missing principal", input({ principalPublicId: "" })],
    ["missing authority version", input({ authorityVersion: "" })],
    ["malformed replay identity", input({ replayIdentity: "wrong" })],
    [
      "replay identity with a mismatched canonical signer",
      input({ replayIdentity: `tool402:wallet-command:v1:296:${otherSigner}:${firstNonce}` }),
    ],
    ["ATS_CREATE without candidate address", (() => {
      const value = input();
      delete value.candidateEvmAddress;
      return value;
    })()],
    ...operations
      .filter((operationKind) => operationKind !== "ATS_CREATE")
      .map((operationKind) => [
        `${operationKind} with a candidate address`,
        input({ operationKind }),
      ]),
  ];
  for (const [name, args] of cases) {
    const db = database();
    await assert.rejects(api.attachAtsCandidateReceipt._handler(db.ctx, args), undefined, name);
    assert.deepEqual(db.accesses, [], `${name}: must fail before database access`);
  }
});

implementedTest("claims a fresh replay identity before the sole candidate patch and resolves by canonical attempt id", async () => {
  const db = database();
  const result = await api.attachAtsCandidateReceipt._handler(db.ctx, input());

  assert.deepEqual(result, { status: "ATTACHED", attemptId, state: "SUBMITTED" });
  expectAttemptLookup(db);
  assert.deepEqual(db.writes, [
    {
      kind: "insert",
      table: "walletCommandReplayClaims",
      rowId: "walletCommandReplayClaims:0",
      document: {
        replayIdentity: replayIdentity(),
        commandType: "external.attachCandidate",
        outcome: "NEW",
        targetId: attemptId,
        claimedAt: db.writes[0].document.claimedAt,
      },
    },
    {
      kind: "patch",
      rowId: attemptId,
      patch: {
        state: "SUBMITTED",
        candidateTransactionId: "0.0.123@1735689600.123456789",
        candidateEvmAddress: candidateAddress,
      },
    },
  ]);
  assert.equal(typeof db.writes[0].document.claimedAt, "bigint");
});

implementedTest("returns a no-write already-attached result only for byte-identical stored candidates", async () => {
  const db = database({
    attempts: [attempt({
      state: "SUBMITTED",
      candidateTransactionId: "0.0.123@1735689600.123456789",
      candidateEvmAddress: candidateAddress,
    })],
  });
  const result = await api.attachAtsCandidateReceipt._handler(db.ctx, input({ replayIdentity: replayIdentity(secondNonce) }));

  assert.deepEqual(result, { status: "ALREADY_ATTACHED", attemptId, state: "SUBMITTED" });
  expectAttemptLookup(db);
  assert.deepEqual(db.writes, []);

  const different = database({ attempts: db.rows.externalPrepareCommandAttempts });
  await assert.rejects(
    api.attachAtsCandidateReceipt._handler(
      different.ctx,
      input({ candidateTransactionId: "0.0.123-1735689600-123456789", replayIdentity: replayIdentity("AgICAgICAgICAgICAgICAg") }),
    ),
    ineligibleReceiptError,
  );
  assert.deepEqual(different.writes, []);
});

implementedTest("attaches one non-ATS candidate without an EVM address", async () => {
  const nonAtsAttempt = attempt({ operationKind: "HEDERA_FUNDING" });
  const nonAtsInput = input({ operationKind: "HEDERA_FUNDING" });
  delete nonAtsInput.candidateEvmAddress;
  const db = database({ attempts: [nonAtsAttempt] });

  assert.deepEqual(
    await api.attachAtsCandidateReceipt._handler(db.ctx, nonAtsInput),
    { status: "ATTACHED", attemptId, state: "SUBMITTED" },
  );
  assert.deepEqual(db.writes, [
    {
      kind: "insert",
      table: "walletCommandReplayClaims",
      rowId: "walletCommandReplayClaims:0",
      document: {
        replayIdentity: replayIdentity(),
        commandType: "external.attachCandidate",
        outcome: "NEW",
        targetId: attemptId,
        claimedAt: db.writes[0].document.claimedAt,
      },
    },
    {
      kind: "patch",
      rowId: attemptId,
      patch: {
        state: "SUBMITTED",
        candidateTransactionId: "0.0.123@1735689600.123456789",
      },
    },
  ]);
});

implementedTest("rejects reused replay identities, missing or duplicate attempts, unsafe rows, and context mismatches without a candidate write", async () => {
  const claimed = database({
    claims: [{
      _id: "walletCommandReplayClaims:old",
      _creationTime: 1,
      replayIdentity: replayIdentity(),
      commandType: "external.attachCandidate",
      outcome: "NEW",
      targetId: attemptId,
      claimedAt: 1n,
    }],
  });
  assert.deepEqual(
    await api.attachAtsCandidateReceipt._handler(claimed.ctx, input()),
    { status: "COMMAND_REPLAYED" },
  );
  assert.deepEqual(claimed.reads.find(({ table }) => table === "walletCommandReplayClaims"), {
    table: "walletCommandReplayClaims",
    index: "by_replay_identity",
    filters: [["replayIdentity", replayIdentity()]],
    limit: 2,
  });
  assert.deepEqual(claimed.writes, []);

  const getterRow = attempt();
  let getterReads = 0;
  Object.defineProperty(getterRow, "state", {
    enumerable: true,
    get() {
      getterReads += 1;
      throw new Error("stored accessor must not be read");
    },
  });
  const cases = [
    ["missing attempt", []],
    ["duplicate attempt", [attempt(), attempt({ _id: "externalPrepareCommandAttempts:duplicate" })]],
    ["unsafe attempt", [getterRow]],
    ["mismatched signer", [attempt({ canonicalSignerAddress: otherSigner })]],
    ["mismatched principal", [attempt({ principalPublicId: "other" })]],
    ["mismatched role", [attempt({ role: "BACKER" })]],
    ["mismatched authority version", [attempt({ authorityVersion: "other" })]],
    ["mismatched operation", [attempt({ operationKind: "HEDERA_FUNDING" })]],
    ["mismatched chain", [attempt({ chainId: 295 })]],
    ["mismatched network", [attempt({ network: "hedera:mainnet" })]],
  ];
  for (const [name, attempts] of cases) {
    const db = database({ attempts });
    await assert.rejects(
      api.attachAtsCandidateReceipt._handler(db.ctx, input()),
      ineligibleReceiptError,
      name,
    );
    assert.deepEqual(db.writes, [], `${name}: must not claim or patch`);
  }
  assert.equal(getterReads, 0);
});

implementedTest("returns only the minimal verification context and terminalizes submitted attempts once", async () => {
  const submitted = attempt({
    state: "SUBMITTED",
    candidateTransactionId: "0.0.123@1735689600.123456789",
    candidateEvmAddress: candidateAddress,
  });
  const readDb = database({ attempts: [submitted] });
  assert.deepEqual(
    await api.readAtsCandidateVerificationContext._handler(readDb.ctx, { attemptId }),
    {
      attemptId,
      state: "SUBMITTED",
      operationKind: "ATS_CREATE",
      network: "hedera:testnet",
      chainId: 296,
      expectedTarget,
      candidateTransactionId: "0.0.123@1735689600.123456789",
      candidateEvmAddress: candidateAddress,
    },
  );

  const missingRead = database({ attempts: [] });
  assert.equal(
    await api.readAtsCandidateVerificationContext._handler(missingRead.ctx, { attemptId }),
    null,
  );

  const unsafeReadRow = attempt();
  let unsafeReadGetterCalls = 0;
  Object.defineProperty(unsafeReadRow, "expectedTarget", {
    enumerable: true,
    get() {
      unsafeReadGetterCalls += 1;
      throw new Error("verification context must not invoke an accessor");
    },
  });
  const unsafeRead = database({ attempts: [unsafeReadRow] });
  await assert.rejects(
    api.readAtsCandidateVerificationContext._handler(unsafeRead.ctx, { attemptId }),
    RangeError,
  );
  assert.equal(unsafeReadGetterCalls, 0);

  const confirmedDb = database({ attempts: [structuredClone(submitted)] });
  await api.recordAtsCandidateOutcome._handler(confirmedDb.ctx, { attemptId, outcome: "CONFIRMED" });
  assert.deepEqual(confirmedDb.writes, [{ kind: "patch", rowId: attemptId, patch: { state: "CONFIRMED" } }]);

  const unknownDb = database({ attempts: [structuredClone(submitted)] });
  await api.recordAtsCandidateOutcome._handler(unknownDb.ctx, { attemptId, outcome: "OUTCOME_UNKNOWN" });
  assert.deepEqual(unknownDb.writes[0].patch.state, "OUTCOME_UNKNOWN");
  assert.equal(typeof unknownDb.writes[0].patch.nextReconciliationAt, "bigint");
  assert.ok(unknownDb.writes[0].patch.nextReconciliationAt > 0n);

  const terminalDb = database({ attempts: [attempt({ state: "CONFIRMED" })] });
  await assert.rejects(
    api.recordAtsCandidateOutcome._handler(terminalDb.ctx, { attemptId, outcome: "REJECTED" }),
    RangeError,
  );
  assert.deepEqual(terminalDb.writes, []);

  const preparedDb = database({ attempts: [attempt()] });
  await assert.rejects(
    api.recordAtsCandidateOutcome._handler(preparedDb.ctx, { attemptId, outcome: "REJECTED" }),
    RangeError,
  );
  assert.deepEqual(preparedDb.writes, []);
});

implementedTest("keeps receipt attachment private and free of provider, SDK, HTTP, and environment capability", () => {
  const source = readFileSync(sourceUrl, "utf8");
  assert.doesNotMatch(
    source,
    /\b(?:httpRouter|httpAction|fetch|runAction|runMutation|runQuery|process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|MetaMask|WalletConnect|createWalletClient|createPublicClient|_generated)\b/u,
  );
  assert.doesNotMatch(readFileSync(new URL("../src/index.ts", import.meta.url), "utf8"), /ats_candidate_receipts/u);
});

implementedTest("enables only the predeclared attach-candidate dispatch seam", () => {
  const dispatchSource = readFileSync(new URL("../convex/command_dispatch.ts", import.meta.url), "utf8");
  const entryStart = dispatchSource.indexOf('"external.attachCandidate": Object.freeze({');
  assert.notEqual(entryStart, -1, "M41 attach-candidate seam must remain present");
  const entryEnd = dispatchSource.indexOf("  }),", entryStart);
  assert.notEqual(entryEnd, -1, "M43 attach-candidate seam must remain closed");
  const entry = dispatchSource.slice(entryStart, entryEnd);
  assert.match(entry, /enabled:\s*true/u);
  assert.match(entry, /attachAtsCandidateReceipt/u);
  for (const type of ["external.prepare", "offering.create", "directory.publish"]) {
    assert.match(dispatchSource, new RegExp(`"${type}": Object\\.freeze\\(\\{\\s*enabled: true`, "u"));
  }
});
