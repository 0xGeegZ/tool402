import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const statePanelPath = "src/components/ui/state-panel.tsx";

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function assertParses(path, source) {
  const sourceFile = typescript.createSourceFile(
    path,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TSX,
  );

  assert.deepEqual(sourceFile.parseDiagnostics, [], `${path} must parse`);
}

test("defines a static StatePanel with labelled text, an optional slot, and decorative-only illustration", async () => {
  const source = await readAppFile(statePanelPath);

  assertParses(statePanelPath, source);
  assert.match(source, /export type StatePanelProps = React\.ComponentPropsWithoutRef<["']section["']> & \{/);
  assert.match(source, /title:\s*string;/);
  assert.match(source, /description:\s*string;/);
  assert.match(source, /action\?:\s*React\.ReactNode;/);
  assert.match(source, /illustration\?:\s*Omit<React\.ComponentPropsWithoutRef<["']img["']>, ["']alt["'] \| ["']aria-hidden["']>;/);
  assert.match(source, /export function StatePanel\(/);
  assert.match(source, /data-slot=["']state-panel["']/);
  assert.match(source, /data-slot=["']state-panel-title["']/);
  assert.match(source, /data-slot=["']state-panel-description["']/);
  assert.match(source, /data-slot=["']state-panel-action["']/);
  assert.match(source, /<img\s+\{\.\.\.illustration\}\s+alt=["']["']\s+aria-hidden=["']true["']/);
  assert.match(source, /\{action \? /);
  assert.match(source, /\{illustration \? /);
  assert.match(source, /\bcn\(/);

  assert.doesNotMatch(
    source,
    /["']use client["']|\buse(?:State|Effect|Memo|Ref)\b|\bfetch\b|window\.|process\.env|localStorage|sessionStorage|setTimeout|setInterval|\bonClick\b|https?:\/\//,
  );
});
