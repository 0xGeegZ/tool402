import {
  canonicalDirectoryPublishPayloadBytes,
  canonicalOfferingCreatePayloadBytes,
  parseDirectoryPublishPayload,
  parseOfferingCreatePayload,
} from "@tool402/core";
import type {
  DirectoryPublishPayload,
  OfferingCreatePayload,
} from "@tool402/core";
import { bytesToHex, keccak256 } from "viem";

type OfferingCommandType = "offering.create" | "directory.publish";

interface CommandContext<TType extends OfferingCommandType, TPayload> {
  readonly version: 1;
  readonly type: TType;
  readonly chainId: 296;
  readonly canonicalSignerAddress: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payloadHash: string;
  readonly replayIdentity: string;
  readonly principalPublicId: string;
  readonly role: "ISSUER";
  readonly authorityVersion: string;
  readonly payload: TPayload;
  readonly durableNow: bigint;
}

export type OfferingCommandBinding = CommandContext<
  "offering.create",
  OfferingCreatePayload
>;
export type DirectoryCommandBinding = CommandContext<
  "directory.publish",
  DirectoryPublishPayload
>;

const commandFields = [
  "version",
  "type",
  "chainId",
  "canonicalSignerAddress",
  "nonce",
  "issuedAt",
  "expiresAt",
  "payloadHash",
  "replayIdentity",
  "principalPublicId",
  "role",
  "authorityVersion",
  "payload",
] as const;
const authorityFields = [
  "principalPublicId",
  "canonicalSignerAddress",
  "chainId",
  "role",
  "ownedSubjectPublicIds",
  "authorityVersion",
  "enabled",
] as const;
const maximumInt64 = 9_223_372_036_854_775_807n;
const canonicalTimestampPattern =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;
const canonicalSignerPattern = /^0x[0-9a-f]{40}$/u;
const canonicalNoncePattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const canonicalPayloadHashPattern = /^0x[0-9a-f]{64}$/u;

function reject(): never {
  throw new TypeError("invalid offering command admission");
}

function captureRecord(
  input: unknown,
  requiredFields: readonly string[],
  optionalFields: readonly string[],
  stored: boolean,
): Readonly<Record<string, unknown>> {
  try {
    if (
      input === null
      || typeof input !== "object"
      || Object.getPrototypeOf(input) !== Object.prototype
    ) {
      return reject();
    }

    const allowed = new Set([
      ...requiredFields,
      ...optionalFields,
      ...(stored ? ["_id", "_creationTime"] : []),
    ]);
    const keys = Reflect.ownKeys(input);
    if (
      keys.some((key) => typeof key !== "string" || !allowed.has(key))
      || requiredFields.some((field) => !keys.includes(field))
      || (stored && !keys.includes("_id"))
    ) {
      return reject();
    }

    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (typeof key !== "string") {
        return reject();
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(input, key);
      if (
        descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.hasOwn(descriptor, "value")
        || Object.hasOwn(descriptor, "get")
        || Object.hasOwn(descriptor, "set")
      ) {
        return reject();
      }
      result[key] = descriptor.value;
    }

    if (
      stored
      && (
        typeof result._id !== "string"
        || result._id.length === 0
        || (Object.hasOwn(result, "_creationTime")
          && (typeof result._creationTime !== "number" || !Number.isFinite(result._creationTime)))
      )
    ) {
      return reject();
    }
    return Object.freeze(result);
  } catch {
    return reject();
  }
}

export function readStoredRecord(
  input: unknown,
  requiredFields: readonly string[],
  optionalFields: readonly string[] = [],
): Readonly<Record<string, unknown>> {
  return captureRecord(input, requiredFields, optionalFields, true);
}

export function isInt64(value: unknown): value is bigint {
  return typeof value === "bigint" && value >= 0n && value <= maximumInt64;
}

export function isCanonicalEvmAddress(value: unknown): value is string {
  return typeof value === "string" && canonicalSignerPattern.test(value);
}

function timestamp(value: unknown): number {
  if (typeof value !== "string" || !canonicalTimestampPattern.test(value)) {
    return reject();
  }
  const milliseconds = Date.parse(value);
  if (
    !Number.isSafeInteger(milliseconds)
    || new Date(milliseconds).toISOString() !== value
  ) {
    return reject();
  }
  return milliseconds;
}

function payloadBinding(
  type: "offering.create",
  value: unknown,
): OfferingCreatePayload;
function payloadBinding(
  type: "directory.publish",
  value: unknown,
): DirectoryPublishPayload;
function payloadBinding(
  type: OfferingCommandType,
  value: unknown,
): OfferingCreatePayload | DirectoryPublishPayload {
  return type === "offering.create"
    ? parseOfferingCreatePayload(value)
    : parseDirectoryPublishPayload(value);
}

function payloadDigest(
  type: "offering.create",
  payload: OfferingCreatePayload,
): string;
function payloadDigest(
  type: "directory.publish",
  payload: DirectoryPublishPayload,
): string;
function payloadDigest(
  type: OfferingCommandType,
  payload: OfferingCreatePayload | DirectoryPublishPayload,
): string {
  const bytes = type === "offering.create"
    ? canonicalOfferingCreatePayloadBytes(payload as OfferingCreatePayload)
    : canonicalDirectoryPublishPayloadBytes(payload as DirectoryPublishPayload);
  return keccak256(bytesToHex(bytes));
}

