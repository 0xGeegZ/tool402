import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("defines the prepared Provider overview hierarchy without prototype metrics", async () => {
  const [page, status] = await Promise.all([
    readAppFile("src/app/provider/page.tsx"),
    readAppFile("src/components/provider/status/provider-status.tsx"),
  ]);
  const presentation = `${page}\n${status}`;

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<LandingFooter\s*\/>/);
  assert.match(page, /Prepare a tool offering/);
  assert.match(page, /href=["']\/provider\/deploy["']/);
  assert.match(page, /href=["']\/explore\/riskscan["']/);

  assert.match(status, /aria-labelledby=["']provider-next-action["']/);
  assert.match(status, /data-ui=["']provider-overview-state-grid["']/);
  assert.match(status, /\bmd:grid-cols-3\b/);
  assert.match(status, /data-ui=["']provider-riskscan-offering-card["']/);
  assert.match(status, /Local RiskScan offering path/);
  assert.match(status, /data-ui=["']provider-riskscan-offering-card["'][\s\S]*?href=["']\/provider\/deploy["']/);
  assert.match(status, /id=["']provider-evidence["']/);
  for (const heading of ["Deployment evidence", "Active terms", "Active directory", "Signer"]) {
    assert.match(status, new RegExp(`>\\s*${heading}\\s*<`));
  }
  assert.match(status, /focus-visible:outline/);

  const cards = status.match(/<Card\b[^>]*>/g) ?? [];
  assert.equal(cards.length, 3);
  for (const card of cards) assert.match(card, /\bshadow-none\b/);
  assert.doesNotMatch(presentation, /\bshadow-(?:sm|md|lg|xl)\b/);
  assert.doesNotMatch(presentation, /funding (?:modeled|raised)|position parts|paid tasks|usage revenue|account balance|portfolio|notifications|activity/i);
  assert.doesNotMatch(presentation, /\b(?:live|published|active) offering\b/i);
});
