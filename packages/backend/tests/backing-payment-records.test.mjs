import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { canonicalizeRequirements } from "@tool402/core";
import { keccak256 } from "viem";

const recordsUrl = new URL("../convex/backing_payment_records.ts", import.meta.url);
const storeUrl = new URL("../convex/backing_payment_store.ts", import.meta.url);
const receiptReaderUrl = new URL("../src/ats/hedera-funding-receipt-reader.ts", import.meta.url);
const claimsUrl = new URL("../convex/backing_payment_claims.ts", import.meta.url);

test("declares the durable backing-payment writer and bounded Hedera receipt reader", () => {
  assert.equal(existsSync(fileURLToPath(recordsUrl)), true);
  assert.equal(existsSync(fileURLToPath(receiptReaderUrl)), true);
});

test("declares one durable transaction-hash claim store before a funding hash can be attached", () => {
  assert.equal(existsSync(fileURLToPath(claimsUrl)), true);
});

test("admits one durable hash claim exactly once per attempt and preserves terminal state", async () => {
  const { resolveBackingPaymentClaim } = await import(storeUrl.href);
  const attemptA = "attempt-A";
  const attemptB = "attempt-B";
  const hashA = `0x${"aa".repeat(32)}`;
  const hashB = `0x${"bb".repeat(32)}`;
  const input = { attemptId: attemptA, transactionHash: hashA, tinybars: "10", outcome: "SUBMITTED" };
  const claim = { attemptId: attemptA, transactionHash: hashA, tinybars: "10", state: "SUBMITTED" };
  assert.equal(resolveBackingPaymentClaim(claim, claim, input), "SUBMITTED", "same hash / attempt is idempotent");
  assert.equal(resolveBackingPaymentClaim(undefined, claim, { ...input, transactionHash: hashB }), null, "different hash for one attempt is rejected");
  assert.equal(resolveBackingPaymentClaim({ ...claim, attemptId: attemptA }, undefined, { ...input, attemptId: attemptB }), null, "one hash cannot satisfy another attempt");
  assert.equal(resolveBackingPaymentClaim({ ...claim, state: "OUTCOME_UNKNOWN" }, { ...claim, state: "OUTCOME_UNKNOWN" }, input), "OUTCOME_UNKNOWN", "a retry cannot downgrade unknown evidence");
  assert.equal(resolveBackingPaymentClaim({ ...claim, state: "CONFIRMED" }, { ...claim, state: "CONFIRMED" }, input), "CONFIRMED", "terminal confirmation is immutable");
});

test("starts dispatch once atomically and never treats an existing reservation as a reusable Send permit", async () => {
  const { beginBackingPaymentDispatch } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{ _id: "externalPrepareCommandAttempts:legacy", idempotencyKey: attemptPublicId, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "PREPARED" }],
    intents: [{ _id: "backingIntents:legacy", idempotencyKey: attemptPublicId, canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7" }],
    authorities: [{ _id: "commandAuthorities:backer", canonicalSignerAddress: signer, chainId: 296, principalPublicId: "legacy_backer", role: "BACKER", authorityVersion: "legacy_v1", enabled: true }],
    claims: [{ _id: "backingPaymentClaims:prepared", attemptId: "externalPrepareCommandAttempts:legacy", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "PREPARED", claimedAt: 1n }],
  });
  const ctx = { db: store.db };
  assert.deepEqual(await beginBackingPaymentDispatch._handler(ctx, { attemptPublicId, canonicalSignerAddress: signer, tinybars: "7" }), { status: "OUTCOME_UNKNOWN", transactionHash: null, tinybars: "7" });
  assert.equal(await beginBackingPaymentDispatch._handler(ctx, { attemptPublicId, canonicalSignerAddress: signer, tinybars: "7" }), null);
  assert.equal(store.rows.backingPaymentClaims[0].state, "OUTCOME_UNKNOWN");
});

test("refuses a replacement dispatch and names the unresolved sibling attempt", async () => {
  const { beginBackingPaymentDispatch } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptA = "AAAAAAAAAAAAAAAAAAAAAA";
  const attemptB = "BBBBBBBBBBBBBBBBBBBBBA";
  const hash = `0x${"ab".repeat(32)}`;
  const store = reservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: attemptA, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "PREPARED" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: attemptB, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [
      { _id: "backingIntents:a", idempotencyKey: attemptA, canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", expiresAt: new Date(Date.now() - 1).toISOString() },
      { _id: "backingIntents:b", idempotencyKey: attemptB, canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", expiresAt: new Date(Date.now() - 1).toISOString() },
    ],
    authorities: [{ _id: "commandAuthorities:backer", canonicalSignerAddress: signer, chainId: 296, principalPublicId: "legacy_backer", role: "BACKER", authorityVersion: "legacy_v1", enabled: true }],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", transactionHash: hash, state: "OUTCOME_UNKNOWN", claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });

  assert.deepEqual(
    await beginBackingPaymentDispatch._handler({ db: store.db }, { attemptPublicId: attemptB, canonicalSignerAddress: signer, tinybars: "7" }),
    { status: "RECOVERY_REQUIRED", recoveryAttemptPublicId: attemptA, transactionHash: hash, tinybars: "7" },
  );
  assert.equal(store.rows.backingPaymentClaims.find((claim) => claim._id === "backingPaymentClaims:b").state, "PREPARED");
});

test("selects the oldest unresolved sibling for bounded recovery when historical uncertainty is duplicated", async () => {
  const { beginBackingPaymentDispatch } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptA = "AAAAAAAAAAAAAAAAAAAAAA";
  const attemptB = "BBBBBBBBBBBBBBBBBBBBBA";
  const attemptC = "CCCCCCCCCCCCCCCCCCCCCg";
  const store = reservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: attemptA, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "OUTCOME_UNKNOWN" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: attemptB, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "OUTCOME_UNKNOWN" },
      { _id: "externalPrepareCommandAttempts:c", idempotencyKey: attemptC, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "c".repeat(64), state: "PREPARED" },
    ],
    intents: [{ _id: "backingIntents:c", idempotencyKey: attemptC, canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7" }],
    authorities: [{ _id: "commandAuthorities:backer", canonicalSignerAddress: signer, chainId: 296, principalPublicId: "legacy_backer", role: "BACKER", authorityVersion: "legacy_v1", enabled: true }],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "OUTCOME_UNKNOWN", claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", transactionHash: `0x${"ab".repeat(32)}`, state: "OUTCOME_UNKNOWN", claimedAt: 2n },
      { _id: "backingPaymentClaims:c", attemptId: "externalPrepareCommandAttempts:c", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "PREPARED", claimedAt: 3n },
    ],
  });

  assert.deepEqual(
    await beginBackingPaymentDispatch._handler({ db: store.db }, { attemptPublicId: attemptC, canonicalSignerAddress: signer, tinybars: "7" }),
    { status: "RECOVERY_REQUIRED", recoveryAttemptPublicId: attemptA, transactionHash: null, tinybars: "7" },
  );
  assert.equal(store.rows.backingPaymentClaims.find((claim) => claim._id === "backingPaymentClaims:c").state, "PREPARED");
});

