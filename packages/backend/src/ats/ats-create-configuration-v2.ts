import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const EXPECTED_CANONICAL_PARAMETERS_HASH =
  "39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a";

export interface AtsCreateConfigurationV2OperationDescriptor {
  readonly sdkPackage: "@hashgraph/asset-tokenization-sdk";
  readonly sdkVersion: "8.0.0";
  readonly creationFamily: "BOND_STANDARD";
  readonly requestExport: "CreateBondRequest";
  readonly requestConstructor: "new CreateBondRequest";
  readonly methodExport: "Bond";
  readonly method: "create";
  readonly targetContractRole: "FACTORY_PROXY";
  readonly factoryHederaId: "0.0.9213391";
  readonly resolverHederaId: "0.0.9212226";
  readonly mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/";
  readonly rpcNodeBaseUrl: "https://testnet.hashio.io/api";
  readonly configId: "0x0000000000000000000000000000000000000000000000000000000000000002";
  readonly configVersion: 1;
  readonly omittedOptionalFields: readonly ["complianceId", "identityRegistryId"];
}

export interface AtsCreateConfigurationV2Parameters {
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

export interface AtsCreateConfigurationV2 {
  readonly protocol: "tool402:ats-parameters:v1";
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly subjectPublicId: "riskscan_revenue_note_demo";
  readonly offeringVersion: "ats_demo_v1";
  readonly registryRevision: "ats_sdk_8_0_0_testnet_v2";
  readonly operationKind: "ATS_CREATE";
  readonly targetKind: "EVM_ADDRESS";
  readonly expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
  readonly canonicalIssuerEvmAddress: "0x0000000000000000000000000000000000000402";
  readonly principalPublicId: "tool402_ats_issuer_demo";
  readonly role: "ISSUER";
  readonly authorityVersion: "ats_issuer_demo_v1";
  readonly sdkPackage: "@hashgraph/asset-tokenization-sdk";
  readonly sdkVersion: "8.0.0";
  readonly sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==";
  readonly resolverHederaId: "0.0.9212226";
  readonly resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a";
  readonly m20EconomicsBinding: "NONE";
  readonly operationDescriptor: AtsCreateConfigurationV2OperationDescriptor;
  readonly parameters: AtsCreateConfigurationV2Parameters;
  readonly canonicalParametersHash: typeof EXPECTED_CANONICAL_PARAMETERS_HASH;
}

type AtsCreateConfigurationV2Preimage = Pick<
  AtsCreateConfigurationV2,
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

function createOperationDescriptor(): AtsCreateConfigurationV2OperationDescriptor {
  return Object.freeze({
    sdkPackage: "@hashgraph/asset-tokenization-sdk", sdkVersion: "8.0.0",
    creationFamily: "BOND_STANDARD", requestExport: "CreateBondRequest",
    requestConstructor: "new CreateBondRequest", methodExport: "Bond", method: "create",
    targetContractRole: "FACTORY_PROXY", factoryHederaId: "0.0.9213391",
    resolverHederaId: "0.0.9212226",
    mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
    rpcNodeBaseUrl: "https://testnet.hashio.io/api",
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
    configVersion: 1,
    omittedOptionalFields: Object.freeze(["complianceId", "identityRegistryId"] as const),
  } satisfies AtsCreateConfigurationV2OperationDescriptor);
}

function createParameters(): AtsCreateConfigurationV2Parameters {
  return Object.freeze({
    name: "Tool402 RiskScan Revenue Note Demo", symbol: "T402RN", isin: "XS402RISKN02",
    decimals: 0, isWhiteList: true, erc20VotesActivated: false, isControllable: false,
    arePartitionsProtected: false, isMultiPartition: false, clearingActive: false,
    internalKycActivated: false, externalPausesIds: Object.freeze([] as const),
    externalControlListsIds: Object.freeze([] as const), externalKycListsIds: Object.freeze([] as const),
    diamondOwnerAccount: "0x0000000000000000000000000000000000000402", currency: "0x555344",
    numberOfUnits: "1000", nominalValue: "1", nominalValueDecimals: 0,
    startingDate: "1789430400", maturityDate: "1798675200", regulationType: 1,
    regulationSubType: 0, isCountryControlListWhiteList: false, countries: "",
    info: "Tool402 testnet demo revenue note; no real-world investment or return claim.",
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
    configVersion: 1, proceedRecipientsIds: Object.freeze([] as const),
    proceedRecipientsData: Object.freeze([] as const),
  } satisfies AtsCreateConfigurationV2Parameters);
}

export function createAtsCreateConfigurationV2(): AtsCreateConfigurationV2 {
  const operationDescriptor = createOperationDescriptor();
  const parameters = createParameters();
  const preimage = {
    protocol: "tool402:ats-parameters:v1", network: "hedera:testnet", chainId: 296,
    subjectPublicId: "riskscan_revenue_note_demo", offeringVersion: "ats_demo_v1",
    registryRevision: "ats_sdk_8_0_0_testnet_v2", operationKind: "ATS_CREATE",
    targetKind: "EVM_ADDRESS", expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
    operationDescriptor, parameters,
  } satisfies AtsCreateConfigurationV2Preimage;
  const canonicalParametersHash = keccak256(stringToHex(canonicalizeRequirements(preimage))).slice(2);
  if (canonicalParametersHash !== EXPECTED_CANONICAL_PARAMETERS_HASH) {
    throw new TypeError("invalid ATS configuration V2");
  }
  return Object.freeze({
    protocol: preimage.protocol, network: preimage.network, chainId: preimage.chainId,
    subjectPublicId: preimage.subjectPublicId, offeringVersion: preimage.offeringVersion,
    registryRevision: preimage.registryRevision, operationKind: preimage.operationKind,
    targetKind: preimage.targetKind, expectedTarget: preimage.expectedTarget,
    canonicalIssuerEvmAddress: "0x0000000000000000000000000000000000000402",
    principalPublicId: "tool402_ats_issuer_demo", role: "ISSUER", authorityVersion: "ats_issuer_demo_v1",
    sdkPackage: "@hashgraph/asset-tokenization-sdk", sdkVersion: "8.0.0",
    sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
    resolverHederaId: "0.0.9212226", resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a",
    m20EconomicsBinding: "NONE", operationDescriptor, parameters, canonicalParametersHash,
  } satisfies AtsCreateConfigurationV2);
}
