import { canonicalizeRequirements } from "./requirements-offering-quote.ts";
import { parseHederaTransactionId } from "./value.ts";
import type {
  EvmAddress,
  ExternalOperationKind,
} from "./external-prepare-payload.ts";
import type { HederaTransactionId } from "./value.ts";

export type MirrorTransactionId = string & {
  readonly __brand: "MirrorTransactionId";
};
export type CandidateTransactionId = HederaTransactionId | MirrorTransactionId;

export interface AttachCandidatePayload {
  readonly schemaVersion: 1;
  readonly attemptPublicId: string;
  readonly operationKind: ExternalOperationKind;
  readonly candidateTransactionId: CandidateTransactionId;
  readonly candidateEvmAddress?: EvmAddress;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}

const requiredFields = [
  "schemaVersion",
  "attemptPublicId",
  "operationKind",
  "candidateTransactionId",
  "idempotencyKey",
  "expiresAt",
] as const;
const externalOperationKinds: readonly ExternalOperationKind[] = [
  "ATS_CREATE",
  "ATS_CONTROL_LIST",
  "ATS_ISSUE",
  "ATS_TRANSFER",
  "ATS_COUPON",
  "HEDERA_FUNDING",
];
const idempotencyKeyPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const evmAddressPattern = /^0x[0-9a-f]{40}$/u;
const mirrorTransactionIdPattern =
  /^0\.0\.(?:0|[1-9][0-9]*)-(?:0|[1-9][0-9]*)-[0-9]{9}$/u;
const canonicalUtcMilliseconds =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;

function rejectAttachCandidatePayload(): never {
  throw new TypeError("invalid attach candidate payload");
}

function capturePayload(input: unknown): readonly unknown[] {
  if (input === null || typeof input !== "object") {
    return rejectAttachCandidatePayload();
  }
  try {
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return rejectAttachCandidatePayload();
    }
    const keys = Reflect.ownKeys(input);
    if (
      (keys.length !== requiredFields.length && keys.length !== requiredFields.length + 1) ||
      keys.some((key) =>
        typeof key !== "string" ||
        (!(requiredFields as readonly string[]).includes(key) && key !== "candidateEvmAddress"),
      )
    ) {
      return rejectAttachCandidatePayload();
    }
    const values = requiredFields.map((field) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return rejectAttachCandidatePayload();
      }
      return descriptor.value;
    });
    if (keys.includes("candidateEvmAddress")) {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, "candidateEvmAddress");
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return rejectAttachCandidatePayload();
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return rejectAttachCandidatePayload();
  }
}

function parseOperationKind(value: unknown): ExternalOperationKind {
  if (
    typeof value !== "string" ||
    !externalOperationKinds.includes(value as ExternalOperationKind)
  ) {
    return rejectAttachCandidatePayload();
  }
  return value as ExternalOperationKind;
}

function parseIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !idempotencyKeyPattern.test(value)) {
    return rejectAttachCandidatePayload();
  }
  return value;
}

function parseCandidateTransactionId(value: unknown): CandidateTransactionId {
  if (typeof value !== "string") {
    return rejectAttachCandidatePayload();
  }
  const hederaTransactionId = parseHederaTransactionId(value);
  if (hederaTransactionId !== undefined) {
    return hederaTransactionId;
  }
  if (mirrorTransactionIdPattern.test(value)) {
    return value as MirrorTransactionId;
  }
  return rejectAttachCandidatePayload();
}

function parseExpiry(value: unknown): string {
  if (typeof value !== "string" || !canonicalUtcMilliseconds.test(value)) {
    return rejectAttachCandidatePayload();
  }
  try {
    const instant = new Date(value);
    if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
      return rejectAttachCandidatePayload();
    }
  } catch {
    return rejectAttachCandidatePayload();
  }
  return value;
}

export function parseAttachCandidatePayload(input: unknown): AttachCandidatePayload {
  const captured = capturePayload(input);
  const [
    schemaVersion,
    attemptPublicId,
    operationKind,
    candidateTransactionId,
    idempotencyKey,
    expiresAt,
    candidateEvmAddress,
  ] = captured;
  if (schemaVersion !== 1) {
    return rejectAttachCandidatePayload();
  }
  const parsedOperationKind = parseOperationKind(operationKind);
  const parsedAttemptPublicId = parseIdempotencyKey(attemptPublicId);
  const parsedIdempotencyKey = parseIdempotencyKey(idempotencyKey);
  if (parsedAttemptPublicId === parsedIdempotencyKey) {
    return rejectAttachCandidatePayload();
  }
  if (parsedOperationKind === "ATS_CREATE") {
    if (
      captured.length !== requiredFields.length + 1 ||
      typeof candidateEvmAddress !== "string" ||
      !evmAddressPattern.test(candidateEvmAddress)
    ) {
      return rejectAttachCandidatePayload();
    }
    return Object.freeze({
      schemaVersion: 1,
      attemptPublicId: parsedAttemptPublicId,
      operationKind: parsedOperationKind,
      candidateTransactionId: parseCandidateTransactionId(candidateTransactionId),
      candidateEvmAddress: candidateEvmAddress as EvmAddress,
      idempotencyKey: parsedIdempotencyKey,
      expiresAt: parseExpiry(expiresAt),
    });
  }
  if (captured.length !== requiredFields.length) {
    return rejectAttachCandidatePayload();
  }
  return Object.freeze({
    schemaVersion: 1,
    attemptPublicId: parsedAttemptPublicId,
    operationKind: parsedOperationKind,
    candidateTransactionId: parseCandidateTransactionId(candidateTransactionId),
    idempotencyKey: parsedIdempotencyKey,
    expiresAt: parseExpiry(expiresAt),
  });
}

export function canonicalAttachCandidatePayloadBytes(
  payload: AttachCandidatePayload,
): Uint8Array {
  const projection: Record<string, unknown> = {
    schemaVersion: payload.schemaVersion,
    attemptPublicId: payload.attemptPublicId,
    operationKind: payload.operationKind,
    candidateTransactionId: payload.candidateTransactionId,
    idempotencyKey: payload.idempotencyKey,
    expiresAt: payload.expiresAt,
  };
  if (payload.candidateEvmAddress !== undefined) {
    projection.candidateEvmAddress = payload.candidateEvmAddress;
  }
  return new TextEncoder().encode(canonicalizeRequirements(projection));
}
