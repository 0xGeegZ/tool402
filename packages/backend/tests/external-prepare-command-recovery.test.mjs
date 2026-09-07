import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { keccak256, stringToHex } from "viem";

const moduleUrl = new URL("../convex/external_prepare_command_recovery.ts", import.meta.url);
const contextKeys = ["version", "type", "chainId", "canonicalSignerAddress", "principalPublicId", "role", "authorityVersion", "payloadHash"];
const payloadKeys = ["operationKind", "subjectPublicId", "network", "chainId", "expectedTarget", "canonicalParametersHash", "idempotencyKey", "expiresAt"];
const pick = (input, keys) => Object.fromEntries(keys.map((key) => [key, input[key]]));
const hashPayload = (payload) => keccak256(stringToHex(JSON.stringify(pick(payload, [...payloadKeys].sort()))));
const attemptId = "externalPrepareCommandAttempts:accepted";

function input() {
  return {
    version: 1, type: "external.prepare", chainId: 296,
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
    principalPublicId: "principal_42", role: "ISSUER", authorityVersion: "authority_v1",
    payloadHash: "0x80e6aa5c7d520c43c2ae746b2a9459ab8e298b384703618a464a30378619422a",
    payload: {
      operationKind: "ATS_CREATE", subjectPublicId: "subject_42", network: "hedera:testnet", chainId: 296,
      expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", canonicalParametersHash: "a".repeat(64),
      idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", expiresAt: "2026-09-07T19:04:00.000Z",
    },
  };
}

function attempt(args = input()) {
  return { _id: attemptId, _creationTime: 1, ...pick(args, contextKeys), ...args.payload, state: "PREPARED", acceptedAt: 123n };
}

function database(rows = []) {
  const reads = [];
  const accesses = [];
  const forbidden = () => { accesses.push("forbidden"); throw new Error("recovery cannot write or invoke another boundary"); };
  const db = {
    query(table) {
      accesses.push(table);
      assert.equal(table, "externalPrepareCommandAttempts", "recovery must not reread authority or replay claims");
      return { withIndex(index, select) {
        const filters = [];
        const range = { eq(field, value) { filters.push([field, value]); return range; } };
        select(range);
        return { async take(limit) {
          reads.push({ table, index, filters, limit });
          assert.equal(limit, 2);
          return rows.slice(0, limit);
        } };
      } };
    },
    get: forbidden, insert: forbidden, patch: forbidden, replace: forbidden, delete: forbidden,
  };
  return { reads, accesses, ctx: { db, runAction: forbidden, runMutation: forbidden, runQuery: forbidden, scheduler: { runAfter: forbidden, runAt: forbidden } } };
}

function expectedRead(args = input()) {
  return [{ table: "externalPrepareCommandAttempts", index: "by_idempotency_key", filters: [["idempotencyKey", args.payload.idempotencyKey]], limit: 2 }];
}

async function loadQuery() {
  const exports = await import(moduleUrl);
  assert.equal(Object.keys(exports).length, 1, "one internal recovery function only");
  return Object.values(exports)[0];
}

const string = { type: "string" };
const literal = (value) => ({ type: "literal", value });
const union = (...values) => ({ type: "union", value: values.map(literal) });
const object = (fields) => ({ type: "object", value: Object.fromEntries(Object.entries(fields).map(([key, fieldType]) => [key, { fieldType, optional: false }])) });
const payloadValidator = object({
  operationKind: union("ATS_CREATE", "ATS_CONTROL_LIST", "ATS_ISSUE", "ATS_TRANSFER", "ATS_COUPON", "HEDERA_FUNDING"),
  subjectPublicId: string, network: literal("hedera:testnet"), chainId: literal(296), expectedTarget: string,
  canonicalParametersHash: string, idempotencyKey: string, expiresAt: string,
});
const contextValidators = {
  version: literal(1), type: literal("external.prepare"), chainId: literal(296), canonicalSignerAddress: string,
  principalPublicId: string, role: union("ISSUER", "BACKER"), authorityVersion: string, payloadHash: string,
};

test("registers only an internal query with exact recovery arguments and persisted snapshot validators", async () => {
  const query = await loadQuery();
  assert.equal(query.isInternal, true);
  assert.equal(query.isQuery, true);
  for (const flag of ["isPublic", "isMutation", "isAction"]) assert.equal(query[flag], undefined);
  assert.deepEqual(JSON.parse(query.exportArgs()), object({ ...contextValidators, payload: payloadValidator }));
  const returns = JSON.parse(query.exportReturns());
  assert.equal(returns.type, "union");
  assert.deepEqual(returns.value.sort((a, b) => a.type.localeCompare(b.type)), [
    { type: "null" },
    object({ attemptId: { type: "id", tableName: "externalPrepareCommandAttempts" }, state: literal("PREPARED"), acceptedAt: { type: "bigint" }, ...contextValidators, payload: payloadValidator }),
  ]);
});

test("returns null only for an empty bounded idempotency lookup", async () => {
  const query = await loadQuery();
  const db = database();
  assert.equal(await query._handler(db.ctx, input()), null);
  assert.deepEqual(db.reads, expectedRead());
  assert.deepEqual(db.accesses, ["externalPrepareCommandAttempts"]);
});

test("returns the full persisted payload and context after expiry without current authority or writes", async (t) => {
  const query = await loadQuery();
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2027-01-01T00:00:00.000Z") });
  for (const acceptedAt of [0n, 123n, 9_223_372_036_854_775_807n]) {
    const row = { ...attempt(), acceptedAt };
    const db = database([row]);
    const result = await query._handler(db.ctx, input());
    assert.deepEqual(result, { attemptId, state: "PREPARED", acceptedAt, ...input() });
    assert.deepEqual(db.reads, expectedRead());
    assert.deepEqual(db.accesses, ["externalPrepareCommandAttempts"]);
  }
});

