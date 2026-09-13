import { internalMutationGeneric, internalQueryGeneric, type DataModelFromSchemaDefinition, type MutationBuilder, type QueryBuilder } from "convex/server";
import { v } from "convex/values";
import type schema from "./schema.ts";

const internalMutation: MutationBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalMutationGeneric;
const internalQuery: QueryBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalQueryGeneric;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const integerPattern = /^(?:0|[1-9][0-9]*)$/u;

const outcomeValidator = v.union(v.literal("CONFIRMED"), v.literal("REJECTED"), v.literal("SUBMITTED"));
const resultValidator = v.union(v.null(), v.object({ status: outcomeValidator, transactionHash: v.string(), tinybars: v.string() }));

function validAttempt(value: unknown, input: { attemptPublicId: string; canonicalSignerAddress: string }): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.idempotencyKey === input.attemptPublicId
    && record.operationKind === "HEDERA_FUNDING"
    && record.role === "BACKER"
    && record.chainId === 296
    && record.canonicalSignerAddress === input.canonicalSignerAddress
    && typeof record.expectedTarget === "string" && addressPattern.test(record.expectedTarget)
    && typeof record.canonicalParametersHash === "string" && /^[0-9a-f]{64}$/u.test(record.canonicalParametersHash)
    && (record.state === "PREPARED" || record.state === "SUBMITTED" || record.state === "CONFIRMED" || record.state === "REJECTED");
}

export const readBackingPaymentContext = internalQuery({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string() },
  returns: v.union(v.null(), v.object({ expectedTarget: v.string(), canonicalParametersHash: v.string(), state: v.string(), transactionHash: v.optional(v.string()), tinybars: v.optional(v.string()) })),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress)) return null;
    const rows = await ctx.db.query("externalPrepareCommandAttempts").withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.attemptPublicId)).take(2);
    if (rows.length !== 1 || !validAttempt(rows[0], args)) return null;
    const row = rows[0];
    return {
      expectedTarget: row.expectedTarget, canonicalParametersHash: row.canonicalParametersHash, state: row.state,
      ...(typeof row.candidateTransactionId === "string" ? { transactionHash: row.candidateTransactionId } : {}),
      ...(typeof row.backingTinybars === "string" ? { tinybars: row.backingTinybars } : {}),
    };
  },
});

export const recordBackingPayment = internalMutation({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string(), transactionHash: v.string(), tinybars: v.string(), outcome: outcomeValidator },
  returns: resultValidator,
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress) || !hashPattern.test(args.transactionHash) || !integerPattern.test(args.tinybars) || BigInt(args.tinybars) < 1n) return null;
    const rows = await ctx.db.query("externalPrepareCommandAttempts").withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.attemptPublicId)).take(2);
    if (rows.length !== 1 || !validAttempt(rows[0], args)) return null;
    const row = rows[0];
    const sameHash = row.candidateTransactionId === undefined || row.candidateTransactionId === args.transactionHash;
    const sameTinybars = row.backingTinybars === undefined || row.backingTinybars === args.tinybars;
    if (!sameHash || !sameTinybars) return null;
    const next = row.state === "CONFIRMED" ? "CONFIRMED" : row.state === "REJECTED" ? "REJECTED" : args.outcome;
    if (row.state !== next || row.candidateTransactionId === undefined || row.backingTinybars === undefined || (next === "CONFIRMED" && row.verifiedEvmTransactionHash === undefined)) {
      await ctx.db.patch(row._id, {
        state: next,
        candidateTransactionId: args.transactionHash,
        backingTinybars: args.tinybars,
        ...(next === "CONFIRMED" ? { verifiedEvmTransactionHash: args.transactionHash } : {}),
      });
    }
    return { status: next, transactionHash: args.transactionHash, tinybars: args.tinybars };
  },
});

export const readBackerPayment = internalQuery({
  args: { canonicalSignerAddress: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress)) return null;
    const rows = await ctx.db.query("externalPrepareCommandAttempts")
      .withIndex("by_operation_kind_and_canonical_signer_address", (q) => q.eq("operationKind", "HEDERA_FUNDING").eq("canonicalSignerAddress", args.canonicalSignerAddress))
      .order("desc").take(1);
    const row = rows[0];
    if (row === undefined || row.role !== "BACKER" || !hashPattern.test(row.candidateTransactionId ?? "") || !integerPattern.test(row.backingTinybars ?? "")
      || (row.state !== "SUBMITTED" && row.state !== "CONFIRMED" && row.state !== "REJECTED")) return null;
    return { status: row.state, transactionHash: row.candidateTransactionId!, tinybars: row.backingTinybars! };
  },
});
