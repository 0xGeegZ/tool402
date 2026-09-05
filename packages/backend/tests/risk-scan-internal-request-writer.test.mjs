import assert from "node:assert/strict";
import test from "node:test";

const validArgs = {
  publicId: "risk_402",
  requestRef: " request-402 ",
  subjectRefHash: "a".repeat(64),
  inputHash: "b".repeat(64),
  createdAt: 1n,
  updatedAt: 1n,
};

const canonicalDocument = {
  publicId: "risk_402",
  requestRef: "request-402",
  subjectRefHash: "a".repeat(64),
  inputHash: "b".repeat(64),
  state: "payment_required",
  createdAt: 1n,
  updatedAt: 1n,
};

async function loadWriter() {
  return import(new URL("../convex/riskscan-requests.ts", import.meta.url));
}

function copyValidArgs() {
  return { ...validArgs };
}

function createControlledDatabase({
  existing = null,
  insertedId = "riskScanRequests:created",
} = {}) {
  const calls = { queries: [], inserts: [] };
  const db = {
    query(table) {
      const query = { table, indexName: null, equality: null };
      calls.queries.push(query);

      return {
        withIndex(indexName, selectIndex) {
          query.indexName = indexName;
          selectIndex({
            eq(field, value) {
              query.equality = { field, value };
              return undefined;
            },
          });

          return {
            async unique() {
              return existing;
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

function assertCanonicalQuery(calls) {
  assert.deepEqual(calls.queries, [{
    table: "riskScanRequests",
    indexName: "by_request_ref",
    equality: { field: "requestRef", value: "request-402" },
  }]);
}

function assertSafeResult(result, status, requestId) {
  assert.deepEqual(result, {
    status,
    requestId,
    state: "payment_required",
  });
  assert.deepEqual(Object.keys(result).sort(), ["requestId", "state", "status"]);
}

test("registers an internal writer with the required argument and return validators", async () => {
  const { recordInitialRiskScanRequest } = await loadWriter();
  const args = JSON.parse(recordInitialRiskScanRequest.exportArgs());
  const returns = JSON.parse(recordInitialRiskScanRequest.exportReturns());

  assert.equal(recordInitialRiskScanRequest.isMutation, true);
  assert.equal(recordInitialRiskScanRequest.isInternal, true);
  assert.equal(args.type, "object");
  assert.deepEqual(Object.keys(args.value).sort(), [
    "createdAt",
    "inputHash",
    "publicId",
    "requestRef",
    "subjectRefHash",
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
      publicId: ["string", false],
      requestRef: ["string", false],
      subjectRefHash: ["string", false],
      inputHash: ["string", false],
      createdAt: ["bigint", false],
      updatedAt: ["bigint", false],
    },
  );
  assert.equal(returns.type, "object");
  assert.deepEqual(Object.keys(returns.value).sort(), ["requestId", "state", "status"]);
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
  assert.deepEqual(returns.value.requestId, {
    fieldType: { type: "id", tableName: "riskScanRequests" },
    optional: false,
  });
  assert.deepEqual(returns.value.state, {
    fieldType: { type: "literal", value: "payment_required" },
    optional: false,
  });
});

test("creates one canonical initial request through the request-reference index", async () => {
  const { recordInitialRiskScanRequest } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase();

  const result = await recordInitialRiskScanRequest._handler(
    handlerContext,
    copyValidArgs(),
  );

  assertSafeResult(result, "created", "riskScanRequests:created");
  assertCanonicalQuery(calls);
  assert.deepEqual(calls.inserts, [{
    table: "riskScanRequests",
    document: canonicalDocument,
  }]);
  assert.deepEqual(Object.keys(calls.inserts[0].document).sort(), [
    "createdAt",
    "inputHash",
    "publicId",
    "requestRef",
    "state",
    "subjectRefHash",
    "updatedAt",
  ]);
});

test("replays an exactly matching initial request without inserting", async () => {
  const { recordInitialRiskScanRequest } = await loadWriter();
  const existingId = "riskScanRequests:existing";
  const { calls, handlerContext } = createControlledDatabase({
    existing: {
      _id: existingId,
      _creationTime: 0,
      ...canonicalDocument,
    },
  });

  const result = await recordInitialRiskScanRequest._handler(
    handlerContext,
    copyValidArgs(),
  );

  assertSafeResult(result, "replayed", existingId);
  assertCanonicalQuery(calls);
  assert.deepEqual(calls.inserts, []);
});

test("rejects a conflicting request reference before inserting", async () => {
  const { recordInitialRiskScanRequest } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase({
    existing: {
      _id: "riskScanRequests:conflict",
      _creationTime: 0,
      ...canonicalDocument,
      inputHash: "c".repeat(64),
    },
  });

  await assert.rejects(
    () => recordInitialRiskScanRequest._handler(handlerContext, copyValidArgs()),
    (error) => error instanceof RangeError
      && error.message === "RiskScan request reference conflicts with a different durable request",
  );
  assertCanonicalQuery(calls);
  assert.deepEqual(calls.inserts, []);
});

test("rejects invalid admission input before querying or inserting", async () => {
  const { recordInitialRiskScanRequest } = await loadWriter();
  const { calls, handlerContext } = createControlledDatabase();

  await assert.rejects(
    () => recordInitialRiskScanRequest._handler(handlerContext, {
      ...copyValidArgs(),
      publicId: "risk 402",
    }),
    (error) => error instanceof TypeError
      && error.message === "Invalid RiskScan durable request admission input",
  );
  assert.deepEqual(calls.queries, []);
  assert.deepEqual(calls.inserts, []);
});
