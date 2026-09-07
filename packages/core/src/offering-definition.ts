import { createOfferingTerms } from "./offering-economics.ts";
import type { OfferingTerms, OfferingTermsInput } from "./offering-economics.ts";

export interface OfferingDefinition {
  readonly schemaVersion: 1;
  readonly terms: OfferingTerms;
  readonly maturityAt: string;
  readonly qualifyingResource: string;
}

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

const canonicalUtcInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function snapshotExactRecord(
  value: unknown,
  fields: readonly string[],
): readonly unknown[] | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return undefined;
    }

    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== fields.length) {
      return undefined;
    }

    for (const key of ownKeys) {
      if (typeof key !== "string" || !fields.includes(key)) {
        return undefined;
      }
    }

    const values: unknown[] = [];
    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(value, field);
      if (
        descriptor === undefined ||
        !descriptor.enumerable ||
        !Object.prototype.hasOwnProperty.call(descriptor, "value")
      ) {
        return undefined;
      }

      values.push(descriptor.value);
    }

    return values;
  } catch {
    return undefined;
  }
}

function requireBoundedString(
  value: unknown,
  maximumLength: number,
  field: string,
): string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a primitive string`);
  }
  if (value.length > maximumLength) {
    throw new RangeError(`${field} must not exceed ${maximumLength} characters`);
  }

  return value;
}

function requireTrimmedNonblankString(
  value: unknown,
  maximumLength: number,
  field: string,
): string {
  const text = requireBoundedString(value, maximumLength, field);
  if (text.length === 0 || text.trim() !== text) {
    throw new RangeError(`${field} must be trimmed and nonblank`);
  }

  return text;
}

function parseMaturityAt(value: unknown): string {
  if (typeof value !== "string") {
    throw new TypeError("maturityAt must be a primitive string");
  }
  if (!canonicalUtcInstant.test(value)) {
    throw new RangeError("maturityAt must use canonical UTC text");
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp) || new Date(timestamp).toISOString() !== value) {
    throw new RangeError("maturityAt must be a real canonical UTC instant");
  }

  return value;
}

function parseTerms(input: unknown): OfferingTerms {
  const snapshot = snapshotExactRecord(input, termsFields);
  if (snapshot === undefined) {
    throw new TypeError("terms must be an exact ordinary record");
  }

  const [
    version,
    fundingTargetTinybars,
    noteUnitPriceTinybars,
    maximumNoteUnits,
    minimumPurchaseUnits,
    reserveShareBps,
    issuerShareBps,
    platformFeeBps,
    payoutCapTinybars,
  ] = snapshot;

  const termsInput: OfferingTermsInput = {
    version: requireTrimmedNonblankString(version, 96, "terms.version"),
    fundingTargetTinybars: requireBoundedString(
      fundingTargetTinybars,
      96,
      "terms.fundingTargetTinybars",
    ),
    noteUnitPriceTinybars: requireBoundedString(
      noteUnitPriceTinybars,
      96,
      "terms.noteUnitPriceTinybars",
    ),
    maximumNoteUnits: requireBoundedString(
      maximumNoteUnits,
      96,
      "terms.maximumNoteUnits",
    ),
    minimumPurchaseUnits: requireBoundedString(
      minimumPurchaseUnits,
      96,
      "terms.minimumPurchaseUnits",
    ),
    reserveShareBps: requireBoundedString(
      reserveShareBps,
      96,
      "terms.reserveShareBps",
    ),
    issuerShareBps: requireBoundedString(
      issuerShareBps,
      96,
      "terms.issuerShareBps",
    ),
    platformFeeBps: requireBoundedString(
      platformFeeBps,
      96,
      "terms.platformFeeBps",
    ),
    payoutCapTinybars: requireBoundedString(
      payoutCapTinybars,
      96,
      "terms.payoutCapTinybars",
    ),
  };

  return createOfferingTerms(termsInput);
}

export function parseOfferingDefinition(input: unknown): OfferingDefinition {
  const snapshot = snapshotExactRecord(input, definitionFields);
  if (snapshot === undefined) {
    throw new TypeError("offering definition must be an exact ordinary record");
  }

  const [schemaVersion, termsInput, maturityAtInput, qualifyingResourceInput] = snapshot;
  if (schemaVersion !== 1) {
    throw new RangeError("schemaVersion must equal 1");
  }

  const terms = parseTerms(termsInput);
  const maturityAt = parseMaturityAt(maturityAtInput);
  const qualifyingResource = requireTrimmedNonblankString(
    qualifyingResourceInput,
    256,
    "qualifyingResource",
  );

  return Object.freeze({
    schemaVersion: 1 as const,
    terms,
    maturityAt,
    qualifyingResource,
  });
}
