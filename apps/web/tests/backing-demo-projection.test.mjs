import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectionUrl = new URL("../src/lib/backing-demo-projection.ts", import.meta.url);
const projectionPath = fileURLToPath(projectionUrl);
const projectionExists = existsSync(projectionPath);
const implementedTest = projectionExists ? test : test.skip;
const offeringPublicId = "riskscan_offering_demo";
const subjectPublicId = "riskscan_revenue_note_demo";
const treasury = "0x4b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d";

function record(overrides = {}) {
  return {
    offeringPublicId,
    version: 1,
    subjectPublicId,
    state: "OPEN",
    definition: {
      terms: {
        version: "v1",
        fundingTargetTinybars: "100000000000",
        noteUnitPriceTinybars: "100000000",
        maximumNoteUnits: "1000",
        minimumPurchaseUnits: "10",
        reserveShareBps: "2000",
        issuerShareBps: "8000",
        platformFeeBps: "0",
        payoutCapTinybars: "150000000000",
      },
      maturityAt: "2026-12-31T00:00:00.000Z",
      qualifyingResource: "/api/services/riskscan/standard",
    },
    narrative: { title: "RiskScan", customerProblem: "x", customerUseCases: [], useOfFunds: [], risks: [] },
    advertisedQuickPriceTinybars: "10000000",
    advertisedStandardPriceTinybars: "50000000",
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    acceptedAt: "1",
    updatedAt: "1",
    ...overrides,
  };
}

function environment(fundingTreasuryAddress = treasury) {
  return {
    TOOL402_CONVEX_SITE_URL: "https://convex.example/",
    TOOL402_FUNDING_TREASURY_EVM_ADDRESS: fundingTreasuryAddress,
  };
}

function fetchProjection(offering) {
  return async (input) => {
    const url = input instanceof URL ? input : new URL(input);
    if (url.pathname === `/public/offerings/${offeringPublicId}`) {
      return Response.json({ outcome: "FOUND", record: offering });
    }
    if (url.pathname === "/public/directory/riskscan/active") return new Response(null, { status: 404 });
    throw new Error(`unexpected public projection path: ${url.pathname}`);
  };
}

test("requires the declared server-owned backing demo projection before GREEN", () => {
  assert.equal(projectionExists, true, `missing declared M56 backing projection module: ${projectionPath}`);
});

let api;

test.before(async () => {
  if (projectionExists) api = await import(projectionUrl.href);
});

implementedTest("loads only the named OPEN RiskScan offering and the independently configured canonical treasury", async () => {
  assert.deepEqual(Object.keys(api).sort(), ["readBackingDemoProjection"]);

  const loaded = await api.readBackingDemoProjection(environment(), fetchProjection(record()));
  assert.deepEqual(loaded, { ...record(), fundingTreasuryAddress: treasury });
});

implementedTest("fails closed for any unavailable projection, wrong campaign, non-OPEN state, or invalid treasury without deriving a target", async () => {
  const invalidTreasuries = [undefined, "", "0x4B1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D", "0.0.7712400", "0x4b1d"];
  for (const fundingTreasuryAddress of invalidTreasuries) {
    assert.equal(
      await api.readBackingDemoProjection(environment(fundingTreasuryAddress), fetchProjection(record())),
      null,
      `treasury ${String(fundingTreasuryAddress)}`,
    );
  }

  for (const offering of [
    record({ offeringPublicId: "another_offering" }),
    record({ subjectPublicId: "another_subject" }),
    record({ state: "READY" }),
  ]) {
    assert.equal(await api.readBackingDemoProjection(environment(), fetchProjection(offering)), null);
  }

  assert.equal(
    await api.readBackingDemoProjection(environment(), async () => new Response(null, { status: 503 })),
    null,
  );
});
