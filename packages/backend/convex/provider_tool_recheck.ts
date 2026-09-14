import { internalActionGeneric, makeFunctionReference, type GenericActionCtx, type GenericDataModel } from "convex/server";
import { v, type GenericId } from "convex/values";

type Context = GenericActionCtx<GenericDataModel>;
const contextReference = makeFunctionReference<"query", { canonicalSignerAddress: string; toolPublicId: string }, { attemptId: GenericId<"externalPrepareCommandAttempts"> } | null>("provider_tools:readOwnedToolDeploymentAttempt");
const verifyReference = makeFunctionReference<"action", { attemptId: GenericId<"externalPrepareCommandAttempts"> }, unknown>("ats_receipt_verification:verifyAtsCandidateReceipt");
const deploymentReference = makeFunctionReference<"query", { canonicalSignerAddress: string; toolPublicId: string }, unknown>("provider_tools:readOwnedToolDeployment");

/** Authenticated recovery only: verify the existing owned candidate, then project it. */
export const recheckOwnedToolDeployment = internalActionGeneric({
  args: { canonicalSignerAddress: v.string(), toolPublicId: v.string() },
  returns: v.any(),
  handler: async (ctx: Context, args) => {
    const context = await ctx.runQuery(contextReference, args);
    if (context === null) return null;
    await ctx.runAction(verifyReference, { attemptId: context.attemptId });
    return ctx.runQuery(deploymentReference, args);
  },
});
