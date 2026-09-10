const MIRROR_NODE_BASE_URL = "https://testnet.mirrornode.hedera.com/api/v1/";
const MIRROR_TRANSACTION_RESULT_PATH = "contracts/results/";
const MIRROR_READ_TIMEOUT_MS = 5_000;
const MAXIMUM_RESPONSE_BYTES = 1_048_576;
const candidateTransactionIdPattern =
  /^0\.0\.[0-9]+(?:@[0-9]+\.[0-9]+|-[0-9]+-[0-9]+)$/u;
const consensusTimestampPattern = /^[0-9]+\.[0-9]+$/u;

type MirrorTransactionVerification =
  | { readonly outcome: "VERIFIED" }
  | {
    readonly outcome: "REJECTED";
    readonly reason:
      | "RESULT_NOT_SUCCESS"
      | "TARGET_MISMATCH"
      | "NETWORK_MISMATCH"
      | "CREATED_ADDRESS_MISMATCH"
      | "OPERATION_NOT_ELIGIBLE";
  }
  | {
    readonly outcome: "UNKNOWN";
    readonly reason: "DOCUMENT_UNSAFE" | "CONSENSUS_TIMESTAMP_MISSING";
  };

interface MirrorTransactionExpectation {
  readonly operationKind: string;
  readonly network: string;
  readonly chainId: number;
  readonly expectedTarget: string;
  readonly candidateEvmAddress?: string;
}

type BoundedMirrorTransactionRead =
  | { readonly status: "DOCUMENT"; readonly document: Readonly<Record<string, unknown>> }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "UNAVAILABLE" };

type InjectedFetch = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

interface BoundedMirrorTransactionReaderDependencies {
  readonly mirrorNodeBaseUrl: string;
  readonly fetch: InjectedFetch;
}

function isOwnEnumerableDataDescriptor(
  descriptor: PropertyDescriptor | undefined,
): descriptor is PropertyDescriptor & { readonly value: unknown } {
  return descriptor !== undefined
    && descriptor.enumerable === true
    && Object.hasOwn(descriptor, "value")
    && !Object.hasOwn(descriptor, "get")
    && !Object.hasOwn(descriptor, "set");
}

function captureSafeDocument(
  input: unknown,
): Readonly<Record<string, unknown>> | null {
  try {
    if (
      input === null
      || typeof input !== "object"
      || Array.isArray(input)
      || Object.getPrototypeOf(input) !== Object.prototype
    ) {
      return null;
    }

    const values = Object.create(null) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(input)) {
      if (typeof key !== "string") {
        return null;
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(input, key);
      if (!isOwnEnumerableDataDescriptor(descriptor)) {
        return null;
      }
      Object.defineProperty(values, key, {
        configurable: false,
        enumerable: true,
        value: descriptor.value,
        writable: false,
      });
    }
    return Object.freeze(values);
  } catch {
    return null;
  }
}

function exposeSafeDocument(
  values: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const document: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(values)) {
    if (typeof key !== "string") {
      throw new TypeError("invalid captured Mirror transaction document");
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(values, key);
    if (!isOwnEnumerableDataDescriptor(descriptor)) {
      throw new TypeError("invalid captured Mirror transaction document");
    }
    Object.defineProperty(document, key, {
      configurable: false,
      enumerable: true,
      value: descriptor.value,
      writable: false,
    });
  }
  return Object.freeze(document);
}

function readDependencies(
  input: BoundedMirrorTransactionReaderDependencies,
): BoundedMirrorTransactionReaderDependencies {
  if (
    input === null
    || typeof input !== "object"
    || Object.getPrototypeOf(input) !== Object.prototype
    || Reflect.ownKeys(input).length !== 2
  ) {
    throw new TypeError("invalid bounded Mirror transaction reader dependencies");
  }

  const baseUrlDescriptor = Reflect.getOwnPropertyDescriptor(
    input,
    "mirrorNodeBaseUrl",
  );
  const fetchDescriptor = Reflect.getOwnPropertyDescriptor(input, "fetch");
  if (
    !isOwnEnumerableDataDescriptor(baseUrlDescriptor)
    || !isOwnEnumerableDataDescriptor(fetchDescriptor)
  ) {
    throw new TypeError("invalid bounded Mirror transaction reader dependencies");
  }

  if (
    baseUrlDescriptor.value !== MIRROR_NODE_BASE_URL
    || typeof fetchDescriptor.value !== "function"
  ) {
    throw new TypeError("invalid bounded Mirror transaction reader dependencies");
  }

  return {
    mirrorNodeBaseUrl: MIRROR_NODE_BASE_URL,
    fetch: fetchDescriptor.value as InjectedFetch,
  };
}

