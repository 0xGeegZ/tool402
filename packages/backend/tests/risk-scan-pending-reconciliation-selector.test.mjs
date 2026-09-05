import assert from "node:assert/strict";
import test from "node:test";

const maxInt64 = 9_223_372_036_854_775_807n;
const storedAttempt = {
  _id: "opaque/attempt identifier",
  operation: "risk_scan_settlement",
  state: "pending_reconciliation",
  network: "eip155:84532",
  candidateSettlementRef: "0xabc_123:XYZ-9",
  nextReconciliationAt: 5n,
};
const fields = Object.keys(storedAttempt);
const cutoffMessage = "RiskScan reconciliation cutoff is invalid";
const unsafeMessage = "RiskScan pending reconciliation selector encountered an unsafe durable attempt";

async function loadSelector() {
  return import(new URL("../convex/riskscan-pending-reconciliation-selector.ts", import.meta.url));
}

function createControlledDatabase(rows = []) {
  const calls = [];
  const forbidden = () => { throw new Error("other reads, writes and actions are forbidden"); };
  return {
    calls,
    handlerContext: {
      db: {
        query(table) {
          calls.push({ method: "query", table });
          assert.equal(table, "riskScanSettlementAttempts");
          return {
            withIndex(indexName, selectIndex) {
              calls.push({ method: "withIndex", indexName });
              assert.equal(indexName, "by_state_and_next_reconciliation");
              const range = {
                eq(field, value) {
                  calls.push({ method: "eq", field, value });
                  return range;
                },
                lte(field, value) {
                  calls.push({ method: "lte", field, value });
                  return range;
                },
              };
              selectIndex(range);
              return {
                async take(limit) {
                  calls.push({ method: "take", limit });
                  return rows.slice(0, limit);
                },
              };
            },
          };
        },
        get: forbidden,
        insert: forbidden,
        patch: forbidden,
        replace: forbidden,
        delete: forbidden,
      },
      runQuery: forbidden,
      runMutation: forbidden,
      runAction: forbidden,
      scheduler: { runAfter: forbidden, runAt: forbidden },
    },
  };
}

function expectedCalls(beforeOrAt) {
  return [
    { method: "query", table: "riskScanSettlementAttempts" },
    { method: "withIndex", indexName: "by_state_and_next_reconciliation" },
    { method: "eq", field: "state", value: "pending_reconciliation" },
    { method: "lte", field: "nextReconciliationAt", value: beforeOrAt },
    { method: "take", limit: 2 },
  ];
}

async function assertUnsafe(handler, rows, beforeOrAt = 5n) {
  const { calls, handlerContext } = createControlledDatabase(rows);
  await assert.rejects(
    () => handler(handlerContext, { beforeOrAt }),
    (error) => error instanceof RangeError && error.message === unsafeMessage,
  );
  assert.deepEqual(calls, expectedCalls(beforeOrAt));
}

test("registers one internal selector with exact cutoff and narrow return validators", async () => {
  const exports = await loadSelector();
  assert.deepEqual(Object.keys(exports), ["selectRiskScanPendingReconciliationAttempt"]);
  const selector = exports.selectRiskScanPendingReconciliationAttempt;
  assert.equal(selector.isQuery, true);
  assert.equal(selector.isInternal, true);
  assert.equal(selector.isPublic, undefined);
  assert.equal(selector.isMutation, undefined);
  assert.equal(selector.isAction, undefined);
  assert.deepEqual(JSON.parse(selector.exportArgs()), {
    type: "object",
    value: { beforeOrAt: { fieldType: { type: "bigint" }, optional: false } },
  });
  assert.deepEqual(JSON.parse(selector.exportReturns()), {
    type: "union",
    value: [
      { type: "null" },
      {
        type: "object",
        value: {
          attemptId: { fieldType: { type: "id", tableName: "riskScanSettlementAttempts" }, optional: false },
        },
      },
    ],
  });
});

test("rejects invalid cutoffs before any database call", async () => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  for (const beforeOrAt of [undefined, null, true, false, 0, 5, NaN, Infinity, "5", {}, [], Symbol("cutoff"), -1n, maxInt64 + 1n]) {
    const { calls, handlerContext } = createControlledDatabase([storedAttempt]);
    await assert.rejects(
      () => selector._handler(handlerContext, { beforeOrAt }),
      (error) => error instanceof RangeError && error.message === cutoffMessage,
    );
    assert.deepEqual(calls, []);
  }
});

test("returns null only for an empty bounded index result", async () => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  for (const beforeOrAt of [0n, 5n, maxInt64]) {
    const { calls, handlerContext } = createControlledDatabase();
    assert.equal(await selector._handler(handlerContext, { beforeOrAt }), null);
    assert.deepEqual(calls, expectedCalls(beforeOrAt));
  }
});

