import { calculateAllocation } from "./offering-economics.ts";
import type { OfferingTerms } from "./offering-economics.ts";
import type { NoteUnits, Tinybar } from "./value.ts";

export type CanonicalRequirements = string & {
  readonly __brand: "CanonicalRequirements";
};

export type RequirementsDigest = string & {
  readonly __brand: "RequirementsDigest";
};

export interface OfferingRequirementsQuoteInput {
  readonly expectedTermsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly confirmedAllocatedUnits: NoteUnits;
  readonly requirements: unknown;
  readonly expiresAt: string;
}

export interface OfferingRequirementsQuote {
  readonly termsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly paymentTinybars: Tinybar;
  readonly remainingCapacityUnits: NoteUnits;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

interface CaptureState {
  nodeCount: number;
  readonly activeContainers: WeakSet<object>;
}

interface DataPropertyDescriptor extends PropertyDescriptor {
  readonly value: unknown;
}

interface CapturedProperty {
  readonly key: string;
  readonly value: unknown;
}

const MAX_CONTAINER_DEPTH = 16;
const MAX_JSON_VALUES = 256;
const MAX_OBJECT_PROPERTIES = 128;
const MAX_ARRAY_ITEMS = 128;
const MAX_CANONICAL_BYTES = 32 * 1024;
const canonicalUtcMilliseconds =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;

function rejectMalformedRequirements(): never {
  throw new TypeError("requirements must be a safe JSON object");
}

function rejectRequirementsLimit(): never {
  throw new RangeError("requirements exceed canonicalization limits");
}

function safeOwnKeys(value: object): readonly PropertyKey[] {
  try {
    return Reflect.ownKeys(value);
  } catch {
    return rejectMalformedRequirements();
  }
}

function safeOwnPropertyDescriptor(
  value: object,
  key: PropertyKey,
): PropertyDescriptor {
  let descriptor: PropertyDescriptor | undefined;

  try {
    descriptor = Reflect.getOwnPropertyDescriptor(value, key);
  } catch {
    return rejectMalformedRequirements();
  }

  return descriptor ?? rejectMalformedRequirements();
}

function safePrototype(value: object): object | null {
  try {
    return Object.getPrototypeOf(value);
  } catch {
    return rejectMalformedRequirements();
  }
}

function isDataPropertyDescriptor(
  descriptor: PropertyDescriptor,
): descriptor is DataPropertyDescriptor {
  return (
    Object.hasOwn(descriptor, "value") &&
    !Object.hasOwn(descriptor, "get") &&
    !Object.hasOwn(descriptor, "set")
  );
}

function consumeJsonValue(state: CaptureState): void {
  state.nodeCount += 1;

  if (state.nodeCount > MAX_JSON_VALUES) {
    rejectRequirementsLimit();
  }
}

function compareKeys(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
}

function captureObjectProperties(value: object): readonly CapturedProperty[] {
  const keys = safeOwnKeys(value);
  if (keys.length > MAX_OBJECT_PROPERTIES) {
    rejectRequirementsLimit();
  }

  const seenKeys = new Set<string>();
  const descriptors: Array<{ key: string; descriptor: DataPropertyDescriptor }> = [];

  for (const key of keys) {
    if (typeof key !== "string" || seenKeys.has(key)) {
      rejectMalformedRequirements();
    }

    const descriptor = safeOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !isDataPropertyDescriptor(descriptor)) {
      rejectMalformedRequirements();
    }

    seenKeys.add(key);
    descriptors.push({ key, descriptor });
  }

  descriptors.sort((left, right) => compareKeys(left.key, right.key));
  return descriptors.map(({ key, descriptor }) => ({
    key,
    value: descriptor.value,
  }));
}

function capturePlainObject(
  value: object,
  depth: number,
  state: CaptureState,
  requireNonEmpty: boolean,
): string {
  if (safePrototype(value) !== Object.prototype) {
    return rejectMalformedRequirements();
  }

  return captureContainer(value, depth, state, () => {
    const properties = captureObjectProperties(value);
    if (requireNonEmpty && properties.length === 0) {
      return rejectMalformedRequirements();
    }

    return `{${properties
      .map(
        ({ key, value: propertyValue }) =>
          `${JSON.stringify(key)}:${captureValue(propertyValue, depth + 1, state, false)}`,
      )
      .join(",")}}`;
  });
}