test("keeps an unrelated offer dispatchable while another offer remains unresolved", async (t) => {
  const { beginBackingPaymentDispatch } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const recipient = "0x1111111111111111111111111111111111111111";
  const terms = { version: "riskscan-revenue-note-v1", fundingTargetTinybars: "1000", noteUnitPriceTinybars: "10", maximumNoteUnits: "100", minimumPurchaseUnits: "1", reserveShareBps: "2000", issuerShareBps: "8000", platformFeeBps: "0", payoutCapTinybars: "1500" };
  const offeringPublicId = "offering_unrelated";
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });
  const store = reservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: recipient, canonicalParametersHash: "a".repeat(64), state: "OUTCOME_UNKNOWN" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: recipient, canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [
      { _id: "backingIntents:a", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", canonicalSignerAddress: signer, offeringPublicId: "offering_blocked", tinybars: "7", expiresAt: new Date(Date.now() + 60_000).toISOString() },
      { _id: "backingIntents:b", idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBA", canonicalSignerAddress: signer, offeringPublicId, offeringVersion: 1, offeringTermsDigest: keccak256(new TextEncoder().encode(canonicalizeRequirements(terms))).slice(2), recipient, tinybars: "7", expiresAt: new Date(Date.now() + 60_000).toISOString() },
    ],
    accounts: [{ _id: "selfServiceAccounts:backer", canonicalSignerAddress: signer, chainId: 296, principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE", createdAt: 1n, updatedAt: 1n }],
    offerings: [{ _id: "offerings:unrelated", offeringPublicId, version: 1, state: "OPEN", fundingRecipient: recipient, canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", definition: { terms } }],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signer, offeringPublicId: "offering_blocked", tinybars: "7", state: "OUTCOME_UNKNOWN", claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signer, offeringPublicId, tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });

  assert.deepEqual(
    await beginBackingPaymentDispatch._handler({ db: store.db }, { attemptPublicId: "BBBBBBBBBBBBBBBBBBBBBA", canonicalSignerAddress: signer, tinybars: "7" }),
    { status: "OUTCOME_UNKNOWN", transactionHash: null, tinybars: "7" },
  );
});

test("keeps an unrelated backer wallet dispatchable while another wallet remains unresolved", async () => {
  const { beginBackingPaymentDispatch } = await import(storeUrl.href);
  const signerA = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const signerB = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const store = reservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerA, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "OUTCOME_UNKNOWN" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerB, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [{ _id: "backingIntents:b", idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBA", canonicalSignerAddress: signerB, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7" }],
    authorities: [{ _id: "commandAuthorities:backer", canonicalSignerAddress: signerB, chainId: 296, principalPublicId: "legacy_backer", role: "BACKER", authorityVersion: "legacy_v1", enabled: true }],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signerA, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "OUTCOME_UNKNOWN", claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signerB, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });

  assert.deepEqual(
    await beginBackingPaymentDispatch._handler({ db: store.db }, { attemptPublicId: "BBBBBBBBBBBBBBBBBBBBBA", canonicalSignerAddress: signerB, tinybars: "7" }),
    { status: "OUTCOME_UNKNOWN", transactionHash: null, tinybars: "7" },
  );
});

test("keeps the original unresolved hash available for offer-scoped recovery after a stale replacement reservation", async () => {
  const { readBackingPaymentVerificationContextForOffering } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptA = "AAAAAAAAAAAAAAAAAAAAAA";
  const hash = `0x${"ab".repeat(32)}`;
  const store = reservationStoreDatabase({
    attempts: [{ _id: "externalPrepareCommandAttempts:a", idempotencyKey: attemptA, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "OUTCOME_UNKNOWN" }],
    intents: [],
    claims: [
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signer, offeringPublicId: "offering_shared", tinybars: "7", state: "PREPARED", claimedAt: 2n },
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signer, offeringPublicId: "offering_shared", tinybars: "7", transactionHash: hash, state: "OUTCOME_UNKNOWN", claimedAt: 1n },
    ],
  });

  assert.deepEqual(
    await readBackingPaymentVerificationContextForOffering._handler({ db: store.db }, { canonicalSignerAddress: signer, offeringPublicId: "offering_shared" }),
    { attemptPublicId: attemptA, expectedTarget: "0x1111111111111111111111111111111111111111", transactionHash: hash, tinybars: "7", state: "OUTCOME_UNKNOWN" },
  );
});

