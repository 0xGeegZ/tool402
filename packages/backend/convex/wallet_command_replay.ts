import {
  internalMutationGeneric,
  internalQueryGeneric,
  type DataModelFromSchemaDefinition,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import { v } from "convex/values";
import { resolveSelectedProviderToolSubject } from "./provider_tool_authority.ts";
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
      subjectPublicId: v.string(),
      offeringPublicId: v.optional(v.string()),
    })),
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
    const projected = authorities.map(projectAuthority);
    if (!projected.every((authority) => authority !== null)) return [];
    if (args.selection === undefined) return projected;
    if (projected.length !== 1 || projected[0] === undefined) return [];
    try {
      const selected = await resolveSelectedProviderToolSubject(
        ctx,
        projected[0],
        args.selection,
      );
      return [{ ...projected[0], ownedSubjectPublicIds: [selected.subjectPublicId] }];
    } catch {
      return [];
    }
  },
});
