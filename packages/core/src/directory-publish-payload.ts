import { parseAgentDirectoryRecordCandidate } from "./agent-directory-record-candidate.ts";
import { canonicalizeRequirements } from "./requirements-offering-quote.ts";
import type { AgentDirectoryRecordCandidate } from "./agent-directory-record-candidate.ts";

export interface DirectoryPublishPayload {
  readonly schemaVersion: 1;
  readonly offeringPublicId: string;
  readonly offeringVersion: number;
  readonly directoryVersion: number;
  readonly record: AgentDirectoryRecordCandidate;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}

const payloadFields = [
  "schemaVersion",
  "offeringPublicId",
  "offeringVersion",
  "directoryVersion",
  "record",
  "idempotencyKey",
  "expiresAt",
] as const;
const recordFields = [
  "schemaVersion",
  "serviceId",
  "serviceSlug",
  "offeringPublicId",
  "offeringVersion",
  "capabilities",
  "x402Endpoint",
  "paymentProtocol",
  "paymentNetwork",
  "asset",
  "advertisedTiers",
  "issuerRevenueAccount",
  "clearingAccount",
  "status",
  "publishedAt",
] as const;
const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const idempotencyKeyPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const canonicalUtcMilliseconds =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;

function rejectDirectoryPublishPayload(): never {
  throw new TypeError("invalid directory publish payload");
}

function captureExactRecord(
  input: unknown,
  fields: readonly string[],
  optionalField?: string,
): readonly unknown[] {
  if (input === null || typeof input !== "object") {
    return rejectDirectoryPublishPayload();
  }
  try {
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return rejectDirectoryPublishPayload();
    }
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== fields.length &&
      (optionalField === undefined || keys.length !== fields.length + 1)
    ) {
      return rejectDirectoryPublishPayload();
    }
    for (const key of keys) {
      if (
        typeof key !== "string" ||
        (!fields.includes(key) && key !== optionalField)
      ) {
        return rejectDirectoryPublishPayload();
      }
    }
    const values = fields.map((field) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return rejectDirectoryPublishPayload();
      }
      return descriptor.value;
    });
    if (optionalField !== undefined && keys.includes(optionalField)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, optionalField);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return rejectDirectoryPublishPayload();
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return rejectDirectoryPublishPayload();
  }
}

function parsePublicId(value: unknown): string {
  if (typeof value !== "string" || !publicIdPattern.test(value)) {
    return rejectDirectoryPublishPayload();
  }
  return value;
}

function parseVersion(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    return rejectDirectoryPublishPayload();
  }
  return value;
}

function parseIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !idempotencyKeyPattern.test(value)) {
    return rejectDirectoryPublishPayload();
  }
  return value;
}

function parseExpiry(value: unknown): string {
  if (typeof value !== "string" || !canonicalUtcMilliseconds.test(value)) {
    return rejectDirectoryPublishPayload();
  }
  try {
    const instant = new Date(value);
    if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
      return rejectDirectoryPublishPayload();
    }
  } catch {
    return rejectDirectoryPublishPayload();
  }
  return value;
}

function parseRecord(input: unknown): AgentDirectoryRecordCandidate {
  const snapshot = captureExactRecord(input, recordFields, "webUrl");
  const x402Endpoint = snapshot[6];
  const webUrl = snapshot[15];
  const recordInput: Record<string, unknown> = {
    schemaVersion: snapshot[0],
    serviceId: snapshot[1],
    serviceSlug: snapshot[2],
    offeringPublicId: snapshot[3],
    offeringVersion: snapshot[4],
    capabilities: snapshot[5],
    x402Endpoint,
    paymentProtocol: snapshot[7],
    paymentNetwork: snapshot[8],
    asset: snapshot[9],
    advertisedTiers: snapshot[10],
    issuerRevenueAccount: snapshot[11],
    clearingAccount: snapshot[12],
    status: snapshot[13],
    publishedAt: snapshot[14],
  };
  if (snapshot.length === recordFields.length + 1) {
    recordInput.webUrl = webUrl;
  }
  const record = parseAgentDirectoryRecordCandidate(recordInput);
  if (
    x402Endpoint !== record.x402Endpoint ||
    (webUrl !== undefined && webUrl !== record.webUrl)
  ) {
    return rejectDirectoryPublishPayload();
  }
  return record;
}

export function parseDirectoryPublishPayload(
  input: unknown,
): DirectoryPublishPayload {
  const [
    schemaVersion,
    offeringPublicId,
    offeringVersion,
    directoryVersion,
    recordInput,
    idempotencyKey,
    expiresAt,
  ] = captureExactRecord(input, payloadFields);
  if (schemaVersion !== 1) {
    return rejectDirectoryPublishPayload();
  }
  const parsedOfferingPublicId = parsePublicId(offeringPublicId);
  const parsedOfferingVersion = parseVersion(offeringVersion);
  const record = parseRecord(recordInput);
  if (
    record.offeringPublicId !== parsedOfferingPublicId ||
    record.offeringVersion !== parsedOfferingVersion
  ) {
    return rejectDirectoryPublishPayload();
  }
  return Object.freeze({
    schemaVersion: 1,
    offeringPublicId: parsedOfferingPublicId,
    offeringVersion: parsedOfferingVersion,
    directoryVersion: parseVersion(directoryVersion),
    record,
    idempotencyKey: parseIdempotencyKey(idempotencyKey),
    expiresAt: parseExpiry(expiresAt),
  });
}

export function canonicalDirectoryPublishPayloadBytes(
  payload: DirectoryPublishPayload,
): Uint8Array {
  const record = payload.record;
  const projection: Record<string, unknown> = {
    schemaVersion: payload.schemaVersion,
    offeringPublicId: payload.offeringPublicId,
    offeringVersion: payload.offeringVersion,
    directoryVersion: payload.directoryVersion,
    record: {
      schemaVersion: record.schemaVersion,
      serviceId: record.serviceId,
      serviceSlug: record.serviceSlug,
      offeringPublicId: record.offeringPublicId,
      offeringVersion: record.offeringVersion,
      capabilities: [...record.capabilities],
      x402Endpoint: record.x402Endpoint,
      paymentProtocol: record.paymentProtocol,
      paymentNetwork: record.paymentNetwork,
      asset: record.asset,
      advertisedTiers: [...record.advertisedTiers],
      issuerRevenueAccount: record.issuerRevenueAccount,
      clearingAccount: record.clearingAccount,
      status: record.status,
      publishedAt: record.publishedAt,
    },
    idempotencyKey: payload.idempotencyKey,
    expiresAt: payload.expiresAt,
  };
  if (record.webUrl !== undefined) {
    (projection.record as Record<string, unknown>).webUrl = record.webUrl;
  }
  return new TextEncoder().encode(canonicalizeRequirements(projection));
}
