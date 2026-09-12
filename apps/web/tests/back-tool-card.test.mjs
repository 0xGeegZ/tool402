import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const cardPath = "src/components/backing/back-tool-card.tsx";
const riskscanPath = "src/components/riskscan/detail/riskscan-detail.tsx";
const entitycheckPath = "src/components/entitycheck/detail/entitycheck-detail.tsx";

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("reads the offering through the accepted state module and gates the open variant on OPEN", async () => {
  const card = await readAppFile(cardPath);

  assert.match(card, /import \{[^}]*\bformatHbar\b[^}]*\} from "\.\/backing-state"/);
  assert.match(card, /import \{[^}]*\bformatShare\b[^}]*\} from "\.\/backing-state"/);
  assert.match(card, /import \{[^}]*\breadBackingOffering\b[^}]*\} from "\.\/backing-state"/);
  assert.match(card, /export function BackToolCard\(/);
  assert.match(card, /state === "OPEN"/);
  assert.match(card, /readBackingOffering\(projection\)/);
  assert.doesNotMatch(card, /validateUnits|createBackingIntent|transferRequest|paymentTinybars/);
});

test("renders the open variant's fixed copy from the accepted formatters", async () => {
  const card = await readAppFile(cardPath);

  assert.match(card, /<CardTitle>Back \{tool\}<\/CardTitle>/);
  assert.match(card, />Open offering</);
  assert.match(
    card,
    /Fund note units with HBAR\. A disclosed \{formatShare\(offering\.terms\.reserveShareBps\)\}% of qualifying usage revenue funds capped distributions under the offering terms\./,
  );
  assert.match(card, /\["Minimum", `\$\{offering\.terms\.minimumPurchaseUnits\} units · \$\{formatHbar\(offering\.terms\.minimumPurchaseUnits \* offering\.terms\.noteUnitPriceTinybars\)\}`\]/);
  assert.match(card, /\["Unit price", formatHbar\(offering\.terms\.noteUnitPriceTinybars\)\]/);
  assert.match(card, /\["Revenue share", `\$\{formatShare\(offering\.terms\.reserveShareBps\)\}%`\]/);
  assert.match(card, /\["Maturity", offering\.maturityAt\]/);
  assert.match(card, /MetaMask · Hedera Testnet · one signature, one HBAR transfer\./);
  assert.match(card, /Terms \{offering\.terms\.version\} · not a projected return\. No payout amount or timeline is promised\./);
  assert.doesNotMatch(card, /Number\(|parseFloat|parseInt|toFixed/);
});

test("renders the no-offering variant's fixed copy and no control", async () => {
  const card = await readAppFile(cardPath);

  assert.match(card, />No open offering</);
  assert.match(card, /\{tool\} has no open offering\. This card opens the funding flow once an issuer's offering is OPEN\./);
  assert.equal((card.match(/<Link\b/g) ?? []).length, 1);
  assert.doesNotMatch(card, /disabled/);
});

test("renders exactly one href and it is the href prop", async () => {
  const card = await readAppFile(cardPath);

  assert.equal((card.match(/href=/g) ?? []).length, 1);
  assert.match(card, /href=\{href\}/);
  assert.doesNotMatch(card, /href=["']/);
});

test("carries no client behaviour, no form control, and no capacity literal", async () => {
  const card = await readAppFile(cardPath);

  assert.doesNotMatch(card, /["']use client["']/);
  assert.doesNotMatch(card, /fetch\(/);
  assert.doesNotMatch(card, /<form\b/);
  assert.doesNotMatch(card, /<button\b/);
  assert.doesNotMatch(card, /https:\/\//);
  assert.doesNotMatch(card, /remain|raised|funded|balance|progress/i);
});

test("both detail asides mount the card once, first, with no projection", async () => {
  const [riskscan, entitycheck] = await Promise.all([readAppFile(riskscanPath), readAppFile(entitycheckPath)]);

  for (const [path, detail] of [[riskscanPath, riskscan], [entitycheckPath, entitycheck]]) {
    assert.match(detail, /import \{ BackToolCard \} from "(?:\.\.\/)+backing\/back-tool-card"/, path);
    assert.equal((detail.match(/<BackToolCard\b/g) ?? []).length, 1, path);
    assert.equal((detail.match(/<aside\b/g) ?? []).length, 1, path);
    assert.match(detail, /<aside[^>]*>\s*<BackToolCard\b/, path);
  }

  assert.match(riskscan, /<BackToolCard tool="RiskScan" href=\{"\/explore\/riskscan\/back"\} projection=\{null\} \/>/);
  assert.match(entitycheck, /<BackToolCard tool="EntityCheck France" projection=\{null\} \/>/);
  assert.doesNotMatch(entitycheck, /<BackToolCard[^>]*href/);
});
