import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const presentationPath = "src/components/backing/backing-presentation.ts";
const railPath = "src/components/backing/backing-step-rail.tsx";
const flowPath = "src/components/backing/backing-flow.tsx";
const presentationUrl = new URL(`../${presentationPath}`, import.meta.url);

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadPresentation() {
  return import(presentationUrl.href);
}

function terms(minimumPurchaseUnits, maximumNoteUnits) {
  return Object.freeze({
    minimumPurchaseUnits: BigInt(minimumPurchaseUnits),
    maximumNoteUnits: BigInt(maximumNoteUnits),
    noteUnitPriceTinybars: 100000000n,
  });
}

const railRows = [
  ["offering_unavailable", false, 1, 0],
  ["choosing", false, 1, 0],
  ["refused", false, 1, 0],
  ["choosing", true, 2, 1],
  ["prepared", false, 3, 2],
  ["prepared", true, 3, 2],
  ["payment_submitted", false, 4, 3],
  ["payment_submitted", true, 4, 3],
  ["payment_outcome_unknown", false, 4, 3],
  ["payment_outcome_unknown", true, 4, 3],
  ["allocation_pending", false, 4, 3],
  ["allocation_pending", true, 4, 3],
  ["complete", false, 4, 4],
  ["complete", true, 4, 4],
];

test("declares the two new presentation source paths", () => {
  assert.deepEqual([presentationPath, railPath].map((path) => existsSync(join(appRoot, path))), [true, true]);
});

test("derives the presets from the accepted terms bounds alone", async () => {
  const { presetUnits } = await loadPresentation();

  assert.deepEqual(presetUnits(terms(10, 1000)), [10n, 50n, 100n]);
  assert.deepEqual(presetUnits(terms(10, 30)), [10n]);
  assert.deepEqual(presetUnits(terms(10, 60)), [10n, 50n]);
  assert.deepEqual(presetUnits(terms(10, 10)), [10n]);
});

test("maps every accepted view kind onto the four rail steps", async () => {
  const { railPosition } = await loadPresentation();

  for (const [kind, signing, current, done] of railRows) {
    assert.deepEqual(railPosition(kind, signing), { current, done }, `${kind} signing=${signing}`);
  }
});

test("keeps the presentation module pure and free of React", async () => {
  const presentation = await readAppFile(presentationPath);

  assert.doesNotMatch(presentation, /["']use client["']|from "react"|<[A-Z]/);
  assert.match(presentation, /^import type \{[^}]*\} from "\.\/backing-state";$/mu);
  assert.match(presentation, /export function presetUnits\(/);
  assert.match(presentation, /export function railPosition\(/);
});

test("renders the four-step rail with checks, the primary colour, and no announcement", async () => {
  const rail = await readAppFile(railPath);

  assert.match(rail, /Choose amount/);
  assert.match(rail, /Sign command/);
  assert.match(rail, /Send HBAR/);
  assert.match(rail, /Allocation/);
  assert.match(rail, /aria-hidden="true"/);
  assert.match(rail, /text-primary/);
  assert.match(rail, /text-muted-foreground/);
});

test("renders one chip per preset plus Custom and keeps the units input the source of truth", async () => {
  const flow = await readAppFile(flowPath);

  assert.match(flow, /import \{ presetUnits, railPosition \} from "\.\/backing-presentation"/);
  assert.match(flow, /presetUnits\(offering\.terms\)/);
  assert.match(flow, /presets\.map\(/);
  assert.equal((flow.match(/name="units-preset"/g) ?? []).length, 2);
  assert.equal((flow.match(/type="radio"/g) ?? []).length, 2);
  assert.match(flow, /Custom/);
  assert.match(flow, /\{units\.toString\(\)\} units\{index === 0 \? " minimum" : ""\}/);
  assert.match(flow, /setUnitsInput\(units\.toString\(\)\)/);
  assert.match(flow, /<div hidden=\{preset !== null\}>/);
  assert.match(flow, /useState<bigint \| null>\(offering\.terms\.minimumPurchaseUnits\)/);
  assert.match(flow, /name="units"/);
});

test("reads the amount out through the accepted payment helpers", async () => {
  const flow = await readAppFile(flowPath);

  assert.match(flow, /\bpaymentTinybars\b[^\n]*from "\.\/backing-state"|paymentTinybars,/);
  assert.match(flow, /\$\{formatHbar\(paymentTinybars\(offering, readoutUnits\)\)\} for \$\{readoutUnits\} note units/);
  assert.match(flow, /readoutUnits === null \? "—"/);
  assert.match(flow, /<CardTitle>Choose amount<\/CardTitle>/);
});

test("mounts the rail once above the cards and the wallet island once inside the Funding section", async () => {
  const flow = await readAppFile(flowPath);

  assert.equal((flow.match(/<BackingStepRail\b/g) ?? []).length, 1);
  assert.equal((flow.match(/<WalletIsland\b/g) ?? []).length, 1);
  assert.match(flow, /<BackingStepRail \{\.\.\.railPosition\(view\.kind, request !== null\)\} \/>/);
  assert.ok(flow.indexOf("<BackingStepRail") < flow.indexOf('aria-labelledby="backing-status"'));
  assert.ok(flow.indexOf('aria-live="polite"') < flow.indexOf("<WalletIsland"));
  assert.ok(flow.indexOf("<WalletIsland") < flow.indexOf("Prepare and fund"));
  assert.doesNotMatch(flow, /Connect MetaMask from the header/);
});

test("lists what happens next only under the payment_submitted kind", async () => {
  const flow = await readAppFile(flowPath);

  assert.equal((flow.match(/What happens next/g) ?? []).length, 1);
  assert.match(flow, /view\.kind === "payment_submitted" \? \([\s\S]{0,400}?What happens next/);
  assert.match(flow, /Mirror Node records the transfer\. The request moves to allocation_pending\./);
  assert.match(flow, /The issuer signs the allocation\. Units are issued to the connected address\./);
  assert.equal((flow.match(/<ol\b/g) ?? []).length, 1);
});

test("carries none of the excluded literals in the presentation slice", async () => {
  const presentation = await readAppFile(presentationPath);
  const rail = await readAppFile(railPath);
  const flow = await readAppFile(flowPath);
  const sources = `${presentation}\n${rail}\n${flow}`;

  assert.doesNotMatch(sources, /sample|simulat|hashscan|mirror-node|units remain|raised|funded|balance|capacity|remaining|countdown|perk|\btier\b|progress|explorer/i);
  assert.doesNotMatch(sources, /\b(?:paid|settled|verified|allocated|(?<!aria-)live)\b(?! only| record)/i);
  assert.doesNotMatch(sources, /Connected\b/);
  assert.doesNotMatch(sources, /https?:\/\/|href=|\bfetch\s*\(|process\.env/);
});
