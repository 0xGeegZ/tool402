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

implementedTest("uses the accepted Directory capability and identifies every invalid editable field", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");
  const { campaignFixture } = await import("../src/components/provider/deploy/campaign-fixture.ts");

  assert.equal(campaignFixture.capability, "evm-contract-risk-signals");
  assert.deepEqual(state.providerDeployFieldErrors(campaignFixture, 0), {});
  assert.deepEqual(state.providerDeployFieldErrors({
    ...campaignFixture,
    toolName: "a".repeat(101),
    customerProblem: "a".repeat(1001),
  }, 0), {
    toolName: "Enter a trimmed tool name of no more than 100 UTF-8 bytes.",
    customerProblem: "Enter a trimmed customer problem of no more than 1,000 UTF-8 bytes.",
  });
  assert.deepEqual(state.providerDeployFieldErrors({
    ...campaignFixture,
    quickPrice: "0",
    standardPrice: "0.10000001",
    targetAgentCustomers: "",
  }, 2), {
    quickPrice: "Enter an HBAR amount from 0.00000001 through 0.1.",
    standardPrice: "Enter an HBAR amount from 0.00000001 through 0.1.",
    targetAgentCustomers: "Enter one to six complete target-agent customer lines of no more than 400 UTF-8 bytes each.",
  });
  assert.deepEqual(state.providerDeployFieldErrors({
    ...campaignFixture,
    useOfFunds: "",
    risks: "a".repeat(401),
  }, 3), {
    useOfFunds: "Enter one to six complete use-of-funds lines of no more than 400 UTF-8 bytes each.",
    risks: "Enter one to six complete risk lines of no more than 400 UTF-8 bytes each.",
  });
});

implementedTest("maps only declared relay outcomes into the closed stage lifecycle", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");

  assert.deepEqual(state.providerDeployStageKinds, [
    "blocked", "actionable", "in_progress", "done", "unavailable", "unsupported_type", "rejected", "replayed", "conflict", "unknown",
  ]);
  assert.deepEqual(state.providerDeployStages, [
    { label: "Record the draft offering", commandType: "offering.create" },
    { label: "Prepare asset creation", commandType: "external.prepare", operationKind: "ATS_CREATE" },
    {
      label: "Create the revenue note",
      substeps: [
        {
          label: "Create the revenue note in MetaMask",
          returnsCandidate: ["transactionId", "evmAddress"],
        },
        {
          label: "Attach the returned candidate",
          commandType: "external.attachCandidate",
          requiresCandidate: ["transactionId", "evmAddress"],
        },
      ],
    },
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

implementedTest("marks stages two and three unavailable and renders no sensitive configuration without a projection", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");

  const withoutProjection = state.providerDeployStageStates(undefined);
  assert.equal(withoutProjection[1].kind, "unavailable");
  assert.equal(withoutProjection[2].kind, "unavailable");
  assert.deepEqual(state.revenueNoteConfigurationRows(undefined), []);
  assert.equal(state.prepareAssetConfiguration(undefined), null);
});

implementedTest("keeps the initial projected deployment sequence local-only and non-actionable", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");
  const { atsCreateConfiguration } = await import("../src/components/provider/deploy/ats-create-configuration.ts");

  const states = state.providerDeployStageStates(atsCreateConfiguration);

  assert.deepEqual(states, [
    { kind: "unavailable" },
    { kind: "blocked" },
    { kind: "unavailable" },
    { kind: "blocked" },
  ]);
  assert.equal(states.some((stage) => stage.kind === "actionable"), false);
  for (const stage of states) {
    assert.equal(Object.isFrozen(stage), true);
    assert.match(stage.kind, /^(?:blocked|unavailable)$/);
  }
});

implementedTest("keeps blocked and unavailable deployment controls explanatory and inert", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");

  const blocked = state.providerDeployStageControl(1, { kind: "blocked" });
  const unavailable = state.providerDeployStageControl(2, { kind: "unavailable" });

  assert.deepEqual(blocked, {
    disabled: true,
    label: "Complete the preceding stage first",
    description: "This signature handoff stays blocked until Record the draft offering is done.",
  });
  assert.deepEqual(unavailable, {
    disabled: true,
    label: "Signature handoff unavailable",
    description: "This stage needs its separate human action and a command bridge before any signature can be requested.",
  });
  for (const control of [blocked, unavailable]) {
    assert.doesNotMatch(`${control.label} ${control.description}`, /signing is available/i);
  }
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
    revenueNote: {
      name: "Tool402 RiskScan Revenue Note Demo",
      symbol: "T402RN",
      isin: "XS402RISKN02",
      numberOfUnits: "1000",
      nominalValue: "1",
      currency: "0x555344",
      decimals: 0,
      isWhiteList: true,
      isControllable: false,
    },
  });
  assert.equal(Object.isFrozen(atsCreateConfiguration), true);
  assert.equal(Object.isFrozen(atsCreateConfiguration.revenueNote), true);
});