test("selects only an opaque attempt ID at equal or earlier cutoff boundaries", async () => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  for (const [nextReconciliationAt, beforeOrAt] of [[0n, 0n], [4n, 5n], [5n, 5n], [maxInt64, maxInt64]]) {
    for (const candidateSettlementRef of ["a", "0xabc_123:XYZ-9", "a".repeat(160)]) {
      const row = { ...storedAttempt, candidateSettlementRef, nextReconciliationAt, _creationTime: 1 };
      let unrelatedGetterReads = 0;
      Object.defineProperty(row, "unrelated", {
        get() { unrelatedGetterReads += 1; throw new Error("unrelated getter must not run"); },
      });
      const { calls, handlerContext } = createControlledDatabase([row]);
      const result = await selector._handler(handlerContext, { beforeOrAt });
      assert.deepEqual(result, { attemptId: "opaque/attempt identifier" });
      assert.deepEqual(Reflect.ownKeys(result), ["attemptId"]);
      assert.equal(unrelatedGetterReads, 0);
      assert.deepEqual(calls, expectedCalls(beforeOrAt));
    }
  }
});

test("rejects two candidates even when their IDs are equal", async () => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  for (const second of [{ ...storedAttempt }, { ...storedAttempt, _id: "other-attempt" }]) {
    await assertUnsafe(selector._handler, [storedAttempt, second]);
  }
});

test("reads bounded candidates without network, clocks, timers or randomness", async (t) => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  const forbidden = () => { throw new Error("external APIs are forbidden"); };
  for (const method of ["fetch", "Date", "setTimeout", "setInterval", "setImmediate"]) {
    t.mock.method(globalThis, method, forbidden);
  }
  t.mock.method(Math, "random", forbidden);
  for (const rows of [[], [storedAttempt]]) {
    const { calls, handlerContext } = createControlledDatabase(rows);
    assert.deepEqual(
      await selector._handler(handlerContext, { beforeOrAt: 5n }),
      rows.length === 0 ? null : { attemptId: "opaque/attempt identifier" },
    );
    assert.deepEqual(calls, expectedCalls(5n));
  }
});

test("rejects malformed and ineligible stored attempts", async () => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  for (const row of [
    undefined, null, true, false, 0, 1n, "attempt", Symbol("attempt"), () => {}, {}, [], Object.assign([], storedAttempt),
    ...["", 0, undefined, null].map((_id) => ({ ...storedAttempt, _id })),
    ...[null, 1, "other_operation"].map((operation) => ({ ...storedAttempt, operation })),
    ...[null, 1, "settled", "verified", "pending_verification", "payment_required"].map((state) => ({ ...storedAttempt, state })),
    ...[null, 1, "", "eip155:0", "eip155:01", "eip155:-1", "eip155:1.0", "eip155:1\n", "eip155:1 ", "EIP155:1", "other:1"]
      .map((network) => ({ ...storedAttempt, network })),
    ...[null, 1, "", "unsafe reference", "a/b", "a\n", "é", "a".repeat(161)]
      .map((candidateSettlementRef) => ({ ...storedAttempt, candidateSettlementRef })),
    ...[null, 0, "5", -1n, 6n, maxInt64 + 1n]
      .map((nextReconciliationAt) => ({ ...storedAttempt, nextReconciliationAt })),
  ]) {
    await assertUnsafe(selector._handler, [row]);
  }
});

test("requires every selected field to be own enumerable data without invoking getters", async () => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  let getterReads = 0;
  for (const field of fields) {
    const missing = { ...storedAttempt };
    delete missing[field];
    for (const row of [
      missing,
      Object.assign(Object.create({ [field]: storedAttempt[field] }), missing),
      Object.defineProperty({ ...storedAttempt }, field, { enumerable: false, value: storedAttempt[field] }),
      Object.defineProperty({ ...storedAttempt }, field, {
        enumerable: true,
        get() { getterReads += 1; throw new Error("stored getter must not run"); },
      }),
    ]) {
      await assertUnsafe(selector._handler, [row]);
    }
  }
  assert.equal(getterReads, 0);
});

test("rejects accessor descriptors with prototype-supplied values and restores pollution", async () => {
  const { selectRiskScanPendingReconciliationAttempt: selector } = await loadSelector();
  let getterReads = 0;
  let prototypeGetterReads = 0;
  const priorDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, "value");
  for (const field of fields) {
    for (const prototypeAccessor of [false, true]) {
      const row = Object.defineProperty({ ...storedAttempt }, field, {
        enumerable: true,
        get() { getterReads += 1; throw new Error("stored getter must not run"); },
      });
      try {
        Object.defineProperty(Object.prototype, "value", prototypeAccessor ? {
          configurable: true,
          get() { prototypeGetterReads += 1; return storedAttempt[field]; },
        } : { configurable: true, writable: true, value: storedAttempt[field] });
        await assertUnsafe(selector._handler, [row]);
      } finally {
        delete Object.prototype.value;
        if (priorDescriptor !== undefined) {
          Object.defineProperty(Object.prototype, "value", priorDescriptor);
        }
      }
    }
  }
  assert.equal(getterReads, 0);
  assert.equal(prototypeGetterReads, 0);
  assert.deepEqual(Object.getOwnPropertyDescriptor(Object.prototype, "value"), priorDescriptor);
});
