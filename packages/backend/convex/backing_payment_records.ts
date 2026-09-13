"use node";

import { canonicalizeRequirements } from "@tool402/core";
import { internalActionGeneric, makeFunctionReference, type GenericActionCtx, type GenericDataModel } from "convex/server";
import { v } from "convex/values";
import { keccak256 } from "viem";
import { createHederaFundingReceiptReader } from "../src/ats/hedera-funding-receipt-reader.ts";

type Context = GenericActionCtx<GenericDataModel>;
type Parameters = Readonly<{ offeringPublicId: string; units: string; tinybars: string; purchaseIntentId: string }>;
type Outcome = Readonly<{ status: "CONFIRMED" | "REJECTED" | "SUBMITTED"; transactionHash: string; tinybars: string }> | null;
type ReceiptReader = (hash: `0x${string}`) => Promise<Readonly<{ from: string; to: string; value: bigint }> | null>;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const integerPattern = /^(?:0|[1-9][0-9]*)$/u;
const contextReference = makeFunctionReference<"query", { attemptPublicId: string; canonicalSignerAddress: string }, { expectedTarget: string; canonicalParametersHash: string } | null>("backing_payment_store:readBackingPaymentContext");
const recordReference = makeFunctionReference<"mutation", { attemptPublicId: string; canonicalSignerAddress: string; transactionHash: string; tinybars: string; outcome: "CONFIRMED" | "REJECTED" | "SUBMITTED" }, Outcome>("backing_payment_store:recordBackingPayment");

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
  const receipt = await readReceipt(args.transactionHash as `0x${string}`);
  const outcome = receipt === null ? "SUBMITTED" : receipt.from !== args.canonicalSignerAddress || receipt.to !== context.expectedTarget || receipt.value !== BigInt(tinybars) * 10_000_000_000n ? "REJECTED" : "CONFIRMED";
  return ctx.runMutation(recordReference, { attemptPublicId: args.attemptPublicId, canonicalSignerAddress: args.canonicalSignerAddress, transactionHash: args.transactionHash, tinybars, outcome });
}

export const confirmBackingPayment = internalActionGeneric({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string(), transactionHash: v.string(), parameters: v.object({ offeringPublicId: v.string(), units: v.string(), tinybars: v.string(), purchaseIntentId: v.string() }) },
  returns: v.union(v.null(), v.object({ status: v.union(v.literal("CONFIRMED"), v.literal("REJECTED"), v.literal("SUBMITTED")), transactionHash: v.string(), tinybars: v.string() })),
  handler: confirm,
});

export function confirmBackingPaymentForTest(ctx: Context, args: { attemptPublicId: string; canonicalSignerAddress: string; transactionHash: string; parameters: Parameters }, readReceipt: ReceiptReader): Promise<Outcome> {
  return confirm(ctx, args, readReceipt);
}
