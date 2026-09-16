import { internalMutationGeneric, type DataModelFromSchemaDefinition, type MutationBuilder } from "convex/server";
import { v } from "convex/values";
import type schema from "./schema.ts";

const internalMutation: MutationBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalMutationGeneric;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const outcomeValidator = v.union(
  v.literal("ACTIVE"),
  v.literal("DISABLED"),
  v.literal("SUSPENDED"),
  v.literal("REVOKED"),
  v.literal("UNAVAILABLE"),
);
const accountStatusValidator = v.union(v.literal("ACTIVE"), v.literal("SUSPENDED"), v.literal("REVOKED"));

export function isPublicTestnetSelfServiceEnabled(): boolean {
  return process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED === "true";
}

function boundedPositiveInteger(value: string | undefined, maximum: number): number | null {
  if (value === undefined || !/^(?:[1-9]|[1-9][0-9]{1,2})$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
}

/** A missing or malformed public quota fails closed instead of becoming unbounded. */
export function readSelfServiceMaxTools(): number | null {
  return boundedPositiveInteger(process.env.TOOL402_SELF_SERVICE_MAX_TOOLS, 100);
}

export function readSelfServiceMaxPendingAttempts(): number | null {
  return boundedPositiveInteger(process.env.TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS, 100);
}

/** Missing or malformed write-rate configuration fails closed. */
export function readSelfServiceMaxBackingIntentsPerHour(): number | null {
  return boundedPositiveInteger(process.env.TOOL402_SELF_SERVICE_MAX_BACKING_INTENTS_PER_HOUR, 100);
}

function timestamp(): bigint | null {
  const value = Date.now();
  return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
}

export const ensureSelfServiceAccount = internalMutation({
  args: { canonicalSignerAddress: v.string() },
  returns: v.object({ outcome: outcomeValidator }),
  handler: async (ctx, args) => {
    if (!isPublicTestnetSelfServiceEnabled()) return { outcome: "DISABLED" as const };
    if (!addressPattern.test(args.canonicalSignerAddress)) return { outcome: "UNAVAILABLE" as const };
    const matches = await ctx.db.query("selfServiceAccounts")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) => (
        query.eq("chainId", 296).eq("canonicalSignerAddress", args.canonicalSignerAddress)
      )).take(2);
    if (matches.length > 1) return { outcome: "UNAVAILABLE" as const };
    const existing = matches[0];
    if (existing !== undefined) {
      if (existing.principalPublicId !== `self_service_${args.canonicalSignerAddress.slice(2)}`
        || existing.policyVersion !== "public_testnet_v1") return { outcome: "UNAVAILABLE" as const };
      return { outcome: existing.status };
    }
    const now = timestamp();
    if (now === null) return { outcome: "UNAVAILABLE" as const };
    await ctx.db.insert("selfServiceAccounts", {
      canonicalSignerAddress: args.canonicalSignerAddress,
      chainId: 296,
      principalPublicId: `self_service_${args.canonicalSignerAddress.slice(2)}`,
      policyVersion: "public_testnet_v1",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
    return { outcome: "ACTIVE" as const };
  },
});

/** Internal-only operator control. It never creates or silently reactivates an account. */
export const setSelfServiceAccountStatus = internalMutation({
  args: { canonicalSignerAddress: v.string(), status: accountStatusValidator },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress)) return false;
    const accounts = await ctx.db.query("selfServiceAccounts")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) => (
        query.eq("chainId", 296).eq("canonicalSignerAddress", args.canonicalSignerAddress)
      )).take(2);
    const account = accounts[0];
    const now = timestamp();
    if (
      accounts.length !== 1 || account === undefined || now === null
      || account.canonicalSignerAddress !== args.canonicalSignerAddress
      || account.chainId !== 296
      || account.principalPublicId !== `self_service_${args.canonicalSignerAddress.slice(2)}`
      || account.policyVersion !== "public_testnet_v1"
    ) return false;
    await ctx.db.patch(account._id, { status: args.status, updatedAt: now });
    return true;
  },
});
