import { createHash } from "node:crypto";

type PaidOutcome = Readonly<{
  kind: "paid";
  settlementRef: string;
  assessment: Readonly<{
    requestRef: string;
    subjectRef: string;
    context: string;
    disposition: string;
    reasons: readonly string[];
    limitations: readonly string[];
  }>;
  quotedPayment: Readonly<{
    network: "hedera:testnet";
    asset: string;
    amount: string;
    recipient: string;
  }>;
}>;

export type RiskScanPaymentEvidence = Readonly<{
  schemaVersion: 1;
  kind: "tool402.agent-payment";
  recordingRunRef: string | null;
  sourceVersion: string | null;
  observedAt: string;
  service: Readonly<{ id: "riskscan.quick"; host: string }>;
  payment: Readonly<{
    network: "hedera:testnet";
    asset: string;
    quotedAmount: string;
    settlementRef: string;
    payer: string;
    recipient: string;
    settlementReportedBy: "facilitator-reported";
  }>;
  result: Readonly<{
    requestRef: string;
    digest: string;
    receivedAndValidatedByClient: true;
  }>;
}>;

const accountPattern = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/u;
const settlementPattern = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)@(?:[1-9][0-9]*)\.(?:0|[1-9][0-9]{0,8})$/u;
const atomicAmountPattern = /^[1-9][0-9]*$/u;
const safeReferencePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/u;
const sourceVersionPattern = /^[0-9a-f]{7,64}$/u;

function safeNullableReference(value: unknown, pattern: RegExp): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" && pattern.test(value) ? value : null;
}

function isPaidOutcome(value: unknown): value is PaidOutcome {
  if (typeof value !== "object" || value === null) return false;
  const outcome = value as Partial<PaidOutcome>;
  return outcome.kind === "paid"
    && typeof outcome.settlementRef === "string" && settlementPattern.test(outcome.settlementRef)
    && typeof outcome.assessment === "object" && outcome.assessment !== null
    && typeof outcome.assessment.requestRef === "string" && safeReferencePattern.test(outcome.assessment.requestRef)
    && typeof outcome.assessment.subjectRef === "string"
    && typeof outcome.assessment.context === "string"
    && typeof outcome.assessment.disposition === "string"
    && Array.isArray(outcome.assessment.reasons) && Array.isArray(outcome.assessment.limitations)
    && typeof outcome.quotedPayment === "object" && outcome.quotedPayment !== null
    && outcome.quotedPayment.network === "hedera:testnet"
    && typeof outcome.quotedPayment.asset === "string" && accountPattern.test(outcome.quotedPayment.asset)
    && typeof outcome.quotedPayment.amount === "string" && atomicAmountPattern.test(outcome.quotedPayment.amount)
    && typeof outcome.quotedPayment.recipient === "string" && accountPattern.test(outcome.quotedPayment.recipient);
}

export function createRiskScanPaymentEvidence(input: Readonly<{
  outcome: unknown;
  serviceBase?: URL;
  payerAccountId?: unknown;
  recordingRunRef?: unknown;
  sourceVersion?: unknown;
  observedAt?: unknown;
}>): RiskScanPaymentEvidence {
  if (!isPaidOutcome(input.outcome) || !(input.serviceBase instanceof URL) || !["http:", "https:"].includes(input.serviceBase.protocol)
    || input.serviceBase.username.length > 0 || input.serviceBase.password.length > 0
    || typeof input.payerAccountId !== "string" || !accountPattern.test(input.payerAccountId)
    || typeof input.observedAt !== "string" || Number.isNaN(Date.parse(input.observedAt))) {
    throw new TypeError("invalid payment evidence input");
  }
  const recordingRunRef = safeNullableReference(input.recordingRunRef, safeReferencePattern);
  const sourceVersion = safeNullableReference(input.sourceVersion, sourceVersionPattern);
  if ((input.recordingRunRef !== null && input.recordingRunRef !== undefined && recordingRunRef === null)
    || (input.sourceVersion !== null && input.sourceVersion !== undefined && sourceVersion === null)) {
    throw new TypeError("invalid payment evidence provenance");
  }
  const assessment = input.outcome.assessment;
  const digest = createHash("sha256").update(JSON.stringify({
    requestRef: assessment.requestRef,
    subjectRef: assessment.subjectRef,
    context: assessment.context,
    disposition: assessment.disposition,
    reasons: assessment.reasons,
    limitations: assessment.limitations,
  })).digest("hex");
  return Object.freeze({
    schemaVersion: 1,
    kind: "tool402.agent-payment",
    recordingRunRef,
    sourceVersion,
    observedAt: input.observedAt,
    service: Object.freeze({ id: "riskscan.quick", host: input.serviceBase.hostname }),
    payment: Object.freeze({
      network: "hedera:testnet",
      asset: input.outcome.quotedPayment.asset,
      quotedAmount: input.outcome.quotedPayment.amount,
      settlementRef: input.outcome.settlementRef,
      payer: input.payerAccountId,
      recipient: input.outcome.quotedPayment.recipient,
      settlementReportedBy: "facilitator-reported",
    }),
    result: Object.freeze({ requestRef: assessment.requestRef, digest, receivedAndValidatedByClient: true }),
  });
}

export function writeRiskScanPaymentEvidence(
  evidence: RiskScanPaymentEvidence,
  outputPath: string,
  writeFile: (path: string, body: string) => void,
): void {
  if (typeof outputPath !== "string" || outputPath.length === 0 || outputPath.length > 1_024) {
    throw new TypeError("invalid evidence output path");
  }
  writeFile(outputPath, JSON.stringify(evidence) + "\n");
}
