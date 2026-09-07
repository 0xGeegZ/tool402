export interface IngressEnvelope {
  readonly keyId: string;
  readonly timestampUnixSeconds: bigint;
  readonly requestNonce: string;
  readonly bodySha256: string;
  readonly signature: string;
  readonly method: "POST";
  readonly path: "/internal/commands";
  readonly signingInput: string;
  readonly replayIdentity: string;
}

const ingressFields: readonly string[] = [
  "keyId",
  "timestampUnixSeconds",
  "requestNonce",
  "bodySha256",
  "signature",
] as const;
const keyIdPattern = /^[A-Za-z0-9_-]{1,64}$/u;
const noncePattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const digestPattern = /^[0-9a-f]{64}$/u;
const signaturePattern = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/u;
const timestampPattern = /^(?:0|[1-9][0-9]*)$/u;
const maximumTimestamp = "9223372036854775807";

function rejectIngressEnvelope(): never {
  throw new TypeError("invalid ingress envelope");
}

function captureIngressFields(input: unknown): readonly unknown[] {
  if (input === null || typeof input !== "object") {
    return rejectIngressEnvelope();
  }

  try {
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return rejectIngressEnvelope();
    }

    const keys = Reflect.ownKeys(input);
    if (keys.length !== ingressFields.length) {
      return rejectIngressEnvelope();
    }

    for (const key of keys) {
      if (typeof key !== "string" || !ingressFields.includes(key)) {
        return rejectIngressEnvelope();
      }
    }

    return ingressFields.map((field) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return rejectIngressEnvelope();
      }

      return descriptor.value;
    });
  } catch {
    return rejectIngressEnvelope();
  }
}

function parseString(value: unknown, pattern: RegExp): string {
  if (typeof value !== "string" || !pattern.test(value)) {
    return rejectIngressEnvelope();
  }

  return value;
}

function parseTimestamp(value: unknown): bigint {
  if (
    typeof value !== "string" ||
    !timestampPattern.test(value) ||
    value.length > maximumTimestamp.length ||
    (value.length === maximumTimestamp.length && value > maximumTimestamp)
  ) {
    return rejectIngressEnvelope();
  }

  return BigInt(value);
}

export function parseIngressEnvelope(input: unknown): IngressEnvelope {
  const [rawKeyId, rawTimestamp, rawRequestNonce, rawBodySha256, rawSignature] =
    captureIngressFields(input);
  const keyId = parseString(rawKeyId, keyIdPattern);
  const timestampUnixSeconds = parseTimestamp(rawTimestamp);
  const requestNonce = parseString(rawRequestNonce, noncePattern);
  const bodySha256 = parseString(rawBodySha256, digestPattern);
  const signature = parseString(rawSignature, signaturePattern);
  const method = "POST" as const;
  const path = "/internal/commands" as const;

  return Object.freeze({
    keyId,
    timestampUnixSeconds,
    requestNonce,
    bodySha256,
    signature,
    method,
    path,
    signingInput: [
      method,
      path,
      rawTimestamp,
      requestNonce,
      bodySha256,
    ].join("\n"),
    replayIdentity: `${keyId}:${requestNonce}`,
  });
}
