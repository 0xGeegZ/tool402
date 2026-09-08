import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const expectedCanonicalParametersHash =
  "eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f";
const sourceUrl = new URL(
  "../src/ats/local-unsigned-ats-create-configuration.ts",
  import.meta.url,
);
const configurationModule = await import(sourceUrl.href);

const expectedOperationDescriptor = {
  sdkPackage: "@hashgraph/asset-tokenization-sdk",
  sdkVersion: "8.0.0",
  creationFamily: "BOND_STANDARD",
  requestExport: "CreateBondRequest",
  requestConstructor: "new CreateBondRequest",
  methodExport: "Bond",
  method: "create",
  targetContractRole: "FACTORY_PROXY",
  factoryHederaId: "0.0.7708432",
  resolverHederaId: "0.0.7707874",
  mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
  rpcNodeBaseUrl: "https://testnet.hashio.io/api",
  configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
  configVersion: 1,
  omittedOptionalFields: ["complianceId", "identityRegistryId"],
};
const expectedParameters = {
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
  externalPausesIds: [],
  externalControlListsIds: [],
  externalKycListsIds: [],
  diamondOwnerAccount: "0x0000000000000000000000000000000000000402",
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
  proceedRecipientsIds: [],
  proceedRecipientsData: [],
};
const expectedProjection = {
  protocol: "tool402:ats-parameters:v1",
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  offeringVersion: "ats_demo_v1",
  registryRevision: "ats_sdk_8_0_0_testnet_v1",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0x5fa65ca30d1984701f10476664327f97c864a9d3",
  canonicalIssuerEvmAddress: "0x0000000000000000000000000000000000000402",
  principalPublicId: "tool402_ats_issuer_demo",
  role: "ISSUER",
  authorityVersion: "ats_issuer_demo_v1",
  sdkPackage: "@hashgraph/asset-tokenization-sdk",
  sdkVersion: "8.0.0",
  sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
  resolverHederaId: "0.0.7707874",
  resolverEvmAddress: "0xefef4cae9642631cfc6d997d6207ee48fa78fe42",
  m20EconomicsBinding: "NONE",
  operationDescriptor: expectedOperationDescriptor,
  parameters: expectedParameters,
  canonicalParametersHash: expectedCanonicalParametersHash,
};

function preimageFor(projection) {
  return {
    protocol: projection.protocol,
    network: projection.network,
    chainId: projection.chainId,
    subjectPublicId: projection.subjectPublicId,
    offeringVersion: projection.offeringVersion,
    registryRevision: projection.registryRevision,
    operationKind: projection.operationKind,
    targetKind: projection.targetKind,
    expectedTarget: projection.expectedTarget,
    operationDescriptor: projection.operationDescriptor,
    parameters: projection.parameters,
  };
}

test("exports only the private local unsigned ATS configuration helper", () => {
  assert.deepEqual(Object.keys(configurationModule).sort(), [
    "createLocalUnsignedAtsCreateConfiguration",
  ]);
});

test("returns the exact accepted local unsigned ATS_CREATE projection", () => {
  const projection =
    configurationModule.createLocalUnsignedAtsCreateConfiguration();

  assert.deepEqual(projection, expectedProjection);
  assert.equal(
    keccak256(stringToHex(canonicalizeRequirements(preimageFor(projection)))).slice(2),
    expectedCanonicalParametersHash,
  );
});

test("returns fresh fully frozen projection data on every call", () => {
  const first = configurationModule.createLocalUnsignedAtsCreateConfiguration();
  const second = configurationModule.createLocalUnsignedAtsCreateConfiguration();

  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.operationDescriptor, second.operationDescriptor);
  assert.notStrictEqual(first.parameters, second.parameters);

  for (const projection of [first, second]) {
    assert.equal(Object.isFrozen(projection), true);
    assert.equal(Object.isFrozen(projection.operationDescriptor), true);
    assert.equal(Object.isFrozen(projection.parameters), true);
    for (const values of [
      projection.operationDescriptor.omittedOptionalFields,
      projection.parameters.externalPausesIds,
      projection.parameters.externalControlListsIds,
      projection.parameters.externalKycListsIds,
      projection.parameters.proceedRecipientsIds,
      projection.parameters.proceedRecipientsData,
    ]) {
      assert.equal(Object.isFrozen(values), true);
    }
  }

  assert.notStrictEqual(
    first.operationDescriptor.omittedOptionalFields,
    second.operationDescriptor.omittedOptionalFields,
  );
  for (const field of [
    "externalPausesIds",
    "externalControlListsIds",
    "externalKycListsIds",
    "proceedRecipientsIds",
    "proceedRecipientsData",
  ]) {
    assert.notStrictEqual(first.parameters[field], second.parameters[field]);
  }
  assert.throws(() => {
    first.parameters.name = "changed";
  }, TypeError);
});

test("keeps the configuration helper private and free of execution capabilities", () => {
  const source = readFileSync(sourceUrl, "utf8");
  const backendPackage = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const backendPublicBarrel = readFileSync(
    new URL("../src/index.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /^\s*import(?:[\s\S]*?\sfrom\s+)?["']@hashgraph\/asset-tokenization-sdk["']|\bimport\s*\(\s*["']@hashgraph\/asset-tokenization-sdk["']\s*\)|\bNetwork\s*\.\s*(?:init|connect)\s*\(|\bnew\s+CreateBondRequest\s*\(|\bBond\s*\.\s*create\s*\(/mu,
  );
  assert.doesNotMatch(
    source,
    /\b(?:window|ethereum|MetaMask|wagmi|WalletConnect|createWalletClient|createPublicClient|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|process\s*\.\s*env|import\.meta\.env|commandAuthorities|ats_prepare_authority|external_prepare_command_admission|convex)\b/u,
  );
  assert.equal(
    backendPackage.dependencies?.["@hashgraph/asset-tokenization-sdk"],
    undefined,
  );
  assert.doesNotMatch(
    backendPublicBarrel,
    /createLocalUnsignedAtsCreateConfiguration/u,
  );
});
