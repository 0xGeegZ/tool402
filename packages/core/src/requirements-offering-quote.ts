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

function emitPlainObject(
  value: object,
  depth: number,
  state: CaptureState,
  requireNonEmpty: boolean,
  emitter: CanonicalEmitter,
): void {
  if (safePrototype(value) !== Object.prototype) {
    rejectMalformedRequirements();
  }

  captureContainer(value, depth, state, () => {
    const properties = captureObjectProperties(value);
    if (requireNonEmpty && properties.length === 0) {
      rejectMalformedRequirements();
    }

    appendAscii(emitter, "{");
    let needsComma = false;
    for (const property of properties) {
      if (needsComma) {
        appendAscii(emitter, ",");
      }

      emitJsonString(emitter, property.key);
      appendAscii(emitter, ":");
      emitValue(property.value, depth + 1, state, false, emitter);
      needsComma = true;
    }
    appendAscii(emitter, "}");
  });
}

function emitArray(
  value: object,
  depth: number,
  state: CaptureState,
  emitter: CanonicalEmitter,
): void {
  if (safePrototype(value) !== Array.prototype) {
    rejectMalformedRequirements();
  }

  captureContainer(value, depth, state, () => {
    const keys = safeOwnKeys(value);
    const seenKeys = new Set<string>();
    const descriptors = new Map<string, DataPropertyDescriptor>();

    for (const key of keys) {
      if (typeof key !== "string" || seenKeys.has(key)) {
        rejectMalformedRequirements();
      }

      const descriptor = safeOwnPropertyDescriptor(value, key);
      if (!isDataPropertyDescriptor(descriptor)) {
        rejectMalformedRequirements();
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
      rejectMalformedRequirements();
    }

    const length = lengthDescriptor.value;
    if (length > MAX_ARRAY_ITEMS) {
      rejectRequirementsLimit();
    }
    if (descriptors.size !== length + 1) {
      rejectMalformedRequirements();
    }

    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors.get(String(index));
      if (descriptor === undefined || !descriptor.enumerable) {
        rejectMalformedRequirements();
      }

      values.push(descriptor.value);
    }

    appendAscii(emitter, "[");
    for (let index = 0; index < values.length; index += 1) {
      if (index > 0) {
        appendAscii(emitter, ",");
      }

      emitValue(values[index], depth + 1, state, false, emitter);
    }
    appendAscii(emitter, "]");
  });
}

function captureContainer(
  value: object,
  depth: number,
  state: CaptureState,
  capture: () => void,
): void {
  if (depth > MAX_CONTAINER_DEPTH) {
    rejectRequirementsLimit();
  }
  if (state.activeContainers.has(value)) {
    rejectMalformedRequirements();
  }

  state.activeContainers.add(value);
  try {
    capture();
  } finally {
    state.activeContainers.delete(value);
  }
}

function emitValue(
  value: unknown,
  depth: number,
  state: CaptureState,
  requireObjectRoot: boolean,
  emitter: CanonicalEmitter,
): void {
  consumeJsonValue(state);

  if (value === null) {
    if (requireObjectRoot) {
      rejectMalformedRequirements();
    }

    appendAscii(emitter, "null");
    return;
  }

  switch (typeof value) {
    case "boolean":
      if (requireObjectRoot) {
        rejectMalformedRequirements();
      }

      appendAscii(emitter, value ? "true" : "false");
      return;
    case "string":
      if (requireObjectRoot) {
        rejectMalformedRequirements();
      }

      emitJsonString(emitter, value);
      return;
    case "number":
      if (!Number.isFinite(value) || Object.is(value, -0)) {
        rejectMalformedRequirements();
      }

      if (requireObjectRoot) {
        rejectMalformedRequirements();
      }

      appendAscii(emitter, String(value));
      return;
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

        emitArray(value, depth, state, emitter);
        return;
      }

      emitPlainObject(value, depth, state, requireObjectRoot, emitter);
      return;
    }
    default:
      rejectMalformedRequirements();
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
  const emitter: CanonicalEmitter = {
    chunks: [],
    currentChunk: "",
    byteLength: 0,
  };

  emitValue(
    input,
    1,
    { nodeCount: 0, activeContainers: new WeakSet<object>() },
    true,
    emitter,
  );

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
