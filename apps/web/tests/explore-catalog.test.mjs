import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

const forbiddenCopy =
  /\b(?:price|wallet|payment|provider|account|metric|evidence|external|request|paid|mock|live availability|available now|sort|search|rating|review|network|balance)\b/i;

test("renders Explore as a static catalog around the accepted discovery card", async () => {
  const [page, workbench] = await Promise.all([
    readAppFile("src/app/explore/page.tsx"),
    readAppFile("src/components/workspace/guest-riskscan-workbench.tsx"),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<ExploreCatalog>\s*<RiskScanDiscoveryCard\s*\/>\s*<\/ExploreCatalog>/);
  assert.doesNotMatch(page, /RiskScanDirectoryDiscovery/);
  assert.match(workbench, /<RiskScanDirectoryDiscovery\s*\/>/);
  assert.match(page, />\s*Marketplace\s*</);
  assert.match(page, /<h1\b[^>]*>\s*Explore tools\s*<\/h1>/);
  assert.match(page, /Bounded, machine-payable tools with an inspectable journey\. Start with what each one covers\./);
});

test("keeps the catalog to one frozen local entry and a static rail", async () => {
  const catalog = await readAppFile("src/components/discovery/explore-catalog.tsx");

  assert.doesNotMatch(catalog, /["']use client["']/);
  assert.match(catalog, /Object\.freeze\(/);
  assert.equal((catalog.match(/\bid: "/g) ?? []).length, 1);
  assert.match(catalog, /id: "riskscan"/);
  assert.match(catalog, /name: "RiskScan"/);
  assert.match(catalog, /category: "Risk assessment"/);
  assert.match(catalog, /status: "In discovery"/);
  assert.match(catalog, /access: "Read-only preview"/);
  assert.match(catalog, /href: "\/explore\/riskscan"/);
  for (const group of ["Category", "Status", "Access", "All tools"]) {
    assert.match(catalog, new RegExp(`>\\s*${group}\\s*<`));
  }
  assert.match(catalog, /catalog\.length/);
  assert.doesNotMatch(catalog, />\s*\d+ tools?\s*</);
  assert.doesNotMatch(catalog, /\b0\b/);
  assert.doesNotMatch(catalog, /<(?:a|Link|button|form|input|select|textarea)\b/);
  assert.doesNotMatch(catalog, /href=/);
  assert.match(catalog, />\s*More tools to come\s*</);
  assert.match(catalog, /New tools appear here once their journey is accepted\./);
  assert.match(catalog, /border-dashed/);
  assert.doesNotMatch(catalog, forbiddenCopy);
});

test("gives the discovery card the tool card anatomy with one link", async () => {
  const card = await readAppFile("src/components/discovery/riskscan-discovery-card.tsx");

  assert.match(card, /<svg\b[^>]*aria-hidden/);
  assert.match(card, />\s*In discovery\s*</);
  assert.match(card, />\s*Risk assessment\s*</);
  assert.match(card, />\s*View details\s*</);
  assert.match(card, /This surface is descriptive only\./);
  const hrefs = [...card.matchAll(/href=["']([^"']+)["']/g)].map(([, href]) => href);
  assert.deepEqual(hrefs, ["/explore/riskscan"]);
  assert.doesNotMatch(card, /<(?:a|button|form|input|select|textarea)\b/i);
  assert.doesNotMatch(card, forbiddenCopy);
});
