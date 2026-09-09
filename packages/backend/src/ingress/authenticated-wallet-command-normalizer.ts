import {
  canonicalAttachCandidatePayloadBytes,
  canonicalDirectoryPublishPayloadBytes,
  canonicalOfferingCreatePayloadBytes,
  parseAttachCandidatePayload,
  parseDirectoryPublishPayload,
  parseExternalPreparePayload,
  parseOfferingCreatePayload,
} from "@tool402/core";
import type {
  AttachCandidatePayload,
  DirectoryPublishPayload,
  ExternalPreparePayload,
  OfferingCreatePayload,
} from "@tool402/core";
import {
  keccak256,
  recoverTypedDataAddress,
  stringToHex,
} from "viem";
import type { Address, Hex } from "viem";
import type {
  CommandAuthorityRole,
  ResolveCommandAuthorities,
} from "./authenticated-external-prepare-normalizer.ts";
import {
  isClaimedProtectedBody,
  readClaimedProtectedBody,
} from "./claimed-protected-body.ts";

type WalletCommandType =
  | "external.prepare"
  | "offering.create"
  | "directory.publish"
  | "external.attachCandidate";

type StrictJsonValue = string | number | StrictJsonObject | readonly string[];
type StrictJsonObject = Map<string, StrictJsonValue>;

