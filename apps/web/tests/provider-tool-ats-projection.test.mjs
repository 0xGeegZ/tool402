import assert from "node:assert/strict";
import test from "node:test";

import { decodeFunctionData } from "viem";
import factoryArtifact from "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json" with { type: "json" };

import { createProviderToolAtsConfiguration } from "../../../packages/backend/src/ats/provider-tool-ats-configuration.ts";
import {
  createProviderToolAtsProjection,
} from "../src/lib/ats/provider-tool-ats-projection.ts";
import {
  buildFactoryDeployBondRequest,
  encodeFactoryDeployBond,
} from "../src/lib/ats/factory-deploy-bond.ts";

const signer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const suffixA = "a".repeat(32);
const suffixB = "b".repeat(32);

function durableProjection(suffix) {
  const configured = createProviderToolAtsConfiguration({
    toolPublicId: `tool_${suffix}`,
    subjectPublicId: `tool_${suffix}`,
    title: "RiskScan Revenue Note",
    canonicalSignerAddress: signer,
  });
  return {
    toolPublicId: `tool_${suffix}`,
    offeringPublicId: `offering_${suffix}`,
    configuration: configured.atsCreateConfiguration,
  };
}

test("validates selected-tool deployment projection, omits authority, and produces distinct Factory calldata", () => {
  const first = createProviderToolAtsProjection(durableProjection(suffixA));
  const second = createProviderToolAtsProjection(durableProjection(suffixB));
  assert.equal(first.toolPublicId, `tool_${suffixA}`);
  assert.equal(first.offeringPublicId, `offering_${suffixA}`);
  assert.equal(Object.hasOwn(first, "canonicalSignerAddress"), false);
  assert.equal(Object.hasOwn(first, "principalPublicId"), false);
  assert.equal(Object.hasOwn(first, "authorityVersion"), false);
  assert.equal(Object.hasOwn(first, "plannedCommandAuthority"), false);
  assert.equal(Object.isFrozen(first), true);

  const firstRequest = buildFactoryDeployBondRequest(first.configuration, { issuerEvmAddress: signer });
  const secondRequest = buildFactoryDeployBondRequest(second.configuration, { issuerEvmAddress: signer });
  const firstData = encodeFactoryDeployBond(firstRequest);
  const secondData = encodeFactoryDeployBond(secondRequest);
  assert.notEqual(firstData, secondData);
  const decoded = decodeFunctionData({ abi: factoryArtifact.abi, data: firstData });
  assert.equal(decoded.functionName, "deployBond");
  assert.equal(decoded.args[0].security.erc20MetadataInfo.name, "RiskScan Revenue Note");
  assert.equal(decoded.args[1].additionalSecurityData.info, `Tool402 testnet demo revenue note; no real-world investment or return claim. Tool ID: tool_${suffixA}`);
  assert.equal(decoded.args[0].security.resolver.toLowerCase(), "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a");
  assert.equal(decoded.args[0].security.rbacs.length, 1);
  assert.equal(decoded.args[0].security.rbacs[0].role, `0x${"0".repeat(64)}`);
  assert.equal(decoded.args[0].security.rbacs[0].members.length, 1);
  assert.equal(decoded.args[0].security.rbacs[0].members[0].toLowerCase(), signer);
  assert.equal(decoded.args[0].security.maxSupply, 1000n);
});

test("fails closed on identity/configuration mismatch and surplus public fields", () => {
  const selected = durableProjection(suffixA);
  for (const mutation of [
    (value) => { value.toolPublicId = `tool_${suffixB}`; },
    (value) => { value.offeringPublicId = `offering_${suffixB}`; },
    (value) => { value.configuration.subjectPublicId = `tool_${suffixB}`; },
    (value) => { value.canonicalSignerAddress = signer; },
  ]) {
    const value = structuredClone(selected);
    mutation(value);
    assert.throws(() => createProviderToolAtsProjection(value), TypeError);
  }
});
