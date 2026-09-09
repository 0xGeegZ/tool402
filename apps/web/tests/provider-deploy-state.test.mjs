import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourcePaths = [
  "../src/app/provider/deploy/page.tsx",
  "../src/components/provider/deploy/provider-deploy-wizard.tsx",
  "../src/components/provider/deploy/provider-deploy-stages.tsx",
  "../src/components/provider/deploy/provider-deploy-state.ts",
  "../src/components/provider/deploy/campaign-fixture.ts",
  "../src/components/provider/deploy/ats-create-configuration.ts",
].map((path) => fileURLToPath(new URL(path, import.meta.url)));
const sourceExists = sourcePaths.every(existsSync);
const implementedTest = sourceExists ? test : test.skip;

test("requires all six declared S16 source paths before GREEN", () => {
  for (const sourcePath of sourcePaths) {
    assert.equal(existsSync(sourcePath), true, `missing declared S16 source path: ${sourcePath}`);
  }
});

implementedTest("fixes the five wizard steps, editable fields, categories, and acknowledgement gate", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");

  assert.deepEqual(state.providerDeploySteps, [
    { label: "Tool details", editable: ["toolName", "category", "oneLiner", "customerProblem"], fixed: [] },
    { label: "Interface and capability", editable: ["qualifyingResource", "capabilitySummary"], fixed: ["capability"] },
    { label: "Pricing and target agent customers", editable: ["quickPrice", "standardPrice", "targetAgentCustomers"], fixed: [] },
    { label: "Funding and revenue-note terms", editable: ["useOfFunds", "risks", "acknowledgement"], fixed: ["termsV1Economics", "revenueNoteParameters"] },
    { label: "Review and sign", editable: [], fixed: ["reviewRows", "deploymentStages"] },
  ]);
  assert.deepEqual(state.providerDeployCategories, ["security", "data", "web", "code", "ai", "productivity"]);
  assert.equal(state.stepCaption(3), "Step 4 of 5 · Funding and revenue-note terms");
  assert.equal(state.canGoBack(0), false);
  assert.equal(state.canAdvance(3, { acknowledgement: false }), false);
  assert.equal(state.canAdvance(3, { acknowledgement: true }), true);
  assert.equal(
    state.acknowledgementCopy,
    "I confirm these are testnet, experimental terms. They promise no yield, principal, or return. Off-platform use of the tool is not observable by Tool402.",
  );
});

implementedTest("keeps terms v1 read-only and refuses invalid browser payload inputs", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");

  assert.deepEqual(state.termsV1Economics, {
    fundingTargetHbar: "1000",
    noteUnitPriceHbar: "1",
    maximumNoteUnits: "1000",
    minimumPurchaseUnits: "10",
    revenueRouting: { operatorBps: 8000, backerReserveBps: 2000, feeBps: 0 },
    payoutCapHbar: "1500",
    maturityDate: "2026-12-31",
  });
  assert.equal(Object.isFrozen(state.termsV1Economics), true);
  assert.equal(state.hbarToTinybars("0.1"), "10000000");
  for (const price of ["0", "0.10000001", "10000000"]) {
    assert.throws(() => state.hbarToTinybars(price));
  }
  for (const [field, value] of [
    ["title", "a".repeat(101)],
    ["customerProblem", "a".repeat(1001)],
    ["useOfFunds", ["a".repeat(401)]],
    ["risks", []],
    ["targetAgentCustomers", Array.from({ length: 7 }, () => "customer")],
  ]) {
    assert.throws(() => state.validateNarrativeField(field, value));
  }
});

implementedTest("maps only declared relay outcomes into the closed stage lifecycle", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");

  assert.deepEqual(state.providerDeployStageKinds, [
    "blocked", "actionable", "in_progress", "done", "unavailable", "unsupported_type", "rejected", "replayed", "conflict", "unknown",
  ]);
  assert.deepEqual(state.providerDeployStages, [
    { label: "Record the draft offering", commandType: "offering.create" },
    { label: "Prepare asset creation", commandType: "external.prepare", operationKind: "ATS_CREATE" },
    { label: "Create the revenue note", commandType: "external.attachCandidate" },
    { label: "Publish to the Tool Directory", commandType: "directory.publish" },
  ]);
  assert.deepEqual(Object.fromEntries([
    "ACCEPTED", "UNSUPPORTED_TYPE", "REJECTED", "REPLAYED", "CONFLICT", "not_configured", "transport_failure", "unexpected_response",
  ].map((outcome) => [outcome, state.stageKindForRelayOutcome(outcome)])), {
    ACCEPTED: "done", UNSUPPORTED_TYPE: "unsupported_type", REJECTED: "rejected", REPLAYED: "replayed", CONFLICT: "conflict", not_configured: "unavailable", transport_failure: "unknown", unexpected_response: "unknown",
  });
  assert.throws(() => state.stageKindForRelayOutcome("accepted"));
  assert.deepEqual(state.afterDeclinedSignature(), { kind: "actionable", detail: "Nothing was recorded." });
});

implementedTest("transcribes the frozen web ATS_CREATE projection field-for-field", async () => {
  const { atsCreateConfiguration } = await import("../src/components/provider/deploy/ats-create-configuration.ts");

  assert.deepEqual(atsCreateConfiguration, {
    network: "hedera:testnet",
    chainId: 296,
    subjectPublicId: "riskscan_revenue_note_demo",
    offeringVersion: "ats_demo_v1",
    registryRevision: "ats_sdk_8_0_0_testnet_v2",
    operationKind: "ATS_CREATE",
    targetKind: "EVM_ADDRESS",
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
    canonicalParametersHash: "39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a",
    factoryHederaId: "0.0.9213391",
    resolverHederaId: "0.0.9212226",
  });
  assert.equal(Object.isFrozen(atsCreateConfiguration), true);
});
