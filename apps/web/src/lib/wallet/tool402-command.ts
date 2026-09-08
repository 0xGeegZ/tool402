import { keccak256 } from "viem";

import type { Eip1193Provider } from "./metamask-provider.ts";

export const TOOL402_TYPED_DATA_DOMAIN = Object.freeze({
  name: "Tool402",
  version: "1",
  chainId: 296,
} as const);

export const TOOL402_COMMAND_PRIMARY_TYPE = "Tool402Command";

function field(name: string, type: string) {
  return Object.freeze({ name, type });
}

export const TOOL402_TYPED_DATA_TYPES = Object.freeze({
  EIP712Domain: Object.freeze([
    field("name", "string"),
    field("version", "string"),
    field("chainId", "uint256"),
  ]),
  Tool402Command: Object.freeze([
    field("version", "uint8"),
    field("type", "string"),
    field("signer", "address"),
    field("nonce", "string"),
    field("issuedAt", "string"),
    field("expiresAt", "string"),
    field("payloadHash", "bytes32"),
  ]),
});

export const MAX_COMMAND_LIFETIME_SECONDS = 300;

export type RandomBytes = (length: number) => Uint8Array;

export interface UnsignedTool402Command {
  readonly version: 1;
  readonly type: string;
  readonly signer: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payloadHash: `0x${string}`;
}

export interface SignedTool402Command extends UnsignedTool402Command {
  readonly chainId: 296;
  readonly signature: `0x${string}`;
}

export interface UnsignedCommandInput {
  readonly type: string;
  readonly signer: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly canonicalPayloadBytes: Uint8Array;
}

const nonceByteLength = 16;
const base64UrlAlphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const canonicalTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const lowerCaseAddressPattern = /^0x[0-9a-f]{40}$/u;
const noncePattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const signaturePattern = /^0x[0-9a-f]{130}$/u;
const unsignedCommands = new WeakSet<UnsignedTool402Command>();
const signedCommands = new WeakSet<SignedTool402Command>();

function defaultRandomBytes(length: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const chunk = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);
    output += base64UrlAlphabet[(chunk >> 18) & 63];
    output += base64UrlAlphabet[(chunk >> 12) & 63];
    if (second !== undefined) {
      output += base64UrlAlphabet[(chunk >> 6) & 63];
    }
    if (third !== undefined) {
      output += base64UrlAlphabet[chunk & 63];
    }
  }
  return output;
}

export function createCommandNonce(
  randomBytes: RandomBytes = defaultRandomBytes,
): string {
  const bytes = randomBytes(nonceByteLength);
  if (!(bytes instanceof Uint8Array) || bytes.length !== nonceByteLength) {
    throw new TypeError("a command nonce needs exactly 16 random bytes");
  }
  return encodeBase64Url(bytes);
}

export function formatCommandTimestamp(milliseconds: number): string {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) {
    throw new RangeError(
      "a command timestamp needs a nonnegative integer millisecond value",
    );
  }
  return new Date(milliseconds).toISOString();
}

export function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !canonicalTimestampPattern.test(value)) {
    return false;
  }
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

export function createCommandTimestamps(
  nowMilliseconds: number,
  lifetimeSeconds: number = MAX_COMMAND_LIFETIME_SECONDS,
): { readonly issuedAt: string; readonly expiresAt: string } {
  if (
    !Number.isSafeInteger(lifetimeSeconds) ||
    lifetimeSeconds < 1 ||
    lifetimeSeconds > MAX_COMMAND_LIFETIME_SECONDS
  ) {
    throw new RangeError("a command lifetime is 1 to 300 whole seconds");
  }
  return Object.freeze({
    issuedAt: formatCommandTimestamp(nowMilliseconds),
    expiresAt: formatCommandTimestamp(nowMilliseconds + lifetimeSeconds * 1000),
  });
}

export function hashCommandPayload(
  canonicalPayloadBytes: Uint8Array,
): `0x${string}` {
  if (!(canonicalPayloadBytes instanceof Uint8Array)) {
    throw new TypeError("a payload digest needs canonical bytes");
  }
  return keccak256(canonicalPayloadBytes);
}

