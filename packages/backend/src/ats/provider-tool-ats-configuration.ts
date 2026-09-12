import { canonicalizeRequirements, parseProviderToolId } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

export type AdmittedToolConfigurationInput = Readonly<{
  toolPublicId: string;
  subjectPublicId: string;
  title: string;
  canonicalSignerAddress: string;
}>;

type AtsCreateParameters = Readonly<{
  name: string;
  symbol: "T402RN";
  isin: "XS402RISKN02";
  decimals: 0;
  isWhiteList: true;
  erc20VotesActivated: false;
  isControllable: false;
  arePartitionsProtected: false;
  isMultiPartition: false;
  clearingActive: false;
  internalKycActivated: false;
  externalPausesIds: readonly [];
  externalControlListsIds: readonly [];
  externalKycListsIds: readonly [];
  diamondOwnerAccount: string;
  currency: "0x555344";
  numberOfUnits: "1000";
  nominalValue: "1";
  nominalValueDecimals: 0;
  startingDate: "1789430400";
  maturityDate: "1798675200";
  regulationType: 1;
  regulationSubType: 0;
  isCountryControlListWhiteList: false;
  countries: "";
  info: string;
  configId: "0x0000000000000000000000000000000000000000000000000000000000000002";
  configVersion: 1;
  proceedRecipientsIds: readonly [];
  proceedRecipientsData: readonly [];
}>;

type AtsCreateOperationDescriptor = Readonly<{
  sdkPackage: "@hashgraph/asset-tokenization-sdk";
  sdkVersion: "8.0.0";
  creationFamily: "BOND_STANDARD";
  requestExport: "CreateBondRequest";
  requestConstructor: "new CreateBondRequest";
  methodExport: "Bond";
  method: "create";
  targetContractRole: "FACTORY_PROXY";
  factoryHederaId: "0.0.9213391";
  resolverHederaId: "0.0.9212226";
  mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/";
  rpcNodeBaseUrl: "https://testnet.hashio.io/api";
  configId: "0x0000000000000000000000000000000000000000000000000000000000000002";
  configVersion: 1;
  omittedOptionalFields: readonly ["complianceId", "identityRegistryId"];
}>;

export type ProviderToolAtsCreateConfiguration = Readonly<{
  protocol: "tool402:ats-parameters:v1";
  network: "hedera:testnet";
  chainId: 296;
  subjectPublicId: string;
  offeringVersion: "ats_demo_v1";
  registryRevision: "ats_sdk_8_0_0_testnet_v2";
  operationKind: "ATS_CREATE";
  targetKind: "EVM_ADDRESS";
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
  sdkPackage: "@hashgraph/asset-tokenization-sdk";
  sdkVersion: "8.0.0";
  sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==";
  resolverHederaId: "0.0.9212226";
  resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a";
  m20EconomicsBinding: "NONE";
  operationDescriptor: AtsCreateOperationDescriptor;
  parameters: AtsCreateParameters;
  canonicalParametersHash: string;
}>;

export type ProviderToolAtsConfiguration = Readonly<{
  atsCreateConfiguration: ProviderToolAtsCreateConfiguration;
  canonicalPreimage: Readonly<{
    protocol: "tool402:ats-parameters:v1";
    network: "hedera:testnet";
    chainId: 296;
    subjectPublicId: string;
    offeringVersion: "ats_demo_v1";
    registryRevision: "ats_sdk_8_0_0_testnet_v2";
    operationKind: "ATS_CREATE";
    targetKind: "EVM_ADDRESS";
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
    operationDescriptor: AtsCreateOperationDescriptor;
    parameters: AtsCreateParameters;
  }>;
  canonicalParametersHash: string;
}>;

const canonicalSigner = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const titleControlCharacter = /[\u0000-\u001F\u007F-\u009F]/u;

function reject(): never {
  throw new TypeError("invalid provider-tool ATS configuration");
}

function validTitle(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.trim() === value
    && !titleControlCharacter.test(value)
    && new TextEncoder().encode(value).byteLength <= 100
    && !hasUnpairedSurrogate(value);
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) return true;
  }
  return false;
}

