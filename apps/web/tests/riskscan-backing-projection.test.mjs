import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/lib/riskscan-backing-projection.ts", import.meta.url);
const treasury = "0x4b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d";
const environment = Object.freeze({ TOOL402_FUNDING_EVM_ADDRESS: treasury });

function record(overrides = {}) {
  return Object.freeze({
    offeringPublicId: "riskscan_revenue_note_demo",
    version: 1,
    subjectPublicId: "riskscan_revenue_note_demo",
    state: "OPEN",
    definition: {
      terms: {
        version: "v1", fundingTargetTinybars: "100000000000", noteUnitPriceTinybars: "100000000",
        maximumNoteUnits: "1000", minimumPurchaseUnits: "10", reserveShareBps: "2000",
        issuerShareBps: "8000", platformFeeBps: "0", payoutCapTinybars: "150000000000",
      },
      maturityAt: "2026-12-31T00:00:00.000Z", qualifyingResource: "/api/services/riskscan/standard",
    },
    narrative: { title: "RiskScan", customerProblem: "x", customerUseCases: [], useOfFunds: [], risks: [] },
    advertisedQuickPriceTinybars: "10000000", advertisedStandardPriceTinybars: "50000000",
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    acceptedAt: "1", updatedAt: "1", ...overrides,
  });
}

function projections(offering = record()) {
  return Object.freeze({
    offering: Object.freeze({ outcome: "loaded", record: offering }),
    directory: Object.freeze({ outcome: "absent" }),
  });
}

async function load() {
  assert.equal(existsSync(fileURLToPath(sourceUrl)), true, "M56 backing projection adapter must exist");
  return import(sourceUrl.href);
}

test("selects only the canonical OPEN RiskScan offering with a server-owned treasury", async () => {
  const { selectRiskScanBackingProjection } = await load();
  const selected = selectRiskScanBackingProjection(projections(), environment);

  assert.equal(selected?.offeringPublicId, "riskscan_revenue_note_demo");
  assert.equal(selected?.state, "OPEN");
  assert.equal(selected?.fundingTreasuryAddress, treasury);
  assert.notEqual(selected, projections().offering.record);
});

test("fails closed for unavailable, non-OPEN, mismatched, or malformed campaign projections", async () => {
  const { selectRiskScanBackingProjection } = await load();
  const unavailable = Object.freeze({ offering: Object.freeze({ outcome: "absent" }), directory: Object.freeze({ outcome: "absent" }) });

  assert.equal(selectRiskScanBackingProjection(unavailable, environment), null);
  assert.equal(selectRiskScanBackingProjection({ offering: null }, environment), null);
  assert.equal(selectRiskScanBackingProjection({ offering: { outcome: "loaded", record: null } }, environment), null);
  for (const candidate of [
    record({ state: "DRAFT" }), record({ state: "ASSET_PENDING" }), record({ state: "READY" }), record({ state: "CLOSED" }),
    record({ offeringPublicId: "other_offering" }), record({ subjectPublicId: "other_subject" }),
    record({ canonicalSignerAddress: "0xABC" }), record({ definition: { ...record().definition, terms: { ...record().definition.terms, noteUnitPriceTinybars: "1.5" } } }),
  ]) {
    assert.equal(selectRiskScanBackingProjection(projections(candidate), environment), null);
  }
});

test("never derives or defaults the treasury from the offering or browser", async () => {
  const { selectRiskScanBackingProjection } = await load();
  for (const value of [undefined, "", "0.0.123", "0x4B1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D", "0x123"]) {
    assert.equal(selectRiskScanBackingProjection(projections(), Object.freeze({ TOOL402_FUNDING_EVM_ADDRESS: value })), null, String(value));
  }
  assert.equal(selectRiskScanBackingProjection(projections(record({ fundingTreasuryAddress: treasury })), Object.freeze({})), null);
});
