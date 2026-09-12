import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/lib/dashboard-campaign.ts", import.meta.url);
const componentUrl = new URL("../src/components/dashboard/dashboard-campaign.tsx", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const dashboardPageUrl = new URL("../src/app/dashboard/page.tsx", import.meta.url);
const implementedTest = existsSync(sourcePath) ? test : test.skip;

// This fails if the dashboard loses the ownership adapter that keeps another
// wallet's durable campaign out of a valid signed session.
test("requires the declared S42 dashboard campaign ownership adapter before GREEN", () => {
  assert.equal(existsSync(sourcePath), true, `missing declared S42 source path: ${sourcePath}`);
});

test("renders the signed campaign surface instead of the historical guest workspace", async () => {
  const page = await readFile(dashboardPageUrl, "utf8");

  assert.doesNotMatch(page, /WorkspaceShell/u);
  assert.match(page, /title="Your campaign"/u);
  assert.match(page, /associated with your signed dashboard session/u);
  assert.match(page, /<DashboardCampaign\s*\/>/u);
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

  assert.deepEqual(readDashboardCampaign({ ...record, state: "OPEN" }, signer), {
    title: "RiskScan",
    state: "OPEN",
    href: "/provider",
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

implementedTest("uses the campaign ownership allowlist as the dashboard projection key", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /import\s*\{\s*readDashboardCampaign\s*,\s*riskScanOfferingPublicId\s*\}/u);
  assert.doesNotMatch(source, /const\s+riskScanOfferingPublicId\s*=/u);
});

implementedTest("renders one local empty card when the signed session has no campaign", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /if\s*\(campaign\s*===\s*null\)\s*\{\s*return\s*\(\s*<section[^>]*aria-label="No campaign yet"/su);
  assert.match(source, />No campaign yet</u);
  assert.match(source, /There is no RiskScan campaign associated with this signed dashboard session\./u);
  assert.match(source, /href="\/provider\/deploy"[^>]*>Prepare a tool</u);
  assert.match(source, /href="\/explore\/riskscan"[^>]*>Explore RiskScan</u);
});

implementedTest("uses the configured session cookie name when it reads the dashboard campaign", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /\breadDashboardSessionCookieName\b/u);
  assert.doesNotMatch(source, /const\s+sessionCookieName\s*=\s*["']__Host-tool402-dashboard-session/u);
});

implementedTest("labels deployed campaigns as a view instead of a resume action", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /campaign\.state\s*===\s*["']OPEN["']\s*\|\|\s*campaign\.state\s*===\s*["']CLOSED["']/u);
  assert.match(source, /View deployment/u);
  assert.match(source, /Resume deployment/u);
  assert.doesNotMatch(source, /Resume campaign/u);
});

implementedTest("sends deployed campaigns to the Provider status page", async () => {
  const source = await readFile(sourceUrl, "utf8");
  assert.match(source, /href:\s*["']\/provider["']/u);
});
