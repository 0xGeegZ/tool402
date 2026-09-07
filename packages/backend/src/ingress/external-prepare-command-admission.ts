import type { ExternalPreparePayload } from "@tool402/core";
import {
  normalizeClaimedExternalPrepareCommand,
} from "./authenticated-external-prepare-normalizer.ts";
import type {
  CommandAuthorityRole,
  ResolveCommandAuthorities,
} from "./authenticated-external-prepare-normalizer.ts";

const atomicAdmissionStatuses = [
  "NEW",
  "COMMAND_REPLAYED",
  "IDEMPOTENCY_REPLAYED",
  "IDEMPOTENCY_CONFLICT",
] as const;

export type ExternalPrepareAtomicAdmissionStatus =
  (typeof atomicAdmissionStatuses)[number];

export interface ExternalPrepareAtomicAdmission {
  readonly version: 1;
  readonly type: "external.prepare";
  readonly chainId: 296;
  readonly canonicalSignerAddress: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payloadHash: string;
  readonly replayIdentity: string;
  readonly principalPublicId: string;
  readonly role: CommandAuthorityRole;
  readonly authorityVersion: string;
  readonly payload: ExternalPreparePayload;
}

export interface ExternalPrepareAtomicAdmissionResult {
  readonly status: ExternalPrepareAtomicAdmissionStatus;
}

export type AtomicallyAdmitExternalPrepareCommand = (
  admission: ExternalPrepareAtomicAdmission,
) => ExternalPrepareAtomicAdmissionResult;

function readDirectAtomicAdmissionStatus(
  value: unknown,
): ExternalPrepareAtomicAdmissionStatus | null {
  try {
    if (
      value === null ||
      typeof value !== "object" ||
      Object.getPrototypeOf(value) !== Object.prototype
    ) {
      return null;
    }

    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== "status") {
      return null;
    }

    const descriptor = Reflect.getOwnPropertyDescriptor(value, "status");
    if (
      descriptor === undefined ||
      descriptor.enumerable !== true ||
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set") ||
      !atomicAdmissionStatuses.includes(
        descriptor.value as ExternalPrepareAtomicAdmissionStatus,
      )
    ) {
      return null;
    }

    return descriptor.value as ExternalPrepareAtomicAdmissionStatus;
  } catch {
    return null;
  }
}

function createAtomicAdmission(
  normalized: ExternalPrepareAtomicAdmission,
): ExternalPrepareAtomicAdmission {
  return Object.freeze({
    version: normalized.version,
    type: normalized.type,
    chainId: normalized.chainId,
    canonicalSignerAddress: normalized.canonicalSignerAddress,
    nonce: normalized.nonce,
    issuedAt: normalized.issuedAt,
    expiresAt: normalized.expiresAt,
    payloadHash: normalized.payloadHash,
    replayIdentity: normalized.replayIdentity,
    principalPublicId: normalized.principalPublicId,
    role: normalized.role,
    authorityVersion: normalized.authorityVersion,
    payload: normalized.payload,
  });
}

export async function admitClaimedExternalPrepareCommand(
  claimedBody: unknown,
  serverNow: string,
  resolveCommandAuthorities: ResolveCommandAuthorities,
  atomicallyAdmit: AtomicallyAdmitExternalPrepareCommand,
): Promise<ExternalPrepareAtomicAdmissionResult | null> {
  try {
    if (typeof atomicallyAdmit !== "function") {
      return null;
    }

    const normalized = await normalizeClaimedExternalPrepareCommand(
      claimedBody,
      serverNow,
      resolveCommandAuthorities,
    );
    if (normalized === null) {
      return null;
    }

    const status = readDirectAtomicAdmissionStatus(
      atomicallyAdmit(createAtomicAdmission(normalized)),
    );
    return status === null ? null : Object.freeze({ status });
  } catch {
    return null;
  }
}
