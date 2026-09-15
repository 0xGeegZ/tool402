import assert from "node:assert/strict";
import test from "node:test";

const schemaUrl = new URL("../convex/schema.ts", import.meta.url);
const sourceUrl = new URL("../convex/self_service_accounts.ts", import.meta.url);
const addressA = "0x1111111111111111111111111111111111111111";

test("reserves an additive self-service account table keyed by wallet and chain", async () => {
  const { default: schema } = await import(schemaUrl.href);
  const exported = JSON.parse(schema.export());
  const table = exported.tables.find(({ tableName }) => tableName === "selfServiceAccounts");

  assert.notEqual(table, undefined);
  assert.deepEqual(
    table.indexes.map(({ indexDescriptor, fields }) => [indexDescriptor, fields]),
    [["by_chain_id_and_canonical_signer_address", ["chainId", "canonicalSignerAddress"]]],
  );
});

function database(accounts = []) {
  const rows = structuredClone(accounts);
  const writes = [];
  return {
    rows,
    writes,
    ctx: {
      db: {
        query(table) {
          assert.equal(table, "selfServiceAccounts");
          return {
            withIndex(index, select) {
              assert.equal(index, "by_chain_id_and_canonical_signer_address");
              const expected = [];
              const query = { eq(field, value) { expected.push([field, value]); return query; } };
              select(query);
              return { async take(limit) {
                return rows.filter((row) => expected.every(([field, value]) => row[field] === value)).slice(0, limit);
              } };
            },
          };
        },
        async insert(table, value) {
          assert.equal(table, "selfServiceAccounts");
          const row = { _id: `selfServiceAccounts:${rows.length}`, _creationTime: 1, ...structuredClone(value) };
          rows.push(row);
          writes.push(row);
          return row._id;
        },
        async patch(id, value) {
          const row = rows.find((candidate) => candidate._id === id);
          assert.notEqual(row, undefined);
          Object.assign(row, structuredClone(value));
        },
      },
    },
  };
}

test("provisions one stable active membership only when the server flag is enabled", async (t) => {
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  const { ensureSelfServiceAccount } = await import(sourceUrl.href);
  const store = database();

  assert.deepEqual(await ensureSelfServiceAccount._handler(store.ctx, { canonicalSignerAddress: addressA }), { outcome: "ACTIVE" });
  assert.deepEqual(await ensureSelfServiceAccount._handler(store.ctx, { canonicalSignerAddress: addressA }), { outcome: "ACTIVE" });
  assert.equal(store.writes.length, 1);
  const { _id, _creationTime, ...written } = store.writes[0];
  assert.deepEqual(written, {
    canonicalSignerAddress: addressA,
    chainId: 296,
    principalPublicId: `self_service_${addressA.slice(2)}`,
    policyVersion: "public_testnet_v1",
    status: "ACTIVE",
    createdAt: store.writes[0].createdAt,
    updatedAt: store.writes[0].updatedAt,
  });
});

test("does not create or reactivate a disabled, suspended, or revoked membership", async (t) => {
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });
  const { ensureSelfServiceAccount } = await import(sourceUrl.href);
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "false";
  const disabled = database();
  assert.deepEqual(await ensureSelfServiceAccount._handler(disabled.ctx, { canonicalSignerAddress: addressA }), { outcome: "DISABLED" });
  assert.equal(disabled.writes.length, 0);

  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  for (const status of ["SUSPENDED", "REVOKED"]) {
    const store = database([{ canonicalSignerAddress: addressA, chainId: 296, principalPublicId: `self_service_${addressA.slice(2)}`, policyVersion: "public_testnet_v1", status }]);
    assert.deepEqual(await ensureSelfServiceAccount._handler(store.ctx, { canonicalSignerAddress: addressA }), { outcome: status });
    assert.equal(store.writes.length, 0);
  }
});

test("permits only an internal operator mutation to durably suspend an existing membership", async () => {
  const { setSelfServiceAccountStatus } = await import(sourceUrl.href);
  const store = database([{
    _id: "selfServiceAccounts:0", _creationTime: 1,
    canonicalSignerAddress: addressA, chainId: 296, principalPublicId: `self_service_${addressA.slice(2)}`,
    policyVersion: "public_testnet_v1", status: "ACTIVE", createdAt: 1n, updatedAt: 1n,
  }]);
  assert.equal(await setSelfServiceAccountStatus._handler(store.ctx, { canonicalSignerAddress: addressA, status: "SUSPENDED" }), true);
  assert.equal(store.rows[0].status, "SUSPENDED");
  assert.equal(await setSelfServiceAccountStatus._handler(store.ctx, { canonicalSignerAddress: "invalid", status: "SUSPENDED" }), false);
});

test("parses self-service quotas server-side and fails closed when either is absent or malformed", async () => {
  const { readSelfServiceMaxBackingIntentsPerHour, readSelfServiceMaxPendingAttempts, readSelfServiceMaxTools } = await import(sourceUrl.href);
  const previousTools = process.env.TOOL402_SELF_SERVICE_MAX_TOOLS;
  const previousPending = process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
  const previousHourly = process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
  try {
    delete process.env.TOOL402_SELF_SERVICE_MAX_TOOLS;
    delete process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
    delete process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
    assert.equal(readSelfServiceMaxTools(), null);
    assert.equal(readSelfServiceMaxPendingAttempts(), null);
    assert.equal(readSelfServiceMaxBackingIntentsPerHour(), null);
    process.env.TOOL402_SELF_SERVICE_MAX_TOOLS = "2";
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "3";
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "4";
    assert.equal(readSelfServiceMaxTools(), 2);
    assert.equal(readSelfServiceMaxPendingAttempts(), 3);
    assert.equal(readSelfServiceMaxBackingIntentsPerHour(), 4);
    process.env.TOOL402_SELF_SERVICE_MAX_TOOLS = "0";
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "101";
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "0";
    assert.equal(readSelfServiceMaxTools(), null);
    assert.equal(readSelfServiceMaxPendingAttempts(), null);
    assert.equal(readSelfServiceMaxBackingIntentsPerHour(), null);
  } finally {
    if (previousTools === undefined) delete process.env.TOOL402_SELF_SERVICE_MAX_TOOLS;
    else process.env.TOOL402_SELF_SERVICE_MAX_TOOLS = previousTools;
    if (previousPending === undefined) delete process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
    else process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = previousPending;
    if (previousHourly === undefined) delete process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
    else process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = previousHourly;
  }
});
