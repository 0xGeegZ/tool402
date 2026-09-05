const expectedInputKeys = ["transactionRef", "observedAt"] as const;

const expectedInputKeySet = new Set<string>(expectedInputKeys);
const transactionRefPattern = /^[A-Za-z0-9:_-]{1,160}$/u;
const maximumTimestamp = 9_223_372_036_854_775_807n;

type ExpectedInputKey = (typeof expectedInputKeys)[number];

export interface RiskScanSettlementRecordCandidateDocument {
  readonly transactionRef: string;
  readonly verificationState: "pending_verification";
  readonly observedAt: bigint;
}

export interface RiskScanSettlementRecordCandidate {
  readonly status: "unpersisted_candidate";
  readonly table: "riskScanSettlementRecords";
  readonly document: Readonly<RiskScanSettlementRecordCandidateDocument>;
}

function rejectInput(): never {
  throw new TypeError("Invalid RiskScan settlement-record admission input");
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
    transactionRef: readOwnEnumerableDataProperty(input, "transactionRef"),
    observedAt: readOwnEnumerableDataProperty(input, "observedAt"),
  };
}

function readTransactionRef(value: unknown): string {
  if (typeof value !== "string" || !transactionRefPattern.test(value)) {
    return rejectInput();
  }

  return value;
}

function readObservedAt(value: unknown): bigint {
  if (
    typeof value !== "bigint" ||
    value < 0n ||
    value > maximumTimestamp
  ) {
    return rejectInput();
  }

  return value;
}

export function admitRiskScanSettlementRecord(
  input: unknown,
): RiskScanSettlementRecordCandidate {
  const values = readInputValues(input);
  const transactionRef = readTransactionRef(values.transactionRef);
  const observedAt = readObservedAt(values.observedAt);
  const document = Object.freeze({
    transactionRef,
    verificationState: "pending_verification" as const,
    observedAt,
  });

  return Object.freeze({
    status: "unpersisted_candidate" as const,
    table: "riskScanSettlementRecords" as const,
    document,
  });
}
