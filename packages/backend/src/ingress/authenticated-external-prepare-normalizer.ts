import {
  keccak256,
  recoverTypedDataAddress,
  stringToHex,
} from "viem";
import type { Address, Hex } from "viem";
import { parseExternalPreparePayload } from "@tool402/core";
import type { ExternalPreparePayload } from "@tool402/core";
import {
  isClaimedProtectedBody,
  readClaimedProtectedBody,
} from "./claimed-protected-body.ts";

const commandFields = [
  "version",
  "type",
  "chainId",
  "signer",
  "nonce",
  "issuedAt",
  "expiresAt",
  "payloadHash",
  "signature",
] as const;
const transportFields = ["command", "payload"] as const;
const timestampPattern =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;
const signerPattern = /^0x[0-9a-f]{40}$/u;
const noncePattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const payloadHashPattern = /^0x[0-9a-f]{64}$/u;
const signaturePattern = /^0x[0-9a-f]{130}$/u;
const curveOrder =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const halfCurveOrder =
  0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n;
const maximumCommandLifetimeMilliseconds = 300_000;
const maximumIssuedAtFutureSkewMilliseconds = 60_000;
const typedDataDomain = {
  name: "Tool402",
  version: "1",
  chainId: 296,
} as const;
const typedDataTypes = {
  Tool402Command: [
    { name: "version", type: "uint8" },
    { name: "type", type: "string" },
    { name: "signer", type: "address" },
    { name: "nonce", type: "string" },
    { name: "issuedAt", type: "string" },
    { name: "expiresAt", type: "string" },
    { name: "payloadHash", type: "bytes32" },
  ],
} as const;

export type CommandAuthorityRole = "ISSUER" | "BACKER";

export interface CommandAuthorityRecord {
  readonly principalPublicId: string;
  readonly canonicalSignerAddress: string;
  readonly chainId: 296;
  readonly role: CommandAuthorityRole;
  readonly ownedSubjectPublicIds: readonly string[];
  readonly authorityVersion: string;
  readonly enabled: boolean;
}

export type ResolveCommandAuthorities = (
  chainId: 296,
  canonicalSignerAddress: string,
) =>
  | readonly CommandAuthorityRecord[]
  | Promise<readonly CommandAuthorityRecord[]>;

export interface NormalizedExternalPrepareCommand {
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

interface ParsedCommand {
  readonly version: 1;
  readonly type: "external.prepare";
  readonly chainId: 296;
  readonly signer: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payloadHash: string;
  readonly signature: string;
}

interface ParsedTransport {
  readonly command: unknown;
  readonly payload: unknown;
}

interface ParsedTimestamp {
  readonly text: string;
  readonly milliseconds: number;
}

interface ResolvedAuthority {
  readonly principalPublicId: string;
  readonly role: CommandAuthorityRole;
  readonly authorityVersion: string;
}

type StrictJsonValue = string | number | StrictJsonObject;

interface StrictJsonObject {
  readonly [key: string]: StrictJsonValue;
}

class StrictJsonReader {
  #offset = 0;
  private readonly text: string;

  constructor(text: string) {
    this.text = text;
  }

  readRoot(): StrictJsonObject {
    this.skipWhitespace();
    const value = this.readValue(0);
    this.skipWhitespace();
    if (this.#offset !== this.text.length || !isStrictJsonObject(value)) {
      return this.reject();
    }

    return value;
  }

