import factoryArtifact from "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json" with { type: "json" };
import { decodeEventLog, encodeFunctionData, isAddress, type Address, type Hex } from "viem";

const factoryAddress = "0xd1f118a40f3b02883d35909ef2517e7edd78379d" as Address;
const resolverAddress = "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a" as Address;
const canonicalIssuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e" as Address;
const zeroAddress = "0x0000000000000000000000000000000000000000" as Address;
const defaultAdminRole = `0x${"0".repeat(64)}` as Hex;

const rootKeys = [
  "protocol", "network", "chainId", "subjectPublicId", "offeringVersion", "registryRevision",
  "operationKind", "targetKind", "expectedTarget", "sdkPackage", "sdkVersion", "sdkIntegrity",
  "resolverHederaId", "resolverEvmAddress", "m20EconomicsBinding", "operationDescriptor",
  "parameters", "canonicalParametersHash",
] as const;

const descriptorKeys = [
  "sdkPackage", "sdkVersion", "creationFamily", "requestExport", "requestConstructor", "methodExport",
  "method", "targetContractRole", "factoryHederaId", "resolverHederaId", "mirrorNodeBaseUrl",
  "rpcNodeBaseUrl", "configId", "configVersion", "omittedOptionalFields",
] as const;

const parameterKeys = [
  "name", "symbol", "isin", "decimals", "isWhiteList", "erc20VotesActivated", "isControllable",
  "arePartitionsProtected", "isMultiPartition", "clearingActive", "internalKycActivated",
  "externalPausesIds", "externalControlListsIds", "externalKycListsIds", "diamondOwnerAccount",
  "currency", "numberOfUnits", "nominalValue", "nominalValueDecimals", "startingDate",
  "maturityDate", "regulationType", "regulationSubType", "isCountryControlListWhiteList", "countries",
  "info", "configId", "configVersion", "proceedRecipientsIds", "proceedRecipientsData",
] as const;

type RecordValue = Record<string, unknown>;

function readExactRecord(value: unknown, keys: readonly string[]): RecordValue {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("invalid ATS configuration record");
  }
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some((key) => typeof key !== "string" || !keys.includes(key))) {
    throw new TypeError("invalid ATS configuration keys");
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value")) throw new TypeError("invalid ATS configuration field");
  }
  return value as RecordValue;
}

function readCanonicalAddress(value: unknown): Address {
  if (typeof value !== "string" || !/^0x[a-f0-9]{40}$/u.test(value)) {
    throw new TypeError("invalid ATS address");
  }
  return value as Address;
}

function readDecodedEventAddress(value: unknown): Address {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new TypeError("invalid ATS address");
  }
  if (value === zeroAddress) throw new TypeError("invalid deployed bond address");
  return value.toLowerCase() as Address;
}

