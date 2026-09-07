import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const convexDirectory = fileURLToPath(new URL("../convex/", import.meta.url));

const canonicalModules = new Map([
  ["riskscan_pending_reconciliation_selector.ts", "selectRiskScanPendingReconciliationAttempt"],
  ["riskscan_pending_settlement_reader.ts", "readRiskScanPendingSettlementCandidate"],
  ["riskscan_requests.ts", "recordInitialRiskScanRequest"],
  ["riskscan_settlement_attempts.ts", "recordInitialRiskScanSettlementAttempt"],
  ["riskscan_settlement_records.ts", "recordInitialRiskScanSettlementRecord"],
]);

const legacyModuleFilenames = [
  "riskscan-pending-reconciliation-selector.ts",
  "riskscan-pending-settlement-reader.ts",
  "riskscan-requests.ts",
  "riskscan-settlement-attempts.ts",
  "riskscan-settlement-records.ts",
];

const legacyModulePathnames = legacyModuleFilenames
  .map((filename) => `packages/backend/convex/${filename}`);

const documentedModuleRecordPaths = [
  "docs/specs/m04-riskscan-internal-request-writer.md",
  "docs/specs/m04-riskscan-candidate-settlement-attempt-writer.md",
  "docs/specs/m04-riskscan-pending-verification-settlement-record-writer.md",
  "docs/specs/m04-riskscan-pending-settlement-reader.md",
  "docs/specs/m04-riskscan-pending-reconciliation-selector.md",
  "docs/superpowers/plans/2026-09-05-m04-riskscan-internal-request-writer.md",
  "docs/superpowers/plans/2026-09-05-m04-riskscan-candidate-settlement-attempt-writer.md",
  "docs/superpowers/plans/2026-09-05-m04-riskscan-pending-verification-settlement-record-writer.md",
  "docs/superpowers/plans/2026-09-05-m04-riskscan-pending-settlement-reader.md",
  "docs/superpowers/plans/2026-09-05-m04-riskscan-pending-reconciliation-selector.md",
  "docs/work-queue/queue/60-done/M04-T030-riskscan-internal-request-writer.md",
  "docs/work-queue/queue/60-done/M04-T040-riskscan-candidate-settlement-attempt-writer.md",
  "docs/work-queue/queue/60-done/M04-T050-riskscan-pending-verification-settlement-record-writer.md",
  "docs/work-queue/queue/60-done/M04-T060-riskscan-pending-settlement-reader.md",
  "docs/work-queue/queue/60-done/M04-T070-riskscan-pending-reconciliation-selector.md",
  "docs/work-queue/FILE-OWNERSHIP.md",
];

test("requires canonical Convex-safe module filenames without freezing future safe modules", () => {
  const typescriptFilenames = readdirSync(convexDirectory)
    .filter((filename) => filename.endsWith(".ts"));

  for (const filename of canonicalModules.keys()) {
    assert.ok(typescriptFilenames.includes(filename), `missing canonical module ${filename}`);
  }

  for (const filename of legacyModuleFilenames) {
    assert.equal(typescriptFilenames.includes(filename), false, `legacy module remains ${filename}`);
  }

  for (const filename of typescriptFilenames) {
    assert.match(filename, /^[A-Za-z0-9_.]+\.ts$/u);
  }
});

test("preserves the exact documented export of every renamed Convex module", async () => {
  for (const [filename, exportName] of canonicalModules) {
    const module = await import(new URL(`../convex/${filename}`, import.meta.url));
    assert.deepEqual(Object.keys(module), [exportName]);
  }
});

test("removes legacy module paths from the sixteen bounded Markdown records", () => {
  for (const recordPath of documentedModuleRecordPaths) {
    const text = readFileSync(join(repositoryRoot, recordPath), "utf8");
    for (const legacyModulePathname of legacyModulePathnames) {
      assert.equal(
        text.includes(legacyModulePathname),
        false,
        `${recordPath} retains ${legacyModulePathname}`,
      );
    }
  }
});
