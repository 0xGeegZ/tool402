import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const timestamps = { createdAt: v.int64(), updatedAt: v.int64() };

export default defineSchema({
  commandAuthorities: defineTable({
    principalPublicId: v.string(),
    canonicalSignerAddress: v.string(),
    chainId: v.literal(296),
    role: v.union(v.literal("ISSUER"), v.literal("BACKER")),
    ownedSubjectPublicIds: v.array(v.string()),
    authorityVersion: v.string(),
    enabled: v.boolean(),
  }).index("by_chain_id_and_canonical_signer_address", ["chainId", "canonicalSignerAddress"]),
  externalPrepareCommandReplayClaims: defineTable({
    replayIdentity: v.string(),
    outcome: v.union(v.literal("NEW"), v.literal("IDEMPOTENCY_REPLAYED"), v.literal("IDEMPOTENCY_CONFLICT")),
    attemptId: v.optional(v.id("externalPrepareCommandAttempts")),
    claimedAt: v.int64(),
  }).index("by_replay_identity", ["replayIdentity"]),
  ingressCommandReplayClaims: defineTable({
    replayIdentity: v.string(),
    claimedAt: v.int64(),
  }).index("by_replay_identity", ["replayIdentity"]),
  externalPrepareCommandAttempts: defineTable({
    version: v.literal(1),
    type: v.literal("external.prepare"),
    chainId: v.literal(296),
    canonicalSignerAddress: v.string(),
    principalPublicId: v.string(),
    role: v.union(v.literal("ISSUER"), v.literal("BACKER")),
    authorityVersion: v.string(),
    payloadHash: v.string(),
    operationKind: v.union(
      v.literal("ATS_CREATE"), v.literal("ATS_CONTROL_LIST"), v.literal("ATS_ISSUE"),
      v.literal("ATS_TRANSFER"), v.literal("ATS_COUPON"), v.literal("HEDERA_FUNDING"),
    ),
    subjectPublicId: v.string(),
    network: v.literal("hedera:testnet"),
    expectedTarget: v.string(),
    canonicalParametersHash: v.string(),
    idempotencyKey: v.string(),
    expiresAt: v.string(),
    state: v.union(
      v.literal("PREPARED"), v.literal("SUBMITTED"), v.literal("CONFIRMED"),
      v.literal("OUTCOME_UNKNOWN"), v.literal("REJECTED"),
    ),
    candidateTransactionId: v.optional(v.string()),
    candidateEvmAddress: v.optional(v.string()),
    nextReconciliationAt: v.optional(v.int64()),
    acceptedAt: v.int64(),
  }).index("by_idempotency_key", ["idempotencyKey"]),
  offerings: defineTable({
    offeringPublicId: v.string(),
    subjectPublicId: v.string(),
    canonicalSignerAddress: v.string(),
    principalPublicId: v.string(),
    authorityVersion: v.string(),
    payloadHash: v.string(),
    idempotencyKey: v.string(),
    advertisedQuickPriceTinybars: v.string(),
    advertisedStandardPriceTinybars: v.string(),
    version: v.number(),
    acceptedAt: v.int64(),
    updatedAt: v.int64(),
    definition: v.object({
      schemaVersion: v.literal(1),
      terms: v.object({
        version: v.string(),
        fundingTargetTinybars: v.string(),
        noteUnitPriceTinybars: v.string(),
        maximumNoteUnits: v.string(),
        minimumPurchaseUnits: v.string(),
        reserveShareBps: v.string(),
        issuerShareBps: v.string(),
        platformFeeBps: v.string(),
        payoutCapTinybars: v.string(),
      }),
      maturityAt: v.string(),
      qualifyingResource: v.string(),
    }),
    narrative: v.object({
      title: v.string(),
      customerProblem: v.string(),
      customerUseCases: v.array(v.string()),
      useOfFunds: v.array(v.string()),
      risks: v.array(v.string()),
    }),
    state: v.union(
      v.literal("DRAFT"), v.literal("ASSET_PENDING"), v.literal("READY"),
      v.literal("OPEN"), v.literal("CLOSED"),
    ),
    atsAttemptId: v.optional(v.id("externalPrepareCommandAttempts")),
    atsAssetEvmAddress: v.optional(v.string()),
    activeDirectoryVersionId: v.optional(v.id("directoryVersions")),
  }).index("by_offering_public_id_and_version", ["offeringPublicId", "version"])
    .index("by_ats_attempt_id", ["atsAttemptId"])
    .index("by_ats_create_draft_binding", [
      "subjectPublicId",
      "canonicalSignerAddress",
      "principalPublicId",
      "authorityVersion",
      "state"
    ]),
  directoryVersions: defineTable({
    offeringPublicId: v.string(),
    payloadHash: v.string(),
    canonicalSignerAddress: v.string(),
    idempotencyKey: v.string(),
    offeringVersion: v.number(),
    directoryVersion: v.number(),
    serviceSlug: v.literal("riskscan"),
    record: v.object({
      schemaVersion: v.literal(1),
      serviceId: v.string(),
      serviceSlug: v.literal("riskscan"),
      offeringPublicId: v.string(),
      offeringVersion: v.number(),
      capabilities: v.array(v.literal("evm-contract-risk-signals")),
      x402Endpoint: v.string(),
      webUrl: v.optional(v.string()),
      paymentProtocol: v.literal("x402"),
      paymentNetwork: v.literal("hedera-testnet"),
      asset: v.literal("HBAR"),
      advertisedTiers: v.array(v.union(v.literal("quick"), v.literal("standard"))),
      issuerRevenueAccount: v.string(),
      clearingAccount: v.string(),
      status: v.literal("active"),
      publishedAt: v.string(),
    }),
    state: v.union(
      v.literal("DRAFT"), v.literal("PUBLISH_PREPARED"),
      v.literal("ACTIVE"), v.literal("SUPERSEDED"),
    ),
    acceptedAt: v.int64(),
  }).index("by_service_slug_and_state", ["serviceSlug", "state"])
    .index("by_offering_public_id_and_directory_version", ["offeringPublicId", "directoryVersion"]),
  walletCommandReplayClaims: defineTable({
    replayIdentity: v.string(),
    commandType: v.union(
      v.literal("offering.create"), v.literal("directory.publish"),
      v.literal("external.attachCandidate"),
    ),
    outcome: v.union(
      v.literal("NEW"), v.literal("IDEMPOTENCY_REPLAYED"),
      v.literal("IDEMPOTENCY_CONFLICT"),
    ),
    targetId: v.optional(v.string()),
    claimedAt: v.int64(),
  }).index("by_replay_identity", ["replayIdentity"]),
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