function paymentStoreDatabase(claims) {
  return {
    db: {
      query(table) {
        return {
          withIndex(_index, configure) {
            const filters = [];
            const query = { eq(field, value) { filters.push([field, value]); return query; } };
            configure(query);
            const matching = claims.filter((claim) => table === "backingPaymentClaims" && filters.every(([field, value]) => claim[field] === value));
            const builder = {
              order(direction) {
                const ordered = [...matching].sort((left, right) => direction === "desc" ? Number(right.claimedAt - left.claimedAt) : Number(left.claimedAt - right.claimedAt));
                return { async take(limit) { return ordered.slice(0, limit); } };
              },
              async take(limit) { return matching.slice(0, limit); },
            };
            return builder;
          },
        };
      },
    },
  };
}

function reservationStoreDatabase({ attempts, intents, accounts = [], authorities = [], offerings = [], claims = [] }) {
  const rows = {
    externalPrepareCommandAttempts: structuredClone(attempts),
    backingIntents: structuredClone(intents),
    selfServiceAccounts: structuredClone(accounts),
    commandAuthorities: structuredClone(authorities),
    offerings: structuredClone(offerings),
    backingPaymentClaims: structuredClone(claims),
  };
  const writes = [];
  return {
    rows,
    writes,
    db: {
      query(table) {
        return {
          withIndex(_index, configure) {
            const filters = [];
            const query = { eq(field, value) { filters.push([field, value]); return query; } };
            configure(query);
            return {
              order() { return this; },
              async take(limit) {
                return rows[table].filter((row) => filters.every(([field, value]) => row[field] === value)).slice(0, limit);
              },
            };
          },
        };
      },
      async insert(table, document) {
        const row = { _id: `${table}:${rows[table].length}`, _creationTime: 1, ...structuredClone(document) };
        rows[table].push(row);
        writes.push(row);
        return row._id;
      },
      async patch(id, patch) {
        const row = Object.values(rows).flat().find((candidate) => candidate._id === id);
        assert.ok(row, `missing patch target ${id}`);
        Object.assign(row, structuredClone(patch));
        writes.push({ kind: "patch", id, patch: structuredClone(patch) });
      },
      async get(id) {
        return rows.externalPrepareCommandAttempts.find((row) => row._id === id) ?? null;
      },
    },
  };
}

function occReservationStoreDatabase({ attempts, intents, accounts = [], authorities = [], claims = [] }) {
  const rows = {
    externalPrepareCommandAttempts: structuredClone(attempts),
    backingIntents: structuredClone(intents),
    selfServiceAccounts: structuredClone(accounts),
    commandAuthorities: structuredClone(authorities),
    backingPaymentClaims: structuredClone(claims),
  };
  let conflicts = 0;

  function matching(source, table, filters) {
    return source[table].filter((row) => filters.every(([field, value]) => row[field] === value));
  }

  function comparable(value) {
    return JSON.stringify(value, (_key, item) => typeof item === "bigint" ? `${item}n` : item);
  }

  function transaction() {
    const snapshot = structuredClone(rows);
    const reads = [];
    const patches = [];
    const db = {
      query(table) {
        return {
          withIndex(_index, configure) {
            const filters = [];
            const query = { eq(field, value) { filters.push([field, value]); return query; } };
            configure(query);
            const expected = matching(snapshot, table, filters);
            reads.push({ table, filters, expected: comparable(expected) });
            return {
              order() { return this; },
              async take(limit) { return expected.slice(0, limit); },
            };
          },
        };
      },
      async get(id) {
        return Object.values(snapshot).flat().find((row) => row._id === id) ?? null;
      },
      async patch(id, patch) {
        patches.push({ id, patch: structuredClone(patch) });
      },
    };
    return {
      ctx: { db },
      commit() {
        if (reads.some((read) => comparable(matching(rows, read.table, read.filters)) !== read.expected)) {
          conflicts += 1;
          return false;
        }
        for (const { id, patch } of patches) {
          const row = Object.values(rows).flat().find((candidate) => candidate._id === id);
          assert.ok(row, `missing patch target ${id}`);
          Object.assign(row, patch);
        }
        return true;
      },
    };
  }

  return {
    rows,
    get conflicts() { return conflicts; },
    async runMutation(handler, args) {
      for (;;) {
        const current = transaction();
        const result = await handler(current.ctx, args);
        if (current.commit()) return result;
      }
    },
  };
}

