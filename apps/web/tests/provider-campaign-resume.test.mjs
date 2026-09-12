import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/lib/provider-campaign-resume.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const implementedTest = existsSync(sourcePath) ? test : test.skip;

test("requires the declared M51 durable Provider resume helper before GREEN", () => {
  assert.equal(existsSync(sourcePath), true, `missing declared M51 source path: ${sourcePath}`);
});

implementedTest("accepts only one exact ASSET_PENDING RiskScan projection for the matching issuer", async () => {
  const { readProviderCampaignResume } = await import(sourceUrl.href);
  const record = {
    offeringPublicId: "riskscan_revenue_note_demo",
    version: 1,
    subjectPublicId: "riskscan_revenue_note_demo",
    state: "ASSET_PENDING",
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    atsAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
  };

  assert.deepEqual(readProviderCampaignResume(record, record.canonicalSignerAddress), {
    kind: "ASSET_PENDING",
    attemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
  });

  for (const candidate of [
    { ...record, state: "DRAFT" },
    { ...record, subjectPublicId: "foreign_subject" },
    { ...record, canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    { ...record, atsAttemptPublicId: "bad" },
    { ...record, atsAttemptPublicId: undefined },
  ]) {
    assert.equal(readProviderCampaignResume(candidate, record.canonicalSignerAddress), null);
  }
});

implementedTest("accepts only a durable READY projection with a canonical recorded asset", async () => {
  const { readProviderCampaignResume } = await import(sourceUrl.href);
  const record = {
    offeringPublicId: "riskscan_revenue_note_demo",
    subjectPublicId: "riskscan_revenue_note_demo",
    state: "READY",
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  };

  assert.deepEqual(readProviderCampaignResume(record, record.canonicalSignerAddress), { kind: "READY" });
  for (const candidate of [
    { ...record, atsAssetEvmAddress: undefined },
    { ...record, atsAssetEvmAddress: "not-an-address" },
    { ...record, state: "OPEN" },
  ]) {
    assert.equal(readProviderCampaignResume(candidate, record.canonicalSignerAddress), null);
  }
});

implementedTest("contains no storage, wallet/provider, Convex client, signature, relay, or transaction capability", async () => {
  const source = await (await import("node:fs/promises")).readFile(sourceUrl, "utf8");
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie|useQuery|useMutation|useAction|eth_|wallet_|sign|relay|transaction|convex)\b/iu);
});
