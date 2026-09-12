import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const stateUrl = new URL("../src/components/backing/backing-state.ts", import.meta.url);
const nowMilliseconds = Date.parse("2026-09-10T18:00:00.000Z");
const treasury = "0x4b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d";
const termsV1 = Object.freeze({
  version: "v1",
  fundingTargetTinybars: "100000000000",
  noteUnitPriceTinybars: "100000000",
  maximumNoteUnits: "1000",
  minimumPurchaseUnits: "10",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "150000000000",
});

function record(overrides = {}) {
  return Object.freeze({
    offeringPublicId: "riskscan_offering_demo",
    version: 1,
    subjectPublicId: "riskscan_revenue_note_demo",
    state: "OPEN",
    definition: { terms: termsV1, maturityAt: "2026-12-31T00:00:00.000Z", qualifyingResource: "/api/services/riskscan/standard" },
    narrative: { title: "RiskScan", customerProblem: "x", customerUseCases: [], useOfFunds: [], risks: [] },
    advertisedQuickPriceTinybars: "10000000",
    advertisedStandardPriceTinybars: "50000000",
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    acceptedAt: "1",
    updatedAt: "1",
    fundingTreasuryAddress: treasury,
    ...overrides,
  });
}

function fixedBytes(seed) {
  let counter = seed;
  return (length) => {
    counter += 1;
    return Uint8Array.from({ length }, (_, index) => (index * 7 + counter) & 0xff);
  };
}

async function loadState() {
  assert.equal(existsSync(fileURLToPath(stateUrl)), true, "backing-state.ts must exist");
  return import(stateUrl.href);
}

test("declares the closed eight-kind view union and its accepted lifecycle mapping", async () => {
  const state = await loadState();

  assert.deepEqual([...state.backingViewKinds], [
    "offering_unavailable",
    "choosing",
    "prepared",
    "payment_submitted",
    "payment_outcome_unknown",
    "allocation_pending",
    "complete",
    "refused",
  ]);
  assert.deepEqual(state.backingLifecycleLabels, {
    offering_unavailable: null,
    choosing: null,
    prepared: "awaiting_payment",
    payment_submitted: "payment_submitted",
    payment_outcome_unknown: "payment_outcome_unknown",
    allocation_pending: "allocation_pending",
    complete: "complete",
    refused: null,
  });
  assert.deepEqual(state.backingAttemptStates, {
    offering_unavailable: null,
    choosing: null,
    prepared: "PREPARED",
    payment_submitted: "PREPARED",
    payment_outcome_unknown: null,
    allocation_pending: null,
    complete: null,
    refused: null,
  });

  const source = await readFile(fileURLToPath(stateUrl), "utf8");
  assert.equal((source.match(/kind: "allocation_pending"/g) ?? []).length, 0);
  assert.equal((source.match(/kind: "complete"/g) ?? []).length, 0);
});

test("reads the offering terms through the accepted constructor and refuses anything it rejects", async () => {
  const state = await loadState();

  const offering = state.readBackingOffering(record());
  assert.notEqual(offering, null);
  assert.equal(offering.terms.minimumPurchaseUnits, 10n);
  assert.equal(offering.terms.maximumNoteUnits, 1000n);
  assert.equal(offering.terms.noteUnitPriceTinybars, 100000000n);
  assert.equal(offering.treasury, treasury);

  assert.equal(state.readBackingOffering(null), null);
  assert.equal(state.readBackingOffering(undefined), null);
  for (const campaignState of ["DRAFT", "ASSET_PENDING", "READY", "CLOSED"]) {
    assert.equal(state.readBackingOffering(record({ state: campaignState })), null, campaignState);
  }
  assert.equal(state.readBackingOffering(record({ definition: { ...record().definition, terms: { ...termsV1, reserveShareBps: "1000", issuerShareBps: "9000" } } })), null);
  assert.equal(state.readBackingOffering(record({ definition: { ...record().definition, terms: { ...termsV1, noteUnitPriceTinybars: "1.5" } } })), null);
});

