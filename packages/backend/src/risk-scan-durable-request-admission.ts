const expectedInputKeys = [
  "publicId",
  "requestRef",
  "subjectRefHash",
  "inputHash",
  "createdAt",
  "updatedAt",
] as const;

const expectedInputKeySet = new Set<string>(expectedInputKeys);
const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const maximumTimestamp = 9_223_372_036_854_775_807n;

type ExpectedInputKey = (typeof expectedInputKeys)[number];

export interface RiskScanDurableRequestDocument {
  readonly publicId: string;
  readonly requestRef: string;
  readonly subjectRefHash: string;
  readonly inputHash: string;
  readonly state: "payment_required";
  readonly createdAt: bigint;
  readonly updatedAt: bigint;
}

export interface RiskScanDurableRequestCandidate {
  readonly status: "unpersisted_candidate";
  readonly table: "riskScanRequests";
  readonly document: Readonly<RiskScanDurableRequestDocument>;
}

function rejectInput(): never {
  throw new TypeError("Invalid RiskScan durable request admission input");
}

function readOwnEnumerableDataProperty(
  input: object,
  key: ExpectedInputKey,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);

  if (
    descriptor === undefined ||
    descriptor.enumerable !== true ||
    !Object.hasOwn(descriptor, "value")
  ) {
    return rejectInput();
  }

  return descriptor.value;
}

function readInputValues(input: unknown): Record<ExpectedInputKey, unknown> {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    return rejectInput();
  }

  const keys = Reflect.ownKeys(input);
  if (
    keys.length !== expectedInputKeys.length ||
    keys.some((key) => typeof key !== "string" || !expectedInputKeySet.has(key))
  ) {
    return rejectInput();
  }

  return {
    publicId: readOwnEnumerableDataProperty(input, "publicId"),
    requestRef: readOwnEnumerableDataProperty(input, "requestRef"),
    subjectRefHash: readOwnEnumerableDataProperty(input, "subjectRefHash"),
    inputHash: readOwnEnumerableDataProperty(input, "inputHash"),
    createdAt: readOwnEnumerableDataProperty(input, "createdAt"),
    updatedAt: readOwnEnumerableDataProperty(input, "updatedAt"),
  };
}

function readPublicId(value: unknown): string {
  if (typeof value !== "string" || !publicIdPattern.test(value)) {
    return rejectInput();
  }

  return value;
}

function readRequestRef(value: unknown): string {
  if (typeof value !== "string") {
    return rejectInput();
  }

  const requestRef = value.trim();
  if (requestRef.length === 0 || requestRef.length > 96) {
    return rejectInput();
  }

  return requestRef;
}

function readHash(value: unknown): string {
  if (typeof value !== "string" || !hashPattern.test(value)) {
    return rejectInput();
  }

  return value;
}

function readTimestamp(value: unknown): bigint {
  if (
    typeof value !== "bigint" ||
    value < 0n ||
    value > maximumTimestamp
  ) {
    return rejectInput();
  }

  return value;
}

export function admitRiskScanDurableRequest(
  input: unknown,
): RiskScanDurableRequestCandidate {
  const values = readInputValues(input);
  const publicId = readPublicId(values.publicId);
  const requestRef = readRequestRef(values.requestRef);
  const subjectRefHash = readHash(values.subjectRefHash);
  const inputHash = readHash(values.inputHash);
  const createdAt = readTimestamp(values.createdAt);
  const updatedAt = readTimestamp(values.updatedAt);

  if (createdAt !== updatedAt) {
    return rejectInput();
  }

  const document = Object.freeze({
    publicId,
    requestRef,
    subjectRefHash,
    inputHash,
    state: "payment_required" as const,
    createdAt,
    updatedAt,
  });

  return Object.freeze({
    status: "unpersisted_candidate" as const,
    table: "riskScanRequests" as const,
    document,
  });
}
