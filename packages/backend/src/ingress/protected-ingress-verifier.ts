import { parseIngressEnvelope } from "@tool402/core";

const verifiedIngresses = new WeakSet<object>();
const expectedHmacHash = "SHA-256";
const maximumAcceptedSkewUnixSeconds = 60n;
const expectedSignatureByteLength = 32;

export interface VerifiedProtectedIngress {
  readonly keyId: string;
  readonly requestNonce: string;
  readonly replayIdentity: string;
  readonly verifiedAtUnixSeconds: bigint;
}

export type ResolveProtectedIngressKey = (
  keyId: string,
) => CryptoKey | undefined;

function toLowercaseHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function decodeBase64UrlSignature(value: string): Uint8Array | null {
  try {
    const standardBase64 = value.replace(/-/gu, "+").replace(/_/gu, "/");
    const paddingLength = (4 - (standardBase64.length % 4)) % 4;
    const decoded = atob(`${standardBase64}${"=".repeat(paddingLength)}`);
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));

    return bytes.byteLength === expectedSignatureByteLength ? bytes : null;
  } catch {
    return null;
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copiedBytes = new Uint8Array(bytes.byteLength);
  copiedBytes.set(bytes);
  return copiedBytes.buffer;
}

function isUsableVerificationKey(value: unknown): value is CryptoKey {
  try {
    if (typeof CryptoKey !== "function" || !(value instanceof CryptoKey)) {
      return false;
    }

    if (value.type !== "secret" || value.extractable) {
      return false;
    }

    const algorithm = value.algorithm;
    if (algorithm.name !== "HMAC" || !("hash" in algorithm)) {
      return false;
    }

    const hash = algorithm.hash;
    return (
      hash !== null &&
      typeof hash === "object" &&
      "name" in hash &&
      hash.name === expectedHmacHash &&
      value.usages.includes("verify")
    );
  } catch {
    return false;
  }
}

export function isVerifiedProtectedIngress(
  value: unknown,
): value is VerifiedProtectedIngress {
  return value !== null && typeof value === "object" && verifiedIngresses.has(value);
}

export async function verifyProtectedIngress(
  envelopeInput: unknown,
  rawBody: Uint8Array,
  nowUnixSeconds: bigint,
  resolveKey: ResolveProtectedIngressKey,
): Promise<VerifiedProtectedIngress | null> {
  try {
    if (!(rawBody instanceof Uint8Array)) {
      return null;
    }

    const copiedRawBody = new Uint8Array(rawBody);
    const envelope = parseIngressEnvelope(envelopeInput);
    const subtle = globalThis.crypto?.subtle;
    if (subtle === undefined) {
      return null;
    }

    const digest = new Uint8Array(
      await subtle.digest("SHA-256", toArrayBuffer(copiedRawBody)),
    );
    if (toLowercaseHex(digest) !== envelope.bodySha256) {
      return null;
    }

    const key = resolveKey(envelope.keyId);
    if (!isUsableVerificationKey(key)) {
      return null;
    }

    const signature = decodeBase64UrlSignature(envelope.signature);
    if (signature === null) {
      return null;
    }

    const isValidMac = await subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(signature),
      toArrayBuffer(new TextEncoder().encode(envelope.signingInput)),
    );
    if (!isValidMac) {
      return null;
    }

    if (typeof nowUnixSeconds !== "bigint" || nowUnixSeconds < 0n) {
      return null;
    }

    const skew =
      nowUnixSeconds >= envelope.timestampUnixSeconds
        ? nowUnixSeconds - envelope.timestampUnixSeconds
        : envelope.timestampUnixSeconds - nowUnixSeconds;
    if (skew > maximumAcceptedSkewUnixSeconds) {
      return null;
    }

    const verified = Object.freeze({
      keyId: envelope.keyId,
      requestNonce: envelope.requestNonce,
      replayIdentity: envelope.replayIdentity,
      verifiedAtUnixSeconds: nowUnixSeconds,
    });
    verifiedIngresses.add(verified);
    return verified;
  } catch {
    return null;
  }
}
