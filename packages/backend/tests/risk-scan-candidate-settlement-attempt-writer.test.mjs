import assert from "node:assert/strict";
import test from "node:test";

const validArgs = {
  requestId: "riskScanRequests:request",
  idempotencyKeyHash: "a".repeat(64),
  network: "eip155:84532",
  candidateSettlementRef: "0xabc_123",
  createdAt: 1n,
  updatedAt: 1n,
};

const storedRequest = {
  _id: "riskScanRequests:request",
  _creationTime: 0,
  publicId: "risk_402",
  requestRef: "request-402",
  subjectRefHash: "b".repeat(64),
  inputHash: "c".repeat(64),
  state: "payment_required",
  createdAt: 1n,
  updatedAt: 1n,
};

const canonicalAttempt = {
  publicId: "risk_402",
  requestId: "riskScanRequests:request",
  operation: "risk_scan_settlement",
  idempotencyKeyHash: "a".repeat(64),
  network: "eip155:84532",
  state: "pending_reconciliation",
  candidateSettlementRef: "0xabc_123",
  nextReconciliationAt: 1n,
  createdAt: 1n,
  updatedAt: 1n,
};

const ineligibleRequestMessage = "RiskScan request is not eligible for a settlement attempt";
const conflictMessage = "RiskScan settlement attempt conflicts with a different durable attempt";

async function loadWriter() {
  return import(new URL("../convex/riskscan-settlement-attempts.ts", import.meta.url));
}

function copyValidArgs() {
  return { ...validArgs };
}

function createControlledDatabase({
  request = storedRequest,
  existingRows = [],
  insertedId = "riskScanSettlementAttempts:created",
} = {}) {
  const calls = { gets: [], queries: [], inserts: [] };
  const db = {
    async get(table, id) {
      calls.gets.push({ table, id });
      return request;
    },
    query(table) {
      const query = {
        table,
        indexName: null,
        equalities: [],
        takeLimit: null,
      };
      calls.queries.push(query);
      const index = {
        eq(field, value) {
          query.equalities.push({ field, value });
          return index;
        },
      };

      return {
        withIndex(indexName, selectIndex) {
          query.indexName = indexName;
          selectIndex(index);

          return {
            async take(limit) {
              query.takeLimit = limit;
              return existingRows.slice(0, limit);
            },
          };
        },
      };
    },
    async insert(table, document) {
      calls.inserts.push({ table, document });
      return insertedId;
    },
  };

  return { calls, handlerContext: { db } };
}

function assertRequestLookup(calls) {
  assert.deepEqual(calls.gets, [{
    table: "riskScanRequests",
    id: "riskScanRequests:request",
  }]);
}

function assertCanonicalQuery(calls) {
  assert.deepEqual(calls.queries, [{
    table: "riskScanSettlementAttempts",
    indexName: "by_idempotency_scope_and_key",
    equalities: [
      { field: "operation", value: "risk_scan_settlement" },
      { field: "idempotencyKeyHash", value: "a".repeat(64) },
    ],
    takeLimit: 2,
  }]);
}

function assertSafeResult(result, status, attemptId) {
  assert.deepEqual(result, {
    status,
    attemptId,
    state: "pending_reconciliation",
  });
  assert.deepEqual(Object.keys(result).sort(), ["attemptId", "state", "status"]);
}

async function assertConflict(handler, handlerContext) {
  await assert.rejects(
    () => handler(handlerContext, copyValidArgs()),
    (error) => error instanceof RangeError && error.message === conflictMessage,
  );
}

test("registers an internal candidate settlement-attempt writer with exact validators", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();
  const args = JSON.parse(recordInitialRiskScanSettlementAttempt.exportArgs());
  const returns = JSON.parse(recordInitialRiskScanSettlementAttempt.exportReturns());

  assert.equal(recordInitialRiskScanSettlementAttempt.isMutation, true);
  assert.equal(recordInitialRiskScanSettlementAttempt.isInternal, true);
  assert.equal(args.type, "object");
  assert.deepEqual(Object.keys(args.value).sort(), [
    "candidateSettlementRef",
    "createdAt",
    "idempotencyKeyHash",
    "network",
    "requestId",
    "updatedAt",
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(args.value).map(([key, validator]) => [
        key,
        [validator.fieldType.type, validator.optional],
      ]),
    ),
    {
      requestId: ["id", false],
      idempotencyKeyHash: ["string", false],
      network: ["string", false],
      candidateSettlementRef: ["string", false],
      createdAt: ["bigint", false],
      updatedAt: ["bigint", false],
    },
  );
  assert.deepEqual(args.value.requestId, {
    fieldType: { type: "id", tableName: "riskScanRequests" },
    optional: false,
  });
  assert.equal(returns.type, "object");
  assert.deepEqual(Object.keys(returns.value).sort(), ["attemptId", "state", "status"]);
  assert.deepEqual(returns.value.status, {
    fieldType: {
      type: "union",
      value: [
        { type: "literal", value: "created" },
        { type: "literal", value: "replayed" },
      ],
    },
    optional: false,
  });
  assert.deepEqual(returns.value.attemptId, {
    fieldType: { type: "id", tableName: "riskScanSettlementAttempts" },
    optional: false,
  });
  assert.deepEqual(returns.value.state, {
    fieldType: { type: "literal", value: "pending_reconciliation" },
    optional: false,
  });
});

