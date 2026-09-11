import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("defines the truthful Provider RiskScan preparation hierarchy", async () => {
  const [page, wizard, stages, signing] = await Promise.all([
    readAppFile("src/app/provider/deploy/page.tsx"),
    readAppFile("src/components/provider/deploy/provider-deploy-wizard.tsx"),
    readAppFile("src/components/provider/deploy/provider-deploy-stages.tsx"),
    readAppFile("src/components/provider/deploy/deploy-stage-signing.tsx"),
  ]);
  const presentation = [page, wizard, stages, signing].join("\n");

  assert.match(page, /<LandingFooter\s*\/>/);
  assert.match(wizard, /data-ui=["']provider-deploy-surface["']/);
  assert.match(wizard, /data-ui=["']provider-deploy-identity["']/);
  assert.match(wizard, /Deploy the RiskScan campaign/);
  assert.match(wizard, /Prepared \/ demo data fixture/);
  assert.match(wizard, /data-ui=["']provider-deploy-progress["']/);
  assert.match(wizard, /h-1\.5/);
  assert.match(wizard, /data-ui=["']provider-deploy-workspace["']/);
  assert.match(wizard, /data-ui=["']provider-deploy-form["']/);
  assert.match(wizard, /data-ui=["']provider-deploy-sidebar["']/);
  assert.match(wizard, /Issuer wallet/);
  assert.match(wizard, /What signing does/);
  assert.match(signing, /data-ui=["']provider-deploy-signing["']/);

  const wizardCards = wizard.match(/<Card\b[^>]*>/g) ?? [];
  for (const card of wizardCards) assert.match(card, /\bshadow-none\b/);

  const stageCards = stages.match(/<Card\b[^>]*>/g) ?? [];
  assert.equal(stageCards.length, 1);
  for (const card of stageCards) assert.match(card, /\bshadow-none\b/);

  assert.match(presentation, /focus-visible:/);
  assert.doesNotMatch(
    presentation,
    /funding (?:modeled|raised)|position parts|illustrative paid tasks|illustrative usage revenue|prototype ready|prototype listing|account balance|portfolio|notifications|activity/i,
  );
  assert.doesNotMatch(presentation, /href=["']\/(?:overview|integration|funding|usage|directory|evidence|settings)["']/i);
});
