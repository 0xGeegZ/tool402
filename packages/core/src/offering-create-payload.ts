import { parseOfferingDefinition } from "./offering-definition.ts";
import { canonicalizeRequirements } from "./requirements-offering-quote.ts";
import { parseTinybar } from "./value.ts";
import type { OfferingDefinition } from "./offering-definition.ts";
import type { Tinybar } from "./value.ts";

export interface OfferingNarrative {
  readonly title: string;
  readonly customerProblem: string;
  readonly customerUseCases: readonly string[];
  readonly useOfFunds: readonly string[];
  readonly risks: readonly string[];
}

export interface OfferingCreatePayload {
  readonly schemaVersion: 1;
  readonly offeringPublicId: string;
  readonly offeringVersion: number;
  readonly subjectPublicId: string;
  readonly definition: OfferingDefinition;
  readonly narrative: OfferingNarrative;
  readonly advertisedQuickPriceTinybars: Tinybar;
  readonly advertisedStandardPriceTinybars: Tinybar;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}

const payloadFields = [
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
const narrativeFields = [
  "title",
  "customerProblem",
  "customerUseCases",
  "useOfFunds",
  "risks",
] as const;
const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const idempotencyKeyPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const canonicalUtcMilliseconds =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;
const controlCharacterPattern = /[\u0000-\u001F\u007F-\u009F]/u;

function rejectOfferingCreatePayload(): never {
  throw new TypeError("invalid offering create payload");
}

function captureExactRecord(
  input: unknown,
  fields: readonly string[],
): readonly unknown[] {
  if (input === null || typeof input !== "object") {
    return rejectOfferingCreatePayload();
  }

  try {
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return rejectOfferingCreatePayload();
    }

    const keys = Reflect.ownKeys(input);
    if (keys.length !== fields.length) {
      return rejectOfferingCreatePayload();
    }
    for (const key of keys) {
      if (typeof key !== "string" || !fields.includes(key)) {
        return rejectOfferingCreatePayload();
      }
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
        return rejectOfferingCreatePayload();
      }
      return descriptor.value;
    });
  } catch {
    return rejectOfferingCreatePayload();
  }
}

function captureNarrativeArray(input: unknown): readonly unknown[] {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) {
      return rejectOfferingCreatePayload();
    }
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(input, "length");
    if (
      lengthDescriptor === undefined ||
      lengthDescriptor.enumerable !== false ||
      lengthDescriptor.configurable !== false ||
      !Object.hasOwn(lengthDescriptor, "value") ||
      Object.hasOwn(lengthDescriptor, "get") ||
      Object.hasOwn(lengthDescriptor, "set")
    ) {
      return rejectOfferingCreatePayload();
    }
    const length = lengthDescriptor.value;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 1 || length > 6) {
      return rejectOfferingCreatePayload();
    }
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== length + 1 ||
      keys.some((key) => key !== "length" && (!Number.isInteger(Number(key)) || String(Number(key)) !== key || Number(key) < 0 || Number(key) >= length))
    ) {
      return rejectOfferingCreatePayload();
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
        return rejectOfferingCreatePayload();
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return rejectOfferingCreatePayload();
  }
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return true;
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function parseNarrativeString(value: unknown, maximumBytes: number): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    controlCharacterPattern.test(value) ||
    hasUnpairedSurrogate(value) ||
    new TextEncoder().encode(value).byteLength > maximumBytes
  ) {
    return rejectOfferingCreatePayload();
  }
  return value;
}

function parseNarrative(input: unknown): OfferingNarrative {
  const [title, customerProblem, customerUseCases, useOfFunds, risks] =
    captureExactRecord(input, narrativeFields);
  const parseList = (value: unknown): readonly string[] => Object.freeze(
    captureNarrativeArray(value).map((item) => parseNarrativeString(item, 400)),
  );

  return Object.freeze({
    title: parseNarrativeString(title, 100),
    customerProblem: parseNarrativeString(customerProblem, 1000),
    customerUseCases: parseList(customerUseCases),
    useOfFunds: parseList(useOfFunds),
    risks: parseList(risks),
  });
}

