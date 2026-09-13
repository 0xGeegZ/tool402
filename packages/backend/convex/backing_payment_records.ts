"use node";

import { canonicalizeRequirements } from "@tool402/core";
import { internalActionGeneric, makeFunctionReference, type GenericActionCtx, type GenericDataModel } from "convex/server";
import { v } from "convex/values";
import { keccak256 } from "viem";
import { createHederaFundingReceiptReader } from "../src/ats/hedera-funding-receipt-reader.ts";

type Context = GenericActionCtx<GenericDataModel>;
type Parameters = Readonly<{ offeringPublicId: string; units: string; tinybars: string; purchaseIntentId: string }>;
type Status = "CONFIRMED" | "REJECTED" | "SUBMITTED" | "OUTCOME_UNKNOWN";
type Outcome = Readonly<{ status: Status; transactionHash: string; tinybars: string }> | null;
type Reservation = Readonly<{ status: "PREPARED" | Status; transactionHash: string | null; tinybars: string }> | null;
type ReceiptReader = (hash: `0x${string}`) => Promise<Readonly<{ from: string; to: string; value: bigint; status: "0x1" | "0x0" }> | null>;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const integerPattern = /^(?:0|[1-9][0-9]*)$/u;
const contextReference = makeFunctionReference<"query", { attemptPublicId: string; canonicalSignerAddress: string }, { expectedTarget: string; canonicalParametersHash: string } | null>("backing_payment_store:readBackingPaymentContext");
const recordReference = makeFunctionReference<"mutation", { attemptPublicId: string; canonicalSignerAddress: string; transactionHash: string; tinybars: string; outcome: Status }, Outcome>("backing_payment_store:recordBackingPayment");
const reserveReference = makeFunctionReference<"mutation", { attemptPublicId: string; canonicalSignerAddress: string; tinybars: string }, Reservation>("backing_payment_store:reserveBackingPayment");
const verificationContextReference = makeFunctionReference<"query", { canonicalSignerAddress: string }, { attemptPublicId: string; expectedTarget: string; transactionHash: string; tinybars: string; state: Status } | null>("backing_payment_store:readBackingPaymentVerificationContext");
const paymentReference = makeFunctionReference<"query", { canonicalSignerAddress: string }, Reservation>("backing_payment_store:readBackerPayment");
const scopedPaymentReference = makeFunctionReference<"query", { canonicalSignerAddress: string; offeringPublicId: string }, Reservation>("backing_payment_store:readBackerPaymentForOffering");

function validParameters(input: Parameters): boolean {
  return /^[A-Za-z0-9_-]{1,96}$/u.test(input.offeringPublicId)
    && integerPattern.test(input.units) && BigInt(input.units) >= 1n
    && integerPattern.test(input.tinybars) && BigInt(input.tinybars) >= 1n
    && /^[A-Za-z0-9_-]{21}[AQgw]$/u.test(input.purchaseIntentId);
}

async function confirm(ctx: Context, args: { attemptPublicId: string; canonicalSignerAddress: string; transactionHash: string; parameters: Parameters }, readReceipt: ReceiptReader = createHederaFundingReceiptReader(globalThis.fetch)): Promise<Outcome> {
  if (!addressPattern.test(args.canonicalSignerAddress) || !hashPattern.test(args.transactionHash) || !validParameters(args.parameters)) return null;
  const context = await ctx.runQuery(contextReference, { attemptPublicId: args.attemptPublicId, canonicalSignerAddress: args.canonicalSignerAddress });
  if (context === null || keccak256(new TextEncoder().encode(canonicalizeRequirements(args.parameters))).slice(2) !== context.canonicalParametersHash) return null;
  const tinybars = args.parameters.tinybars;
  const submitted = await ctx.runMutation(recordReference, { attemptPublicId: args.attemptPublicId, canonicalSignerAddress: args.canonicalSignerAddress, transactionHash: args.transactionHash, tinybars, outcome: "SUBMITTED" });
  if (submitted === null || submitted.status === "CONFIRMED" || submitted.status === "REJECTED") return submitted;
  const receipt = await readReceipt(args.transactionHash as `0x${string}`);
  const outcome: Status = receipt === null ? "OUTCOME_UNKNOWN" : receipt.status !== "0x1" || receipt.from !== args.canonicalSignerAddress || receipt.to !== context.expectedTarget || receipt.value !== BigInt(tinybars) * 10_000_000_000n ? "REJECTED" : "CONFIRMED";
  return ctx.runMutation(recordReference, { attemptPublicId: args.attemptPublicId, canonicalSignerAddress: args.canonicalSignerAddress, transactionHash: args.transactionHash, tinybars, outcome });
}

