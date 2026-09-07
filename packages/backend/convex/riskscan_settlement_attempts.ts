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

interface StoredSettlementAttempt {
  readonly _id: GenericId<"riskScanSettlementAttempts">;
  readonly publicId: unknown;
  readonly requestId: unknown;
  readonly operation: unknown;
  readonly idempotencyKeyHash: unknown;
  readonly network: unknown;
  readonly state: unknown;
  readonly candidateSettlementRef: unknown;
  readonly nextReconciliationAt: unknown;
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
}

interface EligibleRiskScanRequest {
  readonly publicId: string;
}

function matchesInitialSettlementAttempt<RequestId>(
  existing: StoredSettlementAttempt,
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

function readOwnEnumerableDataProperty(
  existing: object,
  key: string,
): unknown | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(existing, key);

  if (
    descriptor === undefined
    || descriptor.enumerable !== true
    || !Object.hasOwn(descriptor, "value")
  ) {
    return undefined;
  }

  return descriptor.value;
}

function readEligibleRiskScanRequest(
  request: unknown,
): EligibleRiskScanRequest | null {
  if (
    request === null
    || typeof request !== "object"
    || Array.isArray(request)
  ) {
    return null;
  }

  const state = readOwnEnumerableDataProperty(request, "state");
  const publicId = readOwnEnumerableDataProperty(request, "publicId");
  if (state !== "payment_required" || typeof publicId !== "string") {
    return null;
  }

  return { publicId };
}

function isOpaqueAttemptId(
  value: unknown,
): value is GenericId<"riskScanSettlementAttempts"> {
  return typeof value === "string" && value.length > 0;
}

function readStoredSettlementAttempt(
  existing: unknown,
): StoredSettlementAttempt | null {
  if (
    existing === null
    || typeof existing !== "object"
    || Array.isArray(existing)
  ) {
    return null;
  }

  const attemptId = readOwnEnumerableDataProperty(existing, "_id");
  const publicId = readOwnEnumerableDataProperty(existing, "publicId");
  const requestId = readOwnEnumerableDataProperty(existing, "requestId");
  const operation = readOwnEnumerableDataProperty(existing, "operation");
  const idempotencyKeyHash = readOwnEnumerableDataProperty(
    existing,
    "idempotencyKeyHash",
  );
  const network = readOwnEnumerableDataProperty(existing, "network");
  const state = readOwnEnumerableDataProperty(existing, "state");
  const candidateSettlementRef = readOwnEnumerableDataProperty(
    existing,
    "candidateSettlementRef",
  );
  const nextReconciliationAt = readOwnEnumerableDataProperty(
    existing,
    "nextReconciliationAt",
  );
  const createdAt = readOwnEnumerableDataProperty(existing, "createdAt");
  const updatedAt = readOwnEnumerableDataProperty(existing, "updatedAt");

  if (
    !isOpaqueAttemptId(attemptId)
    || publicId === undefined
    || requestId === undefined
    || operation === undefined
    || idempotencyKeyHash === undefined
    || network === undefined
    || state === undefined
    || candidateSettlementRef === undefined
    || nextReconciliationAt === undefined
    || createdAt === undefined
    || updatedAt === undefined
  ) {
    return null;
  }

  return {
    _id: attemptId,
    publicId,
    requestId,
    operation,
    idempotencyKeyHash,
    network,
    state,
    candidateSettlementRef,
    nextReconciliationAt,
    createdAt,
    updatedAt,
  };
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
    const loadedRequest = await ctx.db.get("riskScanRequests", args.requestId);
    const eligibleRequest = readEligibleRiskScanRequest(loadedRequest);

    if (eligibleRequest === null) {
      return rejectIneligibleRequest();
    }

    const document = {
      publicId: eligibleRequest.publicId,
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

    if (existingRows.length !== 1) {
      return rejectSettlementAttemptConflict();
    }

    const [existing] = existingRows;
    const storedAttempt = readStoredSettlementAttempt(existing);
    if (
      storedAttempt === null
      || !matchesInitialSettlementAttempt(storedAttempt, document)
    ) {
      return rejectSettlementAttemptConflict();
    }

    return {
      status: "replayed" as const,
      attemptId: storedAttempt._id,
      state: "pending_reconciliation" as const,
    };
  },
});
