import {
  internalMutationGeneric,
  internalQueryGeneric,
  type DataModelFromSchemaDefinition,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import { v } from "convex/values";
import { isSelectedProviderToolSubject, resolveSelectedProviderToolSubject } from "./provider_tool_authority.ts";
import type schema from "./schema.ts";

const internalMutation: MutationBuilder<
  DataModelFromSchemaDefinition<typeof schema>,
  "internal"
> = internalMutationGeneric;
const internalQuery: QueryBuilder<
  DataModelFromSchemaDefinition<typeof schema>,
  "internal"
> = internalQueryGeneric;

type ProjectedAuthority = {
  readonly principalPublicId: string;
  readonly canonicalSignerAddress: string;
  readonly chainId: 296;
  readonly role: "ISSUER" | "BACKER";
  readonly ownedSubjectPublicIds: string[];
  readonly authorityVersion: string;
  readonly enabled: boolean;
};

type TargetSelection = Readonly<{ subjectPublicId?: string; offeringPublicId?: string; attemptPublicId?: string }>;

async function resolveAuthorityTarget(ctx: Parameters<typeof resolveSelectedProviderToolSubject>[0], authority: ProjectedAuthority, selection: TargetSelection): Promise<string> {
  if (typeof selection.subjectPublicId === "string") {
    return (await resolveSelectedProviderToolSubject(ctx, authority, { subjectPublicId: selection.subjectPublicId, ...(selection.offeringPublicId === undefined ? {} : { offeringPublicId: selection.offeringPublicId }) })).subjectPublicId;
  }
  if (typeof selection.attemptPublicId !== "string") throw new TypeError("missing durable target");
  const attemptPublicId = selection.attemptPublicId;
  const attempts = await ctx.db.query("externalPrepareCommandAttempts")
    .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", attemptPublicId))
    .take(2);
  const attempt = attempts[0];
  if (attempts.length !== 1 || attempt === undefined || attempt.canonicalSignerAddress !== authority.canonicalSignerAddress
    || attempt.principalPublicId !== authority.principalPublicId || attempt.authorityVersion !== authority.authorityVersion
    || attempt.role !== authority.role || typeof attempt.subjectPublicId !== "string") throw new TypeError("attempt authority mismatch");
  if (!isSelectedProviderToolSubject(attempt.subjectPublicId)) return attempt.subjectPublicId;
  return (await resolveSelectedProviderToolSubject(ctx, authority, { subjectPublicId: attempt.subjectPublicId })).subjectPublicId;
}

function claimTimestamp(): bigint {
  const now = Date.now();
  if (!Number.isSafeInteger(now) || now < 0) {
    throw new TypeError("invalid ingress replay claim time");
  }
  return BigInt(now);
}

function projectAuthority(input: unknown): ProjectedAuthority | null {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) {
    return null;
  }
  const fields = [
    "principalPublicId",
    "canonicalSignerAddress",
    "chainId",
    "role",
    "ownedSubjectPublicIds",
    "authorityVersion",
    "enabled",
  ] as const;
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(input, field);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) {
      return null;
    }
    values[field] = descriptor.value;
  }
  const role = values.role;
  if (
    typeof values.principalPublicId !== "string"
    || typeof values.canonicalSignerAddress !== "string"
    || values.chainId !== 296
    || (role !== "ISSUER" && role !== "BACKER")
    || !Array.isArray(values.ownedSubjectPublicIds)
    || values.ownedSubjectPublicIds.some((subject) => typeof subject !== "string")
    || typeof values.authorityVersion !== "string"
    || typeof values.enabled !== "boolean"
  ) {
    return null;
  }
  const normalizedRole: "ISSUER" | "BACKER" = role;
  return {
    principalPublicId: values.principalPublicId,
    canonicalSignerAddress: values.canonicalSignerAddress,
    chainId: 296 as const,
    role: normalizedRole,
    ownedSubjectPublicIds: [...values.ownedSubjectPublicIds] as string[],
    authorityVersion: values.authorityVersion,
    enabled: values.enabled,
  };
}

export const claimIngressReplayIdentity = internalMutation({
  args: { replayIdentity: v.string() },
  returns: v.union(v.literal("claimed"), v.literal("already_claimed")),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("ingressCommandReplayClaims")
      .withIndex("by_replay_identity", (query) => query.eq("replayIdentity", args.replayIdentity))
      .take(2);
    if (existing.length !== 0) {
      return "already_claimed" as const;
    }
    await ctx.db.insert("ingressCommandReplayClaims", {
      replayIdentity: args.replayIdentity,
      claimedAt: claimTimestamp(),
    });
    return "claimed" as const;
  },
});

export const readCommandAuthorities = internalQuery({
  args: {
    chainId: v.literal(296),
    canonicalSignerAddress: v.string(),
    selection: v.optional(v.object({
      subjectPublicId: v.optional(v.string()),
      offeringPublicId: v.optional(v.string()),
      attemptPublicId: v.optional(v.string()),
    })),
    purpose: v.optional(v.union(v.literal("BACKING"), v.literal("OWNER"))),
  },
  returns: v.array(v.object({
    principalPublicId: v.string(),
    canonicalSignerAddress: v.string(),
    chainId: v.literal(296),
    role: v.union(v.literal("ISSUER"), v.literal("BACKER")),
    ownedSubjectPublicIds: v.array(v.string()),
    authorityVersion: v.string(),
    enabled: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const authorities = await ctx.db.query("commandAuthorities")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) => (
        query.eq("chainId", args.chainId).eq("canonicalSignerAddress", args.canonicalSignerAddress)
      ))
      .take(2);
    const initialProjection = authorities.map(projectAuthority);
    if (!initialProjection.every((authority) => authority !== null)) return [];
    const legacy = initialProjection.length === 1 ? initialProjection[0] : undefined;
    const compatibleLegacy = legacy !== undefined && legacy.enabled === true
      && (args.purpose === "BACKING" ? legacy.role === "BACKER" : legacy.role === "ISSUER");
    if (compatibleLegacy && args.selection === undefined) return [legacy];
    if (compatibleLegacy && args.selection !== undefined) {
      try {
        const subjectPublicId = await resolveAuthorityTarget(ctx, legacy, args.selection);
        return [{ ...legacy, ownedSubjectPublicIds: [subjectPublicId] }];
      } catch {
        // The selected durable tool belongs to another principal/version. It
        // must not make an unrelated legacy issuer mask active self-service.
      }
    }
    if (process.env.TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED !== "true") return [];
    const accounts = await ctx.db.query("selfServiceAccounts")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) => query.eq("chainId", 296).eq("canonicalSignerAddress", args.canonicalSignerAddress))
      .take(2);
    const account = accounts.length === 1 ? accounts[0] : undefined;
    if (account === undefined || account.status !== "ACTIVE" || account.policyVersion !== "public_testnet_v1"
      || account.principalPublicId !== `self_service_${args.canonicalSignerAddress.slice(2)}`) return [];
    const projected: ProjectedAuthority = {
      principalPublicId: account.principalPublicId,
      canonicalSignerAddress: args.canonicalSignerAddress,
      chainId: 296,
      role: args.purpose === "OWNER" || args.selection !== undefined ? "ISSUER" : "BACKER",
      ownedSubjectPublicIds: [],
      authorityVersion: account.policyVersion,
      enabled: true,
    };
    if (args.selection === undefined) return [projected];
    try {
      const subjectPublicId = await resolveAuthorityTarget(ctx, projected, args.selection);
      return [{ ...projected, ownedSubjectPublicIds: [subjectPublicId] }];
    } catch {
      return [];
    }
  },
});
