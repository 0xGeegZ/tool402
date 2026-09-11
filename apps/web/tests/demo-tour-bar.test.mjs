import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const barPath = "src/components/demo/demo-tour-bar.tsx";
const stepsPath = "src/components/demo/guided-demo-steps.tsx";
const layoutPath = "src/app/layout.tsx";

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function assertParses(path, source) {
  const sourceFile = typescript.createSourceFile(path, source, typescript.ScriptTarget.ES2022, true, typescript.ScriptKind.TSX);
  assert.deepEqual(sourceFile.parseDiagnostics, [], `${path} must parse`);
}

test("derives guided-demo progress from the route and a tour flag, never from storage", async () => {
  const [bar, steps] = await Promise.all([readAppFile(barPath), readAppFile(stepsPath)]);
  assertParses(barPath, bar);

  assert.match(bar, /^["']use client["'];/m);
  assert.match(bar, /import\s*\{\s*usePathname\s*\}\s*from\s*["']next\/navigation["']/);
  assert.match(bar, /import\s*\{[^}]*useQueryState[^}]*\}\s*from\s*["']nuqs["']/);
  assert.match(bar, /import\s*\{\s*steps\s*\}\s*from\s*["']\.\/guided-demo-steps["']/);
  assert.match(steps, /export const steps = \[/);
  assert.match(bar, /useQueryState\(\s*["']tour["']/);
  assert.match(bar, /of \{steps\.length\}/);
  assert.match(bar, /aria-label=["']Guided demo progress["']/);
  assert.equal((bar.match(/<a\b/gi) ?? []).length, 0);
  assert.doesNotMatch(bar, /\b(?:localStorage|sessionStorage|indexedDB|fetch|setTimeout|setInterval)\b/);
  assert.doesNotMatch(bar, /\b(?:wallet|payment|credential|auth|analytics|evidence|metric)\b/i);
});

test("mounts the tour bar once in the shell under a Suspense boundary", async () => {
  const layout = await readAppFile(layoutPath);

  assert.match(layout, /import\s*\{\s*DemoTourBar\s*\}\s*from\s*["'][^"']*demo-tour-bar["']/);
  assert.match(layout, /<Suspense\b[^>]*>\s*<DemoTourBar\s*\/>\s*<\/Suspense>/);
  assert.equal((layout.match(/<DemoTourBar\b/g) ?? []).length, 1);
});