test("recovers each operation and opaque target shape without inferring executable target authority", async () => {
  const query = await loadQuery();
  assert.equal(hashPayload(input().payload), input().payloadHash);
  for (const operationKind of ["ATS_CREATE", "ATS_CONTROL_LIST", "ATS_ISSUE", "ATS_TRANSFER", "ATS_COUPON", "HEDERA_FUNDING"]) {
    for (const expectedTarget of ["0.0.987654", "0xcccccccccccccccccccccccccccccccccccccccc"]) {
      const args = input();
      args.payload = { ...args.payload, operationKind, expectedTarget, canonicalParametersHash: "e".repeat(64) };
      args.payloadHash = hashPayload(args.payload);
      if (operationKind === "HEDERA_FUNDING") args.role = "BACKER";
      const db = database([attempt(args)]);
      assert.deepEqual(await query._handler(db.ctx, args), { attemptId, state: "PREPARED", acceptedAt: 123n, ...args });
      assert.deepEqual(db.reads, expectedRead(args));
    }
  }
});

test("rejects malformed supplied context, M26 payload and hash before any recovery read", async () => {
  const query = await loadQuery();
  const cases = [null, [], {}];
  for (const key of Object.keys(input())) { const args = input(); delete args[key]; cases.push(args); }
  for (const [key, value] of Object.entries({ version: 2, type: "external.execute", chainId: 295, canonicalSignerAddress: input().canonicalSignerAddress.toUpperCase(), principalPublicId: "", role: "ADMIN", authorityVersion: "", payloadHash: "0x" + "b".repeat(64), payload: null })) cases.push({ ...input(), [key]: value });
  for (const key of ["nonce", "replayIdentity", "issuedAt", "expiresAt", "now", "serverNow", "signature", "rawBody", "capability"]) cases.push({ ...input(), [key]: "unexpected" });
  for (const key of payloadKeys) { const args = input(); delete args.payload[key]; cases.push(args); }
  for (const [key, value] of Object.entries({ operationKind: "ATS_UNKNOWN", subjectPublicId: "", network: "hedera:mainnet", chainId: 295, expectedTarget: "invalid", canonicalParametersHash: "A".repeat(64), idempotencyKey: "short", expiresAt: "2026-09-07T19:04:00Z", extra: true })) cases.push({ ...input(), payload: { ...input().payload, [key]: value } });
  for (const [key, value] of Object.entries({ operationKind: "ATS_ISSUE", subjectPublicId: "subject_other", expectedTarget: "0.0.987654", canonicalParametersHash: "b".repeat(64), idempotencyKey: "QQQQQQQQQQQQQQQQQQQQQQ", expiresAt: "2026-09-07T19:03:00.000Z" })) cases.push({ ...input(), payload: { ...input().payload, [key]: value } });
  for (const args of cases) {
    const db = database([attempt()]);
    await assert.rejects(() => query._handler(db.ctx, args));
    assert.deepEqual(db.accesses, []);
  }
});

test("fails closed on duplicate, malformed or mismatched persisted context and every stored payload field", async () => {
  const query = await loadQuery();
  const cases = [[attempt(), attempt()], [null], [[]]];
  for (const [key, value] of Object.entries({
    _id: "", version: 2, type: "external.other", chainId: 295, canonicalSignerAddress: "0x" + "c".repeat(40),
    principalPublicId: "principal_other", role: "BACKER", authorityVersion: "authority_v2", payloadHash: "0x" + "b".repeat(64),
    operationKind: "ATS_ISSUE", subjectPublicId: "subject_other", network: "hedera:mainnet", expectedTarget: "0.0.987654",
    canonicalParametersHash: "b".repeat(64), idempotencyKey: "QQQQQQQQQQQQQQQQQQQQQQ", expiresAt: "2026-09-07T19:03:00.000Z", state: "EXECUTED", acceptedAt: 123,
  })) cases.push([{ ...attempt(), [key]: value }]);
  for (const key of Object.keys(attempt()).filter((key) => key !== "_creationTime")) { const row = attempt(); delete row[key]; cases.push([row]); }
  cases.push([{ ...attempt(), acceptedAt: -9_223_372_036_854_775_809n }], [{ ...attempt(), acceptedAt: 9_223_372_036_854_775_808n }]);
  // A coherent alternate stored hash still cannot satisfy the requested payload/context.
  const changed = { ...attempt(), expectedTarget: "0.0.987654" };
  changed.payloadHash = hashPayload(changed);
  cases.push([changed]);
  for (const rows of cases) {
    const db = database(rows);
    await assert.rejects(() => query._handler(db.ctx, input()));
    assert.deepEqual(db.reads, expectedRead());
    assert.deepEqual(db.accesses, ["externalPrepareCommandAttempts"]);
  }
});

test("keeps recovery module internal and excludes writes, external integrations and configuration", async () => {
  await import(moduleUrl);
  assert.match(moduleUrl.pathname.split("/").at(-1), /^[a-z0-9_]+\.ts$/u);
  const source = readFileSync(moduleUrl, "utf8");
  assert.match(source, /\binternalQueryGeneric\b/u);
  assert.doesNotMatch(source, /\b(?:queryGeneric|mutationGeneric|actionGeneric|internalMutationGeneric|internalActionGeneric|httpActionGeneric|fetch|runAction|runMutation|runQuery)\b|process\s*\.\s*env|@hashgraph|wagmi|viem\/accounts|viem\/actions|createWalletClient|createPublicClient|_generated|convex\/nextjs|import\.meta\.env|from\s+["'](?:node:)?https?["']|\.\s*(?:insert|patch|replace|delete)\s*\(/u);
});
