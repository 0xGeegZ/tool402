import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePaths = [
  "src/app/provider/deploy/page.tsx",
  "src/components/provider/deploy/provider-deploy-wizard.tsx",
  "src/components/provider/deploy/provider-deploy-stages.tsx",
  "src/components/provider/deploy/provider-deploy-state.ts",
  "src/components/provider/deploy/campaign-fixture.ts",
  "src/components/provider/deploy/ats-create-configuration.ts",
];
const sourceExists = sourcePaths.every((path) => existsSync(join(appRoot, path)));
const implementedTest = sourceExists ? test : test.skip;

async function readS16Sources() {
  const entries = await Promise.all(sourcePaths.map(async (path) => [path, await readFile(join(appRoot, path), "utf8")]));
  return Object.fromEntries(entries);
}

test("requires all six declared S16 source paths before route GREEN", () => {
  for (const path of sourcePaths) {
    assert.equal(existsSync(join(appRoot, path)), true, `missing declared S16 source path: ${path}`);
  }
});

implementedTest("renders the direct provider deploy route as a server page over the labelled local fixture", async () => {
  const sources = await readS16Sources();
  const page = sources["src/app/provider/deploy/page.tsx"];
  const fixture = sources["src/components/provider/deploy/campaign-fixture.ts"];

  assert.match(page, /import\s*\{\s*ProviderDeployWizard\s*\}\s+from\s+["'][^"']*provider-deploy-wizard["']/);
  assert.match(page, /<ProviderDeployWizard\s*\/>/);
  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(fixture, /PREPARED\s*\/\s*DEMO DATA/);
  assert.match(fixture, /Object\.freeze/);
});

implementedTest("keeps the route and every step transition local with no external or persistent read", async () => {
  const sources = Object.values(await readS16Sources()).join("\n");

  assert.doesNotMatch(sources, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
  assert.doesNotMatch(sources, /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(sources, /\b(?:process\.env|import\.meta\.env)\b/);
  assert.doesNotMatch(sources, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
});

implementedTest("keeps unavailable configuration rows blank and stage outcomes accessible without claiming a cause", async () => {
  const sources = await readS16Sources();
  const wizard = sources["src/components/provider/deploy/provider-deploy-wizard.tsx"];
  const stages = sources["src/components/provider/deploy/provider-deploy-stages.tsx"];

  assert.match(wizard, /not configured/i);
  assert.match(stages, /aria-live=["']polite["']/);
  assert.match(stages, /server gave no reason/i);
  assert.match(stages, /nothing was recorded/i);
  assert.doesNotMatch(sources["src/app/provider/deploy/page.tsx"], /(?:attempt|transaction|account|asset|digest)/i);
});
