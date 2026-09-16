import assert from "node:assert/strict";
import test from "node:test";

const sourceUrl = new URL("../convex/backing_intents.ts", import.meta.url);
const signer = "0x1111111111111111111111111111111111111111";
const recipient = "0x2222222222222222222222222222222222222222";
const publicOfferingId = "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const publicSubjectId = "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
function expiry() { return new Date(Date.now() + 60_000).toISOString(); }

function offering(overrides = {}) {
  return {
    _id: "offerings:riskscan", _creationTime: 1,
    offeringPublicId: "riskscan_revenue_note_demo", subjectPublicId: "riskscan_revenue_note_demo",
    canonicalSignerAddress: recipient, principalPublicId: "legacy_issuer", authorityVersion: "legacy_v1",
    payloadHash: `0x${"a".repeat(64)}`, idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBQ",
    advertisedQuickPriceTinybars: "10", advertisedStandardPriceTinybars: "25", version: 1,
    acceptedAt: 1n, updatedAt: 1n,
    definition: { schemaVersion: 1, terms: { version: "riskscan-revenue-note-v1", fundingTargetTinybars: "1000", noteUnitPriceTinybars: "10", maximumNoteUnits: "100", minimumPurchaseUnits: "1", reserveShareBps: "2000", issuerShareBps: "8000", platformFeeBps: "0", payoutCapTinybars: "1500" }, maturityAt: "2026-12-31T00:00:00.000Z", qualifyingResource: "riskscan.quick" },
    narrative: { title: "RiskScan", customerProblem: "problem", customerUseCases: ["use"], useOfFunds: ["fund"], risks: ["risk"] },
    state: "OPEN",
    ...overrides,
  };
}

function database({ authorities = [], offerings = [offering()], accounts = [] } = {}) {
  const rows = { commandAuthorities: authorities, offerings, selfServiceAccounts: accounts, backingIntents: [], selfServiceWriteRateLimits: [] };
  return { rows, ctx: { db: {
    query(table) { return { withIndex(_name, select) { const filters = []; const query = { eq(field, value) { filters.push(["eq", field, value]); return query; }, gt(field, value) { filters.push(["gt", field, value]); return query; } }; select(query); const builder = { order() { return builder; }, async take(limit) { return rows[table].filter((row) => filters.every(([kind, field, value]) => kind === "eq" ? row[field] === value : row[field] > value)).slice(0, limit); } }; return builder; } }; },
    async insert(table, value) { rows[table].push({ _id: `${table}:${rows[table].length}`, _creationTime: 1, ...value }); },
    async patch(id, value) {
      const row = Object.values(rows).flat().find((candidate) => candidate._id === id);
      assert.notEqual(row, undefined, "patch must target a stored row");
      Object.assign(row, value);
    },
  } } };
}

test("prepares legacy RiskScan backing for an enabled BACKER while public self-service is disabled", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousTreasury = process.env.TOOL402_FUNDING_EVM_ADDRESS;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "false";
  process.env.TOOL402_FUNDING_EVM_ADDRESS = recipient;
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag; process.env.TOOL402_FUNDING_EVM_ADDRESS = previousTreasury; });
  const db = database({ authorities: [{ _id: "commandAuthorities:backer", _creationTime: 1, principalPublicId: "legacy_backer", canonicalSignerAddress: signer, chainId: 296, role: "BACKER", ownedSubjectPublicIds: [], authorityVersion: "legacy_v1", enabled: true }] });
  const result = await freezeBackingIntent._handler(db.ctx, { canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", units: "2", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry() });
  assert.equal(result.outcome, "PREPARED");
  assert.equal(result.intent.recipient, recipient);
});

