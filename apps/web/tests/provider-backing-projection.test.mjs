import assert from "node:assert/strict";
import test from "node:test";

const moduleUrl = new URL("../src/lib/provider-backing-projection.ts", import.meta.url);
const offeringPublicId = `offering_${"ab".repeat(16)}`;
const owner = "0x1111111111111111111111111111111111111111";

function record(overrides = {}) {
  return {
    offeringPublicId, version: 1, subjectPublicId: `tool_${"ab".repeat(16)}`, state: "OPEN",
    definition: { schemaVersion: 1, terms: {
      version: "v1", fundingTargetTinybars: "100000000000", noteUnitPriceTinybars: "100000000",
      maximumNoteUnits: "1000", minimumPurchaseUnits: "10", reserveShareBps: "2000",
      issuerShareBps: "8000", platformFeeBps: "0", payoutCapTinybars: "150000000000",
    }, maturityAt: "2026-12-31T00:00:00.000Z", qualifyingResource: "riskscan.quick" },
    narrative: { title: "Provider tool", customerProblem: "x", customerUseCases: [], useOfFunds: [], risks: [] },
    advertisedQuickPriceTinybars: "10000000", advertisedStandardPriceTinybars: "5000000",
    canonicalSignerAddress: owner, fundingRecipient: owner, acceptedAt: "1", updatedAt: "1", ...overrides,
  };
}

test("projects OPEN funding and CLOSED recovery evidence with its persisted owner-recipient policy", async () => {
  const { loadProviderBackingProjection } = await import(moduleUrl.href);
  const projection = await loadProviderBackingProjection(
    { TOOL402_CONVEX_SITE_URL: "https://convex.test/" },
    async (url) => url.pathname === `/public/offerings/${offeringPublicId}`
      ? new Response(JSON.stringify({ outcome: "FOUND", record: record() }), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(null, { status: 404 }),
    offeringPublicId,
  );
  assert.equal(projection?.fundingTreasuryAddress, owner);
  assert.equal(projection?.state, "OPEN");
  const closed = await loadProviderBackingProjection(
    { TOOL402_CONVEX_SITE_URL: "https://convex.test/" },
    async (url) => url.pathname === `/public/offerings/${offeringPublicId}`
      ? new Response(JSON.stringify({ outcome: "FOUND", record: record({ state: "CLOSED" }) }), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(null, { status: 404 }),
    offeringPublicId,
  );
  assert.equal(closed?.state, "CLOSED");
  const rejected = await loadProviderBackingProjection(
    { TOOL402_CONVEX_SITE_URL: "https://convex.test/" },
    async (url) => url.pathname === `/public/offerings/${offeringPublicId}`
      ? new Response(JSON.stringify({ outcome: "FOUND", record: record({ fundingRecipient: "0x2222222222222222222222222222222222222222" }) }), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(null, { status: 404 }),
    offeringPublicId,
  );
  assert.equal(rejected, null);
});