export function bindOfferingCommand(
  input: unknown,
  type: "offering.create",
  durableNow: number,
): OfferingCommandBinding;
export function bindOfferingCommand(
  input: unknown,
  type: "directory.publish",
  durableNow: number,
): DirectoryCommandBinding;
export function bindOfferingCommand(
  input: unknown,
  type: OfferingCommandType,
  durableNow: number,
): OfferingCommandBinding | DirectoryCommandBinding {
  const record = captureRecord(input, commandFields, [], false);
  const canonicalSignerAddress = record.canonicalSignerAddress;
  const nonce = record.nonce;
  const principalPublicId = record.principalPublicId;
  const authorityVersion = record.authorityVersion;
  const payloadHash = record.payloadHash;
  if (
    record.version !== 1
    || record.type !== type
    || record.chainId !== 296
    || !isCanonicalEvmAddress(canonicalSignerAddress)
    || typeof nonce !== "string"
    || !canonicalNoncePattern.test(nonce)
    || typeof principalPublicId !== "string"
    || principalPublicId.length === 0
    || record.role !== "ISSUER"
    || typeof authorityVersion !== "string"
    || authorityVersion.length === 0
    || typeof payloadHash !== "string"
    || !canonicalPayloadHashPattern.test(payloadHash)
    || !Number.isSafeInteger(durableNow)
    || durableNow < 0
  ) {
    return reject();
  }

  const issuedAt = timestamp(record.issuedAt);
  const expiresAt = timestamp(record.expiresAt);
  const payload = type === "offering.create"
    ? payloadBinding(type, record.payload)
    : payloadBinding(type, record.payload);
  const digest = type === "offering.create"
    ? payloadDigest("offering.create", payload as OfferingCreatePayload)
    : payloadDigest("directory.publish", payload as DirectoryPublishPayload);
  if (
    digest !== payloadHash
    || record.expiresAt !== payload.expiresAt
    || expiresAt <= issuedAt
    || expiresAt - issuedAt > 300_000
    || issuedAt > durableNow + 60_000
    || durableNow > expiresAt
    || record.replayIdentity
      !== `tool402:wallet-command:v1:296:${canonicalSignerAddress}:${nonce}`
  ) {
    return reject();
  }

  const binding = {
    version: 1 as const,
    type,
    chainId: 296 as const,
    canonicalSignerAddress,
    nonce,
    issuedAt: record.issuedAt as string,
    expiresAt: record.expiresAt as string,
    payloadHash,
    replayIdentity: record.replayIdentity as string,
    principalPublicId,
    role: "ISSUER" as const,
    authorityVersion,
    payload,
    durableNow: BigInt(durableNow),
  };
  return Object.freeze(binding) as OfferingCommandBinding | DirectoryCommandBinding;
}

function captureStringArray(input: unknown): readonly string[] {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) {
      return reject();
    }
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(input, "length");
    if (
      lengthDescriptor === undefined
      || lengthDescriptor.enumerable !== false
      || !Object.hasOwn(lengthDescriptor, "value")
      || Object.hasOwn(lengthDescriptor, "get")
      || Object.hasOwn(lengthDescriptor, "set")
      || typeof lengthDescriptor.value !== "number"
      || !Number.isSafeInteger(lengthDescriptor.value)
    ) {
      return reject();
    }
    const length = lengthDescriptor.value;
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== length + 1
      || keys.some((key) => key !== "length" && (
        typeof key !== "string"
        || !/^(?:0|[1-9][0-9]*)$/u.test(key)
        || Number(key) >= length
      ))
    ) {
      return reject();
    }
    const values: string[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, String(index));
      if (
        descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.hasOwn(descriptor, "value")
        || Object.hasOwn(descriptor, "get")
        || Object.hasOwn(descriptor, "set")
        || typeof descriptor.value !== "string"
      ) {
        return reject();
      }
      values.push(descriptor.value);
    }
    return Object.freeze(values);
  } catch {
    return reject();
  }
}

export function revalidateOfferingAuthority(
  input: unknown,
  command: OfferingCommandBinding | DirectoryCommandBinding,
  requirePayloadSubject: boolean,
): readonly string[] {
  const record = readStoredRecord(input, authorityFields);
  const ownedSubjectPublicIds = captureStringArray(record.ownedSubjectPublicIds);
  if (
    record.enabled !== true
    || record.chainId !== 296
    || record.canonicalSignerAddress !== command.canonicalSignerAddress
    || record.principalPublicId !== command.principalPublicId
    || record.role !== "ISSUER"
    || record.authorityVersion !== command.authorityVersion
    || (requirePayloadSubject
      && (command.type !== "offering.create"
        || !ownedSubjectPublicIds.includes(command.payload.subjectPublicId)))
  ) {
    return reject();
  }
  return ownedSubjectPublicIds;
}

export function revalidateWalletCommandReplayClaim(
  input: unknown,
  replayIdentity: string,
  commandType: OfferingCommandType,
): void {
  try {
    if (input === null || typeof input !== "object") {
      return reject();
    }
    const outcomeDescriptor = Reflect.getOwnPropertyDescriptor(input, "outcome");
    if (
      outcomeDescriptor === undefined
      || outcomeDescriptor.enumerable !== true
      || !Object.hasOwn(outcomeDescriptor, "value")
      || Object.hasOwn(outcomeDescriptor, "get")
      || Object.hasOwn(outcomeDescriptor, "set")
    ) {
      return reject();
    }
    const outcome = outcomeDescriptor.value;
    const linked = outcome === "NEW" || outcome === "IDEMPOTENCY_REPLAYED";
    const record = readStoredRecord(
      input,
      ["replayIdentity", "commandType", "outcome", "claimedAt"],
      linked ? ["targetId"] : [],
    );
    if (
      record.replayIdentity !== replayIdentity
      || record.commandType !== commandType
      || !isInt64(record.claimedAt)
      || (linked
        ? (typeof record.targetId !== "string" || record.targetId.length === 0)
        : outcome !== "IDEMPOTENCY_CONFLICT")
    ) {
      return reject();
    }
  } catch {
    return reject();
  }
}
