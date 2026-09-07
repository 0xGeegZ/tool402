import { parseHederaAccountId } from "./value.ts";
import type { HederaAccountId } from "./value.ts";

export type ExternalOperationKind =
  | "ATS_CREATE"
  | "ATS_CONTROL_LIST"
  | "ATS_ISSUE"
  | "ATS_TRANSFER"
  | "ATS_COUPON"
  | "HEDERA_FUNDING";

export type EvmAddress = string & {
  readonly __brand: "EvmAddress";
};

export type ExternalPrepareTarget = HederaAccountId | EvmAddress;

export type CanonicalParametersHash = string & {
  readonly __brand: "CanonicalParametersHash";
};

export interface ExternalPreparePayload {
  readonly operationKind: ExternalOperationKind;
  readonly subjectPublicId: string;
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly expectedTarget: ExternalPrepareTarget;
  readonly canonicalParametersHash: CanonicalParametersHash;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}

const externalPrepareFields: readonly string[] = [
  "operationKind",
  "subjectPublicId",
  "network",
  "chainId",
  "expectedTarget",
  "canonicalParametersHash",
  "idempotencyKey",
  "expiresAt",
];
const externalOperationKinds: readonly ExternalOperationKind[] = [
  "ATS_CREATE",
  "ATS_CONTROL_LIST",
  "ATS_ISSUE",
  "ATS_TRANSFER",
  "ATS_COUPON",
  "HEDERA_FUNDING",
];
const subjectPublicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const evmAddressPattern = /^0x[0-9a-f]{40}$/u;
const canonicalParametersHashPattern = /^[0-9a-f]{64}$/u;
const idempotencyKeyPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const canonicalUtcMilliseconds =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;

function rejectExternalPreparePayload(): never {
  throw new TypeError("invalid external prepare payload");
}

function captureExternalPrepareFields(
  input: unknown,
): readonly unknown[] {
  if (input === null || typeof input !== "object") {
    return rejectExternalPreparePayload();
  }

  try {
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return rejectExternalPreparePayload();
    }

    const keys = Reflect.ownKeys(input);
    if (keys.length !== externalPrepareFields.length) {
      return rejectExternalPreparePayload();
    }

    for (const key of keys) {
      if (
        typeof key !== "string" ||
        !externalPrepareFields.includes(key)
      ) {
        return rejectExternalPreparePayload();
      }
    }

    return externalPrepareFields.map((field) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return rejectExternalPreparePayload();
      }

      return descriptor.value;
    });
  } catch {
    return rejectExternalPreparePayload();
  }
}

function parseOperationKind(value: unknown): ExternalOperationKind {
  if (
    typeof value !== "string" ||
    !externalOperationKinds.includes(value as ExternalOperationKind)
  ) {
    return rejectExternalPreparePayload();
  }

  return value as ExternalOperationKind;
}

function parseSubjectPublicId(value: unknown): string {
  if (typeof value !== "string" || !subjectPublicIdPattern.test(value)) {
    return rejectExternalPreparePayload();
  }

  return value;
}

function parseExpectedTarget(value: unknown): ExternalPrepareTarget {
  if (typeof value !== "string") {
    return rejectExternalPreparePayload();
  }

  if (evmAddressPattern.test(value)) {
    return value as EvmAddress;
  }

  return parseHederaAccountId(value) ?? rejectExternalPreparePayload();
}

function parseCanonicalParametersHash(value: unknown): CanonicalParametersHash {
  if (
    typeof value !== "string" ||
    !canonicalParametersHashPattern.test(value)
  ) {
    return rejectExternalPreparePayload();
  }

  return value as CanonicalParametersHash;
}

function parseIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !idempotencyKeyPattern.test(value)) {
    return rejectExternalPreparePayload();
  }

  return value;
}

function parseExpiry(value: unknown): string {
  if (typeof value !== "string" || !canonicalUtcMilliseconds.test(value)) {
    return rejectExternalPreparePayload();
  }

  try {
    const instant = new Date(value);
    if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
      return rejectExternalPreparePayload();
    }
  } catch {
    return rejectExternalPreparePayload();
  }

  return value;
}

export function parseExternalPreparePayload(
  input: unknown,
): ExternalPreparePayload {
  const [
    rawOperationKind,
    rawSubjectPublicId,
    rawNetwork,
    rawChainId,
    rawExpectedTarget,
    rawCanonicalParametersHash,
    rawIdempotencyKey,
    rawExpiry,
  ] = captureExternalPrepareFields(input);
  const operationKind = parseOperationKind(rawOperationKind);
  const subjectPublicId = parseSubjectPublicId(rawSubjectPublicId);
  if (rawNetwork !== "hedera:testnet" || rawChainId !== 296) {
    return rejectExternalPreparePayload();
  }

  const payload: ExternalPreparePayload = {
    operationKind,
    subjectPublicId,
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: parseExpectedTarget(rawExpectedTarget),
    canonicalParametersHash: parseCanonicalParametersHash(
      rawCanonicalParametersHash,
    ),
    idempotencyKey: parseIdempotencyKey(rawIdempotencyKey),
    expiresAt: parseExpiry(rawExpiry),
  };

  return Object.freeze(payload);
}