function parsePublicId(value: unknown): string {
  if (typeof value !== "string" || !publicIdPattern.test(value)) {
    return rejectOfferingCreatePayload();
  }
  return value;
}

function parseVersion(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    return rejectOfferingCreatePayload();
  }
  return value;
}

function parsePrice(value: unknown): Tinybar {
  if (typeof value !== "string" || value.length > 8) {
    return rejectOfferingCreatePayload();
  }
  const price = parseTinybar(value);
  if (price === undefined || price < 1n || price > 10000000n) {
    return rejectOfferingCreatePayload();
  }
  return price;
}

function parseIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !idempotencyKeyPattern.test(value)) {
    return rejectOfferingCreatePayload();
  }
  return value;
}

function parseExpiry(value: unknown): string {
  if (typeof value !== "string" || !canonicalUtcMilliseconds.test(value)) {
    return rejectOfferingCreatePayload();
  }
  try {
    const instant = new Date(value);
    if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
      return rejectOfferingCreatePayload();
    }
  } catch {
    return rejectOfferingCreatePayload();
  }
  return value;
}

export function parseOfferingCreatePayload(input: unknown): OfferingCreatePayload {
  const [
    schemaVersion,
    offeringPublicId,
    offeringVersion,
    subjectPublicId,
    definition,
    narrative,
    advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars,
    idempotencyKey,
    expiresAt,
  ] = captureExactRecord(input, payloadFields);
  if (schemaVersion !== 1) {
    return rejectOfferingCreatePayload();
  }

  return Object.freeze({
    schemaVersion: 1,
    offeringPublicId: parsePublicId(offeringPublicId),
    offeringVersion: parseVersion(offeringVersion),
    subjectPublicId: parsePublicId(subjectPublicId),
    definition: parseOfferingDefinition(definition),
    narrative: parseNarrative(narrative),
    advertisedQuickPriceTinybars: parsePrice(advertisedQuickPriceTinybars),
    advertisedStandardPriceTinybars: parsePrice(advertisedStandardPriceTinybars),
    idempotencyKey: parseIdempotencyKey(idempotencyKey),
    expiresAt: parseExpiry(expiresAt),
  });
}

export function canonicalOfferingCreatePayloadBytes(
  payload: OfferingCreatePayload,
): Uint8Array {
  const terms = payload.definition.terms;
  return new TextEncoder().encode(canonicalizeRequirements({
    schemaVersion: payload.schemaVersion,
    offeringPublicId: payload.offeringPublicId,
    offeringVersion: payload.offeringVersion,
    subjectPublicId: payload.subjectPublicId,
    definition: {
      schemaVersion: payload.definition.schemaVersion,
      terms: {
        version: terms.version,
        fundingTargetTinybars: terms.fundingTargetTinybars.toString(),
        noteUnitPriceTinybars: terms.noteUnitPriceTinybars.toString(),
        maximumNoteUnits: terms.maximumNoteUnits.toString(),
        minimumPurchaseUnits: terms.minimumPurchaseUnits.toString(),
        reserveShareBps: terms.reserveShareBps.toString(),
        issuerShareBps: terms.issuerShareBps.toString(),
        platformFeeBps: terms.platformFeeBps.toString(),
        payoutCapTinybars: terms.payoutCapTinybars.toString(),
      },
      maturityAt: payload.definition.maturityAt,
      qualifyingResource: payload.definition.qualifyingResource,
    },
    narrative: {
      title: payload.narrative.title,
      customerProblem: payload.narrative.customerProblem,
      customerUseCases: [...payload.narrative.customerUseCases],
      useOfFunds: [...payload.narrative.useOfFunds],
      risks: [...payload.narrative.risks],
    },
    advertisedQuickPriceTinybars: payload.advertisedQuickPriceTinybars.toString(),
    advertisedStandardPriceTinybars: payload.advertisedStandardPriceTinybars.toString(),
    idempotencyKey: payload.idempotencyKey,
    expiresAt: payload.expiresAt,
  }));
}
