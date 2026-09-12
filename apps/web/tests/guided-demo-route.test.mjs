import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const pagePath = "src/app/demo/page.tsx";
const stepsPath = "src/components/demo/guided-demo-steps.tsx";
const controlPath = "src/components/demo/demo-control-room.ts";
const roomPath = "src/components/demo/recording-control-room.tsx";

async function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function assertParses(path, source) {
  const sourceFile = typescript.createSourceFile(path, source, typescript.ScriptTarget.ES2022, true, typescript.ScriptKind.TSX);
  assert.deepEqual(sourceFile.parseDiagnostics, [], path + " must parse");
}

test("composes the guide from one static page and the dedicated control room", async () => {
  await Promise.all([pagePath, stepsPath, controlPath, roomPath].map((path) => access(join(appRoot, path))));
  const [page, steps, room] = await Promise.all([readAppFile(pagePath), readAppFile(stepsPath), readAppFile(roomPath)]);
  assertParses(pagePath, page);
  assertParses(stepsPath, steps);
  assertParses(roomPath, room);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.match(page, /<RecordingControlRoom\s*\/>/);
  assert.match(page, /<GuidedDemoSteps\s*\/>/);
  assert.match(page, /<details\b/);
});

test("renders the shared fifteen-step itinerary with stable recording links", async () => {
  const steps = await readAppFile(stepsPath);
  assert.match(steps, /import\s*\{\s*recordingSteps\s*,\s*recordingTourHref\s*\}\s*from\s*["']\.\/demo-control-room["']/);
  assert.match(steps, /export const steps = recordingSteps/);
  assert.match(steps, /recordingSteps\.map\(/);
  assert.match(steps, /recordingTourHref\(step\.href, step\.id\)/);
  assert.match(steps, /step\.do/);
  assert.match(steps, /step\.say/);
  assert.match(steps, /step\.show/);
  assert.match(steps, /Wallet needed/);
  assert.doesNotMatch(steps, /<a\b/i);
});

test("keeps guide presentation free of environment, storage, automatic action, and fabricated proof", async () => {
  const [page, steps, room] = await Promise.all([readAppFile(pagePath), readAppFile(stepsPath), readAppFile(roomPath)]);
  const source = page + "\n" + steps + "\n" + room;
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB|process\.env|import\.meta\.env)\b/i);
  assert.doesNotMatch(source, /\b(?:eth_sendTransaction|eth_signTypedData|wallet_switchEthereumChain|fetch\s*\()\b/);
  assert.match(source, /NOT AVAILABLE/);
  assert.match(source, /allocation pending/i);
  assert.match(room, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(room, /PRIVATE_KEY\s*=/);
});