implementedTest("renders only the approved immutable revenue-note subprojection", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");
  const { atsCreateConfiguration } = await import("../src/components/provider/deploy/ats-create-configuration.ts");

  assert.deepEqual(state.revenueNoteConfigurationRows(atsCreateConfiguration), [
    { label: "Note name", value: "Tool402 RiskScan Revenue Note Demo" },
    { label: "Symbol", value: "T402RN" },
    { label: "ISIN", value: "XS402RISKN02" },
    { label: "Unit count", value: "1000" },
    { label: "Nominal value", value: "1" },
    { label: "Currency", value: "0x555344" },
    { label: "Decimals", value: "0" },
    { label: "Whitelist", value: "Enabled" },
    { label: "Controllable", value: "Disabled" },
    { label: "Factory", value: "0.0.9213391" },
    { label: "Resolver", value: "0.0.9212226" },
  ]);
  assert.equal(Object.isFrozen(state.revenueNoteConfigurationRows(atsCreateConfiguration)), true);
});

implementedTest("enables only an actionable control the bridge reports and derives stage states from this session", async () => {
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");
  const { atsCreateConfiguration } = await import("../src/components/provider/deploy/ats-create-configuration.ts");
  const done = { kind: "done" };
  const candidate = { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x1111111111111111111111111111111111111111" };
  const connected = { connected: true, results: [], candidate: null, recordComplete: false };

  assert.deepEqual(state.providerDeployStageControl(0, { kind: "actionable" }, true), {
    disabled: false,
    label: "Request signature",
    description: "Opens one signature request for this stage. Nothing is recorded unless the relay reports ACCEPTED.",
  });
  assert.equal(state.providerDeployStageControl(0, { kind: "actionable" }).disabled, true);
  assert.equal(state.providerDeployStageControl(1, { kind: "blocked" }, true).disabled, true);
  assert.equal(state.providerDeployStageControl(2, { kind: "unavailable" }, true).disabled, true);
  assert.equal(state.providerDeployStageControl(3, { kind: "done" }, true).disabled, true);

  assert.deepEqual(
    state.providerDeployStageStates(atsCreateConfiguration, { ...connected, connected: false }),
    state.providerDeployStageStates(atsCreateConfiguration),
  );
  assert.equal(state.stageFourUnavailableDetail, "No accepted clearing account or public x402 endpoint is recorded.");
  assert.deepEqual(state.providerDeployStageStates(atsCreateConfiguration, connected), [
    { kind: "actionable" },
    { kind: "blocked" },
    { kind: "unavailable" },
    { kind: "unavailable", detail: state.stageFourUnavailableDetail },
  ]);
  assert.deepEqual(state.providerDeployStageStates(undefined, connected)[1], { kind: "unavailable" });
  assert.deepEqual(state.providerDeployStageStates(atsCreateConfiguration, { ...connected, results: [done] }).slice(0, 3), [
    done,
    { kind: "actionable" },
    { kind: "unavailable" },
  ]);
  assert.deepEqual(state.providerDeployStageStates(atsCreateConfiguration, { ...connected, results: [done], candidate })[2], { kind: "blocked" });
  assert.deepEqual(state.providerDeployStageStates(atsCreateConfiguration, { ...connected, results: [done, done], candidate })[2], { kind: "actionable" });
  const complete = state.providerDeployStageStates(atsCreateConfiguration, { connected: true, results: [done, done, done], candidate, recordComplete: true });
  assert.deepEqual(complete, [done, done, done, { kind: "actionable" }]);
  assert.deepEqual(
    state.providerDeployStageStates(atsCreateConfiguration, { ...connected, results: [state.afterDeclinedSignature()] })[0],
    { kind: "actionable", detail: "Nothing was recorded." },
  );
  assert.deepEqual(state.providerDeployStageStates(atsCreateConfiguration, { ...connected, results: [{ kind: "conflict" }] })[1], { kind: "blocked" });
  for (const stage of [...complete, ...state.providerDeployStageStates(atsCreateConfiguration, connected)]) {
    assert.equal(Object.isFrozen(stage), true);
  }
});