test("retries an OCC-conflicted stale-tab dispatch and preserves one unresolved owner", async () => {
  const { beginBackingPaymentDispatch } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptA = "AAAAAAAAAAAAAAAAAAAAAA";
  const attemptB = "BBBBBBBBBBBBBBBBBBBBBA";
  const store = occReservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: attemptA, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "PREPARED" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: attemptB, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [
      { _id: "backingIntents:a", idempotencyKey: attemptA, canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7" },
      { _id: "backingIntents:b", idempotencyKey: attemptB, canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7" },
    ],
    authorities: [{ _id: "commandAuthorities:backer", canonicalSignerAddress: signer, chainId: 296, principalPublicId: "legacy_backer", role: "BACKER", authorityVersion: "legacy_v1", enabled: true }],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "PREPARED", claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });
  const [left, right] = await Promise.all([
    store.runMutation(beginBackingPaymentDispatch._handler, { attemptPublicId: attemptA, canonicalSignerAddress: signer, tinybars: "7" }),
    store.runMutation(beginBackingPaymentDispatch._handler, { attemptPublicId: attemptB, canonicalSignerAddress: signer, tinybars: "7" }),
  ]);
  const outcomes = [left, right];
  assert.equal(outcomes.filter((outcome) => outcome?.status === "OUTCOME_UNKNOWN").length, 1);
  assert.equal(outcomes.filter((outcome) => outcome?.status === "RECOVERY_REQUIRED").length, 1);
  assert.equal(store.conflicts, 1, "the second mutation reruns after the indexed unresolved-claim range changes");
  assert.equal(store.rows.backingPaymentClaims.filter((claim) => claim.state === "OUTCOME_UNKNOWN").length, 1);
});

test("reads an actual scoped payment even after more than twenty abandoned intents", async () => {
  const { readBackerPaymentForOffering } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const claims = [{ _id: "claim:older", attemptId: "attempt:older", canonicalSignerAddress: signer, offeringPublicId: "offering_a", tinybars: "10", state: "CONFIRMED", transactionHash: `0x${"ab".repeat(32)}`, claimedAt: 1n }];
  const result = await readBackerPaymentForOffering._handler(paymentStoreDatabase(claims), { canonicalSignerAddress: signer, offeringPublicId: "offering_a" });
  assert.deepEqual(result, { status: "CONFIRMED", transactionHash: `0x${"ab".repeat(32)}`, tinybars: "10" });
});

test("lists only offer-scoped durable claims and never relabels an arbitrary legacy claim", async () => {
  const { listBackerPayments } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const claims = [
    { _id: "claim:generic", attemptId: "attempt:generic", canonicalSignerAddress: signer, offeringPublicId: "offering_generic", tinybars: "11", state: "CONFIRMED", transactionHash: `0x${"cd".repeat(32)}`, claimedAt: 2n },
    { _id: "claim:unscoped", attemptId: "attempt:unscoped", canonicalSignerAddress: signer, tinybars: "12", state: "CONFIRMED", transactionHash: `0x${"ef".repeat(32)}`, claimedAt: 3n },
  ];
  const result = await listBackerPayments._handler(paymentStoreDatabase(claims), { canonicalSignerAddress: signer });
  assert.deepEqual(result, [{ offeringPublicId: "offering_generic", status: "CONFIRMED", transactionHash: `0x${"cd".repeat(32)}`, tinybars: "11" }]);
});

test("keeps a pre-M59 RiskScan claim visible after BACKER authority revocation", async () => {
  const { readLegacyRiskScanPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attempt = { _id: "externalPrepareCommandAttempts:legacy", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "CONFIRMED", subjectPublicId: "riskscan_revenue_note_demo" };
  const claim = { _id: "backingPaymentClaims:legacy", attemptId: attempt._id, canonicalSignerAddress: signer, tinybars: "7", state: "CONFIRMED", transactionHash: `0x${"ab".repeat(32)}`, claimedAt: 1n };
  const store = reservationStoreDatabase({ attempts: [attempt], intents: [], authorities: [{ _id: "commandAuthorities:revoked", canonicalSignerAddress: signer, chainId: 296, principalPublicId: "legacy", role: "BACKER", authorityVersion: "legacy_v1", enabled: false }], claims: [claim] });
  assert.deepEqual(await readLegacyRiskScanPayment._handler({ db: store.db }, { canonicalSignerAddress: signer }), { status: "CONFIRMED", transactionHash: claim.transactionHash, tinybars: "7" });
});

test("reconciles an existing pre-M59 pending RiskScan claim without inventing an intent or funding permission", async () => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const hash = `0x${"ab".repeat(32)}`;
  const store = reservationStoreDatabase({
    attempts: [{ _id: "externalPrepareCommandAttempts:legacy", idempotencyKey: attemptPublicId, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "PREPARED", subjectPublicId: "riskscan_revenue_note_demo" }],
    intents: [],
    claims: [{ _id: "backingPaymentClaims:legacy", attemptId: "externalPrepareCommandAttempts:legacy", canonicalSignerAddress: signer, tinybars: "7", state: "PREPARED", claimedAt: 1n }],
  });
  assert.deepEqual(await recordBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, transactionHash: hash, tinybars: "7", outcome: "SUBMITTED" }), { status: "SUBMITTED", transactionHash: hash, tinybars: "7" });
  assert.equal(store.rows.backingIntents.length, 0);
});

