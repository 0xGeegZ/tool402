import { internalQueryGeneric, type IndexRange } from "convex/server";
import { v, type GenericId } from "convex/values";

interface CandidateRelationship {
  readonly attemptId: GenericId<"riskScanSettlementAttempts">;
  readonly network: string;
  readonly transactionRef: string;
}

interface SafeRecord {
  readonly recordId: GenericId<"riskScanSettlementRecords">;
  readonly observedAt: bigint;
}

type TransactionRefIndexRange = IndexRange & {
  eq(field: "transactionRef", value: string): IndexRange;
};

function readOwnEnumerableDataProperty(existing: object, key: string): unknown {
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

function readEligibleRelationship(
  attempt: unknown,
  attemptId: GenericId<"riskScanSettlementAttempts">,
): CandidateRelationship | null {
  if (
    attempt === null
    || typeof attempt !== "object"
    || Array.isArray(attempt)
  ) {
    return null;
  }

  const storedId = readOwnEnumerableDataProperty(attempt, "_id");
  const operation = readOwnEnumerableDataProperty(attempt, "operation");
  const state = readOwnEnumerableDataProperty(attempt, "state");
  const network = readOwnEnumerableDataProperty(attempt, "network");
  const transactionRef = readOwnEnumerableDataProperty(attempt, "candidateSettlementRef");

  if (
    typeof storedId !== "string"
    || storedId.length === 0
    || storedId !== attemptId
    || operation !== "risk_scan_settlement"
    || state !== "pending_reconciliation"
    || typeof network !== "string"
    || !/^eip155:[1-9]\d*$/u.test(network)
    || typeof transactionRef !== "string"
    || !/^[A-Za-z0-9:_-]{1,160}$/u.test(transactionRef)
  ) {
    return null;
  }

  return { attemptId, network, transactionRef };
}

function isOpaqueRecordId(
  value: unknown,
): value is GenericId<"riskScanSettlementRecords"> {
  return typeof value === "string" && value.length > 0;
}

function readMatchingRecord(
  existing: unknown,
  relationship: CandidateRelationship,
): SafeRecord | null {
  if (
    existing === null
    || typeof existing !== "object"
    || Array.isArray(existing)
    || Object.hasOwn(existing, "finalityBoundary")
  ) {
    return null;
  }

  const recordId = readOwnEnumerableDataProperty(existing, "_id");
  const observedAt = readOwnEnumerableDataProperty(existing, "observedAt");
  if (
    !isOpaqueRecordId(recordId)
    || readOwnEnumerableDataProperty(existing, "attemptId") !== relationship.attemptId
    || readOwnEnumerableDataProperty(existing, "network") !== relationship.network
    || readOwnEnumerableDataProperty(existing, "transactionRef") !== relationship.transactionRef
    || readOwnEnumerableDataProperty(existing, "verificationState") !== "pending_verification"
    || typeof observedAt !== "bigint"
    || observedAt < 0n
    || observedAt > 9_223_372_036_854_775_807n
  ) {
    return null;
  }

  return { recordId, observedAt };
}

function rejectSettlementRecordConflict(): never {
  throw new RangeError(
    "RiskScan pending settlement record conflicts with a different durable record",
  );
}

export const readRiskScanPendingSettlementCandidate = internalQueryGeneric({
  args: {
    attemptId: v.id("riskScanSettlementAttempts"),
  },
  returns: v.union(v.null(), v.object({
    recordId: v.id("riskScanSettlementRecords"),
    network: v.string(),
    transactionRef: v.string(),
    verificationState: v.literal("pending_verification"),
    observedAt: v.int64(),
  })),
  handler: async (ctx, args) => {
    const loadedAttempt = await ctx.db.get("riskScanSettlementAttempts", args.attemptId);
    if (loadedAttempt === null) {
      return null;
    }

    const relationship = readEligibleRelationship(loadedAttempt, args.attemptId);
    if (relationship === null) {
      throw new RangeError("RiskScan settlement attempt is not eligible for pending-settlement read");
    }

    const byAttempt = await ctx.db
      .query("riskScanSettlementRecords")
      .withIndex("by_attempt", (query) => query.eq("attemptId", args.attemptId))
      .take(2);
    const byTransaction = await ctx.db
      .query("riskScanSettlementRecords")
      .withIndex("by_network_and_transaction_ref", (query) => {
        const networkRange = query.eq("network", relationship.network);

        return (networkRange as unknown as TransactionRefIndexRange).eq(
          "transactionRef",
          relationship.transactionRef,
        );
      })
      .take(2);

    if (byAttempt.length === 0 && byTransaction.length === 0) {
      return null;
    }
    if (byAttempt.length !== 1 || byTransaction.length !== 1) {
      return rejectSettlementRecordConflict();
    }

    const attemptRecord = readMatchingRecord(byAttempt[0], relationship);
    const transactionRecord = readMatchingRecord(byTransaction[0], relationship);
    if (
      attemptRecord === null
      || transactionRecord === null
      || attemptRecord.recordId !== transactionRecord.recordId
      || attemptRecord.observedAt !== transactionRecord.observedAt
    ) {
      return rejectSettlementRecordConflict();
    }

    return {
      recordId: attemptRecord.recordId,
      network: relationship.network,
      transactionRef: relationship.transactionRef,
      verificationState: "pending_verification" as const,
      observedAt: attemptRecord.observedAt,
    };
  },
});
