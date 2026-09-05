import { internalMutationGeneric } from "convex/server";
import { v } from "convex/values";
import {
  admitRiskScanDurableRequest,
  type RiskScanDurableRequestDocument,
} from "../src/risk-scan-durable-request-admission.ts";

function matchesInitialRequest(
  existing: Record<string, unknown>,
  document: RiskScanDurableRequestDocument,
): boolean {
  return existing.publicId === document.publicId
    && existing.requestRef === document.requestRef
    && existing.subjectRefHash === document.subjectRefHash
    && existing.inputHash === document.inputHash
    && existing.state === document.state
    && existing.createdAt === document.createdAt
    && existing.updatedAt === document.updatedAt;
}

export const recordInitialRiskScanRequest = internalMutationGeneric({
  args: {
    publicId: v.string(),
    requestRef: v.string(),
    subjectRefHash: v.string(),
    inputHash: v.string(),
    createdAt: v.int64(),
    updatedAt: v.int64(),
  },
  returns: v.object({
    status: v.union(v.literal("created"), v.literal("replayed")),
    requestId: v.id("riskScanRequests"),
    state: v.literal("payment_required"),
  }),
  handler: async (ctx, args) => {
    const candidate = admitRiskScanDurableRequest(args);
    const existing = await ctx.db
      .query("riskScanRequests")
      .withIndex("by_request_ref", (query) =>
        query.eq("requestRef", candidate.document.requestRef),
      )
      .unique();

    if (existing === null) {
      const requestId = await ctx.db.insert(
        "riskScanRequests",
        candidate.document,
      );

      return {
        status: "created" as const,
        requestId,
        state: "payment_required" as const,
      };
    }

    if (!matchesInitialRequest(existing, candidate.document)) {
      throw new RangeError(
        "RiskScan request reference conflicts with a different durable request",
      );
    }

    return {
      status: "replayed" as const,
      requestId: existing._id,
      state: "payment_required" as const,
    };
  },
});
