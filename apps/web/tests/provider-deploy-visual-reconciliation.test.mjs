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
  assert.match(wizard, /h-0\.5/);
  assert.match(wizard, /data-ui=["']provider-deploy-icon["']/);
  assert.match(wizard, /<ProviderIcon kind="shield"/);
  assert.match(wizard, /data-ui=["']provider-deploy-workspace["']/);
  assert.match(wizard, /data-ui=["']provider-deploy-form["']/);
  assert.doesNotMatch(wizard, /provider-deploy-sidebar/);
  assert.doesNotMatch(wizard, /lg:grid-cols-\[minmax\(0,1\.62fr\)_minmax\(17rem,0\.9fr\)\]/);
  assert.match(signing, /data-ui=["']provider-deploy-signing["']/);
  assert.doesNotMatch(signing, /Issuer wallet|approved issuer/iu);
  assert.match(signing, /data-ui=["']provider-deploy-connect["']/u);
  assert.match(signing, /Connect MetaMask on Hedera Testnet to enable the first signing step\./u);
  assert.match(signing, /className="h-full rounded-card border border-primary\/15 bg-primary\/\[0\.03\]/u);
  assert.match(signing, /data-ui=["']provider-review-wallet-context["']/);
  assert.match(signing, /What signing does/);
  assert.match(wizard, /data-ui="provider-deploy-wallet-pair" className="grid gap-4 lg:grid-cols-2 lg:items-stretch"/u);
  assert.doesNotMatch(wizard, /aria-label="Wallet connection">\{layout\.connect\}<\/section>/u);
  assert.match(presentation, /Connect MetaMask/);
  assert.match(stages, /data-ui=["']provider-deploy-stage-rail["']/);
  assert.match(stages, /data-ui=["']provider-deploy-stage-icon["']/);

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

test("splits multiline campaign summary values on actual line delimiters", async () => {
  const wizard = await readAppFile("src/components/provider/deploy/provider-deploy-wizard.tsx");

  assert.match(wizard, /const lineItems = \(value: string\) => value\.split\(\/\\r\?\\n\/u\)\.filter\(Boolean\);/u);
});

test("links the campaign summary terms control to an existing local target", async () => {
  const wizard = await readAppFile("src/components/provider/deploy/provider-deploy-wizard.tsx");

  assert.match(wizard, /<section id="terms" className="border-b border-primary\/10 py-4">/u);
  assert.match(wizard, /<a href="#terms" className="mt-4 inline-block text-sm font-semibold text-primary">View full terms →<\/a>/u);
});

test("shares the Provider wallet glyph between the wizard and the connection panel", async () => {
  const [wizard, signing, icon] = await Promise.all([
    readAppFile("src/components/provider/deploy/provider-deploy-wizard.tsx"),
    readAppFile("src/components/provider/deploy/deploy-stage-signing.tsx"),
    readAppFile("src/components/provider/deploy/provider-icon.tsx"),
  ]);

  assert.match(wizard, /import \{ ProviderGlyph, type ProviderIconKind \} from "\.\/provider-icon";/u);
  assert.match(signing, /import \{ ProviderGlyph \} from "\.\/provider-icon";/u);
  assert.match(icon, /kind === "wallet"/u);
  assert.match(icon, /M4 7\.5A2\.5 2\.5 0 0 1 6\.5 5H19v14H6\.5A2\.5 2\.5 0 0 1 4 16\.5v-9Z/u);
  assert.doesNotMatch(signing, /<path d="M4 7\.5A2\.5 2\.5 0 0 1 6\.5 5H19v14H6\.5A2\.5 2\.5 0 0 1 4 16\.5v-9Z"/u);
});
