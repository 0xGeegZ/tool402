import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const wizardPath = "src/components/provider/deploy/provider-deploy-wizard.tsx";
const statePath = "src/components/provider/deploy/provider-deploy-state.ts";
const implementedTest = [wizardPath, statePath].every((path) => existsSync(join(appRoot, path))) ? test : test.skip;

function stepProgressSource(wizard) {
  const start = wizard.indexOf("function StepProgress");
  const end = wizard.indexOf("function CampaignSummary");
  assert.ok(start >= 0 && end > start, "StepProgress must be declared before CampaignSummary in the wizard source");
  return wizard.slice(start, end);
}

implementedTest("names the five wizard steps with the shortened pricing label", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");

  assert.deepEqual(state.providerDeploySteps.map((step) => step.label), [
    "Tool details",
    "Interface and capability",
    "Pricing and customers",
    "Funding and revenue-note terms",
    "Review and sign",
  ]);
  assert.equal(state.stepCaption(2), "Step 3 of 5 · Pricing and customers");
  assert.deepEqual(state.providerDeploySteps[2].editable, ["quickPrice", "standardPrice", "targetAgentCustomers"]);
});

implementedTest("keeps five equal progress columns, full labels, and a single caption beneath the row", async () => {
  const wizard = await readFile(join(appRoot, wizardPath), "utf8");
  const progress = stepProgressSource(wizard);

  assert.match(progress, /<ol[^>]*className="[^"]*\bgrid-cols-5\b[^"]*"/);
  assert.equal((wizard.match(/>\{stepCaption\(currentStep\)\}</g) ?? []).length, 1);
  assert.match(progress, /<\/ol>\s*<p[^>]*>\{stepCaption\(currentStep\)\}<\/p>/);
  assert.doesNotMatch(progress, /\btruncate\b/);
  assert.doesNotMatch(progress, /\stitle=/);
  assert.doesNotMatch(wizard, /\{currentStep \+ 1\}/);
});
