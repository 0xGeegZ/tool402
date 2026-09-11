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

  assert.match(page, /aria-label="Explore introduction"/);
  assert.match(page, /\bMarketplace\b/);
  assert.match(page, /\bTwo local tools with clear routes to inspect what each one covers\./);
  assert.match(page, /\bPageHeader\b/);

  assert.match(catalog, /\bCurrent catalogue\b/);
  assert.match(catalog, /\bStatic marketplace view\b/);
  assert.match(catalog, /\bCurrent routes, with no simulated availability or pricing\./);
  assert.match(catalog, /\bHedera testnet\b/);
  assert.match(catalog, /grid gap-5 md:grid-cols-2 xl:grid-cols-3/);
  assert.doesNotMatch(catalog, /\bFILTER_GROUPS\b/);
  assert.doesNotMatch(catalog, /\bcountsFor\b/);
  for (const [card, href] of [
    [riskScan, "/explore/riskscan"],
    [entityCheck, "/explore/entitycheck"],
  ]) {
    assert.match(card, /min-h-\[20rem\]/);
    assert.match(card, /\bshadow-none\b/);
    assert.match(card, /\bCurrent route\b/);
    assert.match(card, /\bView details\b/);
    assert.match(card, new RegExp('href="' + href + '"'));
    assert.doesNotMatch(card, /min-h-\[25rem\]/);
    assert.doesNotMatch(card, /\bshadow-lg\b/);
  }

  const presentationSources = [page, catalog, riskScan, entityCheck];
  const presentationSource = presentationSources.join("\n");

  for (const source of presentationSources) {
    assert.doesNotMatch(
      source,
      /^\s*["']use client["'];|\buse(?:State|Effect|Memo|Callback|Ref)\b|\bfetch\s*\(|\bon[A-Z][A-Za-z]*\s*=|<(?:button|input|select|textarea|form)\b|\brole=["']button["']|\baria-(?:pressed|expanded|checked)=/m,
    );
  }

  assert.doesNotMatch(
    presentationSource,
    /\b(?:payable|provider|wallet|payment|price|funding|revenue|transaction|deploy(?:ment)?|live availability)\b/i,
  );
  assert.doesNotMatch(presentationSource, /https?:\/\//i);
});
