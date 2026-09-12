import {
  internalMutationGeneric,
  internalQueryGeneric,
  type DataModelFromSchemaDefinition,
  type GenericQueryCtx,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import { v } from "convex/values";
import { createProviderToolIdentity, parseProviderToolId } from "@tool402/core";
import { createStageBIssuerAtsCreateAuthority } from "../src/ats/stage-b-issuer-ats-create-authority.ts";
import type schema from "./schema.ts";

const internalMutation: MutationBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalMutationGeneric;
const internalQuery: QueryBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalQueryGeneric;

const addressPattern = /^0x[0-9a-f]{40}$/u;
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const stateValidator = v.union(
  v.literal("ALLOCATED"), v.literal("DRAFT"), v.literal("ASSET_PENDING"),
  v.literal("READY"), v.literal("OPEN"), v.literal("CLOSED"),
);
const toolValidator = v.object({
  toolPublicId: v.string(),
  subjectPublicId: v.string(),
  offeringPublicId: v.string(),
  serviceId: v.string(),
  serviceSlug: v.string(),
  title: v.string(),
  state: stateValidator,
});
type ToolState = "ALLOCATED" | "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";
type ToolIdentityProjection = Readonly<{
  toolPublicId: string;
  subjectPublicId: string;
  offeringPublicId: string;
  serviceId: string;
  serviceSlug: string;
}>;
type ToolAllocation = Readonly<{
  canonicalSignerAddress: string;
  principalPublicId: string;
  authorityVersion: string;
  offeringVersion: 1;
}> & ToolIdentityProjection;
type ToolProjection = Readonly<{
  title: string;
  state: ToolState;
}> & ToolIdentityProjection;
type DatabaseContext = Pick<GenericQueryCtx<DataModelFromSchemaDefinition<typeof schema>>, "db">;

const defaultTitle = "RiskScan";

function now(): bigint | null {
  const value = Date.now();
  return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
}

function isCurrentIssuer(value: unknown, address: string): value is {
  principalPublicId: string;
  authorityVersion: string;
} {
  if (value === null || typeof value !== "object") return false;
  const planned = createStageBIssuerAtsCreateAuthority().plannedCommandAuthority;
  const record = value as Record<string, unknown>;
  return record.canonicalSignerAddress === address
    && record.canonicalSignerAddress === planned.canonicalSignerAddress
    && record.chainId === planned.chainId
    && record.role === planned.role
    && record.enabled === planned.enabled
    && record.principalPublicId === planned.principalPublicId
    && record.authorityVersion === planned.authorityVersion
    && Array.isArray(record.ownedSubjectPublicIds)
    && record.ownedSubjectPublicIds.length === 1
    && record.ownedSubjectPublicIds[0] === planned.ownedSubjectPublicIds[0];
}

function projectAllocation(value: unknown): ToolAllocation | null {
  if (value === null || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const toolPublicId = parseProviderToolId(record.toolPublicId);
  if (toolPublicId === null || record.subjectPublicId !== toolPublicId || typeof record.offeringPublicId !== "string"
    || typeof record.serviceId !== "string" || typeof record.serviceSlug !== "string"
    || typeof record.canonicalSignerAddress !== "string" || !addressPattern.test(record.canonicalSignerAddress) || typeof record.principalPublicId !== "string"
    || record.principalPublicId.length === 0 || typeof record.authorityVersion !== "string"
    || record.authorityVersion.length === 0 || record.chainId !== 296
    || record.offeringPublicId !== `offering_${toolPublicId.slice(5)}` || record.serviceId !== toolPublicId
    || record.serviceSlug !== `tool-${toolPublicId.slice(5)}` || record.offeringVersion !== 1 || record.directoryVersion !== 1) {
    return null;
  }
  return {
    toolPublicId,
    subjectPublicId: record.subjectPublicId,
    offeringPublicId: record.offeringPublicId,
    serviceId: record.serviceId,
    serviceSlug: record.serviceSlug,
    canonicalSignerAddress: record.canonicalSignerAddress,
    principalPublicId: record.principalPublicId,
    authorityVersion: record.authorityVersion,
    offeringVersion: 1,
  };
}

function isOfferingState(value: unknown): value is Exclude<ToolState, "ALLOCATED"> {
  return value === "DRAFT" || value === "ASSET_PENDING" || value === "READY" || value === "OPEN" || value === "CLOSED";
}

async function project(ctx: DatabaseContext, value: unknown): Promise<ToolProjection | null> {
  const allocation = projectAllocation(value);
  if (allocation === null) return null;
  const offerings = await ctx.db.query("offerings")
    .withIndex("by_offering_public_id_and_version", (query) => (
      query.eq("offeringPublicId", allocation.offeringPublicId)
    )).take(2);
  const projection = (title: string, state: ToolState): ToolProjection => ({
    toolPublicId: allocation.toolPublicId,
    subjectPublicId: allocation.subjectPublicId,
    offeringPublicId: allocation.offeringPublicId,
    serviceId: allocation.serviceId,
    serviceSlug: allocation.serviceSlug,
    title,
    state,
  });
  if (offerings.length === 0) return projection(defaultTitle, "ALLOCATED");
  if (offerings.length !== 1 || offerings[0] === undefined) return null;
  const offering = offerings[0];
  if (offering.offeringPublicId !== allocation.offeringPublicId
    || offering.version !== allocation.offeringVersion
    || offering.subjectPublicId !== allocation.subjectPublicId
    || offering.canonicalSignerAddress !== allocation.canonicalSignerAddress
    || offering.principalPublicId !== allocation.principalPublicId
    || offering.authorityVersion !== allocation.authorityVersion
    || typeof offering.narrative?.title !== "string" || offering.narrative.title.trim().length === 0
    || !isOfferingState(offering.state)) return null;
  return projection(offering.narrative.title, offering.state);
}

function randomIdentity() {
  const entropy = globalThis.crypto?.getRandomValues(new Uint8Array(16));
  return entropy instanceof Uint8Array && entropy.byteLength === 16
    ? createProviderToolIdentity(entropy)
    : null;
}

export const allocateForIssuer = internalMutation({
  args: { canonicalSignerAddress: v.string(), requestId: v.string() },
  returns: v.union(
    v.object({ outcome: v.literal("allocated"), tool: toolValidator }),
    v.object({ outcome: v.literal("replayed"), tool: toolValidator }),
    v.object({ outcome: v.literal("rejected") }),
  ),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress) || !requestIdPattern.test(args.requestId)) {
      return { outcome: "rejected" as const };
    }
    const authorities = await ctx.db.query("commandAuthorities")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) => (
        query.eq("chainId", 296).eq("canonicalSignerAddress", args.canonicalSignerAddress)
      )).take(2);
    if (authorities.length !== 1 || !isCurrentIssuer(authorities[0], args.canonicalSignerAddress)) {
      return { outcome: "rejected" as const };
    }
    const prior = await ctx.db.query("providerTools")
      .withIndex("by_owner_and_chain_and_request", (query) => (
        query.eq("canonicalSignerAddress", args.canonicalSignerAddress).eq("chainId", 296).eq("requestId", args.requestId)
      )).take(2);
    const replay = prior.length === 1 ? await project(ctx, prior[0]) : null;
    if (replay !== null) return { outcome: "replayed" as const, tool: replay };
    if (prior.length > 1) return { outcome: "rejected" as const };

    const createdAt = now();
    if (createdAt === null) return { outcome: "rejected" as const };
    for (let attempts = 0; attempts < 8; attempts += 1) {
      const identity = randomIdentity();
      if (identity === null) return { outcome: "rejected" as const };
      const collisions = await ctx.db.query("providerTools")
        .withIndex("by_tool_public_id", (query) => query.eq("toolPublicId", identity.toolPublicId))
        .take(1);
      if (collisions.length !== 0) continue;
      const authority = authorities[0];
      await ctx.db.insert("providerTools", {
        ...identity,
        canonicalSignerAddress: args.canonicalSignerAddress,
        chainId: 296,
        principalPublicId: authority.principalPublicId,
        authorityVersion: authority.authorityVersion,
        requestId: args.requestId,
        offeringVersion: 1,
        directoryVersion: 1,
        createdAt,
      });
      return { outcome: "allocated" as const, tool: { ...identity, title: defaultTitle, state: "ALLOCATED" as const } };
    }
    return { outcome: "rejected" as const };
  },
});

