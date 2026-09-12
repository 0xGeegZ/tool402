import { parseProviderToolId } from "@tool402/core";

import { buildFactoryDeployBondRequest } from "./factory-deploy-bond.ts";

type ProviderToolAtsProjection = Readonly<{
  toolPublicId: string;
  offeringPublicId: string;
  configuration: unknown;
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