function captureArray(
  value: object,
  depth: number,
  state: CaptureState,
): string {
  if (safePrototype(value) !== Array.prototype) {
    return rejectMalformedRequirements();
  }

  return captureContainer(value, depth, state, () => {
    const keys = safeOwnKeys(value);
    const seenKeys = new Set<string>();
    const descriptors = new Map<string, DataPropertyDescriptor>();

    for (const key of keys) {
      if (typeof key !== "string" || seenKeys.has(key)) {
        return rejectMalformedRequirements();
      }

      const descriptor = safeOwnPropertyDescriptor(value, key);
      if (!isDataPropertyDescriptor(descriptor)) {
        return rejectMalformedRequirements();
      }

      seenKeys.add(key);
      descriptors.set(key, descriptor);
    }

    const lengthDescriptor = descriptors.get("length");
    if (
      lengthDescriptor === undefined ||
      lengthDescriptor.enumerable ||
      typeof lengthDescriptor.value !== "number" ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return rejectMalformedRequirements();
    }

    const length = lengthDescriptor.value;
    if (length > MAX_ARRAY_ITEMS) {
      return rejectRequirementsLimit();
    }
    if (descriptors.size !== length + 1) {
      return rejectMalformedRequirements();
    }

    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors.get(String(index));
      if (descriptor === undefined || !descriptor.enumerable) {
        return rejectMalformedRequirements();
      }

      values.push(descriptor.value);
    }

    return `[${values
      .map((item) => captureValue(item, depth + 1, state, false))
      .join(",")}]`;
  });
}

function captureContainer(
  value: object,
  depth: number,
  state: CaptureState,
  capture: () => string,
): string {
  if (depth > MAX_CONTAINER_DEPTH) {
    return rejectRequirementsLimit();
  }
  if (state.activeContainers.has(value)) {
    return rejectMalformedRequirements();
  }

  state.activeContainers.add(value);
  try {
    return capture();
  } finally {
    state.activeContainers.delete(value);
  }
}

function captureValue(
  value: unknown,
  depth: number,
  state: CaptureState,
  requireObjectRoot: boolean,
): string {
  consumeJsonValue(state);

  if (value === null) {
    return requireObjectRoot ? rejectMalformedRequirements() : "null";
  }

  switch (typeof value) {
    case "boolean":
      return requireObjectRoot ? rejectMalformedRequirements() : String(value);
    case "string":
      return requireObjectRoot ? rejectMalformedRequirements() : JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value) || Object.is(value, -0)) {
        return rejectMalformedRequirements();
      }

      return requireObjectRoot ? rejectMalformedRequirements() : JSON.stringify(value);
    case "object": {
      let isArray: boolean;

      try {
        isArray = Array.isArray(value);
      } catch {
        return rejectMalformedRequirements();
      }

      if (isArray) {
        return requireObjectRoot
          ? rejectMalformedRequirements()
          : captureArray(value, depth, state);
      }

      return capturePlainObject(value, depth, state, requireObjectRoot);
    }
    default:
      return rejectMalformedRequirements();
  }
}

function parseCanonicalUtcMilliseconds(value: unknown): number {
  if (typeof value !== "string" || !canonicalUtcMilliseconds.test(value)) {
    throw new TypeError("timestamp must use canonical UTC milliseconds");
  }

  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    throw new RangeError("timestamp must round-trip as canonical UTC milliseconds");
  }

  return epoch;
}

function canonicalExpiry(value: string): string {
  parseCanonicalUtcMilliseconds(value);
  return value;
}

async function canonicalRequirementsDigest(
  canonicalRequirements: CanonicalRequirements,
): Promise<RequirementsDigest> {
  if (globalThis.crypto?.subtle === undefined) {
    throw new TypeError("Web Crypto SHA-256 is unavailable");
  }

  const bytes = new TextEncoder().encode(canonicalRequirements);
  const bytesDigest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hexadecimal = [...new Uint8Array(bytesDigest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

  return hexadecimal as RequirementsDigest;
}

export function canonicalizeRequirements(input: unknown): CanonicalRequirements {
  const canonical = captureValue(
    input,
    1,
    { nodeCount: 0, activeContainers: new WeakSet<object>() },
    true,
  );

  if (new TextEncoder().encode(canonical).byteLength > MAX_CANONICAL_BYTES) {
    rejectRequirementsLimit();
  }

  return canonical as CanonicalRequirements;
}

export async function sha256Requirements(
  input: unknown,
): Promise<RequirementsDigest> {
  return canonicalRequirementsDigest(canonicalizeRequirements(input));
}

export async function createOfferingRequirementsQuote(
  terms: OfferingTerms,
  input: OfferingRequirementsQuoteInput,
): Promise<OfferingRequirementsQuote> {
  const allocation = calculateAllocation(terms, input);
  const requirementsDigest = await canonicalRequirementsDigest(
    canonicalizeRequirements(input.requirements),
  );
  const expiresAt = canonicalExpiry(input.expiresAt);

  return Object.freeze({
    termsVersion: allocation.termsVersion,
    requestedUnits: allocation.requestedUnits,
    paymentTinybars: allocation.paymentTinybars,
    remainingCapacityUnits: allocation.remainingCapacityUnits,
    requirementsDigest,
    expiresAt,
  });
}

export async function matchesQuotedRequirements(
  quote: OfferingRequirementsQuote,
  requirements: unknown,
): Promise<boolean> {
  return quote.requirementsDigest === (await sha256Requirements(requirements));
}

export function isOfferingRequirementsQuoteActive(
  quote: OfferingRequirementsQuote,
  observedAt: string,
): boolean {
  return (
    parseCanonicalUtcMilliseconds(observedAt) <
    parseCanonicalUtcMilliseconds(quote.expiresAt)
  );
}
