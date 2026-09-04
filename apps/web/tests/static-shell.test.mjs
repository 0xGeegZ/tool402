import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("declares the strict Next workspace boundary", async () => {
  const manifest = JSON.parse(await readAppFile("package.json"));

  assert.equal(manifest.name, "@tool402/web");
  assert.equal(manifest.private, true);
  assert.equal(manifest.scripts.typecheck, "next typegen && tsc --noEmit");
  assert.deepEqual(manifest.dependencies, {
    clsx: "2.1.1",
    next: "16.3.4",
    react: "19.2.8",
    "react-dom": "19.2.8",
    "tailwind-merge": "3.6.0",
  });
  assert.deepEqual(manifest.devDependencies, {
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "22.15.0",
    "@types/react": "19.2.7",
    "@types/react-dom": "19.2.3",
    postcss: "8.5.28",
    tailwindcss: "4.3.3",
    typescript: "5.9.3",
  });
});

test("enables Cache Components without a legacy cache opt-out", async () => {
  const config = await readAppFile("next.config.ts");

  assert.match(config, /cacheComponents\s*:\s*true/);
  assert.doesNotMatch(config, /\b(?:dynamicIO|useCache|dynamic|revalidate|fetchCache)\b/);
});

test("renders only the static Tool402 foundation shell", async () => {
  const [layout, page] = await Promise.all([
    readAppFile("src/app/layout.tsx"),
    readAppFile("src/app/page.tsx"),
  ]);

  assert.match(layout, /<html\s+lang=["']en["']>/);
  assert.match(layout, /<body>/);
  assert.match(page, /<main>/);
  assert.match(page, /Tool402 foundation/);
  assert.doesNotMatch(page, /\b(?:wallet|payment|provider|credential|deploy)\b/i);
});