test("keeps a rejected foreign candidate from owning the rightful payer's hash", async () => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signerA = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const signerB = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const hash = `0x${"ab".repeat(32)}`;
  const attemptA = "AAAAAAAAAAAAAAAAAAAAAA";
  const attemptB = "BBBBBBBBBBBBBBBBBBBBBA";
  const store = reservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: attemptA, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerA, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "PREPARED" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: attemptB, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerB, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [
      { _id: "backingIntents:a", idempotencyKey: attemptA, canonicalSignerAddress: signerA, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7" },
      { _id: "backingIntents:b", idempotencyKey: attemptB, canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7" },
    ],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signerA, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7", state: "PREPARED", claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });
  const ctx = { db: store.db };
  assert.deepEqual(
    await recordBackingPayment._handler(ctx, { attemptPublicId: attemptB, canonicalSignerAddress: signerB, transactionHash: hash, tinybars: "7", outcome: "REJECTED" }),
    { status: "REJECTED", transactionHash: hash, tinybars: "7" },
  );
  assert.deepEqual(
    await recordBackingPayment._handler(ctx, { attemptPublicId: attemptA, canonicalSignerAddress: signerA, transactionHash: hash, tinybars: "7", outcome: "CONFIRMED" }),
    { status: "CONFIRMED", transactionHash: hash, tinybars: "7" },
  );
  assert.equal(store.rows.backingPaymentClaims.find((claim) => claim._id === "backingPaymentClaims:b").verifiedTransactionHash, undefined);
  assert.equal(store.rows.backingPaymentClaims.find((claim) => claim._id === "backingPaymentClaims:a").verifiedTransactionHash, hash);
});

test("confirms the rightful submitted claim after more than one hundred rejected or unknown candidates share its hash", async () => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const hash = `0x${"ab".repeat(32)}`;
  const rejected = Array.from({ length: 100 }, (_, index) => ({
    _id: `backingPaymentClaims:rejected-${index}`,
    attemptId: `externalPrepareCommandAttempts:rejected-${index}`,
    canonicalSignerAddress: `0x${index.toString(16).padStart(40, "0")}`,
    offeringPublicId: `offering_rejected_${index}`,
    tinybars: "7",
    transactionHash: hash,
    state: "REJECTED",
    claimedAt: BigInt(index),
  }));
  const store = reservationStoreDatabase({
    attempts: [{ _id: "externalPrepareCommandAttempts:rightful", idempotencyKey: attemptPublicId, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "PREPARED" }],
    intents: [{ _id: "backingIntents:rightful", idempotencyKey: attemptPublicId, canonicalSignerAddress: signer, offeringPublicId: "offering_rightful", tinybars: "7" }],
    claims: [
      ...rejected,
      { _id: "backingPaymentClaims:unknown", attemptId: "externalPrepareCommandAttempts:unknown", canonicalSignerAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", offeringPublicId: "offering_unknown", tinybars: "7", transactionHash: hash, state: "OUTCOME_UNKNOWN", claimedAt: 100n },
      { _id: "backingPaymentClaims:rightful", attemptId: "externalPrepareCommandAttempts:rightful", canonicalSignerAddress: signer, offeringPublicId: "offering_rightful", tinybars: "7", transactionHash: hash, state: "SUBMITTED", claimedAt: 101n },
    ],
  });

  assert.deepEqual(
    await recordBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, transactionHash: hash, tinybars: "7", outcome: "CONFIRMED" }),
    { status: "CONFIRMED", transactionHash: hash, tinybars: "7" },
  );
  assert.equal(store.rows.backingPaymentClaims.at(-1).verifiedTransactionHash, hash);
});

test("refuses a second confirmation for a legacy confirmed hash without verifiedTransactionHash", async () => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signerA = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const signerB = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const hash = `0x${"ab".repeat(32)}`;
  const attemptB = "BBBBBBBBBBBBBBBBBBBBBA";
  const store = reservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerA, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "CONFIRMED" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: attemptB, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerB, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [{ _id: "backingIntents:b", idempotencyKey: attemptB, canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7" }],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signerA, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7", state: "CONFIRMED", transactionHash: hash, claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });
  assert.equal(
    await recordBackingPayment._handler({ db: store.db }, { attemptPublicId: attemptB, canonicalSignerAddress: signerB, transactionHash: hash, tinybars: "7", outcome: "CONFIRMED" }),
    null,
  );
  assert.equal(store.rows.backingPaymentClaims[0].verifiedTransactionHash, undefined);
  assert.equal(store.rows.backingPaymentClaims[0].state, "CONFIRMED");
});

test("refuses a second confirmation for a verified confirmed hash", async () => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signerA = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const signerB = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const hash = `0x${"ab".repeat(32)}`;
  const attemptB = "BBBBBBBBBBBBBBBBBBBBBA";
  const store = reservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerA, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "CONFIRMED" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: attemptB, operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerB, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [{ _id: "backingIntents:b", idempotencyKey: attemptB, canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7" }],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signerA, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7", state: "CONFIRMED", transactionHash: hash, verifiedTransactionHash: hash, claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });
  assert.equal(
    await recordBackingPayment._handler({ db: store.db }, { attemptPublicId: attemptB, canonicalSignerAddress: signerB, transactionHash: hash, tinybars: "7", outcome: "CONFIRMED" }),
    null,
  );
  assert.equal(store.rows.backingPaymentClaims[0].verifiedTransactionHash, hash);
  assert.equal(store.rows.backingPaymentClaims[0].state, "CONFIRMED");
});

