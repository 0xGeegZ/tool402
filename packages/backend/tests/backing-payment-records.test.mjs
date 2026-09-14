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

function reservationStoreDatabase({ attempts, intents, accounts = [], authorities = [], claims = [] }) {
  const rows = {
    externalPrepareCommandAttempts: structuredClone(attempts),
    backingIntents: structuredClone(intents),
    selfServiceAccounts: structuredClone(accounts),
    commandAuthorities: structuredClone(authorities),
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
    },
  };
}

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

test("keeps the shared ATS prepare attempt PREPARED while the dedicated backing claim changes state", async () => {
  const source = await readFile(storeUrl, "utf8");
  assert.match(source, /ctx\.db\.patch\(claim\._id, \{ transactionHash: args\.transactionHash, state: next \}\)/u);
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
