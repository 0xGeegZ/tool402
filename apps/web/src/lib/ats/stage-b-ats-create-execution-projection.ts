import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const canonicalParametersHash = "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const issuerEvmAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const issuerHederaAccountId = "0.0.10430887";
const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1/";

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createStageBAtsCreateExecutionProjection() {
  const operationDescriptor = {
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
    omittedOptionalFields: ["complianceId", "identityRegistryId"],
  } as const;
  const parameters = {
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
    proceedRecipientsIds: [],
    proceedRecipientsData: [],
  } as const;
  const preimage = {
    protocol: "tool402:ats-parameters:v1",
    network: "hedera:testnet",
    chainId: 296,
    subjectPublicId: "riskscan_revenue_note_demo",
    offeringVersion: "ats_demo_v1",
    registryRevision: "ats_sdk_8_0_0_testnet_v2",
    operationKind: "ATS_CREATE",
    targetKind: "EVM_ADDRESS",
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
    operationDescriptor,
    parameters,
  } as const;
  const digest = keccak256(stringToHex(canonicalizeRequirements(preimage))).slice(2);
  if (digest !== canonicalParametersHash) throw new TypeError("invalid Stage B ATS configuration");

  const configuration = {
    ...preimage,
    sdkPackage: "@hashgraph/asset-tokenization-sdk",
    sdkVersion: "8.0.0",
    sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
    resolverHederaId: "0.0.9212226",
    resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a",
    m20EconomicsBinding: "NONE",
    canonicalParametersHash,
  } as const;

  return freeze({
    configuration,
    issuerEvmAddress,
    issuerHederaAccountId,
    mirrorNodeBaseUrl,
  });
}