test("retries an OCC-conflicted competing confirmation through the backing mutation", async () => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signerA = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const signerB = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const hash = `0x${"ab".repeat(32)}`;
  const store = occReservationStoreDatabase({
    attempts: [
      { _id: "externalPrepareCommandAttempts:a", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerA, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "a".repeat(64), state: "PREPARED" },
      { _id: "externalPrepareCommandAttempts:b", idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBA", operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296, canonicalSignerAddress: signerB, expectedTarget: "0x1111111111111111111111111111111111111111", canonicalParametersHash: "b".repeat(64), state: "PREPARED" },
    ],
    intents: [
      { _id: "backingIntents:a", idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", canonicalSignerAddress: signerA, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7" },
      { _id: "backingIntents:b", idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBA", canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7" },
    ],
    claims: [
      { _id: "backingPaymentClaims:a", attemptId: "externalPrepareCommandAttempts:a", canonicalSignerAddress: signerA, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7", state: "PREPARED", claimedAt: 1n },
      { _id: "backingPaymentClaims:b", attemptId: "externalPrepareCommandAttempts:b", canonicalSignerAddress: signerB, offeringPublicId: "offering_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", tinybars: "7", state: "PREPARED", claimedAt: 2n },
    ],
  });
  const [first, second] = await Promise.all([
    store.runMutation(recordBackingPayment._handler, { attemptPublicId: "AAAAAAAAAAAAAAAAAAAAAA", canonicalSignerAddress: signerA, transactionHash: hash, tinybars: "7", outcome: "CONFIRMED" }),
    store.runMutation(recordBackingPayment._handler, { attemptPublicId: "BBBBBBBBBBBBBBBBBBBBBA", canonicalSignerAddress: signerB, transactionHash: hash, tinybars: "7", outcome: "CONFIRMED" }),
  ]);
  assert.equal(first.status, "CONFIRMED");
  assert.equal(second, null);
  assert.equal(store.conflicts, 1);
  assert.equal(store.rows.backingPaymentClaims.filter((claim) => claim.state === "CONFIRMED").length, 1);
});

test("keeps the shared ATS prepare attempt PREPARED while the dedicated backing claim changes state", async () => {
  const source = await readFile(storeUrl, "utf8");
  assert.match(source, /by_verified_transaction_hash/u);
  assert.match(source, /verifiedTransactionHash: args\.transactionHash/u);
  assert.doesNotMatch(source, /ctx\.db\.patch\(row\._id, \{ state: next \}\)/u);
});

test("refuses a new self-service payment reservation after the public flag is disabled", async (t) => {
  const { reserveBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{
      _id: "externalPrepareCommandAttempts:funding", idempotencyKey: attemptPublicId,
      operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296,
      canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111",
      canonicalParametersHash: "a".repeat(64), state: "PREPARED",
    }],
    intents: [{
      _id: "backingIntents:funding", idempotencyKey: attemptPublicId,
      canonicalSignerAddress: signer, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7",
    }],
    accounts: [{
      _id: "selfServiceAccounts:backer", canonicalSignerAddress: signer, chainId: 296,
      principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
      createdAt: 1n, updatedAt: 1n,
    }],
  });
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "false";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });

  assert.equal(
    await reserveBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, tinybars: "7" }),
    null,
  );
  assert.deepEqual(store.writes, []);
});

test("refuses a new self-service payment reservation after its frozen intent expires", async (t) => {
  const { reserveBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{
      _id: "externalPrepareCommandAttempts:funding", idempotencyKey: attemptPublicId,
      operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296,
      canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111",
      canonicalParametersHash: "a".repeat(64), state: "PREPARED",
    }],
    intents: [{
      _id: "backingIntents:funding", idempotencyKey: attemptPublicId,
      canonicalSignerAddress: signer, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7",
      expiresAt: new Date(Date.now() - 1).toISOString(),
    }],
    accounts: [{
      _id: "selfServiceAccounts:backer", canonicalSignerAddress: signer, chainId: 296,
      principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
      createdAt: 1n, updatedAt: 1n,
    }],
  });
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });

  assert.equal(
    await reserveBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, tinybars: "7" }),
    null,
  );
  assert.deepEqual(store.writes, []);
});

test("refuses a first self-service payment attachment without a durable reservation", async (t) => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{
      _id: "externalPrepareCommandAttempts:funding", idempotencyKey: attemptPublicId,
      operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296,
      canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111",
      canonicalParametersHash: "a".repeat(64), state: "PREPARED",
    }],
    intents: [{
      _id: "backingIntents:funding", idempotencyKey: attemptPublicId,
      canonicalSignerAddress: signer, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }],
    accounts: [{
      _id: "selfServiceAccounts:backer", canonicalSignerAddress: signer, chainId: 296,
      principalPublicId: `self_service_${signer.slice(2)}`, policyVersion: "public_testnet_v1", status: "ACTIVE",
      createdAt: 1n, updatedAt: 1n,
    }],
  });
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });

  assert.equal(
    await recordBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, transactionHash: `0x${"ab".repeat(32)}`, tinybars: "7", outcome: "SUBMITTED" }),
    null,
  );
  assert.deepEqual(store.writes, []);
});

test("records an exact pre-reserved self-service payment after its frozen intent expires", async () => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{
      _id: "externalPrepareCommandAttempts:funding", idempotencyKey: attemptPublicId,
      operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296,
      canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111",
      canonicalParametersHash: "a".repeat(64), state: "PREPARED",
    }],
    intents: [{
      _id: "backingIntents:funding", idempotencyKey: attemptPublicId,
      canonicalSignerAddress: signer, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7",
      expiresAt: new Date(Date.now() - 1).toISOString(),
    }],
    claims: [{
      _id: "backingPaymentClaims:prepared", attemptId: "externalPrepareCommandAttempts:funding",
      canonicalSignerAddress: signer, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7", state: "PREPARED", claimedAt: 1n,
    }],
  });
  const transactionHash = `0x${"ab".repeat(32)}`;

  assert.deepEqual(
    await recordBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, transactionHash, tinybars: "7", outcome: "SUBMITTED" }),
    { status: "SUBMITTED", transactionHash, tinybars: "7" },
  );
  assert.equal(store.rows.backingPaymentClaims[0].transactionHash, transactionHash);
});

