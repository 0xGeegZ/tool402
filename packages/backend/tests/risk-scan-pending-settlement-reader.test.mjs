import assert from "node:assert/strict";
import test from "node:test";

const validArgs = { attemptId: "riskScanSettlementAttempts:attempt" };
const storedAttempt = {
  _id: validArgs.attemptId,
  operation: "risk_scan_settlement",
  state: "pending_reconciliation",
  network: "eip155:84532",
  candidateSettlementRef: "0xabc_123",
};
const storedRecord = {
  _id: "riskScanSettlementRecords:existing",
  attemptId: validArgs.attemptId,
  network: storedAttempt.network,
  transactionRef: storedAttempt.candidateSettlementRef,
  verificationState: "pending_verification",
  observedAt: 1n,
};
const attemptFields = Object.keys(storedAttempt);
const recordFields = Object.keys(storedRecord);
const ineligibleMessage = "RiskScan settlement attempt is not eligible for pending-settlement read";
const conflictMessage = "RiskScan pending settlement record conflicts with a different durable record";

async function loadReader() {
  return import(new URL("../convex/riskscan-pending-settlement-reader.ts", import.meta.url));
}

function createControlledDatabase(options = {}) {
  const attempt = Object.hasOwn(options, "attempt") ? options.attempt : storedAttempt;
  const { byAttempt = [], byTransaction = [] } = options;
  const calls = [];
  const forbidden = () => { throw new Error("writes and actions are forbidden"); };
  const db = {
    async get(table, id) {
      calls.push({ method: "get", table, id });
      assert.equal(table, "riskScanSettlementAttempts");
      return attempt;
    },
    query(table) {
      calls.push({ method: "query", table });
      assert.equal(table, "riskScanSettlementRecords");
      return {
        withIndex(indexName, selectIndex) {
          calls.push({ method: "withIndex", indexName });
          assert.ok(["by_attempt", "by_network_and_transaction_ref"].includes(indexName));
          const index = {
            eq(field, value) {
              calls.push({ method: "eq", field, value });
              return index;
            },
          };
          selectIndex(index);
          return {
            async take(limit) {
              calls.push({ method: "take", limit });
              await Promise.resolve();
              calls.push({ method: "takeResolved", indexName });
              return (indexName === "by_attempt" ? byAttempt : byTransaction).slice(0, limit);
            },
          };
        },
      };
    },
    insert: forbidden,
    patch: forbidden,
    replace: forbidden,
    delete: forbidden,
  };
  return {
    calls,
    handlerContext: {
      db,
      runQuery: forbidden,
      runMutation: forbidden,
      runAction: forbidden,
      scheduler: { runAfter: forbidden, runAt: forbidden },
    },
  };
}

function expectedLookups(attempt = storedAttempt) {
  return [
    { method: "get", table: "riskScanSettlementAttempts", id: attempt._id },
    { method: "query", table: "riskScanSettlementRecords" },
    { method: "withIndex", indexName: "by_attempt" },
    { method: "eq", field: "attemptId", value: attempt._id },
    { method: "take", limit: 2 },
    { method: "takeResolved", indexName: "by_attempt" },
    { method: "query", table: "riskScanSettlementRecords" },
    { method: "withIndex", indexName: "by_network_and_transaction_ref" },
    { method: "eq", field: "network", value: attempt.network },
    { method: "eq", field: "transactionRef", value: attempt.candidateSettlementRef },
    { method: "take", limit: 2 },
    { method: "takeResolved", indexName: "by_network_and_transaction_ref" },
  ];
}

async function assertIneligible(handler, attempt) {
  const { calls, handlerContext } = createControlledDatabase({ attempt });
  await assert.rejects(
    () => handler(handlerContext, { ...validArgs }),
    (error) => error instanceof RangeError && error.message === ineligibleMessage,
  );
  assert.deepEqual(calls, [expectedLookups()[0]]);
}

async function assertConflict(handler, byAttempt, byTransaction) {
  const { calls, handlerContext } = createControlledDatabase({ byAttempt, byTransaction });
  await assert.rejects(
    () => handler(handlerContext, { ...validArgs }),
    (error) => error instanceof RangeError && error.message === conflictMessage,
  );
  assert.deepEqual(calls, expectedLookups());
}

function withFieldDescriptor(row, field, descriptor) {
  return Object.defineProperty({ ...row }, field, descriptor);
}

