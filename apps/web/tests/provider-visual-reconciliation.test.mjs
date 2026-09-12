import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("defines the Provider command center: one dynamic hero, scannable data regions, and a technical disclosure", async () => {
  const [page, status] = await Promise.all([
    readAppFile("src/app/provider/page.tsx"),
    readAppFile("src/components/provider/status/provider-status.tsx"),
  ]);
  const presentation = `${page}\n${status}`;

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<PageHeader\b/g) ?? []).length, 0);
  assert.match(page, /<LandingFooter\s*\/>/);
  assert.match(page, /aria-label="Tool operator Campaign status"/);
  assert.doesNotMatch(page, /actions=/);

  for (const region of [
    "provider-command-center",
    "provider-campaign-hero",
    "provider-campaign-progress",
    "provider-activity-timeline",
    "provider-campaign-snapshot",
    "provider-supporting-cards",
    "provider-technical-record",
  ]) assert.match(status, new RegExp(`data-ui=["']${region}["']`));
  assert.match(status, /presentation\.heroTitle/);
  assert.match(status, /presentation\.offeringTitle/);
  assert.match(status, /presentation\.directoryTitle/);
  assert.match(status, /nextAction = nextProviderAction\(offering\.state\)/);
  assert.match(status, /nextAction\.href === null \? null : <Link/);
  assert.match(status, /offering\.state === "OPEN" && directory !== undefined/);
  assert.match(status, /formatHbar\(BigInt\(/);
  assert.match(status, /formatShare\(BigInt\(/);
  assert.match(status, /formatMaturity\(offering\.definition\.maturityAt\)/);
  assert.match(status, /campaignName = offering\.narrative\.title/);
  assert.match(status, /rows\.map\(/);
  assert.equal((status.match(/href=["']\/provider\/deploy["']/g) ?? []).length, 1);
  assert.match(status, /href=\{nextAction\.href\}/);
  assert.match(status, /href=["']\/explore\/riskscan["']/);
  assert.match(status, /src=["']\/brand\/provider-campaign-duo\.png["']/);
  assert.match(status, /id=["']provider-evidence["']/);
  assert.doesNotMatch(status, /<table\b|min-w-\[/);
  for (const heading of ["Activity &amp; proof", "Campaign snapshot", "Economics", "Capacity", "Governance", "Trust details", "Technical record", "Active terms", "Active directory"]) {
    assert.match(status, new RegExp(`>\\s*${heading}\\s*<`));
  }
  assert.match(status, /if \(offering !== undefined\) return <LoadedRegions\b/);
  assert.match(status, /from ["']\.\.\/\.\.\/\.\.\/lib\/hbar-format["']/);
  assert.match(status, /<Status tone="warning">/);
  assert.match(status, /focus-visible:outline/);

  assert.doesNotMatch(presentation, /funding (?:modeled|raised)|position parts|paid tasks|usage revenue|account balance|portfolio|notifications/i);
  assert.doesNotMatch(presentation, /\b(?:live|published|active) offering\b/i);
});
