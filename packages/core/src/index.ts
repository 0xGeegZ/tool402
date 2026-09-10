export const coreFoundation = {
  packageName: "@tool402/core",
} as const;

export { parseIngressEnvelope } from "./ingress-envelope.ts";
export type { IngressEnvelope } from "./ingress-envelope.ts";
export { parseExternalPreparePayload } from "./external-prepare-payload.ts";
export type {
  CanonicalParametersHash,
  EvmAddress,
  ExternalOperationKind,
  ExternalPreparePayload,
  ExternalPrepareTarget,
} from "./external-prepare-payload.ts";

export {
  parseBasisPoints,
  parseHederaAccountId,
  parseHederaTransactionId,
  parseNoteUnits,
  parseTinybar,
} from "./value.ts";
export type {
  BasisPoints,
  HederaAccountId,
  HederaTransactionId,
  NoteUnits,
  Tinybar,
} from "./value.ts";
export {
  calculateAllocation,
  calculateClearingSplit,
  createOfferingTerms,
  remainingPayoutCapacity,
} from "./offering-economics.ts";
export type {
  ClearingSplit,
  ClearingSplitInput,
  OfferingAllocation,
  OfferingAllocationInput,
  OfferingTerms,
  OfferingTermsInput,
} from "./offering-economics.ts";
export { parseOfferingDefinition } from "./offering-definition.ts";
export type { OfferingDefinition } from "./offering-definition.ts";
export { parseAgentDirectoryRecordCandidate } from "./agent-directory-record-candidate.ts";
export type {
  AdvertisedDirectoryTiers,
  AgentDirectoryRecordCandidate,
  DirectoryCapability,
  DirectoryTier,
} from "./agent-directory-record-candidate.ts";
export {
  canonicalizeRequirements,
  createOfferingRequirementsQuote,
  isOfferingRequirementsQuoteActive,
  matchesQuotedRequirements,
  sha256Requirements,
} from "./requirements-offering-quote.ts";
export type {
  CanonicalRequirements,
  OfferingRequirementsQuote,
  OfferingRequirementsQuoteInput,
  RequirementsDigest,
} from "./requirements-offering-quote.ts";
export {
  createOfferingPurchase,
  transitionOfferingPurchase,
} from "./offering-purchase-lifecycle.ts";
export type {
  OfferingPurchaseAllocationPending,
  OfferingPurchaseAllocationSubmitted,
  OfferingPurchaseAllocationOutcomeUnknown,
  OfferingPurchaseAwaitingPayment,
  OfferingPurchaseComplete,
  OfferingPurchaseDraft,
  OfferingPurchaseEvent,
  OfferingPurchaseExpired,
  OfferingPurchaseManualReconciliation,
  OfferingPurchasePaymentConfirmed,
  OfferingPurchasePaymentOutcomeUnknown,
  OfferingPurchasePaymentRejected,
  OfferingPurchasePaymentSubmitted,
  OfferingPurchaseRefunded,
  OfferingPurchaseRefundOutcomeUnknown,
  OfferingPurchaseRefundRequired,
  OfferingPurchaseRefundSubmitted,
  OfferingPurchaseSnapshot,
  OfferingPurchaseState,
} from "./offering-purchase-lifecycle.ts";
export { createPaidTask, transitionPaidTask } from "./paid-task-lifecycle.ts";
export type {
  PaidTaskEvent,
  PaidTaskExecutionFailed,
  PaidTaskExecutionStarted,
  PaidTaskExpired,
  PaidTaskInput,
  PaidTaskPaymentOutcomeUnknown,
  PaidTaskPaymentRejected,
  PaidTaskPaymentSettled,
  PaidTaskPaymentSubmitted,
  PaidTaskQuoted,
  PaidTaskResultValid,
  PaidTaskResponseOutcomeUnknown,
  PaidTaskSnapshot,
  PaidTaskState,
} from "./paid-task-lifecycle.ts";
export {
  createClearingSplit,
  transitionClearingSplit,
} from "./clearing-split-lifecycle.ts";
export type {
  ClearingSplitConfirmed,
  ClearingSplitEvent,
  ClearingSplitOutcomeUnknown,
  ClearingSplitRequired,
  ClearingSplitSnapshot,
  ClearingSplitState,
  ClearingSplitSubmitted,
} from "./clearing-split-lifecycle.ts";
export { evaluateRiskScanNativeQuote } from "./riskscan-native-quote-eligibility.ts";
export type {
  RiskScanNativeAssetId,
  RiskScanNativeAtomicAmount,
  RiskScanNativeQuoteDeclineReason,
  RiskScanNativeQuoteEligibility,
} from "./riskscan-native-quote-eligibility.ts";
export {
  bindRiskScanReceiptEvidence,
  completeRiskScanRequest,
  createRiskScanVerifiedSettlement,
  markRiskScanExecutionFailed,
  markRiskScanPaymentFailed,
  markRiskScanPaymentPending,
  markRiskScanUnavailable,
  startRiskScanRequest,
  validateRiskScanRequest,
} from "./risk-scan.ts";
export type {
  RiskScanAssessmentResult,
  RiskScanAssessmentCompletionInput,
  RiskScanBoundReceiptEvidence,
  RiskScanCompleted,
  RiskScanExecutionFailed,
  RiskScanLifecycleState,
  RiskScanPaymentFailed,
  RiskScanPaymentPending,
  RiskScanPaymentRequired,
  RiskScanRequest,
  RiskScanRequestInput,
  RiskScanReceiptEvidenceInput,
  RiskScanSettlementCorrelationInput,
  RiskScanUnavailable,
  RiskScanVerifiedSettlement,
} from "./risk-scan.ts";
export { assessRiskScanQuick } from "./risk-scan-quick.ts";
export type {
  RiskScanQuickDeclaration,
  RiskScanQuickDeclarations,
  RiskScanQuickDisposition,
  RiskScanQuickInput,
  RiskScanQuickResult,
} from "./risk-scan-quick.ts";
export {
  canonicalOfferingCreatePayloadBytes,
  parseOfferingCreatePayload,
} from "./offering-create-payload.ts";
export type {
  OfferingCreatePayload,
  OfferingNarrative,
} from "./offering-create-payload.ts";
export {
  canonicalDirectoryPublishPayloadBytes,
  parseDirectoryPublishPayload,
} from "./directory-publish-payload.ts";
export type { DirectoryPublishPayload } from "./directory-publish-payload.ts";
export {
  canonicalAttachCandidatePayloadBytes,
  parseAttachCandidatePayload,
} from "./attach-candidate-payload.ts";
export type {
  AttachCandidatePayload,
  CandidateTransactionId,
  MirrorTransactionId,
} from "./attach-candidate-payload.ts";
export {
  assessEntityCheck,
  normaliseEntityName,
  parseEntityCheckRequest,
} from "./entity-check.ts";
export type {
  EntityCheckAssessmentInput,
  EntityCheckDisposition,
  EntityCheckRequest,
  EntityCheckResult,
  EntityCheckScreen,
  EntityRegistryCandidate,
  EntityRegistrySource,
  EntitySanctionsDataset,
  EntitySanctionsEntry,
  EntitySanctionsSource,
} from "./entity-check.ts";
