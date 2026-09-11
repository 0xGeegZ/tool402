import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("defines the distilled Provider overview: one status block, one primary action, data regions only when loaded", async () => {
  const [page, status] = await Promise.all([
    readAppFile("src/app/provider/page.tsx"),
    readAppFile("src/components/provider/status/provider-status.tsx"),
  ]);
  const presentation = `${page}\n${status}`;

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.match(page, /<LandingFooter\s*\/>/);
  assert.match(page, /title="Provider status"/);
  assert.match(page, /eyebrow="Tool operator"/);
  assert.doesNotMatch(page, /actions=/);
  assert.doesNotMatch(page, /Prepare an offering/);

  assert.match(status, /data-ui=["']provider-status-block["']/);
  assert.match(status, /aria-labelledby=["']provider-next-action["']/);
  assert.equal((status.match(/Prepare an offering/g) ?? []).length, 1);
  assert.equal((status.match(/href=["']\/provider\/deploy["']/g) ?? []).length, 1);
  assert.match(status, /href=["']\/explore\/riskscan["']/);
  assert.match(status, /href=["']\/docs\/providers["']/);
  assert.match(status, /Offering record/);
  assert.match(status, /Directory record/);
  assert.doesNotMatch(status, /data-ui=["']provider-overview-state-grid["']/);
  assert.doesNotMatch(status, /data-ui=["']provider-riskscan-offering-card["']/);
  assert.doesNotMatch(status, /Local RiskScan offering path|Current scope|State ribbon/);
  assert.doesNotMatch(status, /<Card\b/);
  assert.match(status, /id=["']provider-evidence["']/);
  assert.match(status, /<caption\b/);
  for (const heading of ["Deployment evidence", "Active terms", "Active directory", "Signer"]) {
    assert.match(status, new RegExp(`>\\s*${heading}\\s*<`));
  }
  assert.match(status, /offering === undefined \? null : <LoadedRegions\b/);
  assert.match(status, /from ["']\.\.\/\.\.\/\.\.\/lib\/hbar-format["']/);
  assert.match(status, /formatHbar\(BigInt\(/);
  assert.match(status, /formatShare\(BigInt\(/);
  assert.match(status, /<Status tone="warning">/);
  assert.match(status, /focus-visible:outline/);

  assert.doesNotMatch(presentation, /\bshadow-(?:sm|md|lg|xl)\b/);
  assert.doesNotMatch(presentation, /funding (?:modeled|raised)|position parts|paid tasks|usage revenue|account balance|portfolio|notifications|activity/i);
  assert.doesNotMatch(presentation, /\b(?:live|published|active) offering\b/i);
});
