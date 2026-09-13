import { internalMutationGeneric, internalQueryGeneric, type DataModelFromSchemaDefinition, type MutationBuilder, type QueryBuilder } from "convex/server";
import { v } from "convex/values";
import type schema from "./schema.ts";
import { backingPaymentClaimStore } from "./backing_payment_claims.ts";

const internalMutation: MutationBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalMutationGeneric;
const internalQuery: QueryBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalQueryGeneric;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const integerPattern = /^(?:0|[1-9][0-9]*)$/u;

const outcomeValidator = v.union(v.literal("PREPARED"), v.literal("CONFIRMED"), v.literal("REJECTED"), v.literal("SUBMITTED"), v.literal("OUTCOME_UNKNOWN"));
const resultValidator = v.union(v.null(), v.object({ status: outcomeValidator, transactionHash: v.union(v.null(), v.string()), tinybars: v.string() }));
type Status = "PREPARED" | "CONFIRMED" | "REJECTED" | "SUBMITTED" | "OUTCOME_UNKNOWN";
type ExistingClaim = Readonly<{ attemptId: string; transactionHash?: string; tinybars: string; state: Status }>;

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
    && (record.state === "PREPARED" || record.state === "SUBMITTED" || record.state === "CONFIRMED" || record.state === "OUTCOME_UNKNOWN" || record.state === "REJECTED");
}

function now(): bigint { return BigInt(Date.now()); }

/** Pure admission policy; the mutation applies it while reading both indexed claims transactionally. */
export function resolveBackingPaymentClaim(
  claimedHash: ExistingClaim | undefined,
  claimedAttempt: ExistingClaim | undefined,
  input: Readonly<{ attemptId: string; transactionHash: string; tinybars: string; outcome: Status }>,
): Status | null {
  if (claimedHash !== undefined && claimedHash.attemptId !== input.attemptId) return null;
  if (claimedAttempt !== undefined && ((claimedAttempt.transactionHash !== undefined && claimedAttempt.transactionHash !== input.transactionHash) || claimedAttempt.tinybars !== input.tinybars)) return null;
  const state = claimedAttempt?.state ?? claimedHash?.state;
  if (state === "CONFIRMED" || state === "REJECTED") return state;
  if (state === "PREPARED") return input.outcome;
  return state === "OUTCOME_UNKNOWN" && input.outcome === "SUBMITTED" ? state : input.outcome;
}

export const reserveBackingPayment = internalMutation({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string(), tinybars: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress) || !integerPattern.test(args.tinybars) || BigInt(args.tinybars) < 1n) return null;
    const rows = await ctx.db.query("externalPrepareCommandAttempts").withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.attemptPublicId)).take(2);
    if (rows.length !== 1 || !validAttempt(rows[0], args)) return null;
    const claims = await ctx.db.query(backingPaymentClaimStore).withIndex("by_attempt_id", (q) => q.eq("attemptId", rows[0]!._id)).take(2);
    if (claims.length > 1 || (claims.length === 1 && claims[0]!.tinybars !== args.tinybars)) return null;
    const claim = claims[0];
    if (claim === undefined) {
      await ctx.db.insert(backingPaymentClaimStore, { attemptId: rows[0]!._id, canonicalSignerAddress: args.canonicalSignerAddress, tinybars: args.tinybars, state: "PREPARED", claimedAt: now() });
      return { status: "PREPARED" as const, transactionHash: null, tinybars: args.tinybars };
    }
    return { status: claim.state, transactionHash: claim.transactionHash ?? null, tinybars: claim.tinybars };
  },
});

