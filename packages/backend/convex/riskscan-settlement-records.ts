import { internalMutationGeneric, type IndexRange } from "convex/server";
import { v, type GenericId } from "convex/values";
import {
  admitRiskScanSettlementRecord,
  type RiskScanSettlementRecordCandidateDocument,
} from "../src/risk-scan-settlement-record-admission.ts";

type InitialSettlementRecordDocument =
  RiskScanSettlementRecordCandidateDocument & {
    readonly attemptId: GenericId<"riskScanSettlementAttempts">;
    readonly network: string;
  };

type TransactionRefIndexRange = IndexRange & {
  eq(field: "transactionRef", value: string): IndexRange;
};

function readOwnEnumerableDataProperty(
  existing: object,
  key: string,
): unknown {
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

function readEligibleAttemptNetwork(
  attempt: unknown,
  attemptId: GenericId<"riskScanSettlementAttempts">,
  transactionRef: string,
): string | null {
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
  const candidateSettlementRef = readOwnEnumerableDataProperty(
    attempt,
    "candidateSettlementRef",
  );

  if (
    typeof storedId !== "string"
    || storedId.length === 0
    || storedId !== attemptId
    || operation !== "risk_scan_settlement"
    || state !== "pending_reconciliation"
    || typeof network !== "string"
    || !/^eip155:[1-9]\d*$/u.test(network)
    || candidateSettlementRef !== transactionRef
  ) {
    return null;
  }

  return network;
}

function isOpaqueRecordId(
  value: unknown,
): value is GenericId<"riskScanSettlementRecords"> {
  return typeof value === "string" && value.length > 0;
}

function readMatchingRecordId(
  existing: unknown,
  document: InitialSettlementRecordDocument,
): GenericId<"riskScanSettlementRecords"> | null {
  if (
    existing === null
    || typeof existing !== "object"
    || Array.isArray(existing)
    || Object.hasOwn(existing, "finalityBoundary")
  ) {
    return null;
  }

  const recordId = readOwnEnumerableDataProperty(existing, "_id");
  if (
    !isOpaqueRecordId(recordId)
    || readOwnEnumerableDataProperty(existing, "attemptId") !== document.attemptId
    || readOwnEnumerableDataProperty(existing, "network") !== document.network
    || readOwnEnumerableDataProperty(existing, "transactionRef") !== document.transactionRef
    || readOwnEnumerableDataProperty(existing, "verificationState") !== document.verificationState
    || readOwnEnumerableDataProperty(existing, "observedAt") !== document.observedAt
  ) {
    return null;
  }

  return recordId;
}

function rejectSettlementRecordConflict(): never {
  throw new RangeError(
    "RiskScan settlement record conflicts with a different durable record",
  );
}

export const recordInitialRiskScanSettlementRecord = internalMutationGeneric({
  args: {
    attemptId: v.id("riskScanSettlementAttempts"),
    transactionRef: v.string(),
    observedAt: v.int64(),
  },
  returns: v.object({
    status: v.union(v.literal("created"), v.literal("replayed")),
    recordId: v.id("riskScanSettlementRecords"),
    verificationState: v.literal("pending_verification"),
  }),
  handler: async (ctx, args) => {
    const candidate = admitRiskScanSettlementRecord({
      transactionRef: args.transactionRef,
      observedAt: args.observedAt,
    });
    const loadedAttempt = await ctx.db.get("riskScanSettlementAttempts", args.attemptId);
    const network = readEligibleAttemptNetwork(
      loadedAttempt,
      args.attemptId,
      candidate.document.transactionRef,
    );

    if (network === null) {
      throw new RangeError("RiskScan settlement attempt is not eligible for a settlement record");
    }

    const document = {
      attemptId: args.attemptId,
      network,
      ...candidate.document,
    };
    const byAttempt = await ctx.db
      .query("riskScanSettlementRecords")
      .withIndex("by_attempt", (query) => query.eq("attemptId", args.attemptId))
      .take(2);
    const byTransaction = await ctx.db
      .query("riskScanSettlementRecords")
      .withIndex("by_network_and_transaction_ref", (query) => {
        const networkRange = query.eq("network", network);

        return (networkRange as unknown as TransactionRefIndexRange).eq(
          "transactionRef",
          candidate.document.transactionRef,
        );
      })
      .take(2);

    if (byAttempt.length === 0 && byTransaction.length === 0) {
      const recordId = await ctx.db.insert("riskScanSettlementRecords", document);

      return {
        status: "created" as const,
        recordId,
        verificationState: "pending_verification" as const,
      };
    }

    if (byAttempt.length !== 1 || byTransaction.length !== 1) {
      return rejectSettlementRecordConflict();
    }

    const attemptRecordId = readMatchingRecordId(byAttempt[0], document);
    const transactionRecordId = readMatchingRecordId(byTransaction[0], document);
    if (attemptRecordId === null || attemptRecordId !== transactionRecordId) {
      return rejectSettlementRecordConflict();
    }

    return {
      status: "replayed" as const,
      recordId: attemptRecordId,
      verificationState: "pending_verification" as const,
    };
  },
});