function readInput(input: AdmittedToolConfigurationInput): AdmittedToolConfigurationInput {
  try {
    if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return reject();
    const fields = ["toolPublicId", "subjectPublicId", "title", "canonicalSignerAddress"] as const;
    const keys = Reflect.ownKeys(input);
    if (keys.length !== fields.length || keys.some((key) => (
      typeof key !== "string" || !fields.includes(key as (typeof fields)[number])
    ))) return reject();
    const values = Object.fromEntries(fields.map((field) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined || descriptor.enumerable !== true || !Object.hasOwn(descriptor, "value")
        || Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set")
      ) return reject();
      return [field, descriptor.value];
    }));
    const toolPublicId = parseProviderToolId(values.toolPublicId);
    if (
      toolPublicId === null
      || values.subjectPublicId !== toolPublicId
      || !validTitle(values.title)
      || values.canonicalSignerAddress !== canonicalSigner
    ) return reject();
    return Object.freeze({
      toolPublicId,
      subjectPublicId: toolPublicId,
      title: values.title,
      canonicalSignerAddress: canonicalSigner,
    });
  } catch {
    return reject();
  }
}

function operationDescriptor(): AtsCreateOperationDescriptor {
  return Object.freeze({
    sdkPackage: "@hashgraph/asset-tokenization-sdk", sdkVersion: "8.0.0",
    creationFamily: "BOND_STANDARD", requestExport: "CreateBondRequest",
    requestConstructor: "new CreateBondRequest", methodExport: "Bond", method: "create",
    targetContractRole: "FACTORY_PROXY", factoryHederaId: "0.0.9213391",
    resolverHederaId: "0.0.9212226", mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
    rpcNodeBaseUrl: "https://testnet.hashio.io/api",
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
    configVersion: 1,
    omittedOptionalFields: Object.freeze(["complianceId", "identityRegistryId"] as const),
  });
}

function parameters(input: AdmittedToolConfigurationInput): AtsCreateParameters {
  return Object.freeze({
    name: input.title, symbol: "T402RN", isin: "XS402RISKN02", decimals: 0,
    isWhiteList: true, erc20VotesActivated: false, isControllable: false,
    arePartitionsProtected: false, isMultiPartition: false, clearingActive: false,
    internalKycActivated: false, externalPausesIds: Object.freeze([] as const),
    externalControlListsIds: Object.freeze([] as const), externalKycListsIds: Object.freeze([] as const),
    diamondOwnerAccount: input.canonicalSignerAddress, currency: "0x555344", numberOfUnits: "1000",
    nominalValue: "1", nominalValueDecimals: 0, startingDate: "1789430400", maturityDate: "1798675200",
    regulationType: 1, regulationSubType: 0, isCountryControlListWhiteList: false, countries: "",
    info: `Tool402 testnet demo revenue note; no real-world investment or return claim. Tool ID: ${input.toolPublicId}`,
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002", configVersion: 1,
    proceedRecipientsIds: Object.freeze([] as const), proceedRecipientsData: Object.freeze([] as const),
  });
}

export function createProviderToolAtsConfiguration(input: AdmittedToolConfigurationInput): ProviderToolAtsConfiguration {
  const admitted = readInput(input);
  const descriptor = operationDescriptor();
  const atsParameters = parameters(admitted);
  const canonicalPreimage = Object.freeze({
    protocol: "tool402:ats-parameters:v1" as const, network: "hedera:testnet" as const, chainId: 296 as const,
    subjectPublicId: admitted.subjectPublicId, offeringVersion: "ats_demo_v1" as const,
    registryRevision: "ats_sdk_8_0_0_testnet_v2" as const, operationKind: "ATS_CREATE" as const,
    targetKind: "EVM_ADDRESS" as const, expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d" as const,
    operationDescriptor: descriptor, parameters: atsParameters,
  });
  const canonicalParametersHash = keccak256(stringToHex(canonicalizeRequirements(canonicalPreimage))).slice(2);
  const atsCreateConfiguration = Object.freeze({
    ...canonicalPreimage,
    sdkPackage: "@hashgraph/asset-tokenization-sdk" as const,
    sdkVersion: "8.0.0" as const,
    sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==" as const,
    resolverHederaId: "0.0.9212226" as const,
    resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a" as const,
    m20EconomicsBinding: "NONE" as const,
    canonicalParametersHash,
  } satisfies ProviderToolAtsCreateConfiguration);
  return Object.freeze({ atsCreateConfiguration, canonicalPreimage, canonicalParametersHash });
}