test("creates one canonical candidate attempt through the bounded idempotency index", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase();

  const result = await recordInitialRiskScanSettlementAttempt._handler(
    handlerContext,
    copyValidArgs(),
  );

  assertSafeResult(result, "created", "riskScanSettlementAttempts:created");
  assertRequestLookup(calls);
  assertCanonicalQuery(calls);
  assert.deepEqual(calls.inserts, [{
    table: "riskScanSettlementAttempts",
    document: canonicalAttempt,
  }]);
  assert.deepEqual(Object.keys(calls.inserts[0].document).sort(), [
    "candidateSettlementRef",
    "createdAt",
    "idempotencyKeyHash",
    "network",
    "nextReconciliationAt",
    "operation",
    "publicId",
    "requestId",
    "state",
    "updatedAt",
  ]);
});

test("replays an exactly matching candidate attempt without inserting", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();
  const existingId = "riskScanSettlementAttempts:existing";
  const { calls, handlerContext } = createControlledDatabase({
    existingRows: [{
      _id: existingId,
      _creationTime: 0,
      ...canonicalAttempt,
    }],
  });

  const result = await recordInitialRiskScanSettlementAttempt._handler(
    handlerContext,
    copyValidArgs(),
  );

  assertSafeResult(result, "replayed", existingId);
  assertRequestLookup(calls);
  assertCanonicalQuery(calls);
  assert.deepEqual(calls.inserts, []);
});

test("rejects invalid candidate input before any database operation", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase();

  await assert.rejects(
    () => recordInitialRiskScanSettlementAttempt._handler(handlerContext, {
      ...copyValidArgs(),
      candidateSettlementRef: "unsafe reference",
    }),
    (error) => error instanceof TypeError
      && error.message === "Invalid RiskScan settlement-attempt admission input",
  );
  assert.deepEqual(calls.gets, []);
  assert.deepEqual(calls.queries, []);
  assert.deepEqual(calls.inserts, []);
});

test("rejects missing and ineligible requests before querying or inserting", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();

  for (const request of [null, { ...storedRequest, state: "submitted" }]) {
    const { calls, handlerContext } = createControlledDatabase({ request });

    await assert.rejects(
      () => recordInitialRiskScanSettlementAttempt._handler(
        handlerContext,
        copyValidArgs(),
      ),
      (error) => error instanceof RangeError && error.message === ineligibleRequestMessage,
    );
    assertRequestLookup(calls);
    assert.deepEqual(calls.queries, []);
    assert.deepEqual(calls.inserts, []);
  }
});

test("rejects duplicate candidate attempts before inserting", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase({
    existingRows: [
      { _id: "riskScanSettlementAttempts:duplicate-one", _creationTime: 0, ...canonicalAttempt },
      { _id: "riskScanSettlementAttempts:duplicate-two", _creationTime: 1, ...canonicalAttempt },
    ],
  });

  await assertConflict(recordInitialRiskScanSettlementAttempt._handler, handlerContext);
  assertRequestLookup(calls);
  assertCanonicalQuery(calls);
  assert.deepEqual(calls.inserts, []);
});

test("rejects null, missing-ID, non-string-ID, and malformed durable attempts before inserting", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();

  for (const row of [
    null,
    { _creationTime: 0, ...canonicalAttempt },
    { _id: 0, _creationTime: 0, ...canonicalAttempt },
    { _id: "riskScanSettlementAttempts:malformed", _creationTime: 0 },
  ]) {
    const { calls, handlerContext } = createControlledDatabase({
      existingRows: [row],
    });

    await assertConflict(recordInitialRiskScanSettlementAttempt._handler, handlerContext);
    assertRequestLookup(calls);
    assertCanonicalQuery(calls);
    assert.deepEqual(calls.inserts, []);
  }
});

test("rejects every protected-field mismatch before inserting", async () => {
  const { recordInitialRiskScanSettlementAttempt } = await loadWriter();
  const mismatchCases = [
    ["publicId", "risk_403"],
    ["requestId", "riskScanRequests:other"],
    ["operation", "other_operation"],
    ["idempotencyKeyHash", "b".repeat(64)],
    ["network", "eip155:1"],
    ["state", "settled"],
    ["candidateSettlementRef", "0xdef_456"],
    ["nextReconciliationAt", 2n],
    ["createdAt", 2n],
    ["updatedAt", 2n],
  ];

  for (const [field, value] of mismatchCases) {
    const { calls, handlerContext } = createControlledDatabase({
      existingRows: [{
        _id: "riskScanSettlementAttempts:conflict",
        _creationTime: 0,
        ...canonicalAttempt,
        [field]: value,
      }],
    });

    await assertConflict(recordInitialRiskScanSettlementAttempt._handler, handlerContext);
    assertRequestLookup(calls);
    assertCanonicalQuery(calls);
    assert.deepEqual(calls.inserts, []);
  }
});
