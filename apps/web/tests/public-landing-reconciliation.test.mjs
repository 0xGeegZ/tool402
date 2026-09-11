import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("gives the reconciled landing the selected five-part marketplace hierarchy", async () => {
  const [hero, sections] = await Promise.all([
    readAppFile("src/components/landing/landing-hero.tsx"),
    readAppFile("src/components/landing/landing-sections.tsx"),
  ]);
  const landing = [hero, sections].join("\n");
  const sectionLabels = [...landing.matchAll(/<section\b[^>]*aria-labelledby=["']([^"']+)["']/g)].map(
    ([, label]) => label,
  );
  const headingIds = [...landing.matchAll(/<h[12]\b[^>]*id=["']([^"']+)["']/g)].map(([, id]) => id);

  assert.equal((landing.match(/<section\b/g) ?? []).length, 5);
  assert.equal((landing.match(/<h2\b/g) ?? []).length, 4);
  assert.deepEqual(sectionLabels, [
    "landing-title",
    "how-it-works-title",
    "campaigns-title",
    "inspectable-scope-title",
    "provider-path-title",
  ]);
  assert.deepEqual(headingIds, sectionLabels);
  assert.match(sections, /Every current route has a clear boundary/);
  assert.match(sections, /Prepare a tool offering/);
});

test("keeps the reference section rhythm without synthetic inter-section gaps", async () => {
  const [page, hero, sections] = await Promise.all([
    readAppFile("src/app/page.tsx"),
    readAppFile("src/components/landing/landing-hero.tsx"),
    readAppFile("src/components/landing/landing-sections.tsx"),
  ]);

  assert.match(page, /<main className="-mt-10">/);
  assert.match(hero, /left-1\/2 isolate w-screen -translate-x-1\/2/);
  assert.match(hero, /mx-auto grid max-w-7xl/);
  assert.match(sections, /<div className="space-y-0">/);
  assert.match(sections, /min-h-60[^"']*rounded-card/);
  assert.match(sections, /w-screen -translate-x-1\/2/);
});

test("keeps the landing content panels border-led instead of shadow-led", async () => {
  const sections = await readAppFile("src/components/landing/landing-sections.tsx");

  assert.match(sections, /\bshadow-none\b/);
  assert.match(sections, /hover:border-foreground\/15/);
  assert.doesNotMatch(sections, /\b(?:shadow-sm|hover:shadow-md|hover:shadow-lg)\b/);
});

test("keeps the landing footer compact once its final legal row is reached", async () => {
  const footer = await readAppFile("src/components/landing/landing-footer.tsx");

  assert.match(footer, /<footer className="border-t border-border pt-12 pb-10">/);
});
