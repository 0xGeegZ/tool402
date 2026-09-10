import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const sourceUrl = new URL("../src/lib/ats/stage-b-ats-create-execution-projection.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const canonicalParametersHash = "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const issuerEvmAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const issuerHederaAccountId = "0.0.10430887";
const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1/";

const expectedConfiguration = Object.freeze({
  protocol: "tool402:ats-parameters:v1",
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  offeringVersion: "ats_demo_v1",
  registryRevision: "ats_sdk_8_0_0_testnet_v2",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  sdkPackage: "@hashgraph/asset-tokenization-sdk",
  sdkVersion: "8.0.0",
  sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
  resolverHederaId: "0.0.9212226",
  resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a",
  m20EconomicsBinding: "NONE",
  operationDescriptor: Object.freeze({
    sdkPackage: "@hashgraph/asset-tokenization-sdk",
    sdkVersion: "8.0.0",
    creationFamily: "BOND_STANDARD",
    requestExport: "CreateBondRequest",
    requestConstructor: "new CreateBondRequest",
    methodExport: "Bond",
    method: "create",
    targetContractRole: "FACTORY_PROXY",
    factoryHederaId: "0.0.9213391",
    resolverHederaId: "0.0.9212226",
    mirrorNodeBaseUrl,
    rpcNodeBaseUrl: "https://testnet.hashio.io/api",
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
    configVersion: 1,
    omittedOptionalFields: Object.freeze(["complianceId", "identityRegistryId"]),
  }),
  parameters: Object.freeze({
    name: "Tool402 RiskScan Revenue Note Demo",
    symbol: "T402RN",
    isin: "XS402RISKN02",
    decimals: 0,
    isWhiteList: true,
    erc20VotesActivated: false,
    isControllable: false,
    arePartitionsProtected: false,
    isMultiPartition: false,
    clearingActive: false,
    internalKycActivated: false,
    externalPausesIds: Object.freeze([]),
    externalControlListsIds: Object.freeze([]),
    externalKycListsIds: Object.freeze([]),
    diamondOwnerAccount: issuerEvmAddress,
    currency: "0x555344",
    numberOfUnits: "1000",
    nominalValue: "1",
    nominalValueDecimals: 0,
    startingDate: "1789430400",
    maturityDate: "1798675200",
    regulationType: 1,
    regulationSubType: 0,
    isCountryControlListWhiteList: false,
    countries: "",
    info: "Tool402 testnet demo revenue note; no real-world investment or return claim.",
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
    configVersion: 1,
    proceedRecipientsIds: Object.freeze([]),
    proceedRecipientsData: Object.freeze([]),
  }),
  canonicalParametersHash,
});

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

test("requires the declared M49 execution-projection source before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M49 source module: ${sourcePath}`);
});

let api;

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest("returns a detached, deeply frozen complete M42 real-issuer execution projection and rehashes its exact preimage", () => {
  assert.deepEqual(Object.keys(api).sort(), ["createStageBAtsCreateExecutionProjection"]);

  const first = api.createStageBAtsCreateExecutionProjection();
  const second = api.createStageBAtsCreateExecutionProjection();
  const expected = {
    configuration: expectedConfiguration,
    issuerEvmAddress,
    issuerHederaAccountId,
    mirrorNodeBaseUrl,
  };

  assert.deepEqual(first, expected);
  assert.deepEqual(second, expected);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.configuration, second.configuration);
  assert.notStrictEqual(first.configuration.operationDescriptor, second.configuration.operationDescriptor);
  assert.notStrictEqual(first.configuration.parameters, second.configuration.parameters);
  assertDeepFrozen(first);
  assertDeepFrozen(second);
  assert.equal(
    keccak256(stringToHex(canonicalizeRequirements(preimageFor(first.configuration)))).slice(2),
    canonicalParametersHash,
  );
  assert.equal(first.configuration.canonicalParametersHash, canonicalParametersHash);
  assert.equal(first.configuration.parameters.diamondOwnerAccount, issuerEvmAddress);
  assert.throws(() => { first.configuration.parameters.name = "changed"; }, TypeError);
});

implementedTest("keeps the browser execution projection local, detached, and free of caller, Backend, provider, and network capability", () => {
  const source = readFileSync(sourcePath, "utf8");

  assert.doesNotMatch(source, /packages\/backend|stage-b-issuer-ats-create-authority|ats-create-configuration-v2|ats-create-configuration|stage-b-ats-create-command-projection/u);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|window|ethereum|MetaMask|wallet|provider|process\.env|import\.meta\.env|localStorage|sessionStorage|indexedDB|Date|setTimeout|setInterval|convex)\b/u);
  assert.doesNotMatch(source, /\b(?:function|const|let)\s+createStageBAtsCreateExecutionProjection\s*\([^)]*[^\s)]/u);
});
