import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePaths = [
  "src/lib/backing-demo-projection.ts",
  "src/app/explore/riskscan/back/page.tsx",
  "src/components/riskscan/detail/riskscan-detail.tsx",
  "src/components/backing/backing-flow.tsx",
];
const sourcesExist = sourcePaths.every((path) => existsSync(join(appRoot, path)));
const implementedTest = sourcesExist ? test : test.skip;

async function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("requires the declared M56 route projection before GREEN", () => {
  assert.deepEqual(
    sourcePaths.map((path) => existsSync(join(appRoot, path))),
    [true, true, true, true],
    "the backing route must not become green until its server-owned projection exists",
  );
});

implementedTest("uses one server projection for the backing flow and exposes the exact RiskScan entry point", async () => {
  const [page, detail] = await Promise.all([
    readAppFile("src/app/explore/riskscan/back/page.tsx"),
    readAppFile("src/components/riskscan/detail/riskscan-detail.tsx"),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(page, /import \{ readBackingDemoProjection \} from "\.\.\.\.\/\.\.\.\.\/lib\/backing-demo-projection"/);
  assert.match(page, /await readBackingDemoProjection\(process\.env, globalThis\.fetch\)/);
  assert.match(page, /<BackingFlow projection=\{projection\} \/>/);
  assert.doesNotMatch(page, /<BackingFlow projection=\{null\} \/>/);
  assert.match(detail, /\{ href: "\/explore\/riskscan\/back", label: "Back this tool" \}/);
});

implementedTest("shows a canonical MetaMask hash with only the truthful submitted-and-pending result", async () => {
  const flow = await readAppFile("src/components/backing/backing-flow.tsx");

  assert.match(
    flow,
    /case "payment_submitted":\s+return `Payment submitted — allocation pending\. Transaction \$\{view\.transactionHash\}\.`;/,
  );
  assert.doesNotMatch(
    flow,
    /case "payment_submitted":\s+return[^;]*(?:funded|confirmed|allocated|settled)/i,
  );
});
