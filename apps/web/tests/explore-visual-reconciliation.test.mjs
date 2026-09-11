import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("uses the compact Explore presentation without changing its static catalogue boundary", async () => {
  const [page, catalog, riskScan, entityCheck] = await Promise.all([
    readAppFile("src/app/explore/page.tsx"),
    readAppFile("src/components/discovery/explore-catalog.tsx"),
    readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
    readAppFile("src/components/discovery/entitycheck-discovery-card.tsx"),
  ]);

  assert.match(page, /aria-labelledby="explore-page-title"/);
  assert.match(page, /id="explore-page-title"/);
  assert.match(page, /\bMarketplace\b/);
  assert.match(page, /\bTools agents can inspect and pay for through current local journeys\./);
  assert.doesNotMatch(page, /\bPageHeader\b/);

  assert.match(catalog, /\bCurrent catalogue\b/);
  assert.match(catalog, /\bStatic marketplace view\b/);
  assert.match(catalog, /\bCurrent routes, with no simulated availability or pricing\./);
  assert.match(catalog, /grid gap-5 md:grid-cols-2 xl:grid-cols-3/);
  assert.doesNotMatch(catalog, /\bFILTER_GROUPS\b/);
  assert.doesNotMatch(catalog, /\bcountsFor\b/);
  assert.doesNotMatch(catalog, /\buseState\b|\bfetch\b|\binput\b|\bbutton\b/);

  for (const card of [riskScan, entityCheck]) {
    assert.match(card, /min-h-\[20rem\]/);
    assert.match(card, /\bshadow-none\b/);
    assert.match(card, /\bCurrent route\b/);
    assert.match(card, /\bOpen tool\b/);
    assert.doesNotMatch(card, /min-h-\[25rem\]/);
    assert.doesNotMatch(card, /\bshadow-lg\b/);
  }
});
