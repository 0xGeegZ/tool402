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
  readonly value: CapturedValue;
}

type CapturedValue =
  | { readonly kind: "null" }
  | { readonly kind: "boolean"; readonly value: boolean }
  | { readonly kind: "string"; readonly value: string }
  | { readonly kind: "number"; readonly value: number }
  | { readonly kind: "object"; readonly properties: readonly CapturedProperty[] }
  | { readonly kind: "array"; readonly values: readonly CapturedValue[] };

interface CanonicalEmitter {
  readonly chunks: string[];
  currentChunk: string;
  byteLength: number;
}

const MAX_CONTAINER_DEPTH = 16;
const MAX_JSON_VALUES = 256;
const MAX_OBJECT_PROPERTIES = 128;
const MAX_ARRAY_ITEMS = 128;
const MAX_CANONICAL_BYTES = 32 * 1024;
const EMITTER_CHUNK_CODE_UNITS = 1024;
const hexadecimalDigits = "0123456789abcdef";
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

function arrayIndexForKey(key: string): number | undefined {
  const index = Number(key);

  if (
    !Number.isSafeInteger(index) ||
    index < 0 ||
    String(index) !== key
  ) {
    return undefined;
  }

  return index;
}

function snapshotObjectProperties(
  value: object,
  depth: number,
  state: CaptureState,
): readonly CapturedProperty[] {
  const keys = safeOwnKeys(value);
  if (keys.length > MAX_OBJECT_PROPERTIES) {
    rejectRequirementsLimit();
  }

  const seenKeys = new Set<string>();
  const properties: CapturedProperty[] = [];

  for (const key of keys) {
    if (typeof key !== "string" || seenKeys.has(key)) {
      rejectMalformedRequirements();
    }

    const descriptor = safeOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !isDataPropertyDescriptor(descriptor)) {
      rejectMalformedRequirements();
    }

    seenKeys.add(key);
    properties.push({
      key,
      value: snapshotValue(descriptor.value, depth + 1, state, false),
    });
  }

  properties.sort((left, right) => compareKeys(left.key, right.key));
  return properties;
}

function appendBounded(
  emitter: CanonicalEmitter,
  value: string,
  byteLength: number,
): void {
  if (byteLength > MAX_CANONICAL_BYTES - emitter.byteLength) {
    rejectRequirementsLimit();
  }

  emitter.byteLength += byteLength;
  emitter.currentChunk += value;
  if (emitter.currentChunk.length >= EMITTER_CHUNK_CODE_UNITS) {
    emitter.chunks.push(emitter.currentChunk);
    emitter.currentChunk = "";
  }
}

function appendAscii(emitter: CanonicalEmitter, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) > 0x7f) {
      rejectMalformedRequirements();
    }
  }

  appendBounded(emitter, value, value.length);
}

function appendUtf8(
  emitter: CanonicalEmitter,
  value: string,
  byteLength: number,
): void {
  appendBounded(emitter, value, byteLength);
}

function emitUnicodeEscape(emitter: CanonicalEmitter, codeUnit: number): void {
  appendAscii(
    emitter,
    `\\u${hexadecimalDigits[(codeUnit >>> 12) & 0xf]}${
      hexadecimalDigits[(codeUnit >>> 8) & 0xf]
    }${hexadecimalDigits[(codeUnit >>> 4) & 0xf]}${
      hexadecimalDigits[codeUnit & 0xf]
    }`,
  );
}

