import { internalMutationGeneric, type IndexRange } from "convex/server";
import { v, type GenericId } from "convex/values";
import {
  admitRiskScanSettlementAttempt,
  type RiskScanSettlementAttemptCandidateDocument,
} from "../src/risk-scan-settlement-attempt-admission.ts";

type InitialSettlementAttemptDocument<RequestId> =
  RiskScanSettlementAttemptCandidateDocument & {
    readonly publicId: string;
    readonly requestId: RequestId;
  };

type IdempotencyKeyIndexRange = IndexRange & {
  eq(field: "idempotencyKeyHash", value: string): IndexRange;
};

function matchesInitialSettlementAttempt<RequestId>(
  existing: Record<string, unknown>,
  document: InitialSettlementAttemptDocument<RequestId>,
): boolean {
  return existing.publicId === document.publicId
    && existing.requestId === document.requestId
    && existing.operation === document.operation
    && existing.idempotencyKeyHash === document.idempotencyKeyHash
    && existing.network === document.network
    && existing.state === document.state
    && existing.candidateSettlementRef === document.candidateSettlementRef
    && existing.nextReconciliationAt === document.nextReconciliationAt
    && existing.createdAt === document.createdAt
    && existing.updatedAt === document.updatedAt;
}

function hasOpaqueAttemptId(
  existing: unknown,
): existing is Record<string, unknown> & {
  readonly _id: GenericId<"riskScanSettlementAttempts">;
} {
  if (existing === null || typeof existing !== "object") {
    return false;
  }

  const descriptor = Object.getOwnPropertyDescriptor(existing, "_id");
  return descriptor !== undefined
    && Object.hasOwn(descriptor, "value")
    && typeof descriptor.value === "string"
    && descriptor.value.length > 0;
}

function rejectIneligibleRequest(): never {
  throw new RangeError("RiskScan request is not eligible for a settlement attempt");
}

function rejectSettlementAttemptConflict(): never {
  throw new RangeError(
    "RiskScan settlement attempt conflicts with a different durable attempt",
  );
}

export const recordInitialRiskScanSettlementAttempt = internalMutationGeneric({
  args: {
    requestId: v.id("riskScanRequests"),
    idempotencyKeyHash: v.string(),
    network: v.string(),
    candidateSettlementRef: v.string(),
    createdAt: v.int64(),
    updatedAt: v.int64(),
  },
  returns: v.object({
    status: v.union(v.literal("created"), v.literal("replayed")),
    attemptId: v.id("riskScanSettlementAttempts"),
    state: v.literal("pending_reconciliation"),
  }),
  handler: async (ctx, args) => {
    const candidate = admitRiskScanSettlementAttempt({
      idempotencyKeyHash: args.idempotencyKeyHash,
      network: args.network,
      candidateSettlementRef: args.candidateSettlementRef,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
    const request = await ctx.db.get("riskScanRequests", args.requestId);

    if (request === null || request.state !== "payment_required") {
      return rejectIneligibleRequest();
    }

    const document = {
      publicId: request.publicId,
      requestId: args.requestId,
      ...candidate.document,
    };
    const existingRows = await ctx.db
      .query("riskScanSettlementAttempts")
      .withIndex("by_idempotency_scope_and_key", (query) => {
        const operationRange = query.eq("operation", candidate.document.operation);

        return (operationRange as unknown as IdempotencyKeyIndexRange).eq(
          "idempotencyKeyHash",
          candidate.document.idempotencyKeyHash,
        );
      })
      .take(2);

    if (existingRows.length === 0) {
      const attemptId = await ctx.db.insert("riskScanSettlementAttempts", document);

      return {
        status: "created" as const,
        attemptId,
        state: "pending_reconciliation" as const,
      };
    }

    const [existing] = existingRows;
    if (
      existingRows.length !== 1
      || !hasOpaqueAttemptId(existing)
      || !matchesInitialSettlementAttempt(existing, document)
    ) {
      return rejectSettlementAttemptConflict();
    }

    return {
      status: "replayed" as const,
      attemptId: existing._id,
      state: "pending_reconciliation" as const,
    };
  },
});
