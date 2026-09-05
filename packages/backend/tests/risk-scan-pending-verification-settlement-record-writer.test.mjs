import assert from "node:assert/strict";
import test from "node:test";

const validArgs = {
  attemptId: "riskScanSettlementAttempts:attempt",
  transactionRef: "0xabc_123",
  observedAt: 1n,
};
const storedAttempt = {
  _id: validArgs.attemptId,
  _creationTime: 0,
  operation: "risk_scan_settlement",
  state: "pending_reconciliation",
  network: "eip155:84532",
  candidateSettlementRef: validArgs.transactionRef,
};
const canonicalRecord = {
  attemptId: validArgs.attemptId,
  network: storedAttempt.network,
  transactionRef: validArgs.transactionRef,
  verificationState: "pending_verification",
  observedAt: validArgs.observedAt,
};
const storedRecord = {
  _id: "riskScanSettlementRecords:existing",
  _creationTime: 0,
  ...canonicalRecord,
};
const attemptFields = ["_id", "operation", "state", "network", "candidateSettlementRef"];
const recordFields = ["_id", ...Object.keys(canonicalRecord)];
const ineligibleMessage = "RiskScan settlement attempt is not eligible for a settlement record";
const conflictMessage = "RiskScan settlement record conflicts with a different durable record";

async function loadWriter() {
  return import(new URL("../convex/riskscan-settlement-records.ts", import.meta.url));
}

function createControlledDatabase(options = {}) {
  const attempt = Object.hasOwn(options, "attempt") ? options.attempt : storedAttempt;
  const { byAttempt = [], byTransaction = [], insertedId = "riskScanSettlementRecords:created" } = options;
  const calls = [];
  const db = {
    async get(table, id) {
      calls.push({ method: "get", table, id });
      return attempt;
    },
    query(table) {
      calls.push({ method: "query", table });
      return {
        withIndex(indexName, selectIndex) {
          calls.push({ method: "withIndex", indexName });
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
              assert.ok(["by_attempt", "by_network_and_transaction_ref"].includes(indexName));
              return (indexName === "by_attempt" ? byAttempt : byTransaction).slice(0, limit);
            },
          };
        },
      };
    },
    async insert(table, document) {
      calls.push({ method: "insert", table, document });
      return insertedId;
    },
  };
  return { calls, handlerContext: { db } };
}

function expectedLookups(args = validArgs, network = storedAttempt.network) {
  return [
    { method: "get", table: "riskScanSettlementAttempts", id: args.attemptId },
    { method: "query", table: "riskScanSettlementRecords" },
    { method: "withIndex", indexName: "by_attempt" },
    { method: "eq", field: "attemptId", value: args.attemptId },
    { method: "take", limit: 2 },
    { method: "takeResolved", indexName: "by_attempt" },
    { method: "query", table: "riskScanSettlementRecords" },
    { method: "withIndex", indexName: "by_network_and_transaction_ref" },
    { method: "eq", field: "network", value: network },
    { method: "eq", field: "transactionRef", value: args.transactionRef },
    { method: "take", limit: 2 },
    { method: "takeResolved", indexName: "by_network_and_transaction_ref" },
  ];
}

function assertSafeResult(result, status, recordId) {
  assert.deepEqual(result, { status, recordId, verificationState: "pending_verification" });
  assert.deepEqual(Reflect.ownKeys(result).sort(), ["recordId", "status", "verificationState"]);
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

test("registers only an internal settlement-record mutation with exact validators", async () => {
  const exports = await loadWriter();
  assert.deepEqual(Object.keys(exports), ["recordInitialRiskScanSettlementRecord"]);
  const writer = exports.recordInitialRiskScanSettlementRecord;
  assert.equal(writer.isMutation, true);
  assert.equal(writer.isInternal, true);
  assert.deepEqual(JSON.parse(writer.exportArgs()), {
    type: "object",
    value: {
      attemptId: { fieldType: { type: "id", tableName: "riskScanSettlementAttempts" }, optional: false },
      transactionRef: { fieldType: { type: "string" }, optional: false },
      observedAt: { fieldType: { type: "bigint" }, optional: false },
    },
  });
  assert.deepEqual(JSON.parse(writer.exportReturns()), {
    type: "object",
    value: {
      status: {
        fieldType: { type: "union", value: [
          { type: "literal", value: "created" },
          { type: "literal", value: "replayed" },
        ] },
        optional: false,
      },
      recordId: { fieldType: { type: "id", tableName: "riskScanSettlementRecords" }, optional: false },
      verificationState: { fieldType: { type: "literal", value: "pending_verification" }, optional: false },
    },
  });
});

test("creates only the canonical pending-verification record after both ordered bounded lookups", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase();
  const result = await writer._handler(handlerContext, { ...validArgs });
  assertSafeResult(result, "created", "riskScanSettlementRecords:created");
  assert.deepEqual(calls, [
    ...expectedLookups(),
    { method: "insert", table: "riskScanSettlementRecords", document: canonicalRecord },
  ]);
  assert.deepEqual(Reflect.ownKeys(calls.at(-1).document).sort(), Object.keys(canonicalRecord).sort());
});

test("rejects invalid candidate fields before touching ctx.db", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  let databaseReads = 0;
  const handlerContext = {
    get db() {
      databaseReads += 1;
      throw new Error("database must remain untouched");
    },
  };
  for (const overrides of [
    { transactionRef: "" }, { transactionRef: "unsafe reference" },
    { transactionRef: "a".repeat(161) }, { transactionRef: 1 },
    { observedAt: 1 }, { observedAt: -1n }, { observedAt: 9_223_372_036_854_775_808n },
  ]) {
    await assert.rejects(
      () => writer._handler(handlerContext, { ...validArgs, ...overrides }),
      (error) => error instanceof TypeError
        && error.message === "Invalid RiskScan settlement-record admission input",
    );
  }
  assert.equal(databaseReads, 0);
});

