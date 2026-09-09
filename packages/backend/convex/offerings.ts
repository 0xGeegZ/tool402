import {
  internalMutationGeneric,
  queryGeneric,
} from "convex/server";
import type {
  DataModelFromSchemaDefinition,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  canonicalOfferingCreatePayloadBytes,
  parseOfferingCreatePayload,
} from "@tool402/core";
import type { OfferingCreatePayload } from "@tool402/core";
import {
  bindOfferingCommand,
  isCanonicalEvmAddress,
  isInt64,
  readStoredRecord,
  revalidateOfferingAuthority,
  revalidateWalletCommandReplayClaim,
} from "../src/offering-command-admission.ts";
import type { OfferingCommandBinding } from "../src/offering-command-admission.ts";
import type schema from "./schema.ts";

const definitionValidator = v.object({
  schemaVersion: v.literal(1),
  terms: v.object({
    version: v.string(),
    fundingTargetTinybars: v.string(),
    noteUnitPriceTinybars: v.string(),
    maximumNoteUnits: v.string(),
    minimumPurchaseUnits: v.string(),
    reserveShareBps: v.string(),
    issuerShareBps: v.string(),
    platformFeeBps: v.string(),
    payoutCapTinybars: v.string(),
  }),
  maturityAt: v.string(),
  qualifyingResource: v.string(),
});
const narrativeValidator = v.object({
  title: v.string(),
  customerProblem: v.string(),
  customerUseCases: v.array(v.string()),
  useOfFunds: v.array(v.string()),
  risks: v.array(v.string()),
});
const offeringPayloadValidator = v.object({
  schemaVersion: v.literal(1),
  offeringPublicId: v.string(),
  offeringVersion: v.number(),
  subjectPublicId: v.string(),
  definition: definitionValidator,
  narrative: narrativeValidator,
  advertisedQuickPriceTinybars: v.string(),
  advertisedStandardPriceTinybars: v.string(),
  idempotencyKey: v.string(),
  expiresAt: v.string(),
});
const offeringCommandValidators = {
  version: v.literal(1),
  type: v.literal("offering.create"),
  chainId: v.literal(296),
  canonicalSignerAddress: v.string(),
  nonce: v.string(),
  issuedAt: v.string(),
  expiresAt: v.string(),
  payloadHash: v.string(),
  replayIdentity: v.string(),
  principalPublicId: v.string(),
  role: v.literal("ISSUER"),
  authorityVersion: v.string(),
  payload: offeringPayloadValidator,
};
const admissionReturns = v.union(
  v.object({ status: v.literal("NEW"), targetId: v.id("offerings"), state: v.literal("DRAFT") }),
  v.object({ status: v.literal("IDEMPOTENCY_REPLAYED"), targetId: v.id("offerings"), state: v.literal("DRAFT") }),
  v.object({ status: v.literal("COMMAND_REPLAYED") }),
  v.object({ status: v.literal("IDEMPOTENCY_CONFLICT") }),
  v.object({ status: v.literal("PRECONDITION_UNMET") }),
);
const projectionValidator = v.object({
  offeringPublicId: v.string(),
  version: v.number(),
  subjectPublicId: v.string(),
  state: v.union(
    v.literal("DRAFT"), v.literal("ASSET_PENDING"), v.literal("READY"),
    v.literal("OPEN"), v.literal("CLOSED"),
  ),
  definition: definitionValidator,
  narrative: narrativeValidator,
  advertisedQuickPriceTinybars: v.string(),
  advertisedStandardPriceTinybars: v.string(),
  canonicalSignerAddress: v.string(),
  atsAssetEvmAddress: v.optional(v.string()),
  acceptedAt: v.int64(),
  updatedAt: v.int64(),
});
const offeringFields = [
  "offeringPublicId",
  "subjectPublicId",
  "canonicalSignerAddress",
  "principalPublicId",
  "authorityVersion",
  "payloadHash",
  "idempotencyKey",
  "advertisedQuickPriceTinybars",
  "advertisedStandardPriceTinybars",
  "version",
  "acceptedAt",
  "updatedAt",
  "definition",
  "narrative",
  "state",
] as const;
const offeringOptionalFields = [
  "atsAttemptId",
  "atsAssetEvmAddress",
  "activeDirectoryVersionId",
] as const;
const externalPrepareAttemptFields = [
  "version",
  "type",
  "chainId",
  "canonicalSignerAddress",
  "principalPublicId",
  "role",
  "authorityVersion",
  "payloadHash",
  "operationKind",
  "subjectPublicId",
  "network",
  "expectedTarget",
  "canonicalParametersHash",
  "idempotencyKey",
  "expiresAt",
  "state",
  "acceptedAt",
] as const;
const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const payloadHashPattern = /^0x[0-9a-f]{64}$/u;
const parameterHashPattern = /^[0-9a-f]{64}$/u;
const idempotencyKeyPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const timestampPattern =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;
const canonicalStoredValidationExpiry = "2026-01-01T00:00:00.000Z";

