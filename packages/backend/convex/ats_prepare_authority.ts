import {
  canonicalizeRequirements,
  parseHederaAccountId,
  type ExternalPreparePayload,
} from "@tool402/core";
import { keccak256, stringToHex } from "viem";

type AtsOperationKind = Exclude<
  ExternalPreparePayload["operationKind"],
  "HEDERA_FUNDING"
>;
type AtsTargetKind = "EVM_ADDRESS" | "HEDERA_ACCOUNT_ID";
type JsonObject = Record<string, unknown>;

interface AtsPrepareAuthority {
  readonly schemaVersion: 1;
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly subjectPublicId: string;
  readonly offeringVersion: string;
  readonly registryRevision: string;
  readonly operationKind: AtsOperationKind;
  readonly targetKind: AtsTargetKind;
  readonly expectedTarget: string;
  readonly operationDescriptor: JsonObject;
  readonly parameters: JsonObject;
  readonly enabled: true;
}

const authorityFields = [
  "schemaVersion",
  "network",
  "chainId",
  "subjectPublicId",
  "offeringVersion",
  "registryRevision",
  "operationKind",
  "targetKind",
  "expectedTarget",
  "operationDescriptor",
  "parameters",
  "enabled",
] as const;
const atsOperationKinds: readonly AtsOperationKind[] = [
  "ATS_CREATE",
  "ATS_CONTROL_LIST",
  "ATS_ISSUE",
  "ATS_TRANSFER",
  "ATS_COUPON",
];
const evmAddress = /^0x[0-9a-f]{40}$/u;
const currentManifest: readonly unknown[] = Object.freeze([
  Object.freeze({
    schemaVersion: 1,
    network: "hedera:testnet",
    chainId: 296,
    subjectPublicId: "riskscan_revenue_note_demo",
    offeringVersion: "ats_demo_v1",
    registryRevision: "ats_sdk_8_0_0_testnet_v2",
    operationKind: "ATS_CREATE",
    targetKind: "EVM_ADDRESS",
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
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
      mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
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
      configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
      configVersion: 1,
      proceedRecipientsIds: Object.freeze([]),
      proceedRecipientsData: Object.freeze([]),
    }),
    enabled: true,
  }),
]);

function reject(): never {
  throw new TypeError("invalid ATS prepare authority");
}

function dataValue(
  source: object,
  key: PropertyKey,
  enumerable: boolean,
): unknown {
  const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
  if (
    descriptor === undefined
    || descriptor.enumerable !== enumerable
    || !Object.hasOwn(descriptor, "value")
    || Object.hasOwn(descriptor, "get")
    || Object.hasOwn(descriptor, "set")
  ) {
    return reject();
  }

  return descriptor.value;
}

function captureManifest(input: unknown): readonly unknown[] {
  if (input === null || typeof input !== "object") {
    return reject();
  }
  if (Object.getPrototypeOf(input) !== Array.prototype) {
    return reject();
  }

  const keys = Reflect.ownKeys(input);
  const lengthValue = dataValue(input, "length", false);
  if (
    typeof lengthValue !== "number"
    || !Number.isSafeInteger(lengthValue)
    || lengthValue < 0
    || keys.length !== lengthValue + 1
  ) {
    return reject();
  }

  for (const key of keys) {
    if (key === "length") {
      continue;
    }
    if (
      typeof key !== "string"
      || !/^(?:0|[1-9][0-9]*)$/u.test(key)
      || Number(key) >= lengthValue
    ) {
      return reject();
    }
  }

  const records: unknown[] = [];
  for (let index = 0; index < lengthValue; index += 1) {
    records.push(dataValue(input, String(index), true));
  }
  return records;
}

function snapshotJsonObject(input: unknown): JsonObject {
  const snapshot: unknown = JSON.parse(canonicalizeRequirements(input));
  if (
    snapshot === null
    || typeof snapshot !== "object"
    || Array.isArray(snapshot)
  ) {
    return reject();
  }
  return snapshot as JsonObject;
}

function nonemptyString(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : reject();
}

function operationKind(value: unknown): AtsOperationKind {
  return typeof value === "string"
    && atsOperationKinds.includes(value as AtsOperationKind)
    ? value as AtsOperationKind
    : reject();
}

