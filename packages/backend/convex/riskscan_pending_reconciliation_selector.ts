import { internalQueryGeneric, type IndexRange } from "convex/server";
import { v, type GenericId } from "convex/values";

const maxInt64 = 9_223_372_036_854_775_807n;

type ReconciliationCutoffRange = IndexRange & {
  lte(field: "nextReconciliationAt", value: bigint): IndexRange;
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

function isOpaqueAttemptId(
  value: unknown,
): value is GenericId<"riskScanSettlementAttempts"> {
  return typeof value === "string" && value.length > 0;
}

function readEligibleAttemptId(
  attempt: unknown,
  beforeOrAt: bigint,
): GenericId<"riskScanSettlementAttempts"> | null {
  if (attempt === null || typeof attempt !== "object" || Array.isArray(attempt)) {
    return null;
  }

  const attemptId = readOwnEnumerableDataProperty(attempt, "_id");
  const operation = readOwnEnumerableDataProperty(attempt, "operation");
  const state = readOwnEnumerableDataProperty(attempt, "state");
  const network = readOwnEnumerableDataProperty(attempt, "network");
  const candidateSettlementRef = readOwnEnumerableDataProperty(attempt, "candidateSettlementRef");
  const nextReconciliationAt = readOwnEnumerableDataProperty(attempt, "nextReconciliationAt");
  if (
    !isOpaqueAttemptId(attemptId)
    || operation !== "risk_scan_settlement"
    || state !== "pending_reconciliation"
    || typeof network !== "string"
    || !/^eip155:[1-9]\d*$/u.test(network)
    || typeof candidateSettlementRef !== "string"
    || !/^[A-Za-z0-9:_-]{1,160}$/u.test(candidateSettlementRef)
    || typeof nextReconciliationAt !== "bigint"
    || nextReconciliationAt < 0n
    || nextReconciliationAt > maxInt64
    || nextReconciliationAt > beforeOrAt
  ) {
    return null;
  }
  return attemptId;
}

export const selectRiskScanPendingReconciliationAttempt = internalQueryGeneric({
  args: { beforeOrAt: v.int64() },
  returns: v.union(v.null(), v.object({ attemptId: v.id("riskScanSettlementAttempts") })),
  handler: async (ctx, args) => {
    const beforeOrAt = args.beforeOrAt;
    if (typeof beforeOrAt !== "bigint" || beforeOrAt < 0n || beforeOrAt > maxInt64) {
      throw new RangeError("RiskScan reconciliation cutoff is invalid");
    }

    const attempts = await ctx.db
      .query("riskScanSettlementAttempts")
      .withIndex("by_state_and_next_reconciliation", (query) => {
        const stateRange = query.eq("state", "pending_reconciliation");
        return (stateRange as unknown as ReconciliationCutoffRange).lte(
          "nextReconciliationAt",
          beforeOrAt,
        );
      })
      .take(2);

    if (attempts.length === 0) {
      return null;
    }
    const attemptId = attempts.length === 1
      ? readEligibleAttemptId(attempts[0], beforeOrAt)
      : null;
    if (attemptId === null) {
      throw new RangeError("RiskScan pending reconciliation selector encountered an unsafe durable attempt");
    }
    return { attemptId };
  },
});