test("keeps an enabled legacy RiskScan BACKER eligible while public self-service is enabled", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousTreasury = process.env.TOOL402_FUNDING_EVM_ADDRESS;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  process.env.TOOL402_FUNDING_EVM_ADDRESS = recipient;
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag; process.env.TOOL402_FUNDING_EVM_ADDRESS = previousTreasury; });
  const db = database({ authorities: [{ _id: "commandAuthorities:backer", _creationTime: 1, principalPublicId: "legacy_backer", canonicalSignerAddress: signer, chainId: 296, role: "BACKER", ownedSubjectPublicIds: [], authorityVersion: "legacy_v1", enabled: true }] });
  assert.equal(
    (await freezeBackingIntent._handler(db.ctx, { canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", units: "2", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry() })).outcome,
    "PREPARED",
  );
});

test("refuses a fresh public backer while the public self-service flag is disabled", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "false";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag; });
  const result = await freezeBackingIntent._handler(database({ offerings: [offering({ offeringPublicId: "offering_public", subjectPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", fundingRecipient: recipient })] }).ctx, { canonicalSignerAddress: signer, offeringPublicId: "offering_public", units: "2", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry() });
  assert.deepEqual(result, { outcome: "REJECTED" });
});

test("does not use the legacy treasury for a public offering without a frozen recipient", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousTreasury = process.env.TOOL402_FUNDING_EVM_ADDRESS;
  const previousPendingLimit = process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
  const previousHourlyLimit = process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  process.env.TOOL402_FUNDING_EVM_ADDRESS = recipient;
  process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "3";
  process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "3";
  t.after(() => {
    process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag;
    process.env.TOOL402_FUNDING_EVM_ADDRESS = previousTreasury;
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = previousPendingLimit;
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = previousHourlyLimit;
  });
  const account = { _id: "selfServiceAccounts:backer", _creationTime: 1, canonicalSignerAddress: signer, chainId: 296, principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE", createdAt: 1n, updatedAt: 1n };
  const result = await freezeBackingIntent._handler(database({
    accounts: [account],
    offerings: [offering({ offeringPublicId: "offering_public", subjectPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })],
  }).ctx, { canonicalSignerAddress: signer, offeringPublicId: "offering_public", units: "2", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry() });
  assert.deepEqual(result, { outcome: "REJECTED" });
});

test("returns the exact already-frozen public intent for a safe repeated preparation", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousPendingLimit = process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
  const previousHourlyLimit = process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "3";
  process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "3";
  t.after(() => {
    process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag;
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = previousPendingLimit;
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = previousHourlyLimit;
  });
  const account = {
    _id: "selfServiceAccounts:backer", _creationTime: 1, canonicalSignerAddress: signer, chainId: 296,
    principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
    createdAt: 1n, updatedAt: 1n,
  };
  const db = database({ accounts: [account], offerings: [offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, fundingRecipient: recipient })] });
  const args = {
    canonicalSignerAddress: signer, offeringPublicId: publicOfferingId, units: "2",
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry(),
  };
  const first = await freezeBackingIntent._handler(db.ctx, args);
  assert.equal(first.outcome, "PREPARED");
  const writesAfterFirst = db.rows.backingIntents.length;

  assert.deepEqual(await freezeBackingIntent._handler(db.ctx, args), first);
  assert.equal(db.rows.backingIntents.length, writesAfterFirst);
  assert.equal(db.rows.selfServiceWriteRateLimits[0].count, 1);
});

test("returns an exact existing frozen intent after a flag switch instead of reopening a new action", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousPendingLimit = process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
  const previousHourlyLimit = process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "3";
  process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "3";
  t.after(() => {
    process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag;
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = previousPendingLimit;
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = previousHourlyLimit;
  });
  const account = {
    _id: "selfServiceAccounts:backer", _creationTime: 1, canonicalSignerAddress: signer, chainId: 296,
    principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
    createdAt: 1n, updatedAt: 1n,
  };
  const db = database({ accounts: [account], offerings: [offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, fundingRecipient: recipient })] });
  const args = {
    canonicalSignerAddress: signer, offeringPublicId: publicOfferingId, units: "2",
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry(),
  };
  const first = await freezeBackingIntent._handler(db.ctx, args);
  assert.equal(first.outcome, "PREPARED");
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "false";
  db.rows.selfServiceAccounts[0].status = "SUSPENDED";
  assert.deepEqual(await freezeBackingIntent._handler(db.ctx, args), first);
  assert.equal(db.rows.backingIntents.length, 1);
});

test("fails closed for non-open, self-funded, recipient-tampered, and expired public backing requests", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousPendingLimit = process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
  const previousHourlyLimit = process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "3";
  process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "3";
  t.after(() => {
    process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag;
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = previousPendingLimit;
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = previousHourlyLimit;
  });
  const account = {
    _id: "selfServiceAccounts:backer", _creationTime: 1, canonicalSignerAddress: signer, chainId: 296,
    principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
    createdAt: 1n, updatedAt: 1n,
  };
  const args = {
    canonicalSignerAddress: signer, offeringPublicId: publicOfferingId, units: "2",
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry(),
  };
  for (const [name, candidate, input] of [
    ["DRAFT", offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, state: "DRAFT", fundingRecipient: recipient }), args],
    ["CLOSED", offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, state: "CLOSED", fundingRecipient: recipient }), args],
    ["self funding", offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, canonicalSignerAddress: signer, fundingRecipient: signer }), args],
    ["recipient tampering", offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, fundingRecipient: signer }), args],
    ["expired intent", offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, fundingRecipient: recipient }), { ...args, expiresAt: new Date(Date.now() - 1).toISOString() }],
  ]) {
    const result = await freezeBackingIntent._handler(database({ accounts: [account], offerings: [candidate] }).ctx, input);
    assert.deepEqual(result, { outcome: "REJECTED" }, name);
  }
});