function decodeCanonicalPayload(bytes: Uint8Array): {
  readonly text: string;
  readonly expiresAt: string;
} {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("a canonical payload needs bytes");
  }
  const text = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true,
  }).decode(bytes);
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new TypeError("a canonical payload is one JSON object");
  }
  const { expiresAt } = parsed as { expiresAt?: unknown };
  if (!isCanonicalTimestamp(expiresAt)) {
    throw new TypeError("a canonical payload carries a canonical expiresAt");
  }
  return { text, expiresAt };
}

export function createUnsignedCommand(
  input: UnsignedCommandInput,
): UnsignedTool402Command {
  const { type, signer, nonce, issuedAt, expiresAt, canonicalPayloadBytes } =
    input;
  if (typeof type !== "string" || type.length === 0) {
    throw new TypeError("a command type is a nonempty string");
  }
  if (typeof signer !== "string" || !lowerCaseAddressPattern.test(signer)) {
    throw new TypeError("a command signer is a lower-case EVM address");
  }
  if (typeof nonce !== "string" || !noncePattern.test(nonce)) {
    throw new TypeError("a command nonce is 22 canonical base64url characters");
  }
  if (!isCanonicalTimestamp(issuedAt) || !isCanonicalTimestamp(expiresAt)) {
    throw new TypeError("command timestamps are canonical UTC milliseconds");
  }
  const lifetimeMilliseconds = Date.parse(expiresAt) - Date.parse(issuedAt);
  if (
    lifetimeMilliseconds <= 0 ||
    lifetimeMilliseconds > MAX_COMMAND_LIFETIME_SECONDS * 1000
  ) {
    throw new RangeError(
      "a command expires after issue and within 300 seconds",
    );
  }
  const payload = decodeCanonicalPayload(canonicalPayloadBytes);
  if (payload.expiresAt !== expiresAt) {
    throw new TypeError(
      "command and payload expiresAt must be byte-for-byte identical",
    );
  }
  const command: UnsignedTool402Command = Object.freeze({
    version: 1,
    type,
    signer,
    nonce,
    issuedAt,
    expiresAt,
    payloadHash: hashCommandPayload(canonicalPayloadBytes),
  });
  unsignedCommands.add(command);
  return command;
}

export function createTypedDataJson(command: UnsignedTool402Command): string {
  if (!unsignedCommands.has(command)) {
    throw new TypeError(
      "typed data is built only from createUnsignedCommand output",
    );
  }
  return JSON.stringify({
    types: TOOL402_TYPED_DATA_TYPES,
    primaryType: TOOL402_COMMAND_PRIMARY_TYPE,
    domain: TOOL402_TYPED_DATA_DOMAIN,
    message: {
      version: command.version,
      type: command.type,
      signer: command.signer,
      nonce: command.nonce,
      issuedAt: command.issuedAt,
      expiresAt: command.expiresAt,
      payloadHash: command.payloadHash,
    },
  });
}

export async function signCommand(
  provider: Eip1193Provider,
  command: UnsignedTool402Command,
): Promise<SignedTool402Command> {
  const typedDataJson = createTypedDataJson(command);
  const signature = await provider.request({
    method: "eth_signTypedData_v4",
    params: [command.signer, typedDataJson],
  });
  if (typeof signature !== "string" || !signaturePattern.test(signature)) {
    throw new TypeError(
      "the wallet returned a signature outside the accepted grammar",
    );
  }
  const signed: SignedTool402Command = Object.freeze({
    version: command.version,
    type: command.type,
    chainId: 296,
    signer: command.signer,
    nonce: command.nonce,
    issuedAt: command.issuedAt,
    expiresAt: command.expiresAt,
    payloadHash: command.payloadHash,
    signature: signature as `0x${string}`,
  });
  signedCommands.add(signed);
  return signed;
}

export function createCommandBody(
  command: SignedTool402Command,
  canonicalPayloadBytes: Uint8Array,
): string {
  if (!signedCommands.has(command)) {
    throw new TypeError("a command body is built only from signCommand output");
  }
  const payload = decodeCanonicalPayload(canonicalPayloadBytes);
  if (payload.expiresAt !== command.expiresAt) {
    throw new TypeError(
      "command and payload expiresAt must be byte-for-byte identical",
    );
  }
  if (hashCommandPayload(canonicalPayloadBytes) !== command.payloadHash) {
    throw new TypeError(
      "the payload bytes must be the bytes the command signed",
    );
  }
  return `{"command":${JSON.stringify(command)},"payload":${payload.text}}`;
}