function readExactArray(value: unknown, expected: readonly string[]): readonly string[] {
  if (!Array.isArray(value) || value.length !== expected.length || value.some((item, index) => item !== expected[index])) {
    throw new TypeError("invalid ATS list");
  }
  return Object.freeze([...value]);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function assertExpectedConfiguration(configuration: RecordValue, issuerEvmAddress: unknown): {
  readonly parameters: RecordValue;
} {
  const descriptor = readExactRecord(configuration.operationDescriptor, descriptorKeys);
  const parameters = readExactRecord(configuration.parameters, parameterKeys);

  const expectedRoot: Record<string, unknown> = {
    protocol: "tool402:ats-parameters:v1", network: "hedera:testnet", chainId: 296,
    subjectPublicId: "riskscan_revenue_note_demo", offeringVersion: "ats_demo_v1",
    registryRevision: "ats_sdk_8_0_0_testnet_v2", operationKind: "ATS_CREATE", targetKind: "EVM_ADDRESS",
    expectedTarget: factoryAddress, sdkPackage: "@hashgraph/asset-tokenization-sdk", sdkVersion: "8.0.0",
    sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
    resolverHederaId: "0.0.9212226", resolverEvmAddress: resolverAddress, m20EconomicsBinding: "NONE",
    canonicalParametersHash: "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9",
  };
  const expectedDescriptor: Record<string, unknown> = {
    sdkPackage: "@hashgraph/asset-tokenization-sdk", sdkVersion: "8.0.0", creationFamily: "BOND_STANDARD",
    requestExport: "CreateBondRequest", requestConstructor: "new CreateBondRequest", methodExport: "Bond",
    method: "create", targetContractRole: "FACTORY_PROXY", factoryHederaId: "0.0.9213391",
    resolverHederaId: "0.0.9212226", mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
    rpcNodeBaseUrl: "https://testnet.hashio.io/api",
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002", configVersion: 1,
  };
  const expectedParameters: Record<string, unknown> = {
    name: "Tool402 RiskScan Revenue Note Demo", symbol: "T402RN", isin: "XS402RISKN02", decimals: 0,
    isWhiteList: true, erc20VotesActivated: false, isControllable: false, arePartitionsProtected: false,
    isMultiPartition: false, clearingActive: false, internalKycActivated: false, diamondOwnerAccount: canonicalIssuer,
    currency: "0x555344", numberOfUnits: "1000", nominalValue: "1", nominalValueDecimals: 0,
    startingDate: "1789430400", maturityDate: "1798675200", regulationType: 1, regulationSubType: 0,
    isCountryControlListWhiteList: false, countries: "",
    info: "Tool402 testnet demo revenue note; no real-world investment or return claim.",
    configId: "0x0000000000000000000000000000000000000000000000000000000000000002", configVersion: 1,
  };

  for (const [key, expected] of Object.entries(expectedRoot)) {
    if (configuration[key] !== expected) throw new TypeError("unexpected ATS configuration");
  }
  for (const [key, expected] of Object.entries(expectedDescriptor)) {
    if (descriptor[key] !== expected) throw new TypeError("unexpected ATS descriptor");
  }
  if (
    JSON.stringify(descriptor.omittedOptionalFields) !== JSON.stringify(["complianceId", "identityRegistryId"]) ||
    readCanonicalAddress(parameters.diamondOwnerAccount) !== canonicalIssuer ||
    readCanonicalAddress(issuerEvmAddress) !== canonicalIssuer
  ) {
    throw new TypeError("unexpected ATS issuer compatibility");
  }
  for (const [key, expected] of Object.entries(expectedParameters)) {
    if (parameters[key] !== expected) throw new TypeError("unexpected ATS parameter");
  }
  for (const key of ["externalPausesIds", "externalControlListsIds", "externalKycListsIds", "proceedRecipientsIds", "proceedRecipientsData"]) {
    readExactArray(parameters[key], []);
  }
  return { parameters };
}

export function buildFactoryDeployBondRequest(configuration: unknown, context: { readonly issuerEvmAddress: unknown }) {
  const accepted = assertExpectedConfiguration(readExactRecord(configuration, rootKeys), context?.issuerEvmAddress);
  const parameters = accepted.parameters;

  return deepFreeze({
    to: factoryAddress,
    bondData: {
      security: {
        resolver: resolverAddress,
        maxSupply: parameters.numberOfUnits,
        resolverProxyConfiguration: { key: parameters.configId, version: parameters.configVersion },
        erc20MetadataInfo: {
          name: parameters.name, symbol: parameters.symbol, isin: parameters.isin, decimals: parameters.decimals,
        },
        rbacs: [{ role: defaultAdminRole, members: [canonicalIssuer] }],
        externalPauses: readExactArray(parameters.externalPausesIds, []),
        externalControlLists: readExactArray(parameters.externalControlListsIds, []),
        externalKycLists: readExactArray(parameters.externalKycListsIds, []),
        compliance: zeroAddress,
        identityRegistry: zeroAddress,
        arePartitionsProtected: parameters.arePartitionsProtected,
        isMultiPartition: parameters.isMultiPartition,
        isControllable: parameters.isControllable,
        isWhiteList: parameters.isWhiteList,
        clearingActive: parameters.clearingActive,
        internalKycActivated: parameters.internalKycActivated,
        erc20VotesActivated: parameters.erc20VotesActivated,
      },
      bondDetails: {
        currency: parameters.currency,
        nominalValue: parameters.nominalValue,
        nominalValueDecimals: parameters.nominalValueDecimals,
        startingDate: parameters.startingDate,
        maturityDate: parameters.maturityDate,
      },
      proceedRecipients: readExactArray(parameters.proceedRecipientsIds, []),
      proceedRecipientsData: readExactArray(parameters.proceedRecipientsData, []),
    },
    factoryRegulationData: {
      regulationType: parameters.regulationType,
      regulationSubType: parameters.regulationSubType,
      additionalSecurityData: {
        countriesControlListType: parameters.isCountryControlListWhiteList,
        listOfCountries: parameters.countries,
        info: parameters.info,
      },
    },
  });
}

export function encodeFactoryDeployBond(request: ReturnType<typeof buildFactoryDeployBondRequest>): Hex {
  return encodeFunctionData({
    abi: factoryArtifact.abi,
    functionName: "deployBond",
    args: [request.bondData, request.factoryRegulationData],
  });
}

export function decodeBondDeployed(log: { readonly data: Hex; readonly topics: readonly Hex[] }): { readonly evmAddress: Address } {
  const [signature, ...indexedTopics] = log.topics;
  if (!signature) throw new TypeError("invalid deployed bond event");
  const decoded = decodeEventLog({
    abi: factoryArtifact.abi,
    eventName: "BondDeployed",
    data: log.data,
    topics: [signature, ...indexedTopics],
  });
  if (!decoded.args || Array.isArray(decoded.args) || !("bondAddress" in decoded.args)) {
    throw new TypeError("invalid deployed bond event");
  }
  return Object.freeze({ evmAddress: readDecodedEventAddress(decoded.args.bondAddress) });
}

export function normalizeHederaCandidateTransactionId(value: unknown): string {
  if (typeof value !== "string") throw new TypeError("invalid candidate transaction id");
  const sdkMatch = /^0\.0\.([1-9]\d*)@(\d+)\.(\d{1,9})$/u.exec(value);
  if (sdkMatch) return `0.0.${sdkMatch[1]}-${sdkMatch[2]}-${sdkMatch[3].padStart(9, "0")}`;
  if (/^0\.0\.[1-9]\d*-\d+-\d{9}$/u.test(value)) return value;
  throw new TypeError("invalid candidate transaction id");
}