test("enforces active membership and the configured pending and hourly quotas for new public backing intents", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousPendingLimit = process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
  const previousHourlyLimit = process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "1";
  process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "1";
  t.after(() => {
    process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag;
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = previousPendingLimit;
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = previousHourlyLimit;
  });
  const account = {
    _id: "selfServiceAccounts:backer", _creationTime: 1, canonicalSignerAddress: signer, chainId: 296,
    principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
    createdAt: 1n, updatedAt: 1n,
  };
  const db = database({ accounts: [account], offerings: [offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, fundingRecipient: recipient })] });
  const first = {
    canonicalSignerAddress: signer, offeringPublicId: publicOfferingId, units: "2",
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry(),
  };
  assert.equal((await freezeBackingIntent._handler(db.ctx, first)).outcome, "PREPARED");
  assert.deepEqual(await freezeBackingIntent._handler(db.ctx, {
    ...first, idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDw", purchaseIntentId: "EEEEEEEEEEEEEEEEEEEEEw",
  }), { outcome: "REJECTED" }, "second live pending intent exceeds quota");
  db.rows.backingIntents[0].expiresAt = new Date(Date.now() - 1).toISOString();
  assert.deepEqual(await freezeBackingIntent._handler(db.ctx, {
    ...first, idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDw", purchaseIntentId: "EEEEEEEEEEEEEEEEEEEEEw",
  }), { outcome: "REJECTED" }, "expired pending intent does not bypass the hourly quota");

  const suspended = database({ accounts: [{ ...account, status: "SUSPENDED" }], offerings: [offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, fundingRecipient: recipient })] });
  assert.deepEqual(await freezeBackingIntent._handler(suspended.ctx, first), { outcome: "REJECTED" }, "suspension blocks new activity");
});

test("counts every unexpired pending intent even when newer expired records exist", async (t) => {
  const { freezeBackingIntent } = await import(sourceUrl.href);
  const previousFlag = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  const previousPendingLimit = process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS;
  const previousHourlyLimit = process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = "3";
  process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = "10";
  t.after(() => {
    process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previousFlag;
    process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS = previousPendingLimit;
    process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR = previousHourlyLimit;
  });
  const account = {
    _id: "selfServiceAccounts:backer", _creationTime: 1, canonicalSignerAddress: signer, chainId: 296,
    principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
    createdAt: 1n, updatedAt: 1n,
  };
  const db = database({ accounts: [account], offerings: [offering({ offeringPublicId: publicOfferingId, subjectPublicId: publicSubjectId, fundingRecipient: recipient })] });
  const first = {
    canonicalSignerAddress: signer, offeringPublicId: publicOfferingId, units: "2",
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", purchaseIntentId: "CCCCCCCCCCCCCCCCCCCCCg", expiresAt: expiry(),
  };
  assert.equal((await freezeBackingIntent._handler(db.ctx, first)).outcome, "PREPARED");
  for (const [index, idempotencyKey] of ["DDDDDDDDDDDDDDDDDDDDDw", "EEEEEEEEEEEEEEEEEEEEEw", "FFFFFFFFFFFFFFFFFFFFFw", "GGGGGGGGGGGGGGGGGGGGGw"].entries()) {
    db.rows.backingIntents.push({
      ...db.rows.backingIntents[0], _id: `backingIntents:expired-${index}`, idempotencyKey,
      purchaseIntentId: `${idempotencyKey.slice(0, 21)}g`, expiresAt: new Date(Date.now() - (index + 1)).toISOString(),
    });
  }
  for (const [idempotencyKey, purchaseIntentId] of [
    ["HHHHHHHHHHHHHHHHHHHHHw", "IIIIIIIIIIIIIIIIIIIIIg"],
    ["JJJJJJJJJJJJJJJJJJJJJw", "KKKKKKKKKKKKKKKKKKKKKg"],
  ]) {
    assert.equal((await freezeBackingIntent._handler(db.ctx, { ...first, idempotencyKey, purchaseIntentId })).outcome, "PREPARED");
  }
  assert.deepEqual(
    await freezeBackingIntent._handler(db.ctx, { ...first, idempotencyKey: "LLLLLLLLLLLLLLLLLLLLLw", purchaseIntentId: "MMMMMMMMMMMMMMMMMMMMMg" }),
    { outcome: "REJECTED" },
  );
});