  private readValue(depth: number): StrictJsonValue {
    const character = this.text[this.#offset];
    if (character === "{") {
      return this.readObject(depth + 1);
    }
    if (character === '"') {
      return this.readString();
    }
    if (character !== undefined && character >= "0" && character <= "9") {
      return this.readInteger();
    }

    return this.reject();
  }

  private readObject(depth: number): StrictJsonObject {
    if (depth > 2) {
      return this.reject();
    }

    this.expect("{");
    this.skipWhitespace();
    const entries: Array<readonly [string, StrictJsonValue]> = [];
    const seenKeys = new Set<string>();
    if (this.text[this.#offset] === "}") {
      this.#offset += 1;
      return {};
    }

    while (true) {
      if (this.text[this.#offset] !== '"') {
        return this.reject();
      }
      const key = this.readString();
      if (seenKeys.has(key)) {
        return this.reject();
      }
      seenKeys.add(key);
      this.skipWhitespace();
      this.expect(":");
      this.skipWhitespace();
      entries.push([key, this.readValue(depth)]);
      this.skipWhitespace();

      const delimiter = this.text[this.#offset];
      if (delimiter === "}") {
        this.#offset += 1;
        break;
      }
      if (delimiter !== ",") {
        return this.reject();
      }
      this.#offset += 1;
      this.skipWhitespace();
    }

    const result: Record<string, StrictJsonValue> = {};
    for (const [key, value] of entries) {
      Object.defineProperty(result, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return result;
  }

  private readString(): string {
    this.expect('"');
    const start = this.#offset;
    while (this.#offset < this.text.length) {
      const code = this.text.charCodeAt(this.#offset);
      if (code === 34) {
        const value = this.text.slice(start, this.#offset);
        this.#offset += 1;
        return value;
      }
      if (code < 32 || code > 126 || code === 92) {
        return this.reject();
      }
      this.#offset += 1;
    }

    return this.reject();
  }

  private readInteger(): number {
    const start = this.#offset;
    if (this.text[this.#offset] === "0") {
      this.#offset += 1;
      const following = this.text[this.#offset];
      if (following !== undefined && following >= "0" && following <= "9") {
        return this.reject();
      }
    } else {
      while (true) {
        const character = this.text[this.#offset];
        if (character === undefined || character < "0" || character > "9") {
          break;
        }
        this.#offset += 1;
      }
    }

    const following = this.text[this.#offset];
    if (following === "." || following === "e" || following === "E") {
      return this.reject();
    }
    const value = Number(this.text.slice(start, this.#offset));
    return Number.isSafeInteger(value) ? value : this.reject();
  }

  private expect(character: string): void {
    if (this.text[this.#offset] !== character) {
      this.reject();
    }
    this.#offset += 1;
  }

  private skipWhitespace(): void {
    while (true) {
      const character = this.text[this.#offset];
      if (
        character !== " " &&
        character !== "\t" &&
        character !== "\n" &&
        character !== "\r"
      ) {
        return;
      }
      this.#offset += 1;
    }
  }

  private reject(): never {
    throw new TypeError("invalid authenticated command transport");
  }
}

function isStrictJsonObject(value: StrictJsonValue): value is StrictJsonObject {
  return value !== null && typeof value === "object";
}

function isOrdinaryObject(value: unknown): value is Record<string, unknown> {
  try {
    return value !== null && typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype;
  } catch {
    return false;
  }
}

function captureExactRecord(
  input: unknown,
  fields: readonly string[],
): readonly unknown[] | null {
  if (!isOrdinaryObject(input)) {
    return null;
  }

  try {
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== fields.length ||
      keys.some((key) => typeof key !== "string" || !fields.includes(key))
    ) {
      return null;
    }

    return fields.map((field) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        throw new TypeError("invalid authenticated command record");
      }
      return descriptor.value;
    });
  } catch {
    return null;
  }
}

function captureExactArray(input: unknown): readonly unknown[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  try {
    if (Object.getPrototypeOf(input) !== Array.prototype) {
      return null;
    }
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(input, "length");
    if (
      lengthDescriptor === undefined ||
      !Object.hasOwn(lengthDescriptor, "value") ||
      typeof lengthDescriptor.value !== "number" ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return null;
    }
    const length = lengthDescriptor.value;
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== length + 1 ||
      !keys.includes("length")
    ) {
      return null;
    }

    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, String(index));
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return null;
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return null;
  }
}

function captureStringArray(input: unknown): readonly string[] | null {
  const values = captureExactArray(input);
  if (values === null || values.some((value) => typeof value !== "string")) {
    return null;
  }
  return values as readonly string[];
}

function parseCanonicalTimestamp(value: unknown): ParsedTimestamp | null {
  if (typeof value !== "string" || !timestampPattern.test(value)) {
    return null;
  }

  try {
    const milliseconds = new Date(value).getTime();
    if (
      Number.isNaN(milliseconds) ||
      new Date(milliseconds).toISOString() !== value
    ) {
      return null;
    }
    return { text: value, milliseconds };
  } catch {
    return null;
  }
}

function parseTransport(rawBody: Uint8Array): ParsedTransport | null {
  try {
    const text = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(rawBody);
    const root = new StrictJsonReader(text).readRoot();
    const fields = captureExactRecord(root, transportFields);
    if (fields === null) {
      return null;
    }
    return {
      command: fields[0],
      payload: fields[1],
    };
  } catch {
    return null;
  }
}

function parseCommand(input: unknown): ParsedCommand | null {
  const fields = captureExactRecord(input, commandFields);
  if (fields === null) {
    return null;
  }

  const [
    version,
    type,
    chainId,
    signer,
    nonce,
    issuedAt,
    expiresAt,
    payloadHash,
    signature,
  ] = fields;
  const parsedIssuedAt = parseCanonicalTimestamp(issuedAt);
  const parsedExpiresAt = parseCanonicalTimestamp(expiresAt);
  if (
    version !== 1 ||
    type !== "external.prepare" ||
    chainId !== 296 ||
    typeof signer !== "string" ||
    !signerPattern.test(signer) ||
    typeof nonce !== "string" ||
    !noncePattern.test(nonce) ||
    parsedIssuedAt === null ||
    parsedExpiresAt === null ||
    typeof payloadHash !== "string" ||
    !payloadHashPattern.test(payloadHash) ||
    typeof signature !== "string" ||
    !signaturePattern.test(signature)
  ) {
    return null;
  }

  return {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    signer,
    nonce,
    issuedAt: parsedIssuedAt.text,
    expiresAt: parsedExpiresAt.text,
    payloadHash,
    signature,
  };
}

function normalizeSignature(signature: string): Hex | null {
  try {
    const r = BigInt("0x" + signature.slice(2, 66));
    const s = BigInt("0x" + signature.slice(66, 130));
    if (
      r === 0n ||
      r >= curveOrder ||
      s === 0n ||
      s > halfCurveOrder
    ) {
      return null;
    }

    const recovery = signature.slice(130);
    let normalizedRecovery: string;
    if (recovery === "00") {
      normalizedRecovery = "1b";
    } else if (recovery === "01") {
      normalizedRecovery = "1c";
    } else if (recovery === "1b" || recovery === "1c") {
      normalizedRecovery = recovery;
    } else {
      return null;
    }
    return ("0x" + signature.slice(2, 130) + normalizedRecovery) as Hex;
  } catch {
    return null;
  }
}

function canonicalPayloadBytes(payload: ExternalPreparePayload): string {
  return (
    '{"canonicalParametersHash":"' +
    payload.canonicalParametersHash +
    '","chainId":296,"expectedTarget":"' +
    payload.expectedTarget +
    '","expiresAt":"' +
    payload.expiresAt +
    '","idempotencyKey":"' +
    payload.idempotencyKey +
    '","network":"hedera:testnet","operationKind":"' +
    payload.operationKind +
    '","subjectPublicId":"' +
    payload.subjectPublicId +
    '"}'
  );
}

function parseResolvedAuthority(
  input: unknown,
  signer: string,
  payload: ExternalPreparePayload,
): ResolvedAuthority | null {
  const fields = captureExactRecord(input, [
    "principalPublicId",
    "canonicalSignerAddress",
    "chainId",
    "role",
    "ownedSubjectPublicIds",
    "authorityVersion",
    "enabled",
  ]);
  if (fields === null) {
    return null;
  }

  const [
    principalPublicId,
    canonicalSignerAddress,
    chainId,
    role,
    ownedSubjectPublicIds,
    authorityVersion,
    enabled,
  ] = fields;
  if (
    typeof principalPublicId !== "string" ||
    principalPublicId.length === 0 ||
    canonicalSignerAddress !== signer ||
    chainId !== 296 ||
    (role !== "ISSUER" && role !== "BACKER") ||
    typeof authorityVersion !== "string" ||
    authorityVersion.length === 0 ||
    enabled !== true
  ) {
    return null;
  }

  const ownedSubjects = captureStringArray(ownedSubjectPublicIds);
  if (ownedSubjects === null) {
    return null;
  }

  if (payload.operationKind === "HEDERA_FUNDING") {
    if (role !== "BACKER") {
      return null;
    }
  } else if (
    role !== "ISSUER" ||
    !ownedSubjects.includes(payload.subjectPublicId)
  ) {
    return null;
  }

  return {
    principalPublicId,
    role,
    authorityVersion,
  };
}

async function resolveAuthority(
  resolveCommandAuthorities: ResolveCommandAuthorities,
  signer: string,
  payload: ExternalPreparePayload,
): Promise<ResolvedAuthority | null> {
  if (typeof resolveCommandAuthorities !== "function") {
    return null;
  }

  const records = captureExactArray(
    await resolveCommandAuthorities(296, signer),
  );
  if (records === null || records.length !== 1) {
    return null;
  }
  return parseResolvedAuthority(records[0], signer, payload);
}

function hasValidTimeWindow(
  issuedAtValue: string,
  expiresAtValue: string,
  serverNow: ParsedTimestamp,
): boolean {
  const issuedAt = parseCanonicalTimestamp(issuedAtValue);
  const expiresAt = parseCanonicalTimestamp(expiresAtValue);
  if (issuedAt === null || expiresAt === null) {
    return false;
  }
  return (
    expiresAt.milliseconds > issuedAt.milliseconds &&
    expiresAt.milliseconds - issuedAt.milliseconds <=
      maximumCommandLifetimeMilliseconds &&
    issuedAt.milliseconds <=
      serverNow.milliseconds + maximumIssuedAtFutureSkewMilliseconds &&
    serverNow.milliseconds <= expiresAt.milliseconds
  );
}

export function isExternalPrepareTimeWindowValidForTest(
  issuedAt: string,
  expiresAt: string,
  serverNow: string,
): boolean {
  const parsedServerNow = parseCanonicalTimestamp(serverNow);
  return parsedServerNow !== null &&
    hasValidTimeWindow(issuedAt, expiresAt, parsedServerNow);
}

export async function normalizeClaimedExternalPrepareCommand(
  claimedBody: unknown,
  serverNow: string,
  resolveCommandAuthorities: ResolveCommandAuthorities,
): Promise<NormalizedExternalPrepareCommand | null> {
  try {
    if (!isClaimedProtectedBody(claimedBody)) {
      return null;
    }
    const rawBody = readClaimedProtectedBody(claimedBody);
    const parsedServerNow = parseCanonicalTimestamp(serverNow);
    if (rawBody === null || parsedServerNow === null) {
      return null;
    }

    const transport = parseTransport(rawBody);
    if (transport === null) {
      return null;
    }
    const command = parseCommand(transport.command);
    if (command === null) {
      return null;
    }

    const payload = parseExternalPreparePayload(transport.payload);
    if (payload.expiresAt !== command.expiresAt) {
      return null;
    }
    const recomputedPayloadHash = keccak256(
      stringToHex(canonicalPayloadBytes(payload)),
    );
    if (recomputedPayloadHash !== command.payloadHash) {
      return null;
    }

    const normalizedSignature = normalizeSignature(command.signature);
    if (normalizedSignature === null) {
      return null;
    }

    const recoveredSigner = (
      await recoverTypedDataAddress({
        domain: typedDataDomain,
        types: typedDataTypes,
        primaryType: "Tool402Command",
        message: {
          version: command.version,
          type: command.type,
          signer: command.signer as Address,
          nonce: command.nonce,
          issuedAt: command.issuedAt,
          expiresAt: command.expiresAt,
          payloadHash: command.payloadHash,
        },
        signature: normalizedSignature,
      })
    ).toLowerCase();
    if (recoveredSigner !== command.signer) {
      return null;
    }

    const authority = await resolveAuthority(
      resolveCommandAuthorities,
      recoveredSigner,
      payload,
    );
    if (
      authority === null ||
      !hasValidTimeWindow(command.issuedAt, command.expiresAt, parsedServerNow)
    ) {
      return null;
    }

    return Object.freeze({
      version: command.version,
      type: command.type,
      chainId: command.chainId,
      canonicalSignerAddress: recoveredSigner,
      nonce: command.nonce,
      issuedAt: command.issuedAt,
      expiresAt: command.expiresAt,
      payloadHash: command.payloadHash,
      replayIdentity:
        "tool402:wallet-command:v1:296:" +
        recoveredSigner +
        ":" +
        command.nonce,
      principalPublicId: authority.principalPublicId,
      role: authority.role,
      authorityVersion: authority.authorityVersion,
      payload,
    });
  } catch {
    return null;
  }
}
