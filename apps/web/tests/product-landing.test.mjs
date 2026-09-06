import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

async function readLandingSources() {
  return Promise.all([
    readAppFile("src/app/page.tsx"),
    readAppFile("src/components/landing/landing-hero.tsx"),
    readAppFile("src/components/landing/landing-sections.tsx"),
    readAppFile("src/components/landing/landing-footer.tsx"),
  ]);
}

test("composes one static product landing with one main landmark and heading", async () => {
  const [page, hero, sections, footer] = await readLandingSources();
  const landing = [page, hero, sections, footer].join("\n");

  assert.equal((landing.match(/<main\b/g) ?? []).length, 1);
  assert.equal((landing.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<LandingHero\s*\/>/);
  assert.match(page, /<LandingSections\s*\/>/);
  assert.match(page, /<LandingFooter\s*\/>/);
  assert.doesNotMatch(landing, /["']use client["']/);
});

test("explains Tool402 and the three-stage bounded RiskScan journey", async () => {
  const sources = await readLandingSources();
  const landing = sources.join("\n");

  assert.match(landing, /Tool402/);
  assert.match(landing, /RiskScan/);
  assert.match(landing, /id=["']how-it-works["']/);
  assert.match(landing, /Explore a bounded tool/i);
  assert.match(landing, /Understand the request boundary/i);
  assert.match(landing, /Follow the local RiskScan journey/i);
});

test("offers exactly the three specified local CTA destinations", async () => {
  const sources = await readLandingSources();
  const landing = sources.join("\n");
  const ctas = [...landing.matchAll(/<Link\b[^>]*href=["']([^"']+)["'][^>]*>\s*([^<]+?)\s*<\/Link>/g)].map(
    ([, href, label]) => [href, label.trim()],
  );

  assert.deepEqual(ctas, [
    ["/explore", "Explore tools"],
    ["/explore/riskscan", "See RiskScan"],
    ["/explore/riskscan/try", "Try local flow"],
  ]);
  assert.doesNotMatch(landing, /<Link\b[^>]*>\s*<Button\b/);
});

test("keeps each repeated step heading subordinate to the how-it-works heading", async () => {
  const sections = await readAppFile("src/components/landing/landing-sections.tsx");

  assert.match(sections, /<h3\b[^>]*>\s*\{step\.title\}\s*<\/h3>/);
  assert.doesNotMatch(sections, /<CardTitle>\{step\.title\}<\/CardTitle>/);
});

test("keeps RiskScan copy readable on its section background", async () => {
  const sections = await readAppFile("src/components/landing/landing-sections.tsx");

  assert.match(
    sections,
    /<p className=["'][^"']*\btext-secondary-foreground\b[^"']*["']>\s*Read what RiskScan considers/,
  );
});

test("keeps the landing local, decorative, and free of unsupported claims", async () => {
  const [page, hero, sections, footer] = await readLandingSources();
  const sources = [page, hero, sections, footer];
  const landing = sources.join("\n");
  const mascot = hero.match(/<Image\b[^>]*src=["']\/brand\/mascot-wave\.png["'][^>]*\/>/);

  assert.ok(mascot);
  assert.match(mascot[0], /\balt=["']["']/);
  assert.doesNotMatch(landing, /\bfetch\s*\(/);
  assert.doesNotMatch(landing, /(?:https?:\/\/|\/api\/)/i);
  assert.doesNotMatch(
    landing,
    /\b(?:wallet|account|provider|price|payment|settlement|result|metric|testimonial|partner|balance|evidence|deployed|guaranteed)\b|\b(?:live service|live availability|available now|user session)\b/i,
  );
});
