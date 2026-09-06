import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = new URL("../src/riskscan-tool-flow.ts", import.meta.url);

test("keeps the flow to the two accepted Agent boundaries", async () => {
  const text = await readFile(source, "utf8");
  assert.match(text, /import\s+\{\s*discoverRiskScanQuick\s*\}\s+from\s+"\.\/riskscan-tool-directory\.ts"/u);
  assert.match(text, /import\s+\{\s*requestRiskScanQuickChallenge\s*\}\s+from\s+"\.\/riskscan-tool-challenge\.ts"/u);
  const imports = [...text.matchAll(/^import[\s\S]*?from\s+"([^"]+)";$/gmu)].map(([, path]) => path);
  assert.deepEqual(imports, [
    "./riskscan-tool-challenge.ts",
    "./riskscan-tool-directory.ts",
    "./riskscan-tool-challenge.ts",
    "./riskscan-tool-directory.ts",
  ]);
  for (const forbidden of [
    /x402|payment|authorization|header|wallet|account|signer|process\.env|backend/iu,
    /setTimeout|setInterval|retry|import\s*\(|child_process|\.json\s*\(|\.text\s*\(|\.arrayBuffer\s*\(|\.blob\s*\(|\.formData\s*\(/u,
    /result|receipt|facilitator|network|price|settlement|verification|finality|console\.|fetch\(/iu,
  ]) assert.doesNotMatch(text, forbidden);
});