async function reserve(ctx: Context, args: { attemptPublicId: string; canonicalSignerAddress: string; parameters: Parameters }): Promise<Reservation> {
  if (!addressPattern.test(args.canonicalSignerAddress) || !validParameters(args.parameters)) return null;
  const context = await ctx.runQuery(contextReference, { attemptPublicId: args.attemptPublicId, canonicalSignerAddress: args.canonicalSignerAddress });
  if (context === null || keccak256(new TextEncoder().encode(canonicalizeRequirements(args.parameters))).slice(2) !== context.canonicalParametersHash) return null;
  return ctx.runMutation(reserveReference, { attemptPublicId: args.attemptPublicId, canonicalSignerAddress: args.canonicalSignerAddress, tinybars: args.parameters.tinybars });
}

async function reverify(ctx: Context, args: { canonicalSignerAddress: string }, readReceipt: ReceiptReader = createHederaFundingReceiptReader(globalThis.fetch)): Promise<Reservation> {
  if (!addressPattern.test(args.canonicalSignerAddress)) return null;
  const context = await ctx.runQuery(verificationContextReference, args);
  if (context === null) return ctx.runQuery(paymentReference, args);
  if (context.state === "CONFIRMED" || context.state === "REJECTED") {
    return { status: context.state, transactionHash: context.transactionHash, tinybars: context.tinybars };
  }
  const receipt = await readReceipt(context.transactionHash as `0x${string}`);
  const outcome: Status = receipt === null ? "OUTCOME_UNKNOWN" : receipt.status !== "0x1" || receipt.from !== args.canonicalSignerAddress || receipt.to !== context.expectedTarget || receipt.value !== BigInt(context.tinybars) * 10_000_000_000n ? "REJECTED" : "CONFIRMED";
  return ctx.runMutation(recordReference, {
    attemptPublicId: context.attemptPublicId,
    canonicalSignerAddress: args.canonicalSignerAddress,
    transactionHash: context.transactionHash,
    tinybars: context.tinybars,
    outcome,
  });
}

export const confirmBackingPayment = internalActionGeneric({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string(), transactionHash: v.string(), parameters: v.object({ offeringPublicId: v.string(), units: v.string(), tinybars: v.string(), purchaseIntentId: v.string() }) },
  returns: v.union(v.null(), v.object({ status: v.union(v.literal("CONFIRMED"), v.literal("REJECTED"), v.literal("SUBMITTED"), v.literal("OUTCOME_UNKNOWN")), transactionHash: v.string(), tinybars: v.string() })),
  handler: confirm,
});

export const reserveBackingPayment = internalActionGeneric({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string(), parameters: v.object({ offeringPublicId: v.string(), units: v.string(), tinybars: v.string(), purchaseIntentId: v.string() }) },
  returns: v.union(v.null(), v.object({ status: v.union(v.literal("PREPARED"), v.literal("CONFIRMED"), v.literal("REJECTED"), v.literal("SUBMITTED"), v.literal("OUTCOME_UNKNOWN")), transactionHash: v.union(v.null(), v.string()), tinybars: v.string() })),
  handler: reserve,
});

export const reverifyBackerPayment = internalActionGeneric({
  args: { canonicalSignerAddress: v.string() },
  returns: v.union(v.null(), v.object({ status: v.union(v.literal("PREPARED"), v.literal("CONFIRMED"), v.literal("REJECTED"), v.literal("SUBMITTED"), v.literal("OUTCOME_UNKNOWN")), transactionHash: v.union(v.null(), v.string()), tinybars: v.string() })),
  handler: reverify,
});

export const readBackerPaymentForOffering = internalActionGeneric({
  args: { canonicalSignerAddress: v.string(), offeringPublicId: v.string() },
  returns: v.union(v.null(), v.object({ status: v.union(v.literal("PREPARED"), v.literal("CONFIRMED"), v.literal("REJECTED"), v.literal("SUBMITTED"), v.literal("OUTCOME_UNKNOWN")), transactionHash: v.union(v.null(), v.string()), tinybars: v.string() })),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress) || !/^[A-Za-z0-9_-]{1,96}$/u.test(args.offeringPublicId)) return null;
    return ctx.runQuery(scopedPaymentReference, args);
  },
});

export function confirmBackingPaymentForTest(ctx: Context, args: { attemptPublicId: string; canonicalSignerAddress: string; transactionHash: string; parameters: Parameters }, readReceipt: ReceiptReader): Promise<Outcome> {
  return confirm(ctx, args, readReceipt);
}

export function reverifyBackerPaymentForTest(ctx: Context, args: { canonicalSignerAddress: string }, readReceipt: ReceiptReader): Promise<Reservation> {
  return reverify(ctx, args, readReceipt);
}