test("registers exactly one internal query with exact argument and return validators", async () => {
  const exports = await loadReader();
  assert.deepEqual(Object.keys(exports), ["readRiskScanPendingSettlementCandidate"]);
  const reader = exports.readRiskScanPendingSettlementCandidate;
  assert.equal(reader.isQuery, true);
  assert.equal(reader.isInternal, true);
  assert.equal(reader.isPublic, undefined);
  assert.equal(reader.isMutation, undefined);
  assert.equal(reader.isAction, undefined);
  assert.deepEqual(JSON.parse(reader.exportArgs()), {
    type: "object",
    value: {
      attemptId: { fieldType: { type: "id", tableName: "riskScanSettlementAttempts" }, optional: false },
    },
  });
  assert.deepEqual(JSON.parse(reader.exportReturns()), {
    type: "union",
    value: [
      { type: "null" },
      {
        type: "object",
        value: {
          recordId: { fieldType: { type: "id", tableName: "riskScanSettlementRecords" }, optional: false },
          network: { fieldType: { type: "string" }, optional: false },
          transactionRef: { fieldType: { type: "string" }, optional: false },
          verificationState: { fieldType: { type: "literal", value: "pending_verification" }, optional: false },
          observedAt: { fieldType: { type: "bigint" }, optional: false },
        },
      },
    ],
  });
});

test("returns null for exactly an absent attempt without record lookups", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  const { calls, handlerContext } = createControlledDatabase({ attempt: null });
  assert.equal(await reader._handler(handlerContext, { ...validArgs }), null);
  assert.deepEqual(calls, [expectedLookups()[0]]);
});

test("returns null only after both ordered bounded record lookups are empty", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  const { calls, handlerContext } = createControlledDatabase();
  assert.equal(await reader._handler(handlerContext, { ...validArgs }), null);
  assert.deepEqual(calls, expectedLookups());
});

test("projects coherent independent records with opaque IDs and boundary timestamps", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  for (const observedAt of [0n, 1n, 9_223_372_036_854_775_807n]) {
    for (const candidateSettlementRef of ["a", "0xabc_123:XYZ-9", "a".repeat(160)]) {
      const attempt = {
        ...storedAttempt, _id: "opaque/attempt identifier", network: "eip155:12345", candidateSettlementRef,
      };
      const record = {
        ...storedRecord, _id: "opaque/record identifier", attemptId: attempt._id,
        network: attempt.network, transactionRef: candidateSettlementRef, observedAt,
      };
      const { calls, handlerContext } = createControlledDatabase({
        attempt,
        byAttempt: [{ ...record, _creationTime: 1, publicId: "excluded" }],
        byTransaction: [{ ...record, _creationTime: 2, storageMetadata: "ignored" }],
      });
      const result = await reader._handler(handlerContext, { attemptId: attempt._id });
      assert.deepEqual(result, {
        recordId: record._id, network: attempt.network, transactionRef: candidateSettlementRef,
        verificationState: "pending_verification", observedAt,
      });
      assert.deepEqual(Reflect.ownKeys(result).sort(), [
        "network", "observedAt", "recordId", "transactionRef", "verificationState",
      ]);
      assert.deepEqual(calls, expectedLookups(attempt));
    }
  }
});

test("rejects every present malformed, wrong-ID or ineligible attempt before record access", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  for (const attempt of [
    undefined, false, true, 0, 1n, "attempt", Symbol("attempt"), () => {}, {}, [], Object.assign([], storedAttempt),
    ...["", 1, null, "other-attempt"].map((_id) => ({ ...storedAttempt, _id })),
    { ...storedAttempt, operation: "other_operation" },
    ...["settled", "verified", "payment_required", "pending_verification"].map((state) => ({ ...storedAttempt, state })),
    ...[undefined, 1, "", "eip155:0", "eip155:01", "eip155:-1", "eip155:1.0", "eip155:1\n", "eip155:1 ", "EIP155:1", "other:1"]
      .map((network) => ({ ...storedAttempt, network })),
    ...[undefined, null, 1, "", "unsafe reference", "a/b", "a\n", "é", "a".repeat(161)]
      .map((candidateSettlementRef) => ({ ...storedAttempt, candidateSettlementRef })),
  ]) {
    await assertIneligible(reader._handler, attempt);
  }
});

test("requires every attempt field to be own enumerable data without getter reads", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  let getterReads = 0;
  for (const field of attemptFields) {
    const missing = { ...storedAttempt };
    delete missing[field];
    for (const attempt of [
      missing,
      Object.assign(Object.create({ [field]: storedAttempt[field] }), missing),
      withFieldDescriptor(storedAttempt, field, { enumerable: false, value: storedAttempt[field] }),
      withFieldDescriptor(storedAttempt, field, {
        enumerable: true,
        get() { getterReads += 1; throw new Error("attempt getter must not run"); },
      }),
    ]) {
      await assertIneligible(reader._handler, attempt);
    }
  }
  assert.equal(getterReads, 0);
});

test("rejects duplicates, one-sided results and differing record IDs", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  const one = [{ ...storedRecord }];
  const two = [{ ...storedRecord }, { ...storedRecord, _id: "another-record" }];
  for (const [byAttempt, byTransaction] of [
    [one, []], [[], one], [two, []], [[], two], [two, one], [one, two], [two, two],
    [one, [{ ...storedRecord, _id: "different-record" }]],
  ]) {
    await assertConflict(reader._handler, byAttempt, byTransaction);
  }
});