type OfferingState = "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";

interface SafeOffering {
  readonly offeringId: GenericId<"offerings">;
  readonly offeringPublicId: string;
  readonly subjectPublicId: string;
  readonly canonicalSignerAddress: string;
  readonly principalPublicId: string;
  readonly authorityVersion: string;
  readonly payloadHash: string;
  readonly idempotencyKey: string;
  readonly advertisedQuickPriceTinybars: string;
  readonly advertisedStandardPriceTinybars: string;
  readonly version: number;
  readonly acceptedAt: bigint;
  readonly updatedAt: bigint;
  readonly definition: ReturnType<typeof storedDefinition>;
  readonly narrative: ReturnType<typeof storedNarrative>;
  readonly state: OfferingState;
  readonly atsAttemptId?: GenericId<"externalPrepareCommandAttempts">;
  readonly atsAssetEvmAddress?: string;
  readonly activeDirectoryVersionId?: GenericId<"directoryVersions">;
}

function reject(): never {
  throw new TypeError("invalid durable offering record");
}

function opaqueId<TableName extends string>(value: unknown): GenericId<TableName> {
  if (typeof value !== "string" || value.length === 0) {
    return reject();
  }
  return value as GenericId<TableName>;
}

function canonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !timestampPattern.test(value)) {
    return false;
  }
  const milliseconds = Date.parse(value);
  return Number.isSafeInteger(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function durableNow(): bigint {
  const now = Date.now();
  if (!Number.isSafeInteger(now) || now < 0) {
    return reject();
  }
  return BigInt(now);
}

function storedDefinition(payload: OfferingCreatePayload) {
  const terms = payload.definition.terms;
  return Object.freeze({
    schemaVersion: 1 as const,
    terms: Object.freeze({
      version: terms.version,
      fundingTargetTinybars: terms.fundingTargetTinybars.toString(),
      noteUnitPriceTinybars: terms.noteUnitPriceTinybars.toString(),
      maximumNoteUnits: terms.maximumNoteUnits.toString(),
      minimumPurchaseUnits: terms.minimumPurchaseUnits.toString(),
      reserveShareBps: terms.reserveShareBps.toString(),
      issuerShareBps: terms.issuerShareBps.toString(),
      platformFeeBps: terms.platformFeeBps.toString(),
      payoutCapTinybars: terms.payoutCapTinybars.toString(),
    }),
    maturityAt: payload.definition.maturityAt,
    qualifyingResource: payload.definition.qualifyingResource,
  });
}

function storedNarrative(payload: OfferingCreatePayload) {
  return Object.freeze({
    title: payload.narrative.title,
    customerProblem: payload.narrative.customerProblem,
    customerUseCases: [...payload.narrative.customerUseCases],
    useOfFunds: [...payload.narrative.useOfFunds],
    risks: [...payload.narrative.risks],
  });
}

function parseStoredOfferingPayload(record: Readonly<Record<string, unknown>>): OfferingCreatePayload {
  return parseOfferingCreatePayload({
    schemaVersion: 1,
    offeringPublicId: record.offeringPublicId,
    offeringVersion: record.version,
    subjectPublicId: record.subjectPublicId,
    definition: record.definition,
    narrative: record.narrative,
    advertisedQuickPriceTinybars: record.advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars: record.advertisedStandardPriceTinybars,
    idempotencyKey: record.idempotencyKey,
    expiresAt: canonicalStoredValidationExpiry,
  });
}

function readSafeOffering(input: unknown): SafeOffering {
  const record = readStoredRecord(input, offeringFields, offeringOptionalFields);
  const payload = parseStoredOfferingPayload(record);
  const state = record.state;
  const atsAttemptId = Object.hasOwn(record, "atsAttemptId")
    ? opaqueId<"externalPrepareCommandAttempts">(record.atsAttemptId)
    : undefined;
  const atsAssetEvmAddress = Object.hasOwn(record, "atsAssetEvmAddress")
    ? record.atsAssetEvmAddress
    : undefined;
  const activeDirectoryVersionId = Object.hasOwn(record, "activeDirectoryVersionId")
    ? opaqueId<"directoryVersions">(record.activeDirectoryVersionId)
    : undefined;
  if (
    !isCanonicalEvmAddress(record.canonicalSignerAddress)
    || typeof record.principalPublicId !== "string"
    || record.principalPublicId.length === 0
    || typeof record.authorityVersion !== "string"
    || record.authorityVersion.length === 0
    || typeof record.payloadHash !== "string"
    || !payloadHashPattern.test(record.payloadHash)
    || !isInt64(record.acceptedAt)
    || !isInt64(record.updatedAt)
    || !["DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"].includes(state as OfferingState)
    || (atsAssetEvmAddress !== undefined && !isCanonicalEvmAddress(atsAssetEvmAddress))
  ) {
    return reject();
  }
  if (
    (state === "DRAFT" && (atsAttemptId !== undefined || atsAssetEvmAddress !== undefined))
    || (state === "ASSET_PENDING" && (atsAttemptId === undefined || atsAssetEvmAddress !== undefined))
    || ((state === "READY" || state === "OPEN")
      && (atsAttemptId === undefined || atsAssetEvmAddress === undefined))
    || (state === "CLOSED"
      && ((atsAttemptId === undefined) !== (atsAssetEvmAddress === undefined)))
  ) {
    return reject();
  }
  return Object.freeze({
    offeringId: opaqueId<"offerings">(record._id),
    offeringPublicId: payload.offeringPublicId,
    subjectPublicId: payload.subjectPublicId,
    canonicalSignerAddress: record.canonicalSignerAddress,
    principalPublicId: record.principalPublicId,
    authorityVersion: record.authorityVersion,
    payloadHash: record.payloadHash,
    idempotencyKey: payload.idempotencyKey,
    advertisedQuickPriceTinybars: payload.advertisedQuickPriceTinybars.toString(),
    advertisedStandardPriceTinybars: payload.advertisedStandardPriceTinybars.toString(),
    version: payload.offeringVersion,
    acceptedAt: record.acceptedAt,
    updatedAt: record.updatedAt,
    definition: storedDefinition(payload),
    narrative: storedNarrative(payload),
    state: state as OfferingState,
    ...(atsAttemptId === undefined ? {} : { atsAttemptId }),
    ...(atsAssetEvmAddress === undefined ? {} : { atsAssetEvmAddress }),
    ...(activeDirectoryVersionId === undefined ? {} : { activeDirectoryVersionId }),
  });
}

function readSafePreparedAtsCreateAttempt(input: unknown) {
  const record = readStoredRecord(input, externalPrepareAttemptFields);
  if (
    record.version !== 1
    || record.type !== "external.prepare"
    || record.chainId !== 296
    || !isCanonicalEvmAddress(record.canonicalSignerAddress)
    || typeof record.principalPublicId !== "string"
    || record.principalPublicId.length === 0
    || record.role !== "ISSUER"
    || typeof record.authorityVersion !== "string"
    || record.authorityVersion.length === 0
    || typeof record.payloadHash !== "string"
    || !payloadHashPattern.test(record.payloadHash)
    || record.operationKind !== "ATS_CREATE"
    || typeof record.subjectPublicId !== "string"
    || !publicIdPattern.test(record.subjectPublicId)
    || record.network !== "hedera:testnet"
    || typeof record.expectedTarget !== "string"
    || record.expectedTarget.length === 0
    || typeof record.canonicalParametersHash !== "string"
    || !parameterHashPattern.test(record.canonicalParametersHash)
    || typeof record.idempotencyKey !== "string"
    || !idempotencyKeyPattern.test(record.idempotencyKey)
    || !canonicalTimestamp(record.expiresAt)
    || record.state !== "PREPARED"
    || !isInt64(record.acceptedAt)
  ) {
    return reject();
  }
  return Object.freeze({
    attemptId: opaqueId<"externalPrepareCommandAttempts">(record._id),
    subjectPublicId: record.subjectPublicId,
  });
}

function matchingBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function matchesStoredOfferingPayload(
  stored: SafeOffering,
  payload: OfferingCreatePayload,
): boolean {
  let reconstructed: OfferingCreatePayload;
  try {
    reconstructed = parseOfferingCreatePayload({
      schemaVersion: 1,
      offeringPublicId: stored.offeringPublicId,
      offeringVersion: stored.version,
      subjectPublicId: stored.subjectPublicId,
      definition: stored.definition,
      narrative: stored.narrative,
      advertisedQuickPriceTinybars: stored.advertisedQuickPriceTinybars,
      advertisedStandardPriceTinybars: stored.advertisedStandardPriceTinybars,
      idempotencyKey: stored.idempotencyKey,
      expiresAt: payload.expiresAt,
    });
  } catch {
    return false;
  }
  return matchingBytes(
    canonicalOfferingCreatePayloadBytes(reconstructed),
    canonicalOfferingCreatePayloadBytes(payload),
  );
}

function matchesStoredOffering(
  stored: SafeOffering,
  command: OfferingCommandBinding,
): boolean {
  const payload = command.payload;
  return (
    stored.state === "DRAFT"
    && stored.offeringPublicId === payload.offeringPublicId
    && stored.version === payload.offeringVersion
    && stored.subjectPublicId === payload.subjectPublicId
    && stored.canonicalSignerAddress === command.canonicalSignerAddress
    && stored.principalPublicId === command.principalPublicId
    && stored.authorityVersion === command.authorityVersion
    && stored.payloadHash === command.payloadHash
    && stored.idempotencyKey === payload.idempotencyKey
    && matchesStoredOfferingPayload(stored, payload)
  );
}

const internalMutation: MutationBuilder<
  DataModelFromSchemaDefinition<typeof schema>,
  "internal"
> = internalMutationGeneric;
const publicQuery: QueryBuilder<
  DataModelFromSchemaDefinition<typeof schema>,
  "public"
> = queryGeneric;

export const admitOfferingCreate = internalMutation({
  args: offeringCommandValidators,
  returns: admissionReturns,
  handler: async (ctx, args) => {
    const command = bindOfferingCommand(args, "offering.create", Number(durableNow()));
    const authorities = await ctx.db.query("commandAuthorities")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) => (
        query.eq("chainId", 296).eq("canonicalSignerAddress", command.canonicalSignerAddress)
      ))
      .take(2);
    if (authorities.length !== 1) {
      return reject();
    }
    revalidateOfferingAuthority(authorities[0], command, true);

    const claims = await ctx.db.query("walletCommandReplayClaims")
      .withIndex("by_replay_identity", (query) => query.eq("replayIdentity", command.replayIdentity))
      .take(2);
    if (claims.length > 1) {
      return reject();
    }
    if (claims.length === 1) {
      revalidateWalletCommandReplayClaim(claims[0], command.replayIdentity, command.type);
      return { status: "COMMAND_REPLAYED" as const };
    }

    const matchingOfferings = await ctx.db.query("offerings")
      .withIndex("by_offering_public_id_and_version", (query) => (
        query
          .eq("offeringPublicId", command.payload.offeringPublicId)
          .eq("version", command.payload.offeringVersion)
      ))
      .take(2);
    if (command.payload.offeringVersion !== 1) {
      return { status: "PRECONDITION_UNMET" as const };
    }
    if (matchingOfferings.length === 0) {
      const payload = command.payload;
      const offeringId = await ctx.db.insert("offerings", {
        offeringPublicId: payload.offeringPublicId,
        subjectPublicId: payload.subjectPublicId,
        canonicalSignerAddress: command.canonicalSignerAddress,
        principalPublicId: command.principalPublicId,
        authorityVersion: command.authorityVersion,
        payloadHash: command.payloadHash,
        idempotencyKey: payload.idempotencyKey,
        advertisedQuickPriceTinybars: payload.advertisedQuickPriceTinybars.toString(),
        advertisedStandardPriceTinybars: payload.advertisedStandardPriceTinybars.toString(),
        version: payload.offeringVersion,
        acceptedAt: command.durableNow,
        updatedAt: command.durableNow,
        definition: storedDefinition(payload),
        narrative: storedNarrative(payload),
        state: "DRAFT" as const,
      });
      await ctx.db.insert("walletCommandReplayClaims", {
        replayIdentity: command.replayIdentity,
        commandType: command.type,
        outcome: "NEW" as const,
        targetId: offeringId,
        claimedAt: command.durableNow,
      });
      return { status: "NEW" as const, targetId: offeringId, state: "DRAFT" as const };
    }

    let stored: SafeOffering | null = null;
    if (matchingOfferings.length === 1) {
      try {
        const candidate = readSafeOffering(matchingOfferings[0]);
        if (matchesStoredOffering(candidate, command)) {
          stored = candidate;
        }
      } catch {
        stored = null;
      }
    }
    if (stored === null) {
      await ctx.db.insert("walletCommandReplayClaims", {
        replayIdentity: command.replayIdentity,
        commandType: command.type,
        outcome: "IDEMPOTENCY_CONFLICT" as const,
        claimedAt: command.durableNow,
      });
      return { status: "IDEMPOTENCY_CONFLICT" as const };
    }
    await ctx.db.insert("walletCommandReplayClaims", {
      replayIdentity: command.replayIdentity,
      commandType: command.type,
      outcome: "IDEMPOTENCY_REPLAYED" as const,
      targetId: stored.offeringId,
      claimedAt: command.durableNow,
    });
    return {
      status: "IDEMPOTENCY_REPLAYED" as const,
      targetId: stored.offeringId,
      state: "DRAFT" as const,
    };
  },
});

