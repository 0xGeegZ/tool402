import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("uses the compact Explore presentation with one bounded provider CTA", async () => {
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
  assert.match(catalog, /data-ui="explore-provider-cta"/);
  assert.match(catalog, /href="\/provider\/deploy"/);
  assert.doesNotMatch(catalog, /^\s*["']use client["']/m);
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

  const catalogBeforeProviderCta = catalog.slice(0, catalog.indexOf('data-ui="explore-provider-cta"'));
  const presentationSources = [page, catalogBeforeProviderCta, riskScan, entityCheck];
  const presentationSource = presentationSources.join("\n");

  for (const source of presentationSources) {
    assert.doesNotMatch(
      source,
      /^\s*["']use client["']|\buse(?:[A-Z][A-Za-z0-9_]*|\s*)\(|\b(?:axios|fetch(?:er)?|got|ky|request|XMLHttpRequest)\b|\baddEventListener\s*\(|\bon[A-Z][A-Za-z]*\s*[:=]|\{\s*\.\.\.|<(?:button|input|select|textarea|form|[A-Za-z0-9]*(?:Button|Checkbox|Combobox|Dialog|Dropdown|Input|Menu|Popover|Radio|Select|Slider|Switch|Text(?:area|Field)))\b|\brole\s*=|\baria-(?:activedescendant|checked|controls|expanded|haspopup|multiselectable|pressed|selected|valuemax|valuemin|valuenow|valuetext)\s*=/m,
    );
  }

  assert.doesNotMatch(
    presentationSource,
    /\b(?:account|activity|payable|provider|wallet|payment|price|funding|revenue|testimonial|transaction|deploy(?:ment)?|live availability)\b/i,
  );
  assert.doesNotMatch(presentationSource, /["'`](?:[a-z][a-z\d+.-]*:|\/\/)/i);
});
