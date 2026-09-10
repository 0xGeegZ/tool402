import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("gives the reconciled landing four labeled sections and three subordinate section headings", async () => {
  const [hero, sections] = await Promise.all([
    readAppFile("src/components/landing/landing-hero.tsx"),
    readAppFile("src/components/landing/landing-sections.tsx"),
  ]);
  const landing = [hero, sections].join("\n");

  assert.equal((landing.match(/<section\b/g) ?? []).length, 4);
  assert.equal((landing.match(/<h2\b/g) ?? []).length, 3);
  assert.match(hero, /<section\b[^>]*aria-labelledby=["']landing-title["']/);
  assert.match(hero, /<h1\b[^>]*id=["']landing-title["']/);
  assert.match(sections, /Know what you can inspect/);
});