function toMirrorTransactionId(candidateTransactionId: string): string | null {
  if (!candidateTransactionIdPattern.test(candidateTransactionId)) {
    return null;
  }
  const atSignIndex = candidateTransactionId.indexOf("@");
  if (atSignIndex === -1) {
    return candidateTransactionId;
  }
  return `${candidateTransactionId.slice(0, atSignIndex)}-${candidateTransactionId
    .slice(atSignIndex + 1)
    .replace(".", "-")}`;
}

async function cancelBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // A closed or already-cancelled response needs no further handling.
  }
}

async function readBoundedResponseBody(response: Response): Promise<string | null> {
  const contentLength = response.headers.get("content-length");
  if (
    contentLength !== null
    && /^[0-9]+$/u.test(contentLength)
    && Number(contentLength) > MAXIMUM_RESPONSE_BYTES
  ) {
    await cancelBody(response);
    return null;
  }

  const reader = response.body?.getReader();
  if (reader === undefined) {
    return null;
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    byteLength += result.value.byteLength;
    if (byteLength > MAXIMUM_RESPONSE_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(result.value);
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function verifyMirrorTransactionReceipt(
  expectation: MirrorTransactionExpectation,
  document: unknown,
): MirrorTransactionVerification {
  if (expectation.candidateEvmAddress !== undefined) {
    return { outcome: "REJECTED", reason: "CREATED_ADDRESS_MISMATCH" };
  }
  if (expectation.operationKind !== "HEDERA_FUNDING") {
    return { outcome: "REJECTED", reason: "OPERATION_NOT_ELIGIBLE" };
  }
  const values = captureSafeDocument(document);
  if (values === null) {
    return { outcome: "UNKNOWN", reason: "DOCUMENT_UNSAFE" };
  }
  if (values.result !== "SUCCESS") {
    return { outcome: "REJECTED", reason: "RESULT_NOT_SUCCESS" };
  }
  if (values.to !== expectation.expectedTarget) {
    return { outcome: "REJECTED", reason: "TARGET_MISMATCH" };
  }
  if (
    expectation.network !== "hedera:testnet"
    || expectation.chainId !== 296
    || values.chain_id !== "0x0128"
  ) {
    return { outcome: "REJECTED", reason: "NETWORK_MISMATCH" };
  }
  if (
    typeof values.timestamp !== "string"
    || !consensusTimestampPattern.test(values.timestamp)
  ) {
    return { outcome: "UNKNOWN", reason: "CONSENSUS_TIMESTAMP_MISSING" };
  }
  return { outcome: "VERIFIED" };
}

export function createBoundedMirrorTransactionReader(
  input: BoundedMirrorTransactionReaderDependencies,
): (candidateTransactionId: string) => Promise<BoundedMirrorTransactionRead> {
  const dependencies = readDependencies(input);

  return async (candidateTransactionId) => {
    const mirrorTransactionId = toMirrorTransactionId(candidateTransactionId);
    if (mirrorTransactionId === null) {
      return { status: "UNAVAILABLE" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MIRROR_READ_TIMEOUT_MS);
    try {
      const response = await dependencies.fetch(
        `${MIRROR_NODE_BASE_URL}${MIRROR_TRANSACTION_RESULT_PATH}${mirrorTransactionId}`,
        {
          method: "GET",
          credentials: "omit",
          redirect: "error",
          signal: controller.signal,
        },
      );
      if (response.status === 404) {
        await cancelBody(response);
        return { status: "NOT_FOUND" };
      }
      if (!response.ok) {
        await cancelBody(response);
        return { status: "UNAVAILABLE" };
      }

      const contentType = response.headers.get("content-type");
      if (
        contentType === null
        || !/^application\/json(?:\s*;|\s*$)/iu.test(contentType)
      ) {
        await cancelBody(response);
        return { status: "UNAVAILABLE" };
      }

      const body = await readBoundedResponseBody(response);
      if (body === null) {
        return { status: "UNAVAILABLE" };
      }
      const document = captureSafeDocument(JSON.parse(body));
      if (document === null) {
        return { status: "UNAVAILABLE" };
      }
      return Reflect.ownKeys(document).length === 0
        ? { status: "NOT_FOUND" }
        : { status: "DOCUMENT", document: exposeSafeDocument(document) };
    } catch {
      return { status: "UNAVAILABLE" };
    } finally {
      clearTimeout(timeout);
    }
  };
}
