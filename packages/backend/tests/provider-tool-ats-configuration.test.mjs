import assert from "node:assert/strict";
import test from "node:test";

import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

import {
  createProviderToolAtsConfiguration,
} from "../src/ats/provider-tool-ats-configuration.ts";

const signer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const suffixA = "a".repeat(32);
const suffixB = "b".repeat(32);

function input(suffix, overrides = {}) {
  return {
    toolPublicId: `tool_${suffix}`,
    subjectPublicId: `tool_${suffix}`,
    title: "RiskScan Revenue Note",
    canonicalSignerAddress: signer,
    ...overrides,
  };
}

function preimageFor(configuration) {
  return {
    protocol: configuration.protocol,
    network: configuration.network,
    chainId: configuration.chainId,
    subjectPublicId: configuration.subjectPublicId,
    offeringVersion: configuration.offeringVersion,
    registryRevision: configuration.registryRevision,
    operationKind: configuration.operationKind,
    targetKind: configuration.targetKind,
    expectedTarget: configuration.expectedTarget,
    operationDescriptor: configuration.operationDescriptor,
    parameters: configuration.parameters,
  };
}

function assertDeepFrozen(value) {
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === "object") assertDeepFrozen(child);
  }
}

test("derives detached deterministic selected-tool configurations from durable admitted fields", () => {
  const first = createProviderToolAtsConfiguration(input(suffixA));
  const repeated = createProviderToolAtsConfiguration(input(suffixA));
  const second = createProviderToolAtsConfiguration(input(suffixB));

  assert.deepEqual(first, repeated);
  assert.notStrictEqual(first, repeated);
  assert.notStrictEqual(first.atsCreateConfiguration, repeated.atsCreateConfiguration);
  assert.equal(first.atsCreateConfiguration.parameters.name, "RiskScan Revenue Note");
  assert.equal(first.atsCreateConfiguration.parameters.info, `Tool402 testnet demo revenue note; no real-world investment or return claim. Tool ID: tool_${suffixA}`);
  assert.equal(second.atsCreateConfiguration.parameters.name, first.atsCreateConfiguration.parameters.name);
  assert.notEqual(second.atsCreateConfiguration.subjectPublicId, first.atsCreateConfiguration.subjectPublicId);
  assert.notEqual(second.atsCreateConfiguration.parameters.info, first.atsCreateConfiguration.parameters.info);
  assert.notEqual(second.canonicalParametersHash, first.canonicalParametersHash);
  assert.equal(second.atsCreateConfiguration.expectedTarget, first.atsCreateConfiguration.expectedTarget);
  assert.equal(second.atsCreateConfiguration.resolverEvmAddress, first.atsCreateConfiguration.resolverEvmAddress);
  assert.equal(second.atsCreateConfiguration.parameters.diamondOwnerAccount, signer);
  assert.equal(Object.hasOwn(first, "plannedCommandAuthority"), false);
  assertDeepFrozen(first);

  assert.equal(
    keccak256(stringToHex(canonicalizeRequirements(preimageFor(first.atsCreateConfiguration)))).slice(2),
    first.canonicalParametersHash,
  );
  assert.equal(first.atsCreateConfiguration.canonicalParametersHash, first.canonicalParametersHash);
});

test("rejects invalid selected-tool identities, title, and signer at the private boundary", () => {
  for (const overrides of [
    { toolPublicId: `tool_${suffixA}`, subjectPublicId: `tool_${suffixB}` },
    { toolPublicId: "riskscan_revenue_note_demo" },
    { toolPublicId: `tool_${suffixA.toUpperCase()}` },
    { canonicalSignerAddress: "0x1111111111111111111111111111111111111111" },
    { canonicalSignerAddress: signer.toUpperCase() },
    { title: "" },
    { title: "x".repeat(101) },
    { title: "\ud800" },
  ]) {
    assert.throws(() => createProviderToolAtsConfiguration(input(suffixA, overrides)), TypeError);
  }
  const accessorBacked = input(suffixA);
  Object.defineProperty(accessorBacked, "title", { enumerable: true, get() { throw new Error("must not read accessor"); } });
  assert.throws(() => createProviderToolAtsConfiguration(accessorBacked), TypeError);
});