export const markAssetPending = internalMutation({
  args: {
    offeringId: v.id("offerings"),
    attemptId: v.id("externalPrepareCommandAttempts"),
  },
  returns: v.object({
    offeringId: v.id("offerings"),
    state: v.literal("ASSET_PENDING"),
  }),
  handler: async (ctx, args) => {
    const offeringId = opaqueId<"offerings">(args.offeringId);
    const attemptId = opaqueId<"externalPrepareCommandAttempts">(args.attemptId);
    const offering = await ctx.db.get(offeringId);
    const attempt = await ctx.db.get(attemptId);
    const storedOffering = readSafeOffering(offering);
    const storedAttempt = readSafePreparedAtsCreateAttempt(attempt);
    if (
      storedOffering.offeringId !== offeringId
      || storedOffering.state !== "DRAFT"
      || storedAttempt.attemptId !== attemptId
      || storedAttempt.subjectPublicId !== storedOffering.subjectPublicId
    ) {
      return reject();
    }
    const existingLinks = await ctx.db.query("offerings")
      .withIndex("by_ats_attempt_id", (query) => query.eq("atsAttemptId", attemptId))
      .take(2);
    if (existingLinks.length !== 0) {
      return reject();
    }
    await ctx.db.patch(offeringId, {
      state: "ASSET_PENDING" as const,
      atsAttemptId: attemptId,
      updatedAt: durableNow(),
    });
    return { offeringId, state: "ASSET_PENDING" as const };
  },
});