test("bounds the picker by the terms and computes no amount for an invalid selection", async () => {
  const state = await loadState();
  const offering = state.readBackingOffering(record());

  assert.deepEqual(state.validateUnits(offering, "10"), { ok: true, units: 10n });
  assert.deepEqual(state.validateUnits(offering, "1000"), { ok: true, units: 1000n });
  for (const input of ["9", "1001", "0", "-5", "12.5", "1e2", "", " 10", "ten"]) {
    const result = state.validateUnits(offering, input);
    assert.equal(result.ok, false, input);
    assert.equal(result.message, "Choose a whole number of units between 10 and 1000.");
    assert.equal("units" in result, false, input);
  }

  const source = await readFile(fileURLToPath(stateUrl), "utf8");
  assert.doesNotMatch(source, /remain|raised|percent|funded|capacity|calculateAllocation|daysToMaturity/i);
});

test("computes the payable amount and the weibar transfer value in integer arithmetic only", async () => {
  const state = await loadState();
  const offering = state.readBackingOffering(record());

  assert.equal(state.paymentTinybars(offering, 25n), 2500000000n);
  assert.equal(state.weibarQuantity(2500000000n), "0x" + (2500000000n * 10n ** 10n).toString(16));
  assert.equal(state.weibarQuantity(1n), "0x2540be400");
  assert.equal(state.formatHbar(150000000000n), "1,500 HBAR");
  assert.equal(state.formatHbar(2500000000n), "25 HBAR");
  assert.equal(state.formatHbar(10000000n), "0.1 HBAR");
  assert.equal(state.formatShare(2000n), "20");

  const source = await readFile(fileURLToPath(stateUrl), "utf8");
  assert.doesNotMatch(source, /parseFloat|Number\(|Math\.|toFixed|\d+\.\d+/);
});

test("builds the HEDERA_FUNDING command over the canonical parameters preimage", async () => {
  const state = await loadState();
  const core = await import("@tool402/core");
  const { keccak256 } = await import("viem");
  const offering = state.readBackingOffering(record());

  const intent = state.createBackingIntent(offering, 25n, nowMilliseconds, fixedBytes(1));
  assert.equal(intent.type, "external.prepare");
  assert.equal(intent.units, 25n);
  assert.equal(intent.tinybars, 2500000000n);
  assert.equal(intent.weibarHex, state.weibarQuantity(2500000000n));
  assert.equal(intent.treasury, treasury);
  assert.match(intent.purchaseIntentId, /^[A-Za-z0-9_-]{21}[AQgw]$/);
  assert.match(intent.idempotencyKey, /^[A-Za-z0-9_-]{21}[AQgw]$/);
  assert.notEqual(intent.purchaseIntentId, intent.idempotencyKey);
  assert.equal(intent.issuedAt, "2026-09-10T18:00:00.000Z");
  assert.equal(intent.expiresAt, "2026-09-10T18:05:00.000Z");
  assert.equal(typeof intent.title, "string");
  assert.equal(typeof intent.description, "string");

  assert.deepEqual(Object.keys(intent.parameters).sort(), ["offeringPublicId", "purchaseIntentId", "tinybars", "units"]);
  assert.deepEqual(intent.parameters, {
    offeringPublicId: "riskscan_offering_demo",
    units: "25",
    tinybars: "2500000000",
    purchaseIntentId: intent.purchaseIntentId,
  });
  const preimageText = core.canonicalizeRequirements(intent.parameters);
  const expectedHash = keccak256(new TextEncoder().encode(preimageText)).slice(2);
  assert.match(expectedHash, /^[0-9a-f]{64}$/);

  const payload = JSON.parse(new TextDecoder().decode(intent.canonicalPayloadBytes));
  assert.deepEqual(payload, {
    operationKind: "HEDERA_FUNDING",
    subjectPublicId: "riskscan_revenue_note_demo",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: treasury,
    canonicalParametersHash: expectedHash,
    idempotencyKey: intent.idempotencyKey,
    expiresAt: "2026-09-10T18:05:00.000Z",
  });
  assert.equal(new TextDecoder().decode(intent.canonicalPayloadBytes), core.canonicalizeRequirements(core.parseExternalPreparePayload(payload)));
  assert.doesNotMatch(new TextDecoder().decode(intent.canonicalPayloadBytes), /purchaseIntentId/);
  assert.throws(() => state.createBackingIntent(offering, 5n, nowMilliseconds, fixedBytes(1)), RangeError);
});

test("refuses to fund without an explicit lowercase treasury address and never derives one", async () => {
  const state = await loadState();

  for (const address of [undefined, null, "", "0.0.7712400", "0x4B1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D", "4b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d", "0x4b1d"]) {
    assert.equal(state.readBackingOffering(record({ fundingTreasuryAddress: address })), null, String(address));
  }

  const source = await readFile(fileURLToPath(stateUrl), "utf8");
  assert.doesNotMatch(source, /toLowerCase|getAddress|checksum|0\.0\.|padStart|parseHederaAccountId|Long|shard|realm/);
});

test("orders the two confirmations and moves a returned hash only to payment_submitted", async () => {
  const state = await loadState();
  const offering = state.readBackingOffering(record());
  const intent = state.createBackingIntent(offering, 25n, nowMilliseconds, fixedBytes(2));
  const backer = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";

  assert.throws(() => state.transferRequest({ kind: "choosing" }, backer), TypeError);

  const prepared = state.viewAfterSignature({ phase: "complete", outcome: "ACCEPTED" }, intent);
  assert.equal(prepared.kind, "prepared");
  assert.equal(prepared.intent, intent);
  assert.deepEqual(state.transferRequest(prepared, backer), {
    method: "eth_sendTransaction",
    params: [{ from: backer, to: treasury, value: intent.weibarHex }],
  });

  const hash = `0x${"ab".repeat(32)}`;
  const submitted = state.viewAfterTransfer(prepared, { kind: "hash", hash });
  assert.deepEqual(submitted, { kind: "payment_submitted", intent, transactionHash: hash });
  assert.throws(() => state.viewAfterTransfer(prepared, { kind: "hash", hash: "0xABC" }), TypeError);
  assert.throws(() => state.viewAfterTransfer({ kind: "choosing" }, { kind: "hash", hash }), TypeError);
  assert.equal(state.viewAfterTransfer(prepared, { kind: "declined" }).kind, "prepared");

  for (const outcome of ["REJECTED", "CONFLICT", "UNSUPPORTED_TYPE", "not_configured", "REPLAYED"]) {
    const refused = state.viewAfterSignature({ phase: "failed", outcome }, intent);
    assert.equal(refused.kind, "refused", outcome);
    assert.equal(refused.outcome, outcome);
    assert.equal(typeof refused.message, "string");
  }
  assert.equal(state.viewAfterSignature({ phase: "rejected", outcome: null }, intent).kind, "choosing");
  assert.equal(state.viewAfterSignature({ phase: "failed", outcome: null }, intent).kind, "choosing");
  assert.equal(state.viewAfterSignature({ phase: "complete", outcome: null }, intent).kind, "payment_outcome_unknown");
  assert.throws(() => state.viewAfterSignature({ phase: "waiting", outcome: null }, intent), TypeError);
});

test("rechecks the accepted intent before the one explicit transfer", async () => {
  const state = await loadState();
  const offering = state.readBackingOffering(record());
  const intent = state.createBackingIntent(offering, 25n, nowMilliseconds, fixedBytes(4));

  assert.equal(state.isCurrentBackingIntent(offering, intent), true);
  assert.equal(state.isCurrentBackingIntent(offering, { ...intent, treasury: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }), false);
  assert.equal(state.isCurrentBackingIntent(offering, { ...intent, tinybars: intent.tinybars + 1n }), false);
  assert.equal(state.isCurrentBackingIntent(offering, { ...intent, weibarHex: "0x1" }), false);
});

test("retries nothing: an unknown wallet return, a transport failure, and an unexpected response reach the unknown kind", async () => {
  const state = await loadState();
  const offering = state.readBackingOffering(record());
  const intent = state.createBackingIntent(offering, 25n, nowMilliseconds, fixedBytes(3));
  const prepared = state.viewAfterSignature({ phase: "complete", outcome: "ACCEPTED" }, intent);

  assert.equal(state.viewAfterTransfer(prepared, { kind: "no_hash" }).kind, "payment_outcome_unknown");
  assert.equal(state.viewAfterSignature({ phase: "failed", outcome: "transport_failure" }, intent).kind, "payment_outcome_unknown");
  assert.equal(state.viewAfterSignature({ phase: "failed", outcome: "unexpected_response" }, intent).kind, "payment_outcome_unknown");
  assert.equal(state.viewAfterSignature({ phase: "unknown", outcome: null }, intent).kind, "payment_outcome_unknown");

  const source = await readFile(fileURLToPath(stateUrl), "utf8");
  assert.doesNotMatch(source, /retry|resend|setTimeout|setInterval|fetch\(|localStorage|sessionStorage|process\.env/i);
});