test("rejects absent, malformed, wrong-ID and ineligible attempts before index access", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  for (const attempt of [
    null, undefined, false, 1, "attempt", {}, [], Object.assign([], storedAttempt),
    ...["", 1, "other-attempt"].map((_id) => ({ ...storedAttempt, _id })),
    { ...storedAttempt, operation: "other_operation" },
    { ...storedAttempt, state: "settled" },
    { ...storedAttempt, candidateSettlementRef: "0xdef_456" },
    ...[undefined, 1, "", "eip155:0", "eip155:01", "eip155:-1", "eip155:1.0", "eip155:1\n", "eip155:1 ", "EIP155:1", "other:1"]
      .map((network) => ({ ...storedAttempt, network })),
  ]) {
    await assertIneligible(writer._handler, attempt);
  }
});

test("requires each attempt field to be own enumerable data without reading accessors", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  let getterReads = 0;
  for (const field of attemptFields) {
    const missing = { ...storedAttempt };
    delete missing[field];
    const inherited = Object.assign(Object.create({ [field]: storedAttempt[field] }), missing);
    for (const attempt of [
      missing, inherited,
      withFieldDescriptor(storedAttempt, field, { enumerable: false, value: storedAttempt[field] }),
      withFieldDescriptor(storedAttempt, field, {
        enumerable: true,
        get() { getterReads += 1; throw new Error("attempt getter must not run"); },
      }),
    ]) {
      await assertIneligible(writer._handler, attempt);
    }
  }
  assert.equal(getterReads, 0);
});

test("replays separate safe records from both indexes with metadata and no insertion", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase({
    byAttempt: [{ ...storedRecord }],
    byTransaction: [{ ...storedRecord, _creationTime: 2, storageMetadata: "ignored" }],
  });
  assertSafeResult(await writer._handler(handlerContext, { ...validArgs }), "replayed", storedRecord._id);
  assert.deepEqual(calls, expectedLookups());
});

test("rejects duplicates, one-sided results and differing opaque record IDs", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  const one = [{ ...storedRecord }];
  const two = [{ ...storedRecord }, { ...storedRecord, _id: "another-record" }];
  for (const [byAttempt, byTransaction] of [
    [one, []], [[], one], [two, []], [[], two], [two, one], [one, two], [two, two],
    [one, [{ ...storedRecord, _id: "different-record" }]],
  ]) {
    await assertConflict(writer._handler, byAttempt, byTransaction);
  }
});

test("independently rejects malformed and descriptor-unsafe records from either index", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  let getterReads = 0;
  const unsafeRows = [
    null, undefined, false, 1, "record", {}, [], Object.assign([], storedRecord),
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
    await assertConflict(writer._handler, [row], [{ ...storedRecord }]);
    await assertConflict(writer._handler, [{ ...storedRecord }], [row]);
  }
  assert.equal(getterReads, 0);
});

test("rejects accessor descriptors despite prototype-supplied values without getter reads", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
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
            await assertIneligible(writer._handler, unsafeRow);
          } else {
            await assertConflict(writer._handler, [unsafeRow], [{ ...storedRecord }]);
            await assertConflict(writer._handler, [{ ...storedRecord }], [unsafeRow]);
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
});

test("rejects every canonical mismatch in either index and in otherwise agreeing rows", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  for (const [field, value] of [
    ["attemptId", "other-attempt"], ["network", "eip155:1"],
    ["transactionRef", "other-reference"], ["verificationState", "verified"],
    ["observedAt", 2n], ["observedAt", 1],
  ]) {
    const mismatch = { ...storedRecord, [field]: value };
    await assertConflict(writer._handler, [mismatch], [{ ...storedRecord }]);
    await assertConflict(writer._handler, [{ ...storedRecord }], [mismatch]);
    await assertConflict(writer._handler, [mismatch], [{ ...mismatch }]);
  }
});

test("rejects any own finality boundary without reading it", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  let getterReads = 0;
  for (const descriptor of [
    { enumerable: true, value: "final" },
    { enumerable: true, value: undefined },
    { enumerable: false, value: undefined },
    { enumerable: true, get() { getterReads += 1; throw new Error("finality getter must not run"); } },
    { enumerable: false, get() { getterReads += 1; throw new Error("finality getter must not run"); } },
  ]) {
    const row = withFieldDescriptor(storedRecord, "finalityBoundary", descriptor);
    await assertConflict(writer._handler, [row], [{ ...storedRecord }]);
    await assertConflict(writer._handler, [{ ...storedRecord }], [row]);
  }
  assert.equal(getterReads, 0);
});

test("preserves opaque IDs, derives the network from storage and returns only local state", async () => {
  const { recordInitialRiskScanSettlementRecord: writer } = await loadWriter();
  const args = { ...validArgs, attemptId: "opaque/attempt identifier" };
  const network = "eip155:1";
  const attempt = { ...storedAttempt, _id: args.attemptId, network };
  const document = { ...canonicalRecord, attemptId: args.attemptId, network };
  const recordId = "opaque/record identifier";
  for (const replay of [false, true]) {
    const { calls, handlerContext } = createControlledDatabase({
      attempt, insertedId: recordId,
      byAttempt: replay ? [{ ...document, _id: recordId }] : [],
      byTransaction: replay ? [{ ...document, _id: recordId }] : [],
    });
    assertSafeResult(await writer._handler(handlerContext, args), replay ? "replayed" : "created", recordId);
    assert.deepEqual(calls, [
      ...expectedLookups(args, network),
      ...(replay ? [] : [{ method: "insert", table: "riskScanSettlementRecords", document }]),
    ]);
  }
});
