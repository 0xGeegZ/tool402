"use node";

import {
  internalActionGeneric,
  makeFunctionReference,
  type GenericActionCtx,
  type GenericDataModel,
} from "convex/server";
import { v, type GenericId } from "convex/values";
import type { ExternalOperationKind } from "@tool402/core";
import {
  createBoundedMirrorTransactionReader,
  verifyMirrorTransactionReceipt,
} from "../src/ats/mirror-transaction-verifier.ts";

type VerificationContext = {
  readonly attemptId: GenericId<"externalPrepareCommandAttempts">;
  readonly state: "PREPARED" | "SUBMITTED" | "CONFIRMED" | "OUTCOME_UNKNOWN" | "REJECTED";
  readonly operationKind: ExternalOperationKind;
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly expectedTarget: string;
  readonly candidateTransactionId?: string;
  readonly candidateEvmAddress?: string;
};
type MirrorReaderResult =
  | { readonly status: "DOCUMENT"; readonly document: unknown }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "UNAVAILABLE" };
type MirrorExpectation = Pick<
  VerificationContext,
  "operationKind" | "network" | "chainId" | "expectedTarget"
> & { readonly candidateEvmAddress?: string };
type MirrorVerification =
  | { readonly outcome: "VERIFIED" }
  | { readonly outcome: "REJECTED"; readonly reason: string }
  | { readonly outcome: "UNKNOWN"; readonly reason: string };
type VerificationOutcome =
  | { readonly outcome: "CONFIRMED" }
  | { readonly outcome: "REJECTED" }
  | { readonly outcome: "OUTCOME_UNKNOWN" }
  | { readonly outcome: "NOT_CONFIGURED" }
  | { readonly outcome: "NOT_ELIGIBLE" };
type VerificationSeams = {
  readonly readMirrorTransaction: (candidateTransactionId: string) => Promise<MirrorReaderResult>;
  readonly verifyMirrorTransactionReceipt: (
    expectation: MirrorExpectation,
    document: unknown,
  ) => MirrorVerification;
};
type ActionContext = GenericActionCtx<GenericDataModel>;
type ActionArguments = {
  readonly attemptId: GenericId<"externalPrepareCommandAttempts">;
};

const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1/";
const readVerificationContextReference = makeFunctionReference<
  "query",
  ActionArguments,
  VerificationContext | null
>("ats_candidate_receipts:readAtsCandidateVerificationContext");
const recordOutcomeReference = makeFunctionReference<
  "mutation",
  {
    readonly attemptId: GenericId<"externalPrepareCommandAttempts">;
    readonly outcome: "CONFIRMED" | "OUTCOME_UNKNOWN" | "REJECTED";
  },
  unknown
>("ats_candidate_receipts:recordAtsCandidateOutcome");

function createProductionSeams(): VerificationSeams {
  const reader = createBoundedMirrorTransactionReader({
    mirrorNodeBaseUrl,
    fetch,
  });
  return {
    readMirrorTransaction: (candidateTransactionId) => reader(candidateTransactionId),
    verifyMirrorTransactionReceipt,
  };
}

async function verifyReceipt(
  ctx: ActionContext,
  args: ActionArguments,
  injectedSeams?: VerificationSeams,
): Promise<VerificationOutcome> {
  const context = await ctx.runQuery(readVerificationContextReference, {
    attemptId: args.attemptId,
  });
  if (
    context === null
    || context.state !== "SUBMITTED"
    || context.candidateTransactionId === undefined
  ) {
    return { outcome: "NOT_ELIGIBLE" };
  }
  if (context.operationKind !== "HEDERA_FUNDING") {
    return { outcome: "NOT_CONFIGURED" };
  }

  const seams = injectedSeams ?? createProductionSeams();
  const readerResult = await seams.readMirrorTransaction(context.candidateTransactionId);
  let outcome: "CONFIRMED" | "OUTCOME_UNKNOWN" | "REJECTED";
  if (readerResult.status !== "DOCUMENT") {
    outcome = "OUTCOME_UNKNOWN";
  } else {
    const verification = seams.verifyMirrorTransactionReceipt({
      operationKind: context.operationKind,
      network: context.network,
      chainId: context.chainId,
      expectedTarget: context.expectedTarget,
      ...(context.candidateEvmAddress === undefined
        ? {}
        : { candidateEvmAddress: context.candidateEvmAddress }),
    }, readerResult.document);
    outcome = verification.outcome === "VERIFIED"
      ? "CONFIRMED"
      : verification.outcome === "REJECTED"
        ? "REJECTED"
        : "OUTCOME_UNKNOWN";
  }

  await ctx.runMutation(recordOutcomeReference, {
    attemptId: args.attemptId,
    outcome,
  });
  return { outcome };
}

export const verifyAtsCandidateReceipt = internalActionGeneric({
  args: {
    attemptId: v.id("externalPrepareCommandAttempts"),
  },
  returns: v.union(
    v.object({ outcome: v.literal("CONFIRMED") }),
    v.object({ outcome: v.literal("REJECTED") }),
    v.object({ outcome: v.literal("OUTCOME_UNKNOWN") }),
    v.object({ outcome: v.literal("NOT_CONFIGURED") }),
    v.object({ outcome: v.literal("NOT_ELIGIBLE") }),
  ),
  handler: verifyReceipt,
});

export function verifyAtsCandidateReceiptForTest(
  ctx: ActionContext,
  args: ActionArguments,
  seams: VerificationSeams,
): Promise<VerificationOutcome> {
  return verifyReceipt(ctx, args, seams);
}
