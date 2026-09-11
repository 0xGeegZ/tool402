import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const fieldPath = "src/components/ui/field.tsx";
const buttonPath = "src/components/ui/button.tsx";
const flowPaths = [
  "src/components/riskscan/request/riskscan-request-flow.tsx",
  "src/components/riskscan/preflight/riskscan-quick-preflight.tsx",
  "src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx",
];
const docsPaths = [
  "src/components/docs/api-reference.tsx",
  "src/components/docs/documentation-faq.tsx",
  "src/components/docs/documentation-home.tsx",
  "src/components/docs/provider-riskscan-guide.tsx",
  "src/components/docs/riskscan-guide.tsx",
];
const ctaPaths = [
  "src/components/landing/landing-hero.tsx",
  "src/components/landing/landing-sections.tsx",
  "src/components/discovery/local-navigation.tsx",
  "src/components/boundary/not-found-boundary.tsx",
  "src/components/boundary/error-boundary.tsx",
];

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function assertParses(path, source) {
  const sourceFile = typescript.createSourceFile(path, source, typescript.ScriptTarget.ES2022, true, typescript.ScriptKind.TSX);
  assert.deepEqual(sourceFile.parseDiagnostics, [], `${path} must parse`);
}

test("defines one static field row primitive and one text-field class set", async () => {
  const field = await readAppFile(fieldPath);
  assertParses(fieldPath, field);
  assert.doesNotMatch(field, /["']use client["']/);
  assert.match(field, /export function Field\(/);
  assert.match(field, /export function CheckboxRow\(/);
  assert.match(field, /export const textInputClass = ["']min-h-10 w-full rounded-control border bg-background px-3["']/);
  assert.match(field, /export const textAreaClass = ["']min-h-24 w-full rounded-control border bg-background px-3 py-2["']/);
});

test("the three identical riskscan flows consume the shared field primitives", async () => {
  for (const path of flowPaths) {
    const source = await readAppFile(path);
    assert.match(source, /import\s*\{[^}]*\bField\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/ui\/field["']/, path);
    assert.doesNotMatch(source, /className="block space-y-2"/, path);
    assert.doesNotMatch(source, /className="min-h-10 w-full rounded-control border bg-background px-3"/, path);
    assert.doesNotMatch(source, /className="flex items-center gap-2">\s*<input/, path);
  }
});

test("buttonVariants owns the pill shape and every hand-rolled CTA consumes it", async () => {
  const button = await readAppFile(buttonPath);
  assert.match(button, /shape\?: ButtonShape/);
  assert.match(button, /pill: ["']rounded-full["']/);
  for (const path of [...docsPaths, ...ctaPaths]) {
    const source = await readAppFile(path);
    assert.match(source, /\bbuttonVariants\b/, path);
    assert.doesNotMatch(source, /const (?:linkClass|guideLinkClass) =/, path);
    assert.doesNotMatch(source, /hover:bg-brand-purple/, path);
  }
});
