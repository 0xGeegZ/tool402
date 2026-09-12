import assert from "node:assert/strict";
import test from "node:test";

import { createProviderToolAtsConfiguration } from "../../../packages/backend/src/ats/provider-tool-ats-configuration.ts";
import { parseProviderToolDeployment } from "../src/lib/provider-tool-deployment-client.ts";

const toolPublicId = `tool_${"ab".repeat(16)}`;
const offeringPublicId = `offering_${"ab".repeat(16)}`;
const signer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const durableValues = {
  toolName: "Second RiskScan",
  customerProblem: "Assess request risk before continuing a workflow.",
  qualifyingResource: "riskscan-local-assessment",
  quickPriceTinybars: "10000000",
  standardPriceTinybars: "10000000",
  targetAgentCustomers: ["Security-oriented agent operators"],
  useOfFunds: ["Maintain provider documentation."],
  risks: ["Testnet terms promise no yield."],
};

test("accepts only an exact selected-tool ATS configuration from the protected deployment response", () => {
  const configuration = createProviderToolAtsConfiguration({
    toolPublicId, subjectPublicId: toolPublicId, title: "Second RiskScan", canonicalSignerAddress: signer,
  }).atsCreateConfiguration;
  const parsed = parseProviderToolDeployment({
    tool: { toolPublicId, subjectPublicId: toolPublicId, offeringPublicId, title: "Second RiskScan", state: "DRAFT" },
    atsCreateConfigurationJson: JSON.stringify(configuration),
    atsAttemptPublicId: null,
    atsCandidate: null,
    durableValues,
  }, toolPublicId);
  assert.equal(parsed?.ats?.command.subjectPublicId, toolPublicId);
  assert.equal(parsed?.ats?.display.revenueNote.name, "Second RiskScan");
  assert.equal(parsed?.durableValues?.quickPrice, "0.1");
});

test("fails closed for a mismatched tool or a tampered configuration", () => {
  const configuration = createProviderToolAtsConfiguration({
    toolPublicId, subjectPublicId: toolPublicId, title: "Second RiskScan", canonicalSignerAddress: signer,
  }).atsCreateConfiguration;
  assert.equal(parseProviderToolDeployment({
    tool: { toolPublicId, subjectPublicId: toolPublicId, offeringPublicId: "offering_other", title: "Second RiskScan", state: "DRAFT" },
    atsCreateConfigurationJson: JSON.stringify(configuration),
    atsAttemptPublicId: null,
    atsCandidate: null,
    durableValues,
  }, toolPublicId), null);
  assert.equal(parseProviderToolDeployment({
    tool: { toolPublicId, subjectPublicId: toolPublicId, offeringPublicId, title: "Second RiskScan", state: "DRAFT" },
    atsCreateConfigurationJson: JSON.stringify({ ...configuration, canonicalParametersHash: "0".repeat(64) }),
    atsAttemptPublicId: null,
    atsCandidate: null,
    durableValues,
  }, toolPublicId), null);
});

test("accepts one exact submitted ATS candidate only for the selected pending tool", () => {
  const configuration = createProviderToolAtsConfiguration({
    toolPublicId, subjectPublicId: toolPublicId, title: "Second RiskScan", canonicalSignerAddress: signer,
  }).atsCreateConfiguration;
  const input = {
    tool: { toolPublicId, subjectPublicId: toolPublicId, offeringPublicId, title: "Second RiskScan", state: "ASSET_PENDING" },
    atsCreateConfigurationJson: JSON.stringify(configuration),
    atsAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
    atsCandidate: { transactionId: "0.0.123-1735689600-123456789", evmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    durableValues,
  };
  assert.deepEqual(parseProviderToolDeployment(input, toolPublicId)?.atsCandidate, input.atsCandidate);
  assert.equal(parseProviderToolDeployment({ ...input, atsCandidate: { ...input.atsCandidate, extra: true } }, toolPublicId), null);
  assert.equal(parseProviderToolDeployment({ ...input, atsCandidate: { ...input.atsCandidate, evmAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } }, toolPublicId), null);
  assert.equal(parseProviderToolDeployment({ ...input, tool: { ...input.tool, state: "READY" }, atsAttemptPublicId: null }, toolPublicId), null);
});
