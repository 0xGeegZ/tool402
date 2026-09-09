import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const islandPath = "src/components/provider/deploy/deploy-stage-signing.tsx";
const sourceExists = existsSync(join(appRoot, islandPath));
const implementedTest = sourceExists ? test : test.skip;

async function readIsland() {
  return readFile(join(appRoot, islandPath), "utf8");
}

test("requires the declared S21 signing island source path", () => {
  assert.equal(sourceExists, true, `missing declared S21 source path: ${islandPath}`);
});

implementedTest("composes the accepted wallet island, signature dialog, and stage list exactly once", async () => {
  const island = await readIsland();

  assert.match(island, /^["']use client["'];/u);
  assert.match(island, /import\s*\{[^}]*\bWalletIsland\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/wallet\/wallet-connect["']/u);
  assert.match(island, /import\s*\{[^}]*\bSignatureDialog\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/wallet\/signature-dialog["']/u);
  assert.match(island, /import\s*\{[^}]*\bProviderDeployStages\b[^}]*\}\s+from\s+["']\.\/provider-deploy-stages["']/u);
  assert.match(island, /import\s*\{[^}]*\bbuildStageSignatureRequest\b[^}]*\}\s+from\s+["'][^"']*lib\/wallet\/command-bridge(?:\.ts)?["']/u);
  assert.match(island, /\bstageStateForSignatureResult\b/u);
  assert.match(island, /\bproviderDeployStageStates\s*\(/u);
  assert.match(island, /\bisDirectoryRecordComplete\s*\(/u);
  assert.equal((island.match(/<WalletIsland\b/gu) ?? []).length, 1);
  assert.equal((island.match(/<SignatureDialog\b/gu) ?? []).length, 1);
  assert.match(island, /<SignatureDialog\b[^>]*\bonResult=/u);
  assert.match(island, /<ProviderDeployStages\b[^>]*\bonActivate=/u);
  assert.match(island, /<ProviderDeployStages\b[^>]*\benabledStage=/u);
});

implementedTest("keeps stage state session-only and truthful with no persistence, retry, environment, or transport", async () => {
  const island = await readIsland();

  assert.match(island, /reload/iu);
  assert.match(island, /not an on-chain fact/iu);
  assert.match(island, /not an authority/iu);
  assert.doesNotMatch(island, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\b/u);
  assert.doesNotMatch(island, /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/u);
  assert.doesNotMatch(island, /\b(?:process\.env|import\.meta\.env)\b/u);
  assert.doesNotMatch(island, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/u);
  assert.doesNotMatch(island, /\b(?:convex|_generated|useMutation|useAction|useQuery)\b/u);
  assert.doesNotMatch(island, /0x[0-9a-fA-F]{40}/u);
  assert.doesNotMatch(island, /\b(?:href|<a\b)/u);
});
