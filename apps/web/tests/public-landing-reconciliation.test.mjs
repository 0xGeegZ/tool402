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
    "riskscan-feature-title",
    "inspectable-scope-title",
    "provider-path-title",
  ]);
  assert.deepEqual(headingIds, sectionLabels);
  assert.match(sections, /Know what you can inspect/);
  assert.match(sections, /Prepare a tool offering/);
});