export const markAssetReady = internalMutation({
  args: {
    attemptId: v.id("externalPrepareCommandAttempts"),
    atsAssetEvmAddress: v.string(),
  },
  returns: v.object({
    offeringId: v.id("offerings"),
    state: v.literal("READY"),
  }),
  handler: async (ctx, args) => {
    const attemptId = opaqueId<"externalPrepareCommandAttempts">(args.attemptId);
    if (!isCanonicalEvmAddress(args.atsAssetEvmAddress)) {
      return reject();
    }
    const candidates = await ctx.db.query("offerings")
      .withIndex("by_ats_attempt_id", (query) => query.eq("atsAttemptId", attemptId))
      .take(2);
    if (candidates.length !== 1) {
      return reject();
    }
    const offering = readSafeOffering(candidates[0]);
    if (
      offering.state !== "ASSET_PENDING"
      || offering.atsAttemptId !== attemptId
      || offering.atsAssetEvmAddress !== undefined
    ) {
      return reject();
    }
    await ctx.db.patch(offering.offeringId, {
      state: "READY" as const,
      atsAssetEvmAddress: args.atsAssetEvmAddress,
      updatedAt: durableNow(),
    });
    return { offeringId: offering.offeringId, state: "READY" as const };
  },
});

export const getPublicProjection = publicQuery({
  args: { offeringPublicId: v.string() },
  returns: v.union(v.null(), projectionValidator),
  handler: async (ctx, args) => {
    if (!publicIdPattern.test(args.offeringPublicId)) {
      return reject();
    }
    const candidates = await ctx.db.query("offerings")
      .withIndex("by_offering_public_id_and_version", (query) => (
        query.eq("offeringPublicId", args.offeringPublicId)
      ))
      .order("desc")
      .take(2);
    if (candidates.length === 0) {
      return null;
    }
    const safeCandidates = candidates.map(readSafeOffering);
    const highest = safeCandidates[0];
    if (
      highest === undefined
      || highest.offeringPublicId !== args.offeringPublicId
      || (safeCandidates[1] !== undefined
        && (safeCandidates[1].offeringPublicId !== args.offeringPublicId
          || safeCandidates[1].version >= highest.version))
    ) {
      return reject();
    }
    return {
      offeringPublicId: highest.offeringPublicId,
      version: highest.version,
      subjectPublicId: highest.subjectPublicId,
      state: highest.state,
      definition: highest.definition,
      narrative: highest.narrative,
      advertisedQuickPriceTinybars: highest.advertisedQuickPriceTinybars,
      advertisedStandardPriceTinybars: highest.advertisedStandardPriceTinybars,
      canonicalSignerAddress: highest.canonicalSignerAddress,
      ...(highest.atsAssetEvmAddress === undefined
        ? {}
        : { atsAssetEvmAddress: highest.atsAssetEvmAddress }),
      acceptedAt: highest.acceptedAt,
      updatedAt: highest.updatedAt,
    };
  },
});