interface ParsedCommand {
  readonly version: 1;
  readonly type: WalletCommandType;
  readonly chainId: 296;
  readonly signer: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payloadHash: string;
  readonly signature: string;
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

interface ExternalPrepareEnvelope {
  readonly type: "external.prepare";
  readonly payload: ExternalPreparePayload;
}

interface OfferingEnvelope {
  readonly type: "offering.create";
  readonly payload: OfferingCreatePayload;
}

interface DirectoryEnvelope {
  readonly type: "directory.publish";
  readonly payload: DirectoryPublishPayload;
}

interface CandidateEnvelope {
  readonly type: "external.attachCandidate";
  readonly payload: AttachCandidatePayload;
}

type CommandEnvelope = ExternalPrepareEnvelope | OfferingEnvelope | DirectoryEnvelope | CandidateEnvelope;

export type NormalizedWalletCommand =
  | {
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
  | {
    readonly version: 1;
    readonly type: "offering.create";
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
    readonly payload: OfferingCreatePayload;
  }
  | {
    readonly version: 1;
    readonly type: "directory.publish";
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
    readonly payload: DirectoryPublishPayload;
    readonly deferredSubjectOwnership: {
      readonly kind: "OFFERING";
      readonly offeringPublicId: string;
      readonly offeringVersion: number;
    };
  }
  | {
    readonly version: 1;
    readonly type: "external.attachCandidate";
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
    readonly payload: AttachCandidatePayload;
    readonly deferredSubjectOwnership: {
      readonly kind: "ATTEMPT";
      readonly attemptPublicId: string;
    };
  };

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
const externalPrepareFields = [
  "operationKind",
  "subjectPublicId",
  "network",
  "chainId",
  "expectedTarget",
  "canonicalParametersHash",
  "idempotencyKey",
  "expiresAt",
] as const;
const offeringFields = [
  "schemaVersion",
  "offeringPublicId",
  "offeringVersion",
  "subjectPublicId",
  "definition",
  "narrative",
  "advertisedQuickPriceTinybars",
  "advertisedStandardPriceTinybars",
  "idempotencyKey",
  "expiresAt",
] as const;
const definitionFields = [
  "schemaVersion",
  "terms",
  "maturityAt",
  "qualifyingResource",
] as const;
const termsFields = [
  "version",
  "fundingTargetTinybars",
  "noteUnitPriceTinybars",
  "maximumNoteUnits",
  "minimumPurchaseUnits",
  "reserveShareBps",
  "issuerShareBps",
  "platformFeeBps",
  "payoutCapTinybars",
] as const;
const narrativeFields = [
  "title",
  "customerProblem",
  "customerUseCases",
  "useOfFunds",
  "risks",
] as const;
const directoryFields = [
  "schemaVersion",
  "offeringPublicId",
  "offeringVersion",
  "directoryVersion",
  "record",
  "idempotencyKey",
  "expiresAt",
] as const;
const directoryRecordFields = [
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
const attachFields = [
  "schemaVersion",
  "attemptPublicId",
  "operationKind",
  "candidateTransactionId",
  "idempotencyKey",
  "expiresAt",
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
const timestampPattern =
  /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{3})Z$/u;
const signerPattern = /^0x[0-9a-f]{40}$/u;
const noncePattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const payloadHashPattern = /^0x[0-9a-f]{64}$/u;
const signaturePattern = /^0x[0-9a-f]{130}$/u;
const curveOrder =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const halfCurveOrder =
  0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n;
const maximumDecodedBytes = 16_384;
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
    if (this.#offset !== this.text.length || !(value instanceof Map)) {
      return this.reject();
    }
    return value;
  }

  private readValue(depth: number): StrictJsonValue {
    const character = this.text.charAt(this.#offset);
    if (character === "{") {
      return this.readObject(depth + 1);
    }
    if (character === "[") {
      return this.readStringArray(depth + 1);
    }
    if (character === '"') {
      return this.readString();
    }
    if (character >= "0" && character <= "9") {
      return this.readInteger();
    }
    return this.reject();
  }

  private readObject(depth: number): StrictJsonObject {
    if (depth > 4) {
      return this.reject();
    }
    this.expect("{");
    this.skipWhitespace();
    const record = new Map<string, StrictJsonValue>();
    if (this.text.charAt(this.#offset) === "}") {
      this.#offset += 1;
      return record;
    }
    while (true) {
      if (this.text.charAt(this.#offset) !== '"') {
        return this.reject();
      }
      const key = this.readString();
      if (record.has(key)) {
        return this.reject();
      }
      this.skipWhitespace();
      this.expect(":");
      this.skipWhitespace();
      record.set(key, this.readValue(depth));
      this.skipWhitespace();
      const delimiter = this.text.charAt(this.#offset);
      if (delimiter === "}") {
        this.#offset += 1;
        return record;
      }
      if (delimiter !== ",") {
        return this.reject();
      }
      this.#offset += 1;
      this.skipWhitespace();
    }
  }

  private readStringArray(depth: number): readonly string[] {
    if (depth > 4) {
      return this.reject();
    }
    this.expect("[");
    this.skipWhitespace();
    const values: string[] = [];
    if (this.text.charAt(this.#offset) === "]") {
      this.#offset += 1;
      return values;
    }
    while (true) {
      if (this.text.charAt(this.#offset) !== '"') {
        return this.reject();
      }
      values.push(this.readString());
      this.skipWhitespace();
      const delimiter = this.text.charAt(this.#offset);
      if (delimiter === "]") {
        this.#offset += 1;
        return values;
      }
      if (delimiter !== ",") {
        return this.reject();
      }
      this.#offset += 1;
      this.skipWhitespace();
    }
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
    const first = this.text.charAt(this.#offset);
    if (first === "0") {
      this.#offset += 1;
      const following = this.text.charAt(this.#offset);
      if (following >= "0" && following <= "9") {
        return this.reject();
      }
    } else {
      while (true) {
        const character = this.text.charAt(this.#offset);
        if (character < "0" || character > "9") {
          break;
        }
        this.#offset += 1;
      }
    }
    const following = this.text.charAt(this.#offset);
    if (following === "." || following === "e" || following === "E") {
      return this.reject();
    }
    const value = decimalValue(this.text.slice(start, this.#offset));
    return value === null ? this.reject() : value;
  }

  private expect(character: string): void {
    if (this.text.charAt(this.#offset) !== character) {
      this.reject();
    }
    this.#offset += 1;
  }

  private skipWhitespace(): void {
    while (true) {
      const character = this.text.charAt(this.#offset);
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
    throw new TypeError("invalid authenticated wallet command transport");
  }
}

function decimalValue(value: string): number | null {
  if (value.length === 0) {
    return null;
  }
  let result = 0;
  for (let position = 0; position < value.length; position += 1) {
    const digit = value.charCodeAt(position) - 48;
    if (digit < 0 || digit > 9 || result > 900719925474099) {
      return null;
    }
    result = result * 10 + digit;
  }
  return Number.isSafeInteger(result) ? result : null;
}

function hasExactFields(input: StrictJsonObject, fields: readonly string[]): boolean {
  return input.size === fields.length && fields.every((field) => input.has(field));
}

function asObject(value: StrictJsonValue | undefined): StrictJsonObject | null {
  return value instanceof Map ? value : null;
}

function asStringArray(value: StrictJsonValue | undefined): readonly string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

function parseTransport(rawBody: Uint8Array): StrictJsonObject | null {
  if (rawBody.byteLength > maximumDecodedBytes) {
    return null;
  }
  try {
    const text = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(rawBody);
    const transport = new StrictJsonReader(text).readRoot();
    return hasExactFields(transport, transportFields) ? transport : null;
  } catch {
    return null;
  }
}

function parseCanonicalTimestamp(value: unknown): ParsedTimestamp | null {
  if (typeof value !== "string") {
    return null;
  }
  const match = timestampPattern.exec(value);
  if (match === null) {
    return null;
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, millisecondText] = match;
  const year = decimalValue(yearText ?? "");
  const month = decimalValue(monthText ?? "");
  const day = decimalValue(dayText ?? "");
  const hour = decimalValue(hourText ?? "");
  const minute = decimalValue(minuteText ?? "");
  const second = decimalValue(secondText ?? "");
  const millisecond = decimalValue(millisecondText ?? "");
  if (
    year === null || year < 0 || month === null || month < 1 || month > 12 ||
    day === null || hour === null || hour > 23 || minute === null || minute > 59 ||
    second === null || second > 59 || millisecond === null || millisecond > 999
  ) {
    return null;
  }
  const daysInMonth = monthLength(year, month);
  if (day < 1 || day > daysInMonth) {
    return null;
  }
  const days = daysBeforeYear(year) - daysBeforeYear(1970) + daysBeforeMonth(year, month) + day - 1;
  const milliseconds = (((((days * 24) + hour) * 60 + minute) * 60 + second) * 1000) + millisecond;
  return Number.isSafeInteger(milliseconds) ? { text: value, milliseconds } : null;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysBeforeYear(year: number): number {
  const priorYear = year - 1;
  return (priorYear * 365) + Math.floor(priorYear / 4) - Math.floor(priorYear / 100) + Math.floor(priorYear / 400);
}

function monthLength(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

function daysBeforeMonth(year: number, month: number): number {
  switch (month) {
    case 1:
      return 0;
    case 2:
      return 31;
    case 3:
      return isLeapYear(year) ? 60 : 59;
    case 4:
      return isLeapYear(year) ? 91 : 90;
    case 5:
      return isLeapYear(year) ? 121 : 120;
    case 6:
      return isLeapYear(year) ? 152 : 151;
    case 7:
      return isLeapYear(year) ? 182 : 181;
    case 8:
      return isLeapYear(year) ? 213 : 212;
    case 9:
      return isLeapYear(year) ? 244 : 243;
    case 10:
      return isLeapYear(year) ? 274 : 273;
    case 11:
      return isLeapYear(year) ? 305 : 304;
    case 12:
      return isLeapYear(year) ? 335 : 334;
    default:
      return -1;
  }
}

function hasValidTimeWindow(
  issuedAtValue: string,
  expiresAtValue: string,
  parsedServerNow: ParsedTimestamp,
): boolean {
  const issuedAt = parseCanonicalTimestamp(issuedAtValue);
  const expiresAt = parseCanonicalTimestamp(expiresAtValue);
  return (
    issuedAt !== null &&
    expiresAt !== null &&
    expiresAt.milliseconds > issuedAt.milliseconds &&
    expiresAt.milliseconds - issuedAt.milliseconds <= maximumCommandLifetimeMilliseconds &&
    issuedAt.milliseconds <= parsedServerNow.milliseconds + maximumIssuedAtFutureSkewMilliseconds &&
    parsedServerNow.milliseconds <= expiresAt.milliseconds
  );
}

export function isWalletCommandTimeWindowValidForTest(
  issuedAt: string,
  expiresAt: string,
  serverNow: string,
): boolean {
  const parsedServerNow = parseCanonicalTimestamp(serverNow);
  return parsedServerNow !== null && hasValidTimeWindow(issuedAt, expiresAt, parsedServerNow);
}

function parseCommand(input: StrictJsonObject): ParsedCommand | null {
  if (!hasExactFields(input, commandFields)) {
    return null;
  }
  const version = input.get("version");
  const type = input.get("type");
  const chainId = input.get("chainId");
  const signer = input.get("signer");
  const nonce = input.get("nonce");
  const issuedAt = input.get("issuedAt");
  const expiresAt = input.get("expiresAt");
  const payloadHash = input.get("payloadHash");
  const signature = input.get("signature");
  const parsedIssuedAt = parseCanonicalTimestamp(issuedAt);
  const parsedExpiresAt = parseCanonicalTimestamp(expiresAt);
  if (
    version !== 1 ||
    (type !== "external.prepare" && type !== "offering.create" && type !== "directory.publish" && type !== "external.attachCandidate") ||
    chainId !== 296 ||
    typeof signer !== "string" || !signerPattern.test(signer) ||
    typeof nonce !== "string" || !noncePattern.test(nonce) ||
    parsedIssuedAt === null || parsedExpiresAt === null ||
    typeof payloadHash !== "string" || !payloadHashPattern.test(payloadHash) ||
    typeof signature !== "string" || !signaturePattern.test(signature)
  ) {
    return null;
  }
  return {
    version: 1,
    type,
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
    if (r === 0n || r >= curveOrder || s === 0n || s > halfCurveOrder) {
      return null;
    }
    const recovery = signature.slice(130);
    if (recovery === "00") {
      return ("0x" + signature.slice(2, 130) + "1b") as Hex;
    }
    if (recovery === "01") {
      return ("0x" + signature.slice(2, 130) + "1c") as Hex;
    }
    if (recovery === "1b" || recovery === "1c") {
      return signature as Hex;
    }
    return null;
  } catch {
    return null;
  }
}

function materializeExternalPreparePayload(input: StrictJsonObject): unknown | null {
  if (!hasExactFields(input, externalPrepareFields)) {
    return null;
  }
  return {
    operationKind: input.get("operationKind"),
    subjectPublicId: input.get("subjectPublicId"),
    network: input.get("network"),
    chainId: input.get("chainId"),
    expectedTarget: input.get("expectedTarget"),
    canonicalParametersHash: input.get("canonicalParametersHash"),
    idempotencyKey: input.get("idempotencyKey"),
    expiresAt: input.get("expiresAt"),
  };
}

function materializeOfferingPayload(input: StrictJsonObject): unknown | null {
  if (!hasExactFields(input, offeringFields)) {
    return null;
  }
  const definition = asObject(input.get("definition"));
  const narrative = asObject(input.get("narrative"));
  if (definition === null || narrative === null || !hasExactFields(definition, definitionFields) || !hasExactFields(narrative, narrativeFields)) {
    return null;
  }
  const terms = asObject(definition.get("terms"));
  const customerUseCases = asStringArray(narrative.get("customerUseCases"));
  const useOfFunds = asStringArray(narrative.get("useOfFunds"));
  const risks = asStringArray(narrative.get("risks"));
  if (terms === null || customerUseCases === null || useOfFunds === null || risks === null || !hasExactFields(terms, termsFields)) {
    return null;
  }
  return {
    schemaVersion: input.get("schemaVersion"),
    offeringPublicId: input.get("offeringPublicId"),
    offeringVersion: input.get("offeringVersion"),
    subjectPublicId: input.get("subjectPublicId"),
    definition: {
      schemaVersion: definition.get("schemaVersion"),
      terms: {
        version: terms.get("version"),
        fundingTargetTinybars: terms.get("fundingTargetTinybars"),
        noteUnitPriceTinybars: terms.get("noteUnitPriceTinybars"),
        maximumNoteUnits: terms.get("maximumNoteUnits"),
        minimumPurchaseUnits: terms.get("minimumPurchaseUnits"),
        reserveShareBps: terms.get("reserveShareBps"),
        issuerShareBps: terms.get("issuerShareBps"),
        platformFeeBps: terms.get("platformFeeBps"),
        payoutCapTinybars: terms.get("payoutCapTinybars"),
      },
      maturityAt: definition.get("maturityAt"),
      qualifyingResource: definition.get("qualifyingResource"),
    },
    narrative: {
      title: narrative.get("title"),
      customerProblem: narrative.get("customerProblem"),
      customerUseCases,
      useOfFunds,
      risks,
    },
    advertisedQuickPriceTinybars: input.get("advertisedQuickPriceTinybars"),
    advertisedStandardPriceTinybars: input.get("advertisedStandardPriceTinybars"),
    idempotencyKey: input.get("idempotencyKey"),
    expiresAt: input.get("expiresAt"),
  };
}

function materializeDirectoryPayload(input: StrictJsonObject): unknown | null {
  if (!hasExactFields(input, directoryFields)) {
    return null;
  }
  const record = asObject(input.get("record"));
  if (
    record === null ||
    (record.size !== directoryRecordFields.length && record.size !== directoryRecordFields.length + 1) ||
    !directoryRecordFields.every((field) => record.has(field)) ||
    (record.size === directoryRecordFields.length + 1 && !record.has("webUrl"))
  ) {
    return null;
  }
  const capabilities = asStringArray(record.get("capabilities"));
  const advertisedTiers = asStringArray(record.get("advertisedTiers"));
  if (capabilities === null || advertisedTiers === null) {
    return null;
  }
  const materializedRecord = {
    schemaVersion: record.get("schemaVersion"),
    serviceId: record.get("serviceId"),
    serviceSlug: record.get("serviceSlug"),
    offeringPublicId: record.get("offeringPublicId"),
    offeringVersion: record.get("offeringVersion"),
    capabilities,
    x402Endpoint: record.get("x402Endpoint"),
    paymentProtocol: record.get("paymentProtocol"),
    paymentNetwork: record.get("paymentNetwork"),
    asset: record.get("asset"),
    advertisedTiers,
    issuerRevenueAccount: record.get("issuerRevenueAccount"),
    clearingAccount: record.get("clearingAccount"),
    status: record.get("status"),
    publishedAt: record.get("publishedAt"),
  };
  if (record.has("webUrl")) {
    return {
      schemaVersion: input.get("schemaVersion"),
      offeringPublicId: input.get("offeringPublicId"),
      offeringVersion: input.get("offeringVersion"),
      directoryVersion: input.get("directoryVersion"),
      record: { ...materializedRecord, webUrl: record.get("webUrl") },
      idempotencyKey: input.get("idempotencyKey"),
      expiresAt: input.get("expiresAt"),
    };
  }
  return {
    schemaVersion: input.get("schemaVersion"),
    offeringPublicId: input.get("offeringPublicId"),
    offeringVersion: input.get("offeringVersion"),
    directoryVersion: input.get("directoryVersion"),
    record: materializedRecord,
    idempotencyKey: input.get("idempotencyKey"),
    expiresAt: input.get("expiresAt"),
  };
}

function materializeAttachPayload(input: StrictJsonObject): unknown | null {
  if (
    (input.size !== attachFields.length && input.size !== attachFields.length + 1) ||
    !attachFields.every((field) => input.has(field)) ||
    (input.size === attachFields.length + 1 && !input.has("candidateEvmAddress"))
  ) {
    return null;
  }
  if (input.has("candidateEvmAddress")) {
    return {
      schemaVersion: input.get("schemaVersion"),
      attemptPublicId: input.get("attemptPublicId"),
      operationKind: input.get("operationKind"),
      candidateTransactionId: input.get("candidateTransactionId"),
      candidateEvmAddress: input.get("candidateEvmAddress"),
      idempotencyKey: input.get("idempotencyKey"),
      expiresAt: input.get("expiresAt"),
    };
  }
  return {
    schemaVersion: input.get("schemaVersion"),
    attemptPublicId: input.get("attemptPublicId"),
    operationKind: input.get("operationKind"),
    candidateTransactionId: input.get("candidateTransactionId"),
    idempotencyKey: input.get("idempotencyKey"),
    expiresAt: input.get("expiresAt"),
  };
}

function parsePayload(type: WalletCommandType, input: StrictJsonObject): CommandEnvelope | null {
  try {
    if (type === "external.prepare") {
      const materialized = materializeExternalPreparePayload(input);
      return materialized === null ? null : {
        type,
        payload: parseExternalPreparePayload(materialized),
      };
    }
    if (type === "offering.create") {
      const materialized = materializeOfferingPayload(input);
      return materialized === null ? null : {
        type,
        payload: parseOfferingCreatePayload(materialized),
      };
    }
    if (type === "directory.publish") {
      const materialized = materializeDirectoryPayload(input);
      return materialized === null ? null : {
        type,
        payload: parseDirectoryPublishPayload(materialized),
      };
    }
    if (type === "external.attachCandidate") {
      const materialized = materializeAttachPayload(input);
      return materialized === null ? null : {
        type,
        payload: parseAttachCandidatePayload(materialized),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function canonicalExternalPreparePayloadBytes(payload: ExternalPreparePayload): string {
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

function canonicalPayloadHash(envelope: CommandEnvelope): Hex {
  if (envelope.type === "external.prepare") {
    return keccak256(stringToHex(canonicalExternalPreparePayloadBytes(envelope.payload)));
  }
  const bytes = envelope.type === "offering.create"
    ? canonicalOfferingCreatePayloadBytes(envelope.payload)
    : envelope.type === "directory.publish"
      ? canonicalDirectoryPublishPayloadBytes(envelope.payload)
      : canonicalAttachCandidatePayloadBytes(envelope.payload);
  return keccak256(stringToHex(new TextDecoder().decode(bytes)));
}

function isPlainDataRecord(input: unknown): input is object {
  if (input === null || typeof input !== "object") {
    return false;
  }
  const probe = {};
  try {
    return Object.getPrototypeOf(input) === Object.getPrototypeOf(probe);
  } catch {
    return false;
  }
}

function descriptorValue(
  input: PropertyDescriptor | undefined,
  expectedEnumerable = true,
): unknown | null {
  if (
    input === undefined || input.enumerable !== expectedEnumerable ||
    !Object.hasOwn(input, "value") || Object.hasOwn(input, "get") || Object.hasOwn(input, "set")
  ) {
    return null;
  }
  return input.value;
}

function captureStringArray(input: unknown): readonly string[] | null {
  if (!Array.isArray(input)) {
    return null;
  }
  const arrayProbe: PropertyDescriptor[] = [];
  try {
    if (Object.getPrototypeOf(input) !== Object.getPrototypeOf(arrayProbe)) {
      return null;
    }
    const arrayInput: object = input;
    const descriptors = Object.getOwnPropertyDescriptors(arrayInput);
    const length = descriptorValue(descriptors.length, false);
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0) {
      return null;
    }
    const keys = Reflect.ownKeys(descriptors);
    if (
      keys.length !== length + 1 ||
      !keys.every((key, index) => key === (index === length ? "length" : index.toString()))
    ) {
      return null;
    }
    const values: string[] = [];
    // Iterate only the local descriptor snapshot, never resolver-owned elements or methods.
    const descriptorArray = { ...descriptors, length };
    const valid = arrayProbe.every.call(descriptorArray, (descriptor: PropertyDescriptor) => {
      const value = descriptorValue(descriptor);
      if (typeof value !== "string") {
        return false;
      }
      values.push(value);
      return true;
    });
    return valid ? values : null;
  } catch {
    return null;
  }
}

function parseAuthorityRecord(
  input: unknown,
  signer: string,
  envelope: CommandEnvelope,
): ResolvedAuthority | null {
  if (!isPlainDataRecord(input)) {
    return null;
  }
  try {
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== authorityFields.length ||
      !keys.every(
        (key) =>
          typeof key === "string" &&
          authorityFields.some((field) => field === key),
      )
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(input);
    const principalPublicId = descriptorValue(descriptors.principalPublicId);
    const canonicalSignerAddress = descriptorValue(descriptors.canonicalSignerAddress);
    const chainId = descriptorValue(descriptors.chainId);
    const role = descriptorValue(descriptors.role);
    const ownedSubjectPublicIds = descriptorValue(descriptors.ownedSubjectPublicIds);
    const authorityVersion = descriptorValue(descriptors.authorityVersion);
    const enabled = descriptorValue(descriptors.enabled);
    if (
      typeof principalPublicId !== "string" || principalPublicId.length === 0 ||
      canonicalSignerAddress !== signer || chainId !== 296 ||
      (role !== "ISSUER" && role !== "BACKER") ||
      typeof authorityVersion !== "string" || authorityVersion.length === 0 || enabled !== true
    ) {
      return null;
    }
    const ownedSubjects = captureStringArray(ownedSubjectPublicIds);
    if (ownedSubjects === null) {
      return null;
    }
    if (envelope.type === "external.prepare" && envelope.payload.operationKind === "HEDERA_FUNDING") {
      if (role !== "BACKER") {
        return null;
      }
    } else if (envelope.type === "external.prepare" || envelope.type === "offering.create") {
      if (role !== "ISSUER" || !ownedSubjects.includes(envelope.payload.subjectPublicId)) {
        return null;
      }
    } else if (role !== "ISSUER") {
      return null;
    }
    return { principalPublicId, role, authorityVersion };
  } catch {
    return null;
  }
}

function captureOneAuthority(records: unknown): unknown | null {
  if (!Array.isArray(records)) {
    return null;
  }
  const arrayProbe: unknown[] = [];
  try {
    if (Object.getPrototypeOf(records) !== Object.getPrototypeOf(arrayProbe)) {
      return null;
    }
    const keys = Reflect.ownKeys(records);
    if (keys.length !== 2 || !keys.includes("0") || !keys.includes("length")) {
      return null;
    }
    const record = descriptorValue(
      Reflect.getOwnPropertyDescriptor(records, "0"),
    );
    const length = descriptorValue(
      Reflect.getOwnPropertyDescriptor(records, "length"),
      false,
    );
    return length === 1 ? record : null;
  } catch {
    return null;
  }
}

async function resolveAuthority(
  resolver: ResolveCommandAuthorities,
  signer: string,
  envelope: CommandEnvelope,
): Promise<ResolvedAuthority | null> {
  if (typeof resolver !== "function") {
    return null;
  }
  const record = captureOneAuthority(await resolver(296, signer));
  return record === null ? null : parseAuthorityRecord(record, signer, envelope);
}

async function recoverSigner(command: ParsedCommand): Promise<string | null> {
  const normalizedSignature = normalizeSignature(command.signature);
  if (normalizedSignature === null) {
    return null;
  }
  try {
    const recovered = await recoverTypedDataAddress({
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
        payloadHash: command.payloadHash as Hex,
      },
      signature: normalizedSignature,
    });
    const canonicalSigner = recovered.toLowerCase();
    return canonicalSigner === command.signer ? canonicalSigner : null;
  } catch {
    return null;
  }
}

function normalizeEnvelope(
  command: ParsedCommand,
  envelope: CommandEnvelope,
  signer: string,
  authority: ResolvedAuthority,
): NormalizedWalletCommand {
  const replayIdentity = "tool402:wallet-command:v1:296:" + signer + ":" + command.nonce;
  if (envelope.type === "external.prepare") {
    return Object.freeze({
      version: 1,
      type: envelope.type,
      chainId: 296,
      canonicalSignerAddress: signer,
      nonce: command.nonce,
      issuedAt: command.issuedAt,
      expiresAt: command.expiresAt,
      payloadHash: command.payloadHash,
      replayIdentity,
      principalPublicId: authority.principalPublicId,
      role: authority.role,
      authorityVersion: authority.authorityVersion,
      payload: envelope.payload,
    });
  }
  if (envelope.type === "offering.create") {
    return Object.freeze({
      version: 1,
      type: envelope.type,
      chainId: 296,
      canonicalSignerAddress: signer,
      nonce: command.nonce,
      issuedAt: command.issuedAt,
      expiresAt: command.expiresAt,
      payloadHash: command.payloadHash,
      replayIdentity,
      principalPublicId: authority.principalPublicId,
      role: authority.role,
      authorityVersion: authority.authorityVersion,
      payload: envelope.payload,
    });
  }
  if (envelope.type === "directory.publish") {
    return Object.freeze({
      version: 1,
      type: envelope.type,
      chainId: 296,
      canonicalSignerAddress: signer,
      nonce: command.nonce,
      issuedAt: command.issuedAt,
      expiresAt: command.expiresAt,
      payloadHash: command.payloadHash,
      replayIdentity,
      principalPublicId: authority.principalPublicId,
      role: authority.role,
      authorityVersion: authority.authorityVersion,
      payload: envelope.payload,
      deferredSubjectOwnership: Object.freeze({
        kind: "OFFERING",
        offeringPublicId: envelope.payload.offeringPublicId,
        offeringVersion: envelope.payload.offeringVersion,
      }),
    });
  }
  return Object.freeze({
    version: 1,
    type: envelope.type,
    chainId: 296,
    canonicalSignerAddress: signer,
    nonce: command.nonce,
    issuedAt: command.issuedAt,
    expiresAt: command.expiresAt,
    payloadHash: command.payloadHash,
    replayIdentity,
    principalPublicId: authority.principalPublicId,
    role: authority.role,
    authorityVersion: authority.authorityVersion,
    payload: envelope.payload,
    deferredSubjectOwnership: Object.freeze({
      kind: "ATTEMPT",
      attemptPublicId: envelope.payload.attemptPublicId,
    }),
  });
}

export async function normalizeClaimedWalletCommand(
  claimedBody: unknown,
  serverNow: string,
  resolveCommandAuthorities: ResolveCommandAuthorities,
): Promise<NormalizedWalletCommand | null> {
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const rawBody = readClaimedProtectedBody(claimedBody);
  try {
    if (rawBody === null) {
      return null;
    }
    const parsedServerNow = parseCanonicalTimestamp(serverNow);
    const transport = parseTransport(rawBody);
    if (parsedServerNow === null || transport === null) {
      return null;
    }
    const commandInput = asObject(transport.get("command"));
    const payloadInput = asObject(transport.get("payload"));
    if (commandInput === null || payloadInput === null) {
      return null;
    }
    const command = parseCommand(commandInput);
    if (command === null) {
      return null;
    }
    const envelope = parsePayload(command.type, payloadInput);
    if (envelope === null || envelope.payload.expiresAt !== command.expiresAt || canonicalPayloadHash(envelope) !== command.payloadHash) {
      return null;
    }
    const signer = await recoverSigner(command);
    if (signer === null) {
      return null;
    }
    const authority = await resolveAuthority(resolveCommandAuthorities, signer, envelope);
    if (authority === null || !hasValidTimeWindow(command.issuedAt, command.expiresAt, parsedServerNow)) {
      return null;
    }
    return normalizeEnvelope(command, envelope, signer, authority);
  } catch {
    return null;
  }
}
