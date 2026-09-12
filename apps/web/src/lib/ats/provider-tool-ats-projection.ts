import { parseProviderToolId } from "@tool402/core";

import { buildFactoryDeployBondRequest } from "./factory-deploy-bond.ts";

export type ProviderToolAtsProjection = Readonly<{
  toolPublicId: string;
  offeringPublicId: string;
  configuration: unknown;
}>;

export type ProviderToolAtsStageProjection = Readonly<{
  configuration: unknown;
  command: Readonly<{
    network: "hedera:testnet";
    chainId: 296;
    subjectPublicId: string;
    operationKind: "ATS_CREATE";
    expectedTarget: string;
    canonicalParametersHash: string;
  }>;
  display: Readonly<{
    network: "hedera:testnet";
    chainId: 296;
    subjectPublicId: string;
    offeringVersion: "ats_demo_v1";
    registryRevision: "ats_sdk_8_0_0_testnet_v2";
    operationKind: "ATS_CREATE";
    targetKind: "EVM_ADDRESS";
    expectedTarget: string;
    canonicalParametersHash: string;
    factoryHederaId: string;
    resolverHederaId: string;
    revenueNote: Readonly<{
      name: string; symbol: string; isin: string; numberOfUnits: string; nominalValue: string;
      currency: string; decimals: number; isWhiteList: boolean; isControllable: boolean;
    }>;
  }>;
}>;

function reject(): never {
  throw new TypeError("invalid provider-tool ATS projection");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createProviderToolAtsProjection(input: unknown): ProviderToolAtsProjection {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return reject();
  const keys = Reflect.ownKeys(input);
  if (keys.length !== 3 || keys.some((key) => !["toolPublicId", "offeringPublicId", "configuration"].includes(key as string))) return reject();
  const record = input as Record<string, unknown>;
  const toolPublicId = parseProviderToolId(record.toolPublicId);
  const suffix = toolPublicId?.slice("tool_".length);
  if (toolPublicId === null || suffix === undefined || record.offeringPublicId !== `offering_${suffix}`) return reject();
  const configuration = structuredClone(record.configuration);
  // Factory validation rehashes the exact selected-tool configuration before it can enter execution.
  buildFactoryDeployBondRequest(configuration, { issuerEvmAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e" });
  if (
    configuration === null || typeof configuration !== "object"
    || (configuration as Record<string, unknown>).subjectPublicId !== toolPublicId
  ) return reject();
  return deepFreeze({ toolPublicId, offeringPublicId: record.offeringPublicId, configuration });
}

export function createProviderToolAtsStageProjection(input: unknown): ProviderToolAtsStageProjection {
  const admitted = createProviderToolAtsProjection(input);
  const configuration = admitted.configuration as Record<string, unknown>;
  const descriptor = configuration.operationDescriptor as Record<string, unknown>;
  const parameters = configuration.parameters as Record<string, unknown>;
  const command = Object.freeze({
    network: configuration.network as "hedera:testnet",
    chainId: configuration.chainId as 296,
    subjectPublicId: configuration.subjectPublicId as string,
    operationKind: configuration.operationKind as "ATS_CREATE",
    expectedTarget: configuration.expectedTarget as string,
    canonicalParametersHash: configuration.canonicalParametersHash as string,
  });
  const display = Object.freeze({
    ...command,
    offeringVersion: configuration.offeringVersion as "ats_demo_v1",
    registryRevision: configuration.registryRevision as "ats_sdk_8_0_0_testnet_v2",
    targetKind: configuration.targetKind as "EVM_ADDRESS",
    factoryHederaId: descriptor.factoryHederaId as string,
    resolverHederaId: descriptor.resolverHederaId as string,
    revenueNote: Object.freeze({
      name: parameters.name as string, symbol: parameters.symbol as string, isin: parameters.isin as string,
      numberOfUnits: parameters.numberOfUnits as string, nominalValue: parameters.nominalValue as string,
      currency: parameters.currency as string, decimals: parameters.decimals as number,
      isWhiteList: parameters.isWhiteList as boolean, isControllable: parameters.isControllable as boolean,
    }),
  });
  return Object.freeze({ configuration: admitted.configuration, command, display });
}
