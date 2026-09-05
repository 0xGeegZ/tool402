const expectedInputKeys = [
  "idempotencyKeyHash",
  "network",
  "candidateSettlementRef",
  "createdAt",
  "updatedAt",
] as const;

const expectedInputKeySet = new Set<string>(expectedInputKeys);
const idempotencyKeyHashPattern = /^[a-f0-9]{64}$/u;
const networkPattern = /^eip155:[1-9]\d*$/u;
const candidateSettlementRefPattern = /^[A-Za-z0-9:_-]{1,160}$/u;
const maximumTimestamp = 9_223_372_036_854_775_807n;

type ExpectedInputKey = (typeof expectedInputKeys)[number];

export interface RiskScanSettlementAttemptCandidateDocument {
  readonly operation: "risk_scan_settlement";
  readonly idempotencyKeyHash: string;
  readonly network: string;
  readonly state: "pending_reconciliation";
  readonly candidateSettlementRef: string;
  readonly nextReconciliationAt: bigint;
  readonly createdAt: bigint;
  readonly updatedAt: bigint;
}

export interface RiskScanSettlementAttemptCandidate {
  readonly status: "unpersisted_candidate";
  readonly table: "riskScanSettlementAttempts";
  readonly document: Readonly<RiskScanSettlementAttemptCandidateDocument>;
}

function rejectInput(): never {
  throw new TypeError("Invalid RiskScan settlement-attempt admission input");
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
    idempotencyKeyHash: readOwnEnumerableDataProperty(input, "idempotencyKeyHash"),
    network: readOwnEnumerableDataProperty(input, "network"),
    candidateSettlementRef: readOwnEnumerableDataProperty(
      input,
      "candidateSettlementRef",
    ),
    createdAt: readOwnEnumerableDataProperty(input, "createdAt"),
    updatedAt: readOwnEnumerableDataProperty(input, "updatedAt"),
  };
}

function readIdempotencyKeyHash(value: unknown): string {
  if (
    typeof value !== "string" ||
    !idempotencyKeyHashPattern.test(value)
  ) {
    return rejectInput();
  }

  return value;
}

function readNetwork(value: unknown): string {
  if (typeof value !== "string" || !networkPattern.test(value)) {
    return rejectInput();
  }

  return value;
}

function readCandidateSettlementRef(value: unknown): string {
  if (
    typeof value !== "string" ||
    !candidateSettlementRefPattern.test(value)
  ) {
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

export function admitRiskScanSettlementAttempt(
  input: unknown,
): RiskScanSettlementAttemptCandidate {
  const values = readInputValues(input);
  const idempotencyKeyHash = readIdempotencyKeyHash(values.idempotencyKeyHash);
  const network = readNetwork(values.network);
  const candidateSettlementRef = readCandidateSettlementRef(
    values.candidateSettlementRef,
  );
  const createdAt = readTimestamp(values.createdAt);
  const updatedAt = readTimestamp(values.updatedAt);

  if (createdAt !== updatedAt) {
    return rejectInput();
  }

  const document = Object.freeze({
    operation: "risk_scan_settlement" as const,
    idempotencyKeyHash,
    network,
    state: "pending_reconciliation" as const,
    candidateSettlementRef,
    nextReconciliationAt: createdAt,
    createdAt,
    updatedAt,
  });

  return Object.freeze({
    status: "unpersisted_candidate" as const,
    table: "riskScanSettlementAttempts" as const,
    document,
  });
}