function emitJsonString(emitter: CanonicalEmitter, value: string): void {
  appendAscii(emitter, '"');

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    switch (codeUnit) {
      case 0x22:
        appendAscii(emitter, '\\"');
        continue;
      case 0x5c:
        appendAscii(emitter, "\\\\");
        continue;
      case 0x08:
        appendAscii(emitter, "\\b");
        continue;
      case 0x0c:
        appendAscii(emitter, "\\f");
        continue;
      case 0x0a:
        appendAscii(emitter, "\\n");
        continue;
      case 0x0d:
        appendAscii(emitter, "\\r");
        continue;
      case 0x09:
        appendAscii(emitter, "\\t");
        continue;
      default:
        break;
    }

    if (codeUnit < 0x20) {
      emitUnicodeEscape(emitter, codeUnit);
      continue;
    }
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        appendUtf8(emitter, value.slice(index, index + 2), 4);
        index += 1;
      } else {
        emitUnicodeEscape(emitter, codeUnit);
      }
      continue;
    }
    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      emitUnicodeEscape(emitter, codeUnit);
      continue;
    }
    if (codeUnit <= 0x7f) {
      appendAscii(emitter, value.charAt(index));
      continue;
    }

    appendUtf8(
      emitter,
      value.charAt(index),
      codeUnit <= 0x7ff ? 2 : 3,
    );
  }

  appendAscii(emitter, '"');
}

function finishCanonicalEmitter(
  emitter: CanonicalEmitter,
): CanonicalRequirements {
  if (emitter.currentChunk.length > 0) {
    emitter.chunks.push(emitter.currentChunk);
    emitter.currentChunk = "";
  }

  return emitter.chunks.join("") as CanonicalRequirements;
}

function snapshotPlainObject(
  value: object,
  depth: number,
  state: CaptureState,
  requireNonEmpty: boolean,
): CapturedValue {
  if (safePrototype(value) !== Object.prototype) {
    rejectMalformedRequirements();
  }

  return snapshotContainer(value, depth, state, () => {
    const properties = snapshotObjectProperties(value, depth, state);
    if (requireNonEmpty && properties.length === 0) {
      rejectMalformedRequirements();
    }

    return { kind: "object", properties };
  });
}

function snapshotArray(
  value: object,
  depth: number,
  state: CaptureState,
): CapturedValue {
  if (safePrototype(value) !== Array.prototype) {
    rejectMalformedRequirements();
  }

  return snapshotContainer(value, depth, state, () => {
    const keys = safeOwnKeys(value);
    if (keys.length > MAX_ARRAY_ITEMS + 1) {
      rejectRequirementsLimit();
    }

    const seenKeys = new Set<string>();
    let itemCount = 0;
    let hasLength = false;

    for (const key of keys) {
      if (typeof key !== "string" || seenKeys.has(key)) {
        rejectMalformedRequirements();
      }

      seenKeys.add(key);
      if (key === "length") {
        hasLength = true;
        continue;
      }

      const index = arrayIndexForKey(key);
      if (index === undefined) {
        rejectMalformedRequirements();
      }

      itemCount += 1;
    }

    if (!hasLength) {
      rejectMalformedRequirements();
    }

    const capturedByIndex = new Map<number, CapturedValue>();
    let length: number | undefined;

    for (const key of keys) {
      if (typeof key !== "string") {
        rejectMalformedRequirements();
      }

      const descriptor = safeOwnPropertyDescriptor(value, key);
      if (key === "length") {
        if (
          !isDataPropertyDescriptor(descriptor) ||
          descriptor.enumerable ||
          typeof descriptor.value !== "number" ||
          !Number.isSafeInteger(descriptor.value) ||
          descriptor.value < 0
        ) {
          rejectMalformedRequirements();
        }

        length = descriptor.value;
        continue;
      }

      const index = arrayIndexForKey(key);
      if (index === undefined) {
        rejectMalformedRequirements();
      }
      if (!descriptor.enumerable || !isDataPropertyDescriptor(descriptor)) {
        rejectMalformedRequirements();
      }

      capturedByIndex.set(
        index,
        snapshotValue(descriptor.value, depth + 1, state, false),
      );
    }

    if (length === undefined) {
      rejectMalformedRequirements();
    }
    if (length > MAX_ARRAY_ITEMS) {
      rejectRequirementsLimit();
    }
    if (itemCount !== length) {
      rejectMalformedRequirements();
    }

    for (let index = 0; index < length; index += 1) {
      if (!seenKeys.has(String(index))) {
        rejectMalformedRequirements();
      }
    }

    const capturedValues: CapturedValue[] = [];
    for (let index = 0; index < length; index += 1) {
      const capturedValue = capturedByIndex.get(index);
      if (capturedValue === undefined) {
        rejectMalformedRequirements();
      }

      capturedValues.push(capturedValue);
    }

    return { kind: "array", values: capturedValues };
  });
}