test("preserves the exact enabled legacy RiskScan reservation while public self-service is disabled", async (t) => {
  const { reserveBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{
      _id: "externalPrepareCommandAttempts:legacy", idempotencyKey: attemptPublicId,
      operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296,
      canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111",
      canonicalParametersHash: "a".repeat(64), state: "PREPARED",
    }],
    intents: [{
      _id: "backingIntents:legacy", idempotencyKey: attemptPublicId,
      canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7",
    }],
    authorities: [{
      _id: "commandAuthorities:backer", canonicalSignerAddress: signer, chainId: 296,
      principalPublicId: "legacy_backer", role: "BACKER", authorityVersion: "legacy_v1", enabled: true,
    }],
  });
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "false";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });

  assert.deepEqual(
    await reserveBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, tinybars: "7" }),
    { status: "PREPARED", transactionHash: null, tinybars: "7" },
  );
  assert.equal(store.rows.backingPaymentClaims.length, 1);
});

test("keeps an enabled legacy RiskScan reservation eligible while public self-service is enabled", async (t) => {
  const { reserveBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{
      _id: "externalPrepareCommandAttempts:legacy", idempotencyKey: attemptPublicId,
      operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296,
      canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111",
      canonicalParametersHash: "a".repeat(64), state: "PREPARED",
    }],
    intents: [{
      _id: "backingIntents:legacy", idempotencyKey: attemptPublicId,
      canonicalSignerAddress: signer, offeringPublicId: "riskscan_revenue_note_demo", tinybars: "7",
    }],
    authorities: [{
      _id: "commandAuthorities:backer", canonicalSignerAddress: signer, chainId: 296,
      principalPublicId: "legacy_backer", role: "BACKER", authorityVersion: "legacy_v1", enabled: true,
    }],
  });
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "true";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });

  assert.deepEqual(
    await reserveBackingPayment._handler({ db: store.db }, { attemptPublicId, canonicalSignerAddress: signer, tinybars: "7" }),
    { status: "PREPARED", transactionHash: null, tinybars: "7" },
  );
});

test("records an already-reserved submitted payment after a public flag switch without granting another reservation", async (t) => {
  const { recordBackingPayment } = await import(storeUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
  const store = reservationStoreDatabase({
    attempts: [{
      _id: "externalPrepareCommandAttempts:funding", idempotencyKey: attemptPublicId,
      operationKind: "HEDERA_FUNDING", role: "BACKER", chainId: 296,
      canonicalSignerAddress: signer, expectedTarget: "0x1111111111111111111111111111111111111111",
      canonicalParametersHash: "a".repeat(64), state: "PREPARED",
    }],
    intents: [{
      _id: "backingIntents:funding", idempotencyKey: attemptPublicId,
      canonicalSignerAddress: signer, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7",
    }],
    claims: [{
      _id: "backingPaymentClaims:prepared", attemptId: "externalPrepareCommandAttempts:funding",
      canonicalSignerAddress: signer, offeringPublicId: "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", tinybars: "7", state: "PREPARED", claimedAt: 1n,
    }],
  });
  const previous = process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED;
  process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = "false";
  t.after(() => { process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED = previous; });
  const transactionHash = `0x${"ab".repeat(32)}`;

  assert.deepEqual(
    await recordBackingPayment._handler({ db: store.db }, {
      attemptPublicId, canonicalSignerAddress: signer, transactionHash, tinybars: "7", outcome: "SUBMITTED",
    }),
    { status: "SUBMITTED", transactionHash, tinybars: "7" },
  );
  assert.equal(store.rows.backingPaymentClaims[0].transactionHash, transactionHash);
});

test("confirms only a hash-bound payment receipt matching the admitted signer, target, and tinybar value", async () => {
  const { confirmBackingPaymentForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const transactionHash = `0x${"ab".repeat(32)}`;
  const parameters = { offeringPublicId: "riskscan_revenue_note_demo", units: "10", tinybars: "1000000000", purchaseIntentId: "AbCdEfGhIjKlMnOpQrStUw" };
  const hash = keccak256(new TextEncoder().encode(canonicalizeRequirements(parameters))).slice(2);
  const calls = [];
  const ctx = {
    runQuery: async () => ({ expectedTarget: signer, canonicalParametersHash: hash }),
    runMutation: async (_reference, input) => { calls.push(input); return { status: input.outcome, transactionHash: input.transactionHash, tinybars: input.tinybars }; },
  };
  const result = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => ({ from: signer, to: signer, value: 10_000_000_000_000_000_000n, status: "0x1" }));
  assert.deepEqual(result, { status: "CONFIRMED", transactionHash, tinybars: "1000000000" });
  assert.deepEqual(calls.map((call) => call.outcome), ["SUBMITTED", "CONFIRMED"]);
  const rejected = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => ({ from: signer, to: "0x1111111111111111111111111111111111111111", value: 10_000_000_000_000_000_000n, status: "0x1" }));
  assert.equal(rejected.status, "REJECTED");
});

