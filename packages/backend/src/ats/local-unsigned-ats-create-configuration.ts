import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const EXPECTED_CANONICAL_PARAMETERS_HASH =
  "eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f";

export interface LocalUnsignedAtsCreateOperationDescriptor {
  readonly sdkPackage: "@hashgraph/asset-tokenization-sdk";
  readonly sdkVersion: "8.0.0";
  readonly creationFamily: "BOND_STANDARD";
  readonly requestExport: "CreateBondRequest";
  readonly requestConstructor: "new CreateBondRequest";
  readonly methodExport: "Bond";
  readonly method: "create";
  readonly targetContractRole: "FACTORY_PROXY";
  readonly factoryHederaId: "0.0.7708432";
  readonly resolverHederaId: "0.0.7707874";
  readonly mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/";
  readonly rpcNodeBaseUrl: "https://testnet.hashio.io/api";
  readonly configId: "0x0000000000000000000000000000000000000000000000000000000000000002";
  readonly configVersion: 1;
  readonly omittedOptionalFields: readonly ["complianceId", "identityRegistryId"];
}

export interface LocalUnsignedAtsCreateParameters {
  readonly name: "Tool402 RiskScan Revenue Note Demo";
  readonly symbol: "T402RN";
  readonly isin: "XS402RISKN02";
  readonly decimals: 0;
  readonly isWhiteList: true;
  readonly erc20VotesActivated: false;
  readonly isControllable: false;
  readonly arePartitionsProtected: false;
  readonly isMultiPartition: false;
  readonly clearingActive: false;
  readonly internalKycActivated: false;
  readonly externalPausesIds: readonly [];
  readonly externalControlListsIds: readonly [];
  readonly externalKycListsIds: readonly [];
  readonly diamondOwnerAccount: "0x0000000000000000000000000000000000000402";
  readonly currency: "0x555344";
  readonly numberOfUnits: "1000";
  readonly nominalValue: "1";
  readonly nominalValueDecimals: 0;
  readonly startingDate: "1789430400";
  readonly maturityDate: "1798675200";
  readonly regulationType: 1;
  readonly regulationSubType: 0;
  readonly isCountryControlListWhiteList: false;
  readonly countries: "";
  readonly info: "Tool402 testnet demo revenue note; no real-world investment or return claim.";
  readonly configId: "0x0000000000000000000000000000000000000000000000000000000000000002";
  readonly configVersion: 1;
  readonly proceedRecipientsIds: readonly [];
  readonly proceedRecipientsData: readonly [];
}

export interface LocalUnsignedAtsCreateConfiguration {
  readonly protocol: "tool402:ats-parameters:v1";
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly subjectPublicId: "riskscan_revenue_note_demo";
  readonly offeringVersion: "ats_demo_v1";
  readonly registryRevision: "ats_sdk_8_0_0_testnet_v1";
  readonly operationKind: "ATS_CREATE";
  readonly targetKind: "EVM_ADDRESS";
  readonly expectedTarget: "0x5fa65ca30d1984701f10476664327f97c864a9d3";
  readonly canonicalIssuerEvmAddress: "0x0000000000000000000000000000000000000402";
  readonly principalPublicId: "tool402_ats_issuer_demo";
  readonly role: "ISSUER";
  readonly authorityVersion: "ats_issuer_demo_v1";
  readonly sdkPackage: "@hashgraph/asset-tokenization-sdk";
  readonly sdkVersion: "8.0.0";
  readonly sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==";
  readonly resolverHederaId: "0.0.7707874";
  readonly resolverEvmAddress: "0xefef4cae9642631cfc6d997d6207ee48fa78fe42";
  readonly m20EconomicsBinding: "NONE";
  readonly operationDescriptor: LocalUnsignedAtsCreateOperationDescriptor;
  readonly parameters: LocalUnsignedAtsCreateParameters;
  readonly canonicalParametersHash: typeof EXPECTED_CANONICAL_PARAMETERS_HASH;
}

function createOperationDescriptor(): LocalUnsignedAtsCreateOperationDescriptor {
  return Object.freeze({
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
    omittedOptionalFields: Object.freeze([
      "complianceId",
      "identityRegistryId",
    ] as const),
  } satisfies LocalUnsignedAtsCreateOperationDescriptor);
}

function createParameters(): LocalUnsignedAtsCreateParameters {
  return Object.freeze({
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
    externalPausesIds: Object.freeze([] as const),
    externalControlListsIds: Object.freeze([] as const),
    externalKycListsIds: Object.freeze([] as const),
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
    proceedRecipientsIds: Object.freeze([] as const),
    proceedRecipientsData: Object.freeze([] as const),
  } satisfies LocalUnsignedAtsCreateParameters);
}

export function createLocalUnsignedAtsCreateConfiguration(): LocalUnsignedAtsCreateConfiguration {
  const operationDescriptor = createOperationDescriptor();
  const parameters = createParameters();
  const preimage = {
    protocol: "tool402:ats-parameters:v1",
    network: "hedera:testnet",
    chainId: 296,
    subjectPublicId: "riskscan_revenue_note_demo",
    offeringVersion: "ats_demo_v1",
    registryRevision: "ats_sdk_8_0_0_testnet_v1",
    operationKind: "ATS_CREATE",
    targetKind: "EVM_ADDRESS",
    expectedTarget: "0x5fa65ca30d1984701f10476664327f97c864a9d3",
    operationDescriptor,
    parameters,
  };
  const canonicalParametersHash = keccak256(
    stringToHex(canonicalizeRequirements(preimage)),
  ).slice(2);
  if (canonicalParametersHash !== EXPECTED_CANONICAL_PARAMETERS_HASH) {
    throw new TypeError("invalid local unsigned ATS configuration");
  }

  return Object.freeze({
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
    operationDescriptor,
    parameters,
    canonicalParametersHash,
  } satisfies LocalUnsignedAtsCreateConfiguration);
}
