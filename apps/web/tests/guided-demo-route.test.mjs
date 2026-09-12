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
const runbookPath = join(appRoot, "../../docs/submission/release-rehearsal-runbook.md");
const b03PacketPath = join(appRoot, "../../docs/work-queue/evidence/HA-B03-AGENT-PAYMENT-001-run-packet.md");

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
  assert.match(room, /typeof navigator\.clipboard\?\.writeText !== "function"/);
  assert.match(room, /Copy unavailable/);
  assert.match(room, /RISKSCAN_PAY_OUTCOME paid/);
  assert.match(room, /RISKSCAN_PAY_SETTLEMENT <non-empty-safe-settlement-reference>/);
  assert.match(room, /RISKSCAN_PAY_DIAGNOSTIC PAID/);
  assert.match(room, /node --experimental-strip-types apps\/agent\/src\/riskscan-pay-cli\.ts --preflight/);
  assert.doesNotMatch(room, /npm run riskscan:pay/);
  assert.doesNotMatch(room, /PRIVATE_KEY\s*=/);
});

test("keeps the release runbook aligned with the B03 terminal contract", async () => {
  const runbook = await readFile(runbookPath, "utf8");
  assert.match(runbook, /RISKSCAN_PAY_DIAGNOSTIC PREFLIGHT_GUARD_REACHED/);
  assert.match(runbook, /RISKSCAN_PAY_OUTCOME paid/);
  assert.match(runbook, /RISKSCAN_PAY_SETTLEMENT <non-empty-safe-settlement-reference>/);
  assert.match(runbook, /RISKSCAN_PAY_DIAGNOSTIC PAID/);
  assert.match(runbook, /not repeated for a recording retake/i);
  assert.match(runbook, /14 Repeatability \| \/sign-in, then \/dashboard/);
});

test("keeps the Human Ops B03 packet copyable and fail-closed", async () => {
  const packet = await readFile(b03PacketPath, "utf8");
  assert.doesNotMatch(packet, /\\`|\\\$\{/);
  assert.match(packet, /\`\`\`sh/);
  assert.match(packet, /: "\$\{RISKSCAN_PAY_PAYER_ACCOUNT_ID:\?set privately in ignored runtime configuration\}"/);
  assert.match(packet, /: "\$\{RISKSCAN_PAY_PAYER_PRIVATE_KEY:\?set privately in ignored runtime configuration\}"/);
  assert.match(packet, /node --experimental-strip-types apps\/agent\/src\/riskscan-pay-cli\.ts --preflight/);
  assert.match(packet, /node --experimental-strip-types apps\/agent\/src\/riskscan-pay-cli\.ts/);
  assert.doesNotMatch(packet, /npm run riskscan:pay/);
});
