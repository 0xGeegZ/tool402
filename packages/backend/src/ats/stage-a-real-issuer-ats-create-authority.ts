import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const EXPECTED_CANONICAL_PARAMETERS_HASH =
  "d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250";

export interface StageAPlannedCommandAuthority {
  readonly chainId: 296;
  readonly canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  readonly principalPublicId: "tool402_ats_issuer_testnet_v1";
  readonly role: "ISSUER";
  readonly ownedSubjectPublicIds: readonly ["riskscan_revenue_note_demo"];
  readonly authorityVersion: "ats_issuer_testnet_v1";
  readonly enabled: true;
}

export interface StageARealIssuerAtsCreateOperationDescriptor {
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

export interface StageARealIssuerAtsCreateParameters {
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
  readonly diamondOwnerAccount: "0xc89f87052c3e080b4a9b021d4930055031ef378e";
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

export interface StageARealIssuerAtsCreateConfiguration {
  readonly protocol: "tool402:ats-parameters:v1";
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly subjectPublicId: "riskscan_revenue_note_demo";
  readonly offeringVersion: "ats_demo_v1";
  readonly registryRevision: "ats_sdk_8_0_0_testnet_v1";
  readonly operationKind: "ATS_CREATE";
  readonly targetKind: "EVM_ADDRESS";
  readonly expectedTarget: "0x5fa65ca30d1984701f10476664327f97c864a9d3";
  readonly sdkPackage: "@hashgraph/asset-tokenization-sdk";
  readonly sdkVersion: "8.0.0";
  readonly sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==";
  readonly resolverHederaId: "0.0.7707874";
  readonly resolverEvmAddress: "0xefef4cae9642631cfc6d997d6207ee48fa78fe42";
  readonly m20EconomicsBinding: "NONE";
  readonly operationDescriptor: StageARealIssuerAtsCreateOperationDescriptor;
  readonly parameters: StageARealIssuerAtsCreateParameters;
  readonly canonicalParametersHash: typeof EXPECTED_CANONICAL_PARAMETERS_HASH;
}

export interface StageARealIssuerAtsCreateAuthority {
  readonly plannedCommandAuthority: StageAPlannedCommandAuthority;
  readonly atsCreateConfiguration: StageARealIssuerAtsCreateConfiguration;
}

type StageARealIssuerAtsCreatePreimage = Pick<
  StageARealIssuerAtsCreateConfiguration,
  | "protocol"
  | "network"
  | "chainId"
  | "subjectPublicId"
  | "offeringVersion"
  | "registryRevision"
  | "operationKind"
  | "targetKind"
  | "expectedTarget"
  | "operationDescriptor"
  | "parameters"
>;

function createPlannedCommandAuthority(): StageAPlannedCommandAuthority {
  return Object.freeze({
    chainId: 296,
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    principalPublicId: "tool402_ats_issuer_testnet_v1",
    role: "ISSUER",
    ownedSubjectPublicIds: Object.freeze([
      "riskscan_revenue_note_demo",
    ] as const),
    authorityVersion: "ats_issuer_testnet_v1",
    enabled: true,
  } satisfies StageAPlannedCommandAuthority);
}

function createOperationDescriptor(): StageARealIssuerAtsCreateOperationDescriptor {
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
    configId:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    configVersion: 1,
    omittedOptionalFields: Object.freeze([
      "complianceId",
      "identityRegistryId",
    ] as const),
  } satisfies StageARealIssuerAtsCreateOperationDescriptor);
}

function createParameters(): StageARealIssuerAtsCreateParameters {
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
    diamondOwnerAccount: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
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
    configId:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    configVersion: 1,
    proceedRecipientsIds: Object.freeze([] as const),
    proceedRecipientsData: Object.freeze([] as const),
  } satisfies StageARealIssuerAtsCreateParameters);
}

export function createStageARealIssuerAtsCreateAuthority(): StageARealIssuerAtsCreateAuthority {
  const plannedCommandAuthority = createPlannedCommandAuthority();
  const operationDescriptor = createOperationDescriptor();
  const parameters = createParameters();
  if (
    plannedCommandAuthority.canonicalSignerAddress
    !== parameters.diamondOwnerAccount
  ) {
    throw new TypeError("invalid Stage A ATS authority");
  }

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
  } satisfies StageARealIssuerAtsCreatePreimage;
  const canonicalParametersHash = keccak256(
    stringToHex(canonicalizeRequirements(preimage)),
  ).slice(2);
  if (canonicalParametersHash !== EXPECTED_CANONICAL_PARAMETERS_HASH) {
    throw new TypeError("invalid Stage A ATS configuration");
  }

  const atsCreateConfiguration = Object.freeze({
    protocol: preimage.protocol,
    network: preimage.network,
    chainId: preimage.chainId,
    subjectPublicId: preimage.subjectPublicId,
    offeringVersion: preimage.offeringVersion,
    registryRevision: preimage.registryRevision,
    operationKind: preimage.operationKind,
    targetKind: preimage.targetKind,
    expectedTarget: preimage.expectedTarget,
    sdkPackage: "@hashgraph/asset-tokenization-sdk",
    sdkVersion: "8.0.0",
    sdkIntegrity:
      "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
    resolverHederaId: "0.0.7707874",
    resolverEvmAddress: "0xefef4cae9642631cfc6d997d6207ee48fa78fe42",
    m20EconomicsBinding: "NONE",
    operationDescriptor: preimage.operationDescriptor,
    parameters: preimage.parameters,
    canonicalParametersHash,
  } satisfies StageARealIssuerAtsCreateConfiguration);

  return Object.freeze({
    plannedCommandAuthority,
    atsCreateConfiguration,
  } satisfies StageARealIssuerAtsCreateAuthority);
}