export const readBackingPaymentContext = internalQuery({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string() },
  returns: v.union(v.null(), v.object({ expectedTarget: v.string(), canonicalParametersHash: v.string(), state: v.string() })),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress)) return null;
    const rows = await ctx.db.query("externalPrepareCommandAttempts").withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.attemptPublicId)).take(2);
    if (rows.length !== 1 || !validAttempt(rows[0], args)) return null;
    const row = rows[0];
    return {
      expectedTarget: row.expectedTarget, canonicalParametersHash: row.canonicalParametersHash, state: row.state,
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
    const claims = await ctx.db.query(backingPaymentClaimStore).withIndex("by_transaction_hash", (q) => q.eq("transactionHash", args.transactionHash)).take(2);
    if (claims.length > 1) return null;
    const attempts = await ctx.db.query(backingPaymentClaimStore).withIndex("by_attempt_id", (q) => q.eq("attemptId", row._id)).take(2);
    if (attempts.length > 1) return null;
    const claim = attempts[0];
    const next = resolveBackingPaymentClaim(claims[0], claim, { attemptId: row._id, transactionHash: args.transactionHash, tinybars: args.tinybars, outcome: args.outcome });
    if (next === null || (claim === undefined && (row.state === "CONFIRMED" || row.state === "REJECTED"))) return null;
    if (claim === undefined) {
      await ctx.db.insert(backingPaymentClaimStore, { transactionHash: args.transactionHash, attemptId: row._id, canonicalSignerAddress: args.canonicalSignerAddress, tinybars: args.tinybars, state: next, claimedAt: now() });
    } else if (claim.state !== next) {
      await ctx.db.patch(claim._id, { transactionHash: args.transactionHash, state: next });
    } else if (claim.transactionHash === undefined) {
      await ctx.db.patch(claim._id, { transactionHash: args.transactionHash });
    }
    return { status: next, transactionHash: args.transactionHash, tinybars: args.tinybars };
  },
});

export const readBackerPayment = internalQuery({
  args: { canonicalSignerAddress: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress)) return null;
    const rows = await ctx.db.query(backingPaymentClaimStore)
      .withIndex("by_canonical_signer_address", (q) => q.eq("canonicalSignerAddress", args.canonicalSignerAddress))
      .order("desc").take(1);
    const row = rows[0];
    if (row === undefined || !integerPattern.test(row.tinybars) || (row.transactionHash !== undefined && !hashPattern.test(row.transactionHash))) return null;
    return { status: row.state, transactionHash: row.transactionHash ?? null, tinybars: row.tinybars };
  },
});

/** Reads a backer's latest durable payment record for one public offering only. */
export const readBackerPaymentForOffering = internalQuery({
  args: { canonicalSignerAddress: v.string(), offeringPublicId: v.string() },
  returns: resultValidator,
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress) || !/^[A-Za-z0-9_-]{1,96}$/u.test(args.offeringPublicId)) return null;
    const intents = await ctx.db.query("backingIntents")
      .withIndex("by_backer_offering_created", (query) => (
        query.eq("canonicalSignerAddress", args.canonicalSignerAddress).eq("offeringPublicId", args.offeringPublicId)
      ))
      .order("desc")
      .take(8);
    for (const intent of intents) {
      const attempts = await ctx.db.query("externalPrepareCommandAttempts")
        .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", intent.idempotencyKey))
        .take(2);
      if (attempts.length !== 1 || !validAttempt(attempts[0], { attemptPublicId: intent.idempotencyKey, canonicalSignerAddress: args.canonicalSignerAddress })) continue;
      const claims = await ctx.db.query(backingPaymentClaimStore)
        .withIndex("by_attempt_id", (query) => query.eq("attemptId", attempts[0]!._id))
        .take(2);
      const claim = claims[0];
      if (
        claims.length === 1 && integerPattern.test(claim!.tinybars)
        && (claim!.transactionHash === undefined || hashPattern.test(claim!.transactionHash))
      ) return { status: claim!.state, transactionHash: claim!.transactionHash ?? null, tinybars: claim!.tinybars };
    }
    return null;
  },
});

export const readBackingPaymentVerificationContext = internalQuery({
  args: { canonicalSignerAddress: v.string() },
  returns: v.union(v.null(), v.object({
    attemptPublicId: v.string(), expectedTarget: v.string(), transactionHash: v.string(), tinybars: v.string(), state: outcomeValidator,
  })),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress)) return null;
    const claims = await ctx.db.query(backingPaymentClaimStore)
      .withIndex("by_canonical_signer_address", (q) => q.eq("canonicalSignerAddress", args.canonicalSignerAddress))
      .order("desc").take(1);
    const claim = claims[0];
    const transactionHash = claim?.transactionHash;
    if (claim === undefined || claim.state === "PREPARED" || transactionHash === undefined || !hashPattern.test(transactionHash) || !integerPattern.test(claim.tinybars)) return null;
    const attempt = await ctx.db.get(claim.attemptId);
    if (!validAttempt(attempt, { attemptPublicId: attempt?.idempotencyKey ?? "", canonicalSignerAddress: args.canonicalSignerAddress })) return null;
    return {
      attemptPublicId: attempt.idempotencyKey,
      expectedTarget: attempt.expectedTarget,
      transactionHash,
      tinybars: claim.tinybars,
      state: claim.state,
    };
  },
});