test("independently rejects malformed and descriptor-unsafe records in either index", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  let getterReads = 0;
  const unsafeRows = [
    null, undefined, false, 1, 1n, "record", Symbol("record"), () => {}, {}, [], Object.assign([], storedRecord),
    ...["", 1, null].map((_id) => ({ ...storedRecord, _id })),
  ];
  for (const field of recordFields) {
    const missing = { ...storedRecord };
    delete missing[field];
    unsafeRows.push(
      missing,
      Object.assign(Object.create({ [field]: storedRecord[field] }), missing),
      withFieldDescriptor(storedRecord, field, { enumerable: false, value: storedRecord[field] }),
      withFieldDescriptor(storedRecord, field, {
        enumerable: true,
        get() { getterReads += 1; throw new Error("record getter must not run"); },
      }),
    );
  }
  for (const row of unsafeRows) {
    await assertConflict(reader._handler, [row], [{ ...storedRecord }]);
    await assertConflict(reader._handler, [{ ...storedRecord }], [row]);
  }
  assert.equal(getterReads, 0);
});

test("rejects accessor descriptors with prototype-supplied values and restores pollution", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  let getterReads = 0;
  let prototypeGetterReads = 0;
  const priorDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, "value");
  for (const [row, fields, isAttempt] of [
    [storedAttempt, attemptFields, true], [storedRecord, recordFields, false],
  ]) {
    for (const field of fields) {
      for (const prototypeAccessor of [false, true]) {
        const unsafeRow = withFieldDescriptor(row, field, {
          enumerable: true,
          get() { getterReads += 1; throw new Error("stored getter must not run"); },
        });
        try {
          Object.defineProperty(Object.prototype, "value", prototypeAccessor ? {
            configurable: true,
            get() { prototypeGetterReads += 1; return row[field]; },
          } : {
            configurable: true, writable: true, value: row[field],
          });
          if (isAttempt) {
            await assertIneligible(reader._handler, unsafeRow);
          } else {
            await assertConflict(reader._handler, [unsafeRow], [{ ...storedRecord }]);
            await assertConflict(reader._handler, [{ ...storedRecord }], [unsafeRow]);
          }
        } finally {
          delete Object.prototype.value;
          if (priorDescriptor !== undefined) {
            Object.defineProperty(Object.prototype, "value", priorDescriptor);
          }
        }
      }
    }
  }
  assert.equal(getterReads, 0);
  assert.equal(prototypeGetterReads, 0);
  assert.deepEqual(Object.getOwnPropertyDescriptor(Object.prototype, "value"), priorDescriptor);
});

test("rejects canonical mismatches, wrong states and invalid timestamps even when rows agree", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  for (const [field, value] of [
    ["attemptId", "other-attempt"], ["network", "eip155:1"],
    ["transactionRef", "other-reference"], ["verificationState", "verified"],
    ["verificationState", "finalized"], ["verificationState", "pending_reconciliation"],
    ...[1, "1", null, undefined, -1n, 9_223_372_036_854_775_808n].map((value) => ["observedAt", value]),
  ]) {
    const mismatch = { ...storedRecord, [field]: value };
    await assertConflict(reader._handler, [mismatch], [{ ...storedRecord }]);
    await assertConflict(reader._handler, [{ ...storedRecord }], [mismatch]);
    await assertConflict(reader._handler, [mismatch], [{ ...mismatch }]);
  }
});

test("rejects otherwise coherent records whose valid timestamps disagree", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  for (const observedAt of [0n, 2n, 9_223_372_036_854_775_807n]) {
    const mismatch = { ...storedRecord, observedAt };
    await assertConflict(reader._handler, [mismatch], [{ ...storedRecord }]);
    await assertConflict(reader._handler, [{ ...storedRecord }], [mismatch]);
  }
});

test("rejects any own finality boundary without reading it", async () => {
  const { readRiskScanPendingSettlementCandidate: reader } = await loadReader();
  let getterReads = 0;
  for (const descriptor of [
    { enumerable: true, value: "final" },
    { enumerable: true, value: undefined },
    { enumerable: false, value: undefined },
    { enumerable: true, get() { getterReads += 1; throw new Error("finality getter must not run"); } },
    { enumerable: false, get() { getterReads += 1; throw new Error("finality getter must not run"); } },
  ]) {
    const row = withFieldDescriptor(storedRecord, "finalityBoundary", descriptor);
    await assertConflict(reader._handler, [row], [{ ...storedRecord }]);
    await assertConflict(reader._handler, [{ ...storedRecord }], [row]);
  }
  assert.equal(getterReads, 0);
});