function targetKind(value: unknown): AtsTargetKind {
  return value === "EVM_ADDRESS" || value === "HEDERA_ACCOUNT_ID"
    ? value
    : reject();
}

function captureAuthority(input: unknown): AtsPrepareAuthority {
  if (input === null || typeof input !== "object") {
    return reject();
  }
  if (Object.getPrototypeOf(input) !== Object.prototype) {
    return reject();
  }

  const keys = Reflect.ownKeys(input);
  if (
    keys.length !== authorityFields.length
    || keys.some((key) => typeof key !== "string" || !authorityFields.includes(
      key as (typeof authorityFields)[number],
    ))
  ) {
    return reject();
  }

  const values = Object.fromEntries(
    authorityFields.map((field) => [field, dataValue(input, field, true)]),
  );
  const parsedOperationKind = operationKind(values.operationKind);
  const parsedTargetKind = targetKind(values.targetKind);
  const expectedTarget = nonemptyString(values.expectedTarget);
  if (
    values.schemaVersion !== 1
    || values.network !== "hedera:testnet"
    || values.chainId !== 296
    || values.enabled !== true
    || (parsedTargetKind === "EVM_ADDRESS" && !evmAddress.test(expectedTarget))
    || (parsedTargetKind === "HEDERA_ACCOUNT_ID"
      && parseHederaAccountId(expectedTarget) === undefined)
  ) {
    return reject();
  }

  return Object.freeze({
    schemaVersion: 1,
    network: "hedera:testnet",
    chainId: 296,
    subjectPublicId: nonemptyString(values.subjectPublicId),
    offeringVersion: nonemptyString(values.offeringVersion),
    registryRevision: nonemptyString(values.registryRevision),
    operationKind: parsedOperationKind,
    targetKind: parsedTargetKind,
    expectedTarget,
    operationDescriptor: snapshotJsonObject(values.operationDescriptor),
    parameters: snapshotJsonObject(values.parameters),
    enabled: true,
  });
}

function assertAtsPrepareAuthority(
  payload: ExternalPreparePayload,
  manifest: unknown,
  payloadOperationKind: AtsOperationKind,
): void {
  const authorities = captureManifest(manifest).map(captureAuthority);
  const matches = authorities.filter((authority) => (
    authority.network === payload.network
    && authority.chainId === payload.chainId
    && authority.subjectPublicId === payload.subjectPublicId
    && authority.operationKind === payloadOperationKind
  ));
  if (matches.length !== 1) {
    return reject();
  }

  const authority = matches[0];
  if (authority === undefined || authority.expectedTarget !== payload.expectedTarget) {
    return reject();
  }

  const preimage = {
    protocol: "tool402:ats-parameters:v1",
    network: authority.network,
    chainId: authority.chainId,
    subjectPublicId: authority.subjectPublicId,
    offeringVersion: authority.offeringVersion,
    registryRevision: authority.registryRevision,
    operationKind: authority.operationKind,
    targetKind: authority.targetKind,
    expectedTarget: authority.expectedTarget,
    operationDescriptor: authority.operationDescriptor,
    parameters: authority.parameters,
  };
  const parametersHash = keccak256(
    stringToHex(canonicalizeRequirements(preimage)),
  ).slice(2);
  if (parametersHash !== payload.canonicalParametersHash) {
    return reject();
  }
}

export function assertCurrentAtsPrepareAuthority(
  payload: ExternalPreparePayload,
): void {
  assertAtsPrepareAuthorityForTest(payload, currentManifest);
}

export function assertAtsPrepareAuthorityForTest(
  payload: ExternalPreparePayload,
  manifest: unknown,
): void {
  let payloadOperationKind: ExternalPreparePayload["operationKind"];
  try {
    payloadOperationKind = payload.operationKind;
  } catch {
    return reject();
  }
  if (payloadOperationKind === "HEDERA_FUNDING") {
    return;
  }
  if (!atsOperationKinds.includes(payloadOperationKind as AtsOperationKind)) {
    return reject();
  }

  try {
    assertAtsPrepareAuthority(
      payload,
      manifest,
      payloadOperationKind as AtsOperationKind,
    );
  } catch {
    return reject();
  }
}
