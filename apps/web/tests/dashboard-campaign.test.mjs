import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/lib/dashboard-campaign.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const implementedTest = existsSync(sourcePath) ? test : test.skip;

// This fails if the dashboard loses the ownership adapter that keeps another
// wallet's durable campaign out of a valid signed session.
test("requires the declared S42 dashboard campaign ownership adapter before GREEN", () => {
  assert.equal(existsSync(sourcePath), true, `missing declared S42 source path: ${sourcePath}`);
});

implementedTest("returns the current RiskScan campaign only for its exact canonical session signer", async () => {
  const { readDashboardCampaign } = await import(sourceUrl.href);
  const signer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const record = {
    offeringPublicId: "riskscan_revenue_note_demo",
    canonicalSignerAddress: signer,
    state: "ASSET_PENDING",
    narrative: { title: "RiskScan" },
  };

  assert.deepEqual(readDashboardCampaign(record, signer), {
    title: "RiskScan",
    state: "ASSET_PENDING",
    href: "/provider/deploy",
  });

  for (const candidate of [
    { ...record, canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    { ...record, offeringPublicId: "another_campaign" },
    { ...record, canonicalSignerAddress: "0xC89f87052c3e080b4a9b021d4930055031ef378e" },
    { ...record, state: "UNKNOWN" },
    { ...record, narrative: { title: "" } },
  ]) {
    assert.equal(readDashboardCampaign(candidate, signer), null);
  }
});

implementedTest("fails closed when the session signer is malformed or the projection is unavailable", async () => {
  const { readDashboardCampaign } = await import(sourceUrl.href);
  const record = {
    offeringPublicId: "riskscan_revenue_note_demo",
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    state: "DRAFT",
    narrative: { title: "RiskScan" },
  };

  assert.equal(readDashboardCampaign(record, "0xC89f87052c3e080b4a9b021d4930055031ef378e"), null);
  assert.equal(readDashboardCampaign(null, record.canonicalSignerAddress), null);
  assert.equal(readDashboardCampaign({ outcome: "unavailable" }, record.canonicalSignerAddress), null);
});