test("persists a submitted hash before observation and later re-verifies it without another wallet transfer", async () => {
  const { confirmBackingPaymentForTest, reverifyBackerPaymentForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const transactionHash = `0x${"ef".repeat(32)}`;
  const parameters = { offeringPublicId: "riskscan_revenue_note_demo", units: "10", tinybars: "1000000000", purchaseIntentId: "AbCdEfGhIjKlMnOpQrStUw" };
  const canonicalParametersHash = keccak256(new TextEncoder().encode(canonicalizeRequirements(parameters))).slice(2);
  const writes = [];
  const context = { expectedTarget: signer, canonicalParametersHash };
  const ctx = {
    runQuery: async () => context,
    runMutation: async (_reference, input) => { writes.push(input); return { status: input.outcome, transactionHash: input.transactionHash, tinybars: input.tinybars }; },
  };
  const submitted = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => null);
  assert.equal(submitted.status, "OUTCOME_UNKNOWN");
  context.attemptPublicId = "ZyXwVuTsRqPoNmLkJiHgFw";
  context.transactionHash = transactionHash;
  context.tinybars = "1000000000";
  context.state = "OUTCOME_UNKNOWN";
  const confirmed = await reverifyBackerPaymentForTest(ctx, { canonicalSignerAddress: signer }, async () => ({ from: signer, to: signer, value: 10_000_000_000_000_000_000n, status: "0x1" }));
  assert.equal(confirmed.status, "CONFIRMED");
  const rejected = await reverifyBackerPaymentForTest({ ...ctx, runQuery: async () => ({ ...context, state: "OUTCOME_UNKNOWN" }) }, { canonicalSignerAddress: signer }, async () => ({ from: signer, to: signer, value: 10_000_000_000_000_000_000n, status: "0x0" }));
  assert.equal(rejected.status, "REJECTED");
  assert.deepEqual(writes.map((write) => write.outcome), ["SUBMITTED", "OUTCOME_UNKNOWN", "CONFIRMED", "REJECTED"]);
});

test("re-verifies a revoked pre-M59 RiskScan candidate through the legacy read path", async () => {
  const { reverifyLegacyRiskScanPaymentForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const transactionHash = `0x${"cd".repeat(32)}`;
  const writes = [];
  const context = {
    attemptPublicId: "AAAAAAAAAAAAAAAAAAAAAA",
    expectedTarget: "0x1111111111111111111111111111111111111111",
    transactionHash,
    tinybars: "7",
    state: "OUTCOME_UNKNOWN",
  };
  const ctx = {
    runQuery: async () => context,
    runMutation: async (_reference, input) => {
      writes.push(input);
      return { status: input.outcome, transactionHash: input.transactionHash, tinybars: input.tinybars };
    },
  };
  assert.deepEqual(
    await reverifyLegacyRiskScanPaymentForTest(ctx, { canonicalSignerAddress: signer }, async () => ({ from: signer, to: context.expectedTarget, value: 70_000_000_000n, status: "0x1" })),
    { status: "CONFIRMED", transactionHash, tinybars: "7" },
  );
  assert.deepEqual(writes.map((write) => write.outcome), ["CONFIRMED"]);
});

test("re-verifies the selected offer's pending claim instead of the wallet's latest claim", async () => {
  const { reverifyBackerPaymentForOfferingForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const selectedHash = `0x${"12".repeat(32)}`;
  const writes = [];
  const result = await reverifyBackerPaymentForOfferingForTest({
    runQuery: async () => ({ attemptPublicId: "SelectedAttemptKey12345A", expectedTarget: signer, transactionHash: selectedHash, tinybars: "7", state: "OUTCOME_UNKNOWN" }),
    runMutation: async (_reference, input) => { writes.push(input); return { status: input.outcome, transactionHash: input.transactionHash, tinybars: input.tinybars }; },
  }, { canonicalSignerAddress: signer, offeringPublicId: "offering_selected" }, async (hash) => {
    assert.equal(hash, selectedHash);
    return { from: signer, to: signer, value: 70_000_000_000n, status: "0x1" };
  });
  assert.deepEqual(result, { status: "CONFIRMED", transactionHash: selectedHash, tinybars: "7" });
  assert.deepEqual(writes.map((write) => write.attemptPublicId), ["SelectedAttemptKey12345A"]);
});

test("returns a durable pre-send reservation on reload without reading a receipt or enabling another send", async () => {
  const { reverifyBackerPaymentForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  let reads = 0;
  let queries = 0;
  const result = await reverifyBackerPaymentForTest({ runQuery: async () => (++queries === 1 ? null : { status: "PREPARED", transactionHash: null, tinybars: "1000000000" }) }, { canonicalSignerAddress: signer }, async () => { reads += 1; return null; });
  assert.deepEqual(result, { status: "PREPARED", transactionHash: null, tinybars: "1000000000" });
  assert.equal(reads, 0);
});

test("reads only matching successful Hedera EVM transaction and receipt documents", async () => {
  const { createHederaFundingReceiptReader } = await import(receiptReaderUrl.href);
  const hash = `0x${"cd".repeat(32)}`;
  const from = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  let count = 0;
  const reader = createHederaFundingReceiptReader(async (_url, init) => {
    count += 1;
    const method = JSON.parse(init.body).method;
    const result = method === "eth_getTransactionByHash"
      ? { hash, chainId: "0x128", from, to: from, value: "0x2540be400" }
      : { transactionHash: hash, status: "0x1" };
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200, headers: { "content-type": "application/json" } });
  });
  assert.deepEqual(await reader(hash), { hash, chainId: 296, from, to: from, value: 10_000_000_000n, status: "0x1" });
  assert.equal(count, 2);
});

test("keeps an unavailable receipt non-terminal and recognizes a failed EVM receipt as terminal", async () => {
  const { createHederaFundingReceiptReader } = await import(receiptReaderUrl.href);
  const hash = `0x${"de".repeat(32)}`;
  const from = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const reader = createHederaFundingReceiptReader(async (_url, init) => {
    const method = JSON.parse(init.body).method;
    const result = method === "eth_getTransactionByHash" ? { hash, chainId: "0x128", from, to: from, value: "0x1" } : { transactionHash: hash, status: "0x0" };
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200, headers: { "content-type": "application/json" } });
  });
  assert.equal((await reader(hash))?.status, "0x0");
});
