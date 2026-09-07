import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("preserves the shared focus and landmark seams without masking overflow", async () => {
  const [stylesheet, layout, navigation] = await Promise.all([
    readAppFile("src/app/globals.css"),
    readAppFile("src/app/layout.tsx"),
    readAppFile("src/components/discovery/local-navigation.tsx"),
  ]);

  assert.match(
    stylesheet,
    /:focus-visible\s*\{[\s\S]*?outline:\s*2px\s+solid\s+var\(--ring\);[\s\S]*?outline-offset:\s*3px;/u,
  );
  assert.doesNotMatch(stylesheet, /overflow-x\s*:\s*(?:hidden|clip)\b/iu);
  assert.match(layout, /<header\s+aria-label=["']Tool402["']/u);
  assert.match(navigation, /<nav\s+aria-label=["']Main navigation["']/u);
});

test("honors reduced motion for the document and generated shell elements", async () => {
  const stylesheet = await readAppFile("src/app/globals.css");

  assert.match(
    stylesheet,
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[\s\S]*?html\s*\{[\s\S]*?scroll-behavior:\s*auto;/u,
  );
  assert.match(
    stylesheet,
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[\s\S]*?\*\s*,\s*\*::before\s*,\s*\*::after\s*\{[\s\S]*?animation-duration:\s*0\.01ms\s*!important;[\s\S]*?animation-iteration-count:\s*1\s*!important;[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/u,
  );
});
