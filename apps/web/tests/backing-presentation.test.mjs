import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const presentationUrl = new URL("../src/components/backing/backing-presentation.ts", import.meta.url);
const stepRailPath = fileURLToPath(new URL("../src/components/backing/backing-step-rail.tsx", import.meta.url));
const terms = Object.freeze({ minimumPurchaseUnits: 10n, maximumNoteUnits: 1000n });

async function loadPresentation() {
  assert.equal(existsSync(fileURLToPath(presentationUrl)), true, "backing presentation module must exist");
  assert.equal(existsSync(stepRailPath), true, "backing step rail must exist");
  return import(presentationUrl.href);
}

test("derives bounded amount presets from accepted terms", async () => {
  const { presetUnits } = await loadPresentation();
  assert.deepEqual(presetUnits(terms), [10n, 50n, 100n]);
  assert.deepEqual(presetUnits({ minimumPurchaseUnits: 10n, maximumNoteUnits: 30n }), [10n]);
  assert.deepEqual(presetUnits({ minimumPurchaseUnits: 10n, maximumNoteUnits: 50n }), [10n, 50n]);
  assert.deepEqual(presetUnits({ minimumPurchaseUnits: 20n, maximumNoteUnits: 75n }), [50n]);
});

test("maps submitted payment to an allocation-pending presentation without changing S18 state", async () => {
  const { railPosition } = await loadPresentation();
  assert.deepEqual(railPosition("choosing", false), { current: 1, done: 0 });
  assert.deepEqual(railPosition("choosing", true), { current: 2, done: 1 });
  assert.deepEqual(railPosition("prepared", false), { current: 3, done: 2 });
  assert.deepEqual(railPosition("payment_submitted", false), { current: 4, done: 3 });
  assert.deepEqual(railPosition("payment_outcome_unknown", false), { current: 4, done: 3 });
});
