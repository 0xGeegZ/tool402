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
  state: "payment_required";
  requestRef: string;
  subjectRef: string;
  context: string;
}

export interface RiskScanUnavailable {
  state: "unavailable";
  requestRef: string;
  subjectRef: string;
  context: string;
  reason: string;
}

export interface RiskScanPaymentPending {
  state: "payment_pending";
  requestRef: string;
  subjectRef: string;
  context: string;
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

export interface RiskScanCompletionInput {
  requestRef: string;
  settlementRef: string;
  resultRef: string;
  receiptRef: string;
  evidenceRef: string;
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

  return {
    state: "payment_required",
    ...request,
  };
}

export function markRiskScanUnavailable(
  state: RiskScanPaymentRequired,
  reason: string,
): RiskScanUnavailable {
  return {
    ...state,
    state: "unavailable",
    reason: requiredTrimmedString(reason, "reason"),
  };
}

export function markRiskScanPaymentPending(
  state: RiskScanPaymentRequired,
): RiskScanPaymentPending {
  return {
    ...state,
    state: "payment_pending",
  };
}

export function markRiskScanPaymentFailed(
  state: RiskScanPaymentRequired | RiskScanPaymentPending,
  reason: string,
): RiskScanPaymentFailed {
  return {
    ...state,
    state: "payment_failed",
    reason: requiredTrimmedString(reason, "reason"),
  };
}

export function createRiskScanVerifiedSettlement(
  state: RiskScanPaymentPending,
  correlation: RiskScanSettlementCorrelationInput,
): RiskScanVerifiedSettlement {
  const requestRef = requiredTrimmedString(
    correlation.requestRef,
    "requestRef",
  );

  if (requestRef !== state.requestRef) {
    throw new RangeError("requestRef must match the payment state");
  }

  const settlement = Object.freeze({
    requestRef: state.requestRef,
    subjectRef: state.subjectRef,
    context: state.context,
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
  completion: RiskScanCompletionInput,
): RiskScanCompleted {
  const verifiedSettlement = requireVerifiedRiskScanSettlement(settlement);
  const requestRef = requiredTrimmedString(completion.requestRef, "requestRef");

  if (requestRef !== verifiedSettlement.requestRef) {
    throw new RangeError("requestRef must match the verified settlement");
  }

  const settlementRef = requiredTrimmedString(
    completion.settlementRef,
    "settlementRef",
  );

  if (settlementRef !== verifiedSettlement.settlementRef) {
    throw new RangeError("settlementRef must match the verified settlement");
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
    receiptRef: requiredTrimmedString(completion.receiptRef, "receiptRef"),
    evidenceRef: requiredTrimmedString(completion.evidenceRef, "evidenceRef"),
  };
}