export const listOwnedTools = internalQuery({
  args: { canonicalSignerAddress: v.string(), cursor: v.union(v.string(), v.null()) },
  returns: v.object({ tools: v.array(toolValidator), nextCursor: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress)) return { tools: [], nextCursor: null };
    const result = await ctx.db.query("providerTools")
      .withIndex("by_owner_and_chain_and_created", (query) => query.eq("canonicalSignerAddress", args.canonicalSignerAddress).eq("chainId", 296))
      .order("desc").paginate({ cursor: args.cursor, numItems: 20 });
    const tools = await Promise.all(result.page.map((tool) => project(ctx, tool)));
    if (!tools.every((tool): tool is ToolProjection => tool !== null)) return { tools: [], nextCursor: null };
    return { tools, nextCursor: result.isDone ? null : result.continueCursor };
  },
});

export const readOwnedTool = internalQuery({
  args: { canonicalSignerAddress: v.string(), toolPublicId: v.string() },
  returns: v.union(toolValidator, v.null()),
  handler: async (ctx, args) => {
    if (!addressPattern.test(args.canonicalSignerAddress) || parseProviderToolId(args.toolPublicId) === null) return null;
    const rows = await ctx.db.query("providerTools")
      .withIndex("by_tool_public_id", (query) => query.eq("toolPublicId", args.toolPublicId))
      .take(2);
    if (rows.length !== 1 || rows[0]?.canonicalSignerAddress !== args.canonicalSignerAddress) return null;
    return project(ctx, rows[0]);
  },
});
