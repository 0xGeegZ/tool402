export interface RiskScanRequestInput {
  requestRef: string;
  subjectRef: string;
  context: string;
}

export interface RiskScanRequest {
  requestRef: string;
  subjectRef: string;
  context: string;
}

export interface RiskScanPaymentRequired {
  readonly state: "payment_required";
  readonly requestRef: string;
  readonly subjectRef: string;
  readonly context: string;
}

export interface RiskScanUnavailable {
  state: "unavailable";
  requestRef: string;
  subjectRef: string;
  context: string;
  reason: string;
}

export interface RiskScanPaymentPending {
  readonly state: "payment_pending";
  readonly requestRef: string;
  readonly subjectRef: string;
  readonly context: string;
}

export interface RiskScanPaymentFailed {
  state: "payment_failed";
  requestRef: string;
  subjectRef: string;
  context: string;
  reason: string;
}

export interface RiskScanSettlementCorrelationInput {
  requestRef: string;
  settlementRef: string;
}

const verifiedRiskScanSettlements = new WeakSet<object>();
const issuedRiskScanPaymentRequired = new WeakSet<object>();
const issuedRiskScanPaymentPending = new WeakSet<object>();
const boundRiskScanReceiptEvidence = new WeakSet<object>();
const verifiedSettlementByReceiptEvidence = new WeakMap<
  object,
  RiskScanVerifiedSettlement
>();

export interface RiskScanVerifiedSettlement {
  readonly requestRef: string;
  readonly subjectRef: string;
  readonly context: string;
  readonly settlementRef: string;
}

export interface RiskScanExecutionFailed {
  state: "execution_failed";
  requestRef: string;
  subjectRef: string;
  context: string;
  settlementRef: string;
  reason: string;
}

export interface RiskScanReceiptEvidenceInput {
  receiptRef: string;
  evidenceRef: string;
}

export interface RiskScanBoundReceiptEvidence {
  readonly requestRef: string;
  readonly settlementRef: string;
  readonly receiptRef: string;
  readonly evidenceRef: string;
}

export interface RiskScanAssessmentCompletionInput {
  resultRef: string;
  salientReasons: readonly string[];
  limitations: readonly string[];
}

export interface RiskScanAssessmentResult {
  resultRef: string;
  salientReasons: string[];
  limitations: string[];
}

export interface RiskScanCompleted {
  state: "completed";
  requestRef: string;
  subjectRef: string;
  context: string;
  settlementRef: string;
  result: RiskScanAssessmentResult;
  receiptRef: string;
  evidenceRef: string;
}

export type RiskScanLifecycleState =
  | RiskScanUnavailable
  | RiskScanPaymentRequired
  | RiskScanPaymentPending
  | RiskScanPaymentFailed
  | RiskScanExecutionFailed
  | RiskScanCompleted;

function requiredTrimmedString(
  value: unknown,
  field: string,
  maximumLength?: number,
): string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new RangeError(`${field} must not be blank`);
  }

  if (maximumLength !== undefined && trimmedValue.length > maximumLength) {
    throw new RangeError(
      `${field} must not exceed ${maximumLength} characters`,
    );
  }

  return trimmedValue;
}

function requiredTrimmedStrings(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new RangeError(`${field} must contain at least one statement`);
  }

  return value.map((entry) => requiredTrimmedString(entry, field));
}

export function validateRiskScanRequest(
  input: RiskScanRequestInput,
): RiskScanRequest {
  return {
    requestRef: requiredTrimmedString(input.requestRef, "requestRef", 96),
    subjectRef: requiredTrimmedString(input.subjectRef, "subjectRef", 160),
    context: requiredTrimmedString(input.context, "context", 280),
  };
}

export function startRiskScanRequest(
  input: RiskScanRequestInput,
): RiskScanPaymentRequired {
  const request = validateRiskScanRequest(input);

  const required = Object.freeze({
    state: "payment_required",
    ...request,
  }) as RiskScanPaymentRequired;

  issuedRiskScanPaymentRequired.add(required);
  return required;
}

function requireIssuedRiskScanPaymentRequired(
  state: unknown,
): RiskScanPaymentRequired {
  if (
    typeof state !== "object" ||
    state === null ||
    !issuedRiskScanPaymentRequired.has(state)
  ) {
    throw new TypeError("an issued payment requirement is required");
  }

  return state as RiskScanPaymentRequired;
}

function requireIssuedRiskScanPaymentPending(
  state: unknown,
): RiskScanPaymentPending {
  if (
    typeof state !== "object" ||
    state === null ||
    !issuedRiskScanPaymentPending.has(state)
  ) {
    throw new TypeError("an issued payment pending state is required");
  }

  return state as RiskScanPaymentPending;
}

function requireIssuedRiskScanPaymentState(
  state: unknown,
): RiskScanPaymentRequired | RiskScanPaymentPending {
  if (
    typeof state !== "object" ||
    state === null ||
    (!issuedRiskScanPaymentRequired.has(state) &&
      !issuedRiskScanPaymentPending.has(state))
  ) {
    throw new TypeError("an issued payment state is required");
  }

  return state as RiskScanPaymentRequired | RiskScanPaymentPending;
}

