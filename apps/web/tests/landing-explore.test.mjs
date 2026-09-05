import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("renders labeled navigation between the committed local routes", async () => {
  const navigation = await readAppFile("src/components/discovery/local-navigation.tsx");

  assert.match(navigation, /<nav\b[^>]*aria-label=["']Main navigation["']/);
  assert.match(navigation, /\{ href: "\/", label: "Home" \}/);
  assert.match(navigation, /\{ href: "\/explore", label: "Explore" \}/);
  assert.match(navigation, /<Link href=\{link\.href\}/);
  assert.doesNotMatch(navigation, /\{ href: "(?!\/"|\/explore")[^"]+/);
});

test("renders a single landing main landmark and page heading", async () => {
  const [page, hero] = await Promise.all([
    readAppFile("src/app/page.tsx"),
    readAppFile("src/components/landing/landing-hero.tsx"),
  ]);

  assert.match(page, /<main\b/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<LandingHero\s*\/>/);
});

test("gives the decorative landing artwork an explicit responsive width", async () => {
  const hero = await readAppFile("src/components/landing/landing-hero.tsx");

  assert.match(hero, /\bw-58\b/);
  assert.match(hero, /\bsm:w-72\b/);
  assert.doesNotMatch(hero, /\bw-full\s+max-w-58\b/);
});

test("renders a single read-only Explore discovery surface", async () => {
  const [page, card] = await Promise.all([
    readAppFile("src/app/explore/page.tsx"),
    readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
  ]);

  assert.match(page, /<main\b/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<RiskScanDiscoveryCard\s*\/>/);
  assert.match(card, /RiskScan/);
  assert.match(card, /read-only/i);
  assert.match(card, /<Link\b[^>]*href=["']\/explore\/riskscan["']/);
  const hrefs = [...card.matchAll(/href=["']([^"']+)["']/g)].map(([, href]) => href);
  assert.deepEqual(hrefs, ["/explore/riskscan"]);
  assert.doesNotMatch(card, /<(?:a|button|form|input|select|textarea)\b/i);
});

test("keeps the Explore eyebrow readable against the local background", async () => {
  const page = await readAppFile("src/app/explore/page.tsx");

  assert.doesNotMatch(page, /\btext-brand-purple\b/);
});

test("keeps landing and discovery copy within the UI-S01 truthfulness boundary", async () => {
  const sources = await Promise.all([
    readAppFile("src/app/page.tsx"),
    readAppFile("src/app/explore/page.tsx"),
    readAppFile("src/components/landing/landing-hero.tsx"),
    readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
  ]);

  assert.doesNotMatch(
    sources.join("\n"),
    /\b(?:price|wallet|payment|provider|account|metric|evidence|external|request|paid|mock|live availability|available now)\b/i,
  );
});
