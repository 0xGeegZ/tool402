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

test("translates the selected marketplace composition through current local orientation steps", async () => {
  const [page, hero, sections, footer] = await readLandingSources();
  const landing = [page, hero, sections, footer].join("\n");

  assert.match(landing, /Tool402/);
  assert.match(landing, /RiskScan/);
  assert.match(hero, /<section\b[^>]*className=["'][^"']*radial-gradient[^"']*["']/);
  assert.match(hero, /<section\b[^>]*className=["'][^"']*\bborder-b\b[^"']*\bbg-card\/30\b[^"']*["']/);
  assert.match(hero, /<h1\b[^>]*>\s*Back the tools\s*<span className=["'][^"']*\btext-brand-purple\b[^"']*["']>agents pay<\/span>\s*to use\./);
  assert.match(hero, /<h1\b[^>]*className=["'][^"']*\bfont-extrabold\b[^"']*\bleading-\[1\.04\][^"']*["']/);
  assert.match(hero, /hero-trio\.png/);
  assert.match(landing, /id=["']how-it-works["']/);
  assert.match(landing, /Explore a current tool/i);
  assert.match(landing, /Inspect its boundary/i);
  assert.match(landing, /Choose a local next step/i);
  assert.match(sections, /id=["']how-it-works["'][^>]*className=["'][^"']*\bbg-muted\/40\b[^"']*/);
  assert.match(sections, /<ol\b[^>]*className=["'][^"']*\bgrid\b[^"']*\blg:grid-cols-3\b[^"']*["']/);
  assert.match(sections, /border-t border-dashed border-border/);
  assert.match(sections, /<Card className=["'][^"']*rounded-\[calc\(var\(--radius\)\*2\)\][^"']*\bbg-card\b[^"']*["']/);
  assert.match(landing, /Prepare a tool offering/i);
});

test("offers only the specified current local CTA destinations", async () => {
  const sources = await readLandingSources();
  const landing = sources.join("\n");
  const ctas = [...landing.matchAll(/<Link\b[^>]*href=["']([^"']+)["'][^>]*>\s*([^<]+?)\s*<\/Link>/g)].map(
    ([, href, label]) => [href, label.trim()],
  );

  assert.deepEqual(ctas, [
    ["/explore", "Explore tools"],
    ["/demo", "Open guided demo"],
    ["/explore/riskscan", "View RiskScan"],
    ["/explore/riskscan/try", "Try RiskScan"],
    ["/provider/deploy", "Prepare a tool offering"],
    ["/explore", "Explore tools"],
    ["/explore/riskscan", "RiskScan"],
    ["/demo", "Guided demo"],
    ["/provider", "Provider overview"],
    ["/provider/deploy", "Prepare a tool offering"],
  ]);
  assert.doesNotMatch(landing, /<Link\b[^>]*>\s*<Button\b/);
});

test("keeps the fuller footer limited to existing local routes", async () => {
  const footer = await readAppFile("src/components/landing/landing-footer.tsx");
  const links = [...footer.matchAll(/<Link\b[^>]*href=["']([^"']+)["'][^>]*>\s*([^<]+?)\s*<\/Link>/g)].map(
    ([, href, label]) => [href, label.trim()],
  );

  assert.deepEqual(links, [
    ["/explore", "Explore tools"],
    ["/explore/riskscan", "RiskScan"],
    ["/demo", "Guided demo"],
    ["/provider", "Provider overview"],
    ["/provider/deploy", "Prepare a tool offering"],
  ]);
  assert.doesNotMatch(footer, /(?:https?:\/\/|\/api\/)/i);
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
    /<p className=["'][^"']*\btext-muted-foreground\b[^"']*["']>\s*A bounded assessment route/,
  );
});

test("keeps the selected visual asset decorative, local, and free of unsupported claims", async () => {
  const [page, hero, sections, footer] = await readLandingSources();
  const sources = [page, hero, sections, footer];
  const landing = sources.join("\n");
  const heroTrio = hero.match(/<Image\b[^>]*src=["']\/brand\/hero-trio\.png["'][^>]*\/>/);

  assert.ok(heroTrio);
  assert.match(heroTrio[0], /\balt=["']["']/);
  assert.doesNotMatch(landing, /\bfetch\s*\(/);
  assert.doesNotMatch(landing, /(?:https?:\/\/|\/api\/)/i);
  assert.doesNotMatch(
    landing,
    /\b(?:wallet|account|price|payment|settlement|result|metric|testimonial|partner|balance|evidence|deployed|guaranteed|mock|paid|verified|transaction|receipt|funding|asset|backer|revenue|payout|availability)\b|\b(?:holder return|investment return|return on investment|financial returns?|return to backers?|live service|available now|user session)\b/i,
  );
});
