import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const timestamps = { createdAt: v.int64(), updatedAt: v.int64() };

export default defineSchema({
  riskScanRequests: defineTable({
    publicId: v.string(), requestRef: v.string(), subjectRefHash: v.string(), inputHash: v.string(), state: v.string(), ...timestamps,
  }).index("by_public_id", ["publicId"]).index("by_request_ref", ["requestRef"]).index("by_state_and_updated_at", ["state", "updatedAt"]),
  riskScanSettlementAttempts: defineTable({
    publicId: v.string(), operation: v.string(), idempotencyKeyHash: v.string(), network: v.string(), state: v.string(), requestId: v.id("riskScanRequests"), candidateSettlementRef: v.optional(v.string()), nextReconciliationAt: v.optional(v.int64()), ...timestamps,
  }).index("by_public_id", ["publicId"]).index("by_request", ["requestId"]).index("by_idempotency_scope_and_key", ["operation", "idempotencyKeyHash"]).index("by_network_and_candidate", ["network", "candidateSettlementRef"]).index("by_state_and_next_reconciliation", ["state", "nextReconciliationAt"]),
  riskScanSettlementRecords: defineTable({
    attemptId: v.id("riskScanSettlementAttempts"), network: v.string(), transactionRef: v.string(), verificationState: v.string(), observedAt: v.int64(), finalityBoundary: v.optional(v.string()),
  }).index("by_attempt", ["attemptId"]).index("by_network_and_transaction_ref", ["network", "transactionRef"]).index("by_verification_state_and_observed_at", ["verificationState", "observedAt"]),
  riskScanPublicProjections: defineTable({
    requestId: v.id("riskScanRequests"), publicState: v.string(), asOf: v.int64(), safeResultHash: v.optional(v.string()),
  }).index("by_request", ["requestId"]).index("by_public_state_and_as_of", ["publicState", "asOf"]),
  riskScanOutbox: defineTable({
    publicId: v.string(), subjectType: v.string(), subjectId: v.string(), eventKind: v.string(), idempotencyKeyHash: v.string(), state: v.string(), nextAttemptAt: v.optional(v.int64()), ...timestamps,
  }).index("by_public_id", ["publicId"]).index("by_subject", ["subjectType", "subjectId"]).index("by_idempotency_scope_and_key", ["eventKind", "idempotencyKeyHash"]).index("by_state_and_next_attempt", ["state", "nextAttemptAt"]),
  riskScanEvidenceReferences: defineTable({
    subjectType: v.string(), subjectId: v.string(), kind: v.string(), sanitizedReference: v.string(), verificationState: v.string(), network: v.optional(v.string()), observedAt: v.int64(),
  }).index("by_subject", ["subjectType", "subjectId"]).index("by_kind_and_observed_at", ["kind", "observedAt"]).index("by_verification_state_and_observed_at", ["verificationState", "observedAt"]),
});