export function markRiskScanUnavailable(
  state: RiskScanPaymentRequired,
  reason: string,
): RiskScanUnavailable {
  const required = requireIssuedRiskScanPaymentRequired(state);

  return {
    ...required,
    state: "unavailable",
    reason: requiredTrimmedString(reason, "reason"),
  };
}

export function markRiskScanPaymentPending(
  state: RiskScanPaymentRequired,
): RiskScanPaymentPending {
  const required = requireIssuedRiskScanPaymentRequired(state);
  const pending = Object.freeze({
    ...required,
    state: "payment_pending",
  }) as RiskScanPaymentPending;

  issuedRiskScanPaymentPending.add(pending);
  return pending;
}

export function markRiskScanPaymentFailed(
  state: RiskScanPaymentRequired | RiskScanPaymentPending,
  reason: string,
): RiskScanPaymentFailed {
  const issuedState = requireIssuedRiskScanPaymentState(state);

  return {
    ...issuedState,
    state: "payment_failed",
    reason: requiredTrimmedString(reason, "reason"),
  };
}

export function createRiskScanVerifiedSettlement(
  state: RiskScanPaymentPending,
  correlation: RiskScanSettlementCorrelationInput,
): RiskScanVerifiedSettlement {
  const pending = requireIssuedRiskScanPaymentPending(state);
  const requestRef = requiredTrimmedString(
    correlation.requestRef,
    "requestRef",
  );

  if (requestRef !== pending.requestRef) {
    throw new RangeError("requestRef must match the payment state");
  }

  const settlement = Object.freeze({
    requestRef: pending.requestRef,
    subjectRef: pending.subjectRef,
    context: pending.context,
    settlementRef: requiredTrimmedString(
      correlation.settlementRef,
      "settlementRef",
    ),
  }) as RiskScanVerifiedSettlement;

  verifiedRiskScanSettlements.add(settlement);

  return settlement;
}

function requireVerifiedRiskScanSettlement(
  settlement: unknown,
): RiskScanVerifiedSettlement {
  if (
    typeof settlement !== "object" ||
    settlement === null ||
    !verifiedRiskScanSettlements.has(settlement)
  ) {
    throw new TypeError("a verified settlement correlation is required");
  }

  return settlement as RiskScanVerifiedSettlement;
}

export function bindRiskScanReceiptEvidence(
  settlement: RiskScanVerifiedSettlement,
  input: RiskScanReceiptEvidenceInput,
): RiskScanBoundReceiptEvidence {
  const verifiedSettlement = requireVerifiedRiskScanSettlement(settlement);
  const artifacts = Object.freeze({
    requestRef: verifiedSettlement.requestRef,
    settlementRef: verifiedSettlement.settlementRef,
    receiptRef: requiredTrimmedString(input.receiptRef, "receiptRef"),
    evidenceRef: requiredTrimmedString(input.evidenceRef, "evidenceRef"),
  }) as RiskScanBoundReceiptEvidence;

  boundRiskScanReceiptEvidence.add(artifacts);
  verifiedSettlementByReceiptEvidence.set(artifacts, verifiedSettlement);
  return artifacts;
}

export function markRiskScanExecutionFailed(
  settlement: RiskScanVerifiedSettlement,
  reason: string,
): RiskScanExecutionFailed {
  const verifiedSettlement = requireVerifiedRiskScanSettlement(settlement);

  return {
    state: "execution_failed",
    requestRef: verifiedSettlement.requestRef,
    subjectRef: verifiedSettlement.subjectRef,
    context: verifiedSettlement.context,
    settlementRef: verifiedSettlement.settlementRef,
    reason: requiredTrimmedString(reason, "reason"),
  };
}

export function completeRiskScanRequest(
  settlement: RiskScanVerifiedSettlement,
  artifacts: RiskScanBoundReceiptEvidence,
  completion: RiskScanAssessmentCompletionInput,
): RiskScanCompleted {
  const verifiedSettlement = requireVerifiedRiskScanSettlement(settlement);
  if (
    typeof artifacts !== "object" ||
    artifacts === null ||
    !boundRiskScanReceiptEvidence.has(artifacts) ||
    verifiedSettlementByReceiptEvidence.get(artifacts) !== verifiedSettlement
  ) {
    throw new TypeError("a bound receipt and evidence artifact is required");
  }

  return {
    state: "completed",
    requestRef: verifiedSettlement.requestRef,
    subjectRef: verifiedSettlement.subjectRef,
    context: verifiedSettlement.context,
    settlementRef: verifiedSettlement.settlementRef,
    result: {
      resultRef: requiredTrimmedString(completion.resultRef, "resultRef"),
      salientReasons: requiredTrimmedStrings(
        completion.salientReasons,
        "salientReasons",
      ),
      limitations: requiredTrimmedStrings(completion.limitations, "limitations"),
    },
    receiptRef: artifacts.receiptRef,
    evidenceRef: artifacts.evidenceRef,
  };
}