function snapshotContainer<T>(
  value: object,
  depth: number,
  state: CaptureState,
  snapshot: () => T,
): T {
  if (depth > MAX_CONTAINER_DEPTH) {
    rejectRequirementsLimit();
  }
  if (state.activeContainers.has(value)) {
    rejectMalformedRequirements();
  }

  state.activeContainers.add(value);
  try {
    return snapshot();
  } finally {
    state.activeContainers.delete(value);
  }
}

function snapshotValue(
  value: unknown,
  depth: number,
  state: CaptureState,
  requireObjectRoot: boolean,
): CapturedValue {
  consumeJsonValue(state);

  if (value === null) {
    if (requireObjectRoot) {
      rejectMalformedRequirements();
    }

    return { kind: "null" };
  }

  switch (typeof value) {
    case "boolean":
      if (requireObjectRoot) {
        rejectMalformedRequirements();
      }

      return { kind: "boolean", value };
    case "string":
      if (requireObjectRoot) {
        rejectMalformedRequirements();
      }

      return { kind: "string", value };
    case "number":
      if (!Number.isFinite(value) || Object.is(value, -0)) {
        rejectMalformedRequirements();
      }

      if (requireObjectRoot) {
        rejectMalformedRequirements();
      }

      return { kind: "number", value };
    case "object": {
      let isArray: boolean;

      try {
        isArray = Array.isArray(value);
      } catch {
        rejectMalformedRequirements();
      }

      if (isArray) {
        if (requireObjectRoot) {
          rejectMalformedRequirements();
        }

        return snapshotArray(value, depth, state);
      }

      return snapshotPlainObject(value, depth, state, requireObjectRoot);
    }
    default:
      return rejectMalformedRequirements();
  }
}

function emitCapturedObject(
  properties: readonly CapturedProperty[],
  emitter: CanonicalEmitter,
): void {
  appendAscii(emitter, "{");
  let needsComma = false;
  for (const property of properties) {
    if (needsComma) {
      appendAscii(emitter, ",");
    }

    emitJsonString(emitter, property.key);
    appendAscii(emitter, ":");
    emitCapturedValue(property.value, emitter);
    needsComma = true;
  }
  appendAscii(emitter, "}");
}

function emitCapturedArray(
  values: readonly CapturedValue[],
  emitter: CanonicalEmitter,
): void {
  appendAscii(emitter, "[");
  let needsComma = false;
  for (const value of values) {
    if (needsComma) {
      appendAscii(emitter, ",");
    }

    emitCapturedValue(value, emitter);
    needsComma = true;
  }
  appendAscii(emitter, "]");
}

function emitCapturedValue(
  value: CapturedValue,
  emitter: CanonicalEmitter,
): void {
  switch (value.kind) {
    case "null":
      appendAscii(emitter, "null");
      return;
    case "boolean":
      appendAscii(emitter, value.value ? "true" : "false");
      return;
    case "string":
      emitJsonString(emitter, value.value);
      return;
    case "number":
      appendAscii(emitter, String(value.value));
      return;
    case "object":
      emitCapturedObject(value.properties, emitter);
      return;
    case "array":
      emitCapturedArray(value.values, emitter);
      return;
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
  const captured = snapshotValue(
    input,
    1,
    { nodeCount: 0, activeContainers: new WeakSet<object>() },
    true,
  );
  const emitter: CanonicalEmitter = {
    chunks: [],
    currentChunk: "",
    byteLength: 0,
  };

  emitCapturedValue(captured, emitter);

  return finishCanonicalEmitter(emitter);
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
  const expiresAt = canonicalExpiry(input.expiresAt);
  const requirementsDigest = await canonicalRequirementsDigest(
    canonicalizeRequirements(input.requirements),
  );

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
