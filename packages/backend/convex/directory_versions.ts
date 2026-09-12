import {
  internalMutationGeneric,
  queryGeneric,
  type DataModelFromSchemaDefinition,
  type GenericMutationCtx,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import { v, type GenericId } from "convex/values";
import {
  parseAgentDirectoryRecordCandidate,
  parseDirectoryPublishPayload,
  parseOfferingCreatePayload,
} from "@tool402/core";
import {
  bindOfferingCommand,
  isCanonicalEvmAddress,
  isInt64,
  readStoredRecord,
  revalidateOfferingAuthority,
  revalidateWalletCommandReplayClaim,
} from "../src/offering-command-admission.ts";
import {
  isSelectedProviderToolSubject,
  resolveSelectedProviderToolSubject,
} from "./provider_tool_authority.ts";
import type { DirectoryCommandBinding } from "../src/offering-command-admission.ts";
import type schema from "./schema.ts";

const directoryRecordValidator = v.object({
  schemaVersion: v.literal(1),
  serviceId: v.string(),
  serviceSlug: v.string(),
  offeringPublicId: v.string(),
  offeringVersion: v.number(),
  capabilities: v.array(v.literal("evm-contract-risk-signals")),
  x402Endpoint: v.string(),
  webUrl: v.optional(v.string()),
  paymentProtocol: v.literal("x402"),
  paymentNetwork: v.literal("hedera-testnet"),
  asset: v.literal("HBAR"),
  advertisedTiers: v.array(v.union(v.literal("quick"), v.literal("standard"))),
  issuerRevenueAccount: v.string(),
  clearingAccount: v.string(),
  status: v.literal("active"),
  publishedAt: v.string(),
});
const directoryPayloadValidator = v.object({
  schemaVersion: v.literal(1),
  offeringPublicId: v.string(),
  offeringVersion: v.number(),
  directoryVersion: v.number(),
  record: directoryRecordValidator,
  idempotencyKey: v.string(),
  expiresAt: v.string(),
});
const commandValidators = {
  version: v.literal(1),
  type: v.literal("directory.publish"),
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
  payload: directoryPayloadValidator,
};

const internalMutation: MutationBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalMutationGeneric;
const query: QueryBuilder<DataModelFromSchemaDefinition<typeof schema>, "public"> = queryGeneric;

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
const directoryFields = [
  "offeringPublicId",
  "payloadHash",
  "canonicalSignerAddress",
  "idempotencyKey",
  "offeringVersion",
  "directoryVersion",
  "serviceSlug",
  "record",
  "state",
  "acceptedAt",
] as const;

type OfferingId = GenericId<"offerings">;
type DirectoryId = GenericId<"directoryVersions">;
type OfferingState = "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";
type DirectoryState = "DRAFT" | "PUBLISH_PREPARED" | "ACTIVE" | "SUPERSEDED";

interface StoredOffering {
  readonly id: OfferingId;
  readonly offeringPublicId: string;
  readonly subjectPublicId: string;
  readonly canonicalSignerAddress: string;
  readonly principalPublicId: string;
  readonly authorityVersion: string;
  readonly version: number;
  readonly state: OfferingState;
  readonly atsAttemptId: unknown;
  readonly atsAssetEvmAddress: unknown;
  readonly activeDirectoryVersionId: unknown;
}

interface StoredDirectory {
  readonly id: DirectoryId;
  readonly offeringPublicId: string;
  readonly payloadHash: string;
  readonly canonicalSignerAddress: string;
  readonly idempotencyKey: string;
  readonly offeringVersion: number;
  readonly directoryVersion: number;
  readonly serviceSlug: string;
  readonly record: ReturnType<typeof parseAgentDirectoryRecordCandidate>;
  readonly state: DirectoryState;
  readonly acceptedAt: bigint;
}

function reject(): never {
  throw new TypeError("invalid durable directory record");
}

function isDocumentId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isCanonicalHash(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value);
}

function isOfferingState(value: unknown): value is OfferingState {
  return value === "DRAFT" || value === "ASSET_PENDING" || value === "READY"
    || value === "OPEN" || value === "CLOSED";
}

function isDirectoryState(value: unknown): value is DirectoryState {
  return value === "DRAFT" || value === "PUBLISH_PREPARED" || value === "ACTIVE"
    || value === "SUPERSEDED";
}

function readOffering(input: unknown): StoredOffering {
  const record = readStoredRecord(input, offeringFields, offeringOptionalFields);
  const offeringPayload = parseOfferingCreatePayload({
    schemaVersion: 1,
    offeringPublicId: record.offeringPublicId,
    offeringVersion: record.version,
    subjectPublicId: record.subjectPublicId,
    definition: record.definition,
    narrative: record.narrative,
    advertisedQuickPriceTinybars: record.advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars: record.advertisedStandardPriceTinybars,
    idempotencyKey: record.idempotencyKey,
    expiresAt: "2026-01-01T00:00:00.000Z",
  });
  if (
    !isDocumentId(record._id)
    || !isCanonicalEvmAddress(record.canonicalSignerAddress)
    || typeof record.principalPublicId !== "string" || record.principalPublicId.length === 0
    || typeof record.authorityVersion !== "string" || record.authorityVersion.length === 0
    || !isCanonicalHash(record.payloadHash)
    || !isInt64(record.acceptedAt) || !isInt64(record.updatedAt)
    || !isOfferingState(record.state)
  ) return reject();

  return Object.freeze({
    id: record._id as OfferingId,
    offeringPublicId: offeringPayload.offeringPublicId,
    subjectPublicId: offeringPayload.subjectPublicId,
    canonicalSignerAddress: record.canonicalSignerAddress,
    principalPublicId: record.principalPublicId,
    authorityVersion: record.authorityVersion,
    version: offeringPayload.offeringVersion,
    state: record.state,
    atsAttemptId: record.atsAttemptId,
    atsAssetEvmAddress: record.atsAssetEvmAddress,
    activeDirectoryVersionId: record.activeDirectoryVersionId,
  });
}

function readDirectory(input: unknown): StoredDirectory {
  const record = readStoredRecord(input, directoryFields);
  const payload = parseDirectoryPublishPayload({
    schemaVersion: 1,
    offeringPublicId: record.offeringPublicId,
    offeringVersion: record.offeringVersion,
    directoryVersion: record.directoryVersion,
    record: record.record,
    idempotencyKey: record.idempotencyKey,
    expiresAt: "2026-01-01T00:00:00.000Z",
  });
  if (
    !isDocumentId(record._id)
    || !isCanonicalHash(record.payloadHash)
    || !isCanonicalEvmAddress(record.canonicalSignerAddress)
    || (record.serviceSlug !== "riskscan" && (typeof record.serviceSlug !== "string" || !/^tool-[0-9a-f]{32}$/u.test(record.serviceSlug)))
    || !isDirectoryState(record.state)
    || !isInt64(record.acceptedAt)
  ) return reject();

  return Object.freeze({
    id: record._id as DirectoryId,
    offeringPublicId: payload.offeringPublicId,
    payloadHash: record.payloadHash,
    canonicalSignerAddress: record.canonicalSignerAddress,
    idempotencyKey: payload.idempotencyKey,
    offeringVersion: payload.offeringVersion,
    directoryVersion: payload.directoryVersion,
    serviceSlug: record.serviceSlug as string,
    record: payload.record,
    state: record.state,
    acceptedAt: record.acceptedAt,
  });
}

function isCanonicalOfferingAssetLink(offering: StoredOffering): boolean {
  return isDocumentId(offering.atsAttemptId) && isCanonicalEvmAddress(offering.atsAssetEvmAddress);
}

function isEligibleForNewPublish(offering: StoredOffering, command: DirectoryCommandBinding): boolean {
  return offering.offeringPublicId === command.payload.offeringPublicId
    && offering.version === command.payload.offeringVersion
    && offering.state === "READY"
    && isCanonicalOfferingAssetLink(offering)
    && offering.activeDirectoryVersionId === undefined;
}

function canSeekPublishedReplay(offering: StoredOffering): boolean {
  if (offering.state !== "OPEN") return false;
  return isDocumentId(offering.atsAttemptId)
    || isDocumentId(offering.activeDirectoryVersionId)
    || (typeof offering.atsAssetEvmAddress === "string" && offering.atsAssetEvmAddress.length > 0);
}

function matchesOfferingContext(offering: StoredOffering, command: DirectoryCommandBinding): boolean {
  return offering.canonicalSignerAddress === command.canonicalSignerAddress
    && offering.principalPublicId === command.principalPublicId
    && offering.authorityVersion === command.authorityVersion;
}

function matchesDirectoryService(offering: StoredOffering, command: DirectoryCommandBinding): boolean {
  const { record } = command.payload;
  if (!isSelectedProviderToolSubject(offering.subjectPublicId)) return record.serviceSlug === "riskscan";
  const suffix = offering.subjectPublicId.slice("tool_".length);
  return record.serviceId === offering.subjectPublicId && record.serviceSlug === `tool-${suffix}`;
}

function sameDirectoryRecord(
  left: ReturnType<typeof parseAgentDirectoryRecordCandidate>,
  right: ReturnType<typeof parseAgentDirectoryRecordCandidate>,
): boolean {
  return left.schemaVersion === right.schemaVersion
    && left.serviceId === right.serviceId
    && left.serviceSlug === right.serviceSlug
    && left.offeringPublicId === right.offeringPublicId
    && left.offeringVersion === right.offeringVersion
    && left.capabilities.length === right.capabilities.length
    && left.capabilities.every((value, index) => value === right.capabilities[index])
    && left.x402Endpoint === right.x402Endpoint
    && left.webUrl === right.webUrl
    && left.paymentProtocol === right.paymentProtocol
    && left.paymentNetwork === right.paymentNetwork
    && left.asset === right.asset
    && left.advertisedTiers.length === right.advertisedTiers.length
    && left.advertisedTiers.every((value, index) => value === right.advertisedTiers[index])
    && left.issuerRevenueAccount === right.issuerRevenueAccount
    && left.clearingAccount === right.clearingAccount
    && left.status === right.status
    && left.publishedAt === right.publishedAt;
}

function matchesDirectoryCommand(directory: StoredDirectory, command: DirectoryCommandBinding): boolean {
  return directory.offeringPublicId === command.payload.offeringPublicId
    && directory.offeringVersion === command.payload.offeringVersion
    && directory.directoryVersion === command.payload.directoryVersion
    && directory.serviceSlug === command.payload.record.serviceSlug
    && directory.payloadHash === command.payloadHash
    && directory.canonicalSignerAddress === command.canonicalSignerAddress
    && directory.idempotencyKey === command.payload.idempotencyKey
    && sameDirectoryRecord(directory.record, command.payload.record);
}

function isExactPublishedReplay(
  offering: StoredOffering,
  directory: StoredDirectory,
  activeDirectory: StoredDirectory | null,
  command: DirectoryCommandBinding,
): boolean {
  return offering.state === "OPEN"
    && isCanonicalOfferingAssetLink(offering)
    && offering.activeDirectoryVersionId === directory.id
    && matchesOfferingContext(offering, command)
    && directory.state === "ACTIVE"
    && activeDirectory?.id === directory.id;
}

function isDescriptorSafeTarget(input: unknown): boolean {
  if (input === null || typeof input !== "object") return true;
  try {
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== Array.prototype) return false;
    return Reflect.ownKeys(input).every((key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, key);
      return descriptor !== undefined
        && Object.hasOwn(descriptor, "value")
        && !Object.hasOwn(descriptor, "get")
        && !Object.hasOwn(descriptor, "set");
    });
  } catch {
    return false;
  }
}

async function claimConflict(
  ctx: GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>,
  command: DirectoryCommandBinding,
): Promise<{ readonly status: "IDEMPOTENCY_CONFLICT" }> {
  await ctx.db.insert("walletCommandReplayClaims", {
    replayIdentity: command.replayIdentity,
    commandType: "directory.publish",
    outcome: "IDEMPOTENCY_CONFLICT",
    claimedAt: command.durableNow,
  });
  return { status: "IDEMPOTENCY_CONFLICT" };
}

export const admitDirectoryPublish = internalMutation({
  args: commandValidators,
  returns: v.union(
    v.object({ status: v.literal("NEW"), targetId: v.id("directoryVersions"), state: v.literal("ACTIVE") }),
    v.object({ status: v.literal("IDEMPOTENCY_REPLAYED"), targetId: v.id("directoryVersions"), state: v.literal("ACTIVE") }),
    v.object({ status: v.literal("COMMAND_REPLAYED") }),
    v.object({ status: v.literal("IDEMPOTENCY_CONFLICT") }),
    v.object({ status: v.literal("PRECONDITION_UNMET") }),
  ),
  handler: async (ctx, args) => {
    const command = bindOfferingCommand(args, "directory.publish", Date.now());
    const authorities = await ctx.db.query("commandAuthorities")
      .withIndex("by_chain_id_and_canonical_signer_address", (index) =>
        index.eq("chainId", 296).eq("canonicalSignerAddress", command.canonicalSignerAddress))
      .take(2);
    if (authorities.length !== 1) return reject();
    const ownedSubjectPublicIds = revalidateOfferingAuthority(authorities[0], command, false);

    const claims = await ctx.db.query("walletCommandReplayClaims")
      .withIndex("by_replay_identity", (index) => index.eq("replayIdentity", command.replayIdentity))
      .take(2);
    if (claims.length > 1) return reject();
    if (claims.length === 1) {
      revalidateWalletCommandReplayClaim(claims[0], command.replayIdentity, "directory.publish");
      return { status: "COMMAND_REPLAYED" as const };
    }

    const offerings = await ctx.db.query("offerings")
      .withIndex("by_offering_public_id_and_version", (index) =>
        index.eq("offeringPublicId", command.payload.offeringPublicId).eq("version", command.payload.offeringVersion))
      .take(2);
    if (offerings.length > 1) return reject();
    if (offerings.length === 0) return { status: "PRECONDITION_UNMET" as const };
    const offering = readOffering(offerings[0]);
    if (isSelectedProviderToolSubject(offering.subjectPublicId)) {
      const selected = await resolveSelectedProviderToolSubject(ctx, authorities[0], {
        subjectPublicId: offering.subjectPublicId,
        offeringPublicId: offering.offeringPublicId,
      });
      if (selected.subjectPublicId !== offering.subjectPublicId) return reject();
    } else if (!ownedSubjectPublicIds.includes(offering.subjectPublicId)) return reject();
    if (!matchesDirectoryService(offering, command)) return reject();

    const eligibleForNewPublish = isEligibleForNewPublish(offering, command);
    const eligibleForReplay = canSeekPublishedReplay(offering);
    if (!matchesOfferingContext(offering, command) && !eligibleForReplay) return reject();

    const matchingDirectories = await ctx.db.query("directoryVersions")
      .withIndex("by_offering_public_id_and_directory_version", (index) =>
        index.eq("offeringPublicId", command.payload.offeringPublicId).eq("directoryVersion", command.payload.directoryVersion))
      .take(2);
    if (matchingDirectories.length > 1) return reject();

    if (matchingDirectories.length === 1) {
      let storedDirectory: StoredDirectory;
      try {
        storedDirectory = readDirectory(matchingDirectories[0]);
      } catch {
        if (!isDescriptorSafeTarget(matchingDirectories[0])) return reject();
        return claimConflict(ctx, command);
      }
      if (
        storedDirectory.state !== "ACTIVE"
        || !matchesDirectoryCommand(storedDirectory, command)
        || !matchesOfferingContext(offering, command)
        || offering.state !== "OPEN"
      ) {
        return claimConflict(ctx, command);
      }
      const activeDirectories = await ctx.db.query("directoryVersions")
        .withIndex("by_service_slug_and_state", (index) =>
          index.eq("serviceSlug", command.payload.record.serviceSlug).eq("state", "ACTIVE"))
        .take(2);
      if (activeDirectories.length > 1) return reject();
      const activeDirectory = activeDirectories.length === 1 ? readDirectory(activeDirectories[0]) : null;
      if (activeDirectory !== null && activeDirectory.state !== "ACTIVE") return reject();
      if (!isExactPublishedReplay(offering, storedDirectory, activeDirectory, command)) {
        return claimConflict(ctx, command);
      }
      await ctx.db.insert("walletCommandReplayClaims", {
        replayIdentity: command.replayIdentity,
        commandType: "directory.publish",
        outcome: "IDEMPOTENCY_REPLAYED",
        targetId: storedDirectory.id,
        claimedAt: command.durableNow,
      });
      return {
        status: "IDEMPOTENCY_REPLAYED" as const,
        targetId: storedDirectory.id,
        state: "ACTIVE" as const,
      };
    }

    if (!matchesOfferingContext(offering, command)) return reject();
    if (!eligibleForNewPublish) {
      return { status: "PRECONDITION_UNMET" as const };
    }

    const activeDirectories = await ctx.db.query("directoryVersions")
      .withIndex("by_service_slug_and_state", (index) =>
        index.eq("serviceSlug", command.payload.record.serviceSlug).eq("state", "ACTIVE"))
      .take(2);
    if (activeDirectories.length > 1) return reject();
    const priorDirectory = activeDirectories.length === 1 ? readDirectory(activeDirectories[0]) : null;
    if (priorDirectory !== null && priorDirectory.state !== "ACTIVE") return reject();

    const directoryId = await ctx.db.insert("directoryVersions", {
      offeringPublicId: command.payload.offeringPublicId,
      payloadHash: command.payloadHash,
      canonicalSignerAddress: command.canonicalSignerAddress,
      idempotencyKey: command.payload.idempotencyKey,
      offeringVersion: command.payload.offeringVersion,
      directoryVersion: command.payload.directoryVersion,
      serviceSlug: command.payload.record.serviceSlug,
      record: {
        schemaVersion: command.payload.record.schemaVersion,
        serviceId: command.payload.record.serviceId,
        serviceSlug: command.payload.record.serviceSlug,
        offeringPublicId: command.payload.record.offeringPublicId,
        offeringVersion: command.payload.record.offeringVersion,
        capabilities: [...command.payload.record.capabilities],
        x402Endpoint: command.payload.record.x402Endpoint,
        ...(command.payload.record.webUrl === undefined ? {} : { webUrl: command.payload.record.webUrl }),
        paymentProtocol: command.payload.record.paymentProtocol,
        paymentNetwork: command.payload.record.paymentNetwork,
        asset: command.payload.record.asset,
        advertisedTiers: [...command.payload.record.advertisedTiers],
        issuerRevenueAccount: command.payload.record.issuerRevenueAccount,
        clearingAccount: command.payload.record.clearingAccount,
        status: command.payload.record.status,
        publishedAt: command.payload.record.publishedAt,
      },
      state: "ACTIVE",
      acceptedAt: command.durableNow,
    });
    if (priorDirectory !== null) {
      await ctx.db.patch(priorDirectory.id, { state: "SUPERSEDED" });
    }
    await ctx.db.patch(offering.id, {
      state: "OPEN",
      activeDirectoryVersionId: directoryId,
      updatedAt: command.durableNow,
    });
    await ctx.db.insert("walletCommandReplayClaims", {
      replayIdentity: command.replayIdentity,
      commandType: "directory.publish",
      outcome: "NEW",
      targetId: directoryId,
      claimedAt: command.durableNow,
    });
    return { status: "NEW" as const, targetId: directoryId, state: "ACTIVE" as const };
  },
});

export const getActive = query({
  args: { serviceSlug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      offeringPublicId: v.string(),
      offeringVersion: v.number(),
      directoryVersion: v.number(),
      serviceSlug: v.string(),
      record: directoryRecordValidator,
      state: v.literal("ACTIVE"),
      acceptedAt: v.int64(),
    }),
  ),
  handler: async (ctx, args) => {
    const directories = await ctx.db.query("directoryVersions")
      .withIndex("by_service_slug_and_state", (index) =>
        index.eq("serviceSlug", args.serviceSlug).eq("state", "ACTIVE"))
      .take(2);
    if (directories.length === 0) return null;
    if (directories.length !== 1) return reject();
    const directory = readDirectory(directories[0]);
    if (directory.state !== "ACTIVE") return reject();
    return {
      offeringPublicId: directory.offeringPublicId,
      offeringVersion: directory.offeringVersion,
      directoryVersion: directory.directoryVersion,
      serviceSlug: directory.serviceSlug,
      record: {
        schemaVersion: directory.record.schemaVersion,
        serviceId: directory.record.serviceId,
        serviceSlug: directory.record.serviceSlug,
        offeringPublicId: directory.record.offeringPublicId,
        offeringVersion: directory.record.offeringVersion,
        capabilities: [...directory.record.capabilities],
        x402Endpoint: directory.record.x402Endpoint,
        ...(directory.record.webUrl === undefined ? {} : { webUrl: directory.record.webUrl }),
        paymentProtocol: directory.record.paymentProtocol,
        paymentNetwork: directory.record.paymentNetwork,
        asset: directory.record.asset,
        advertisedTiers: [...directory.record.advertisedTiers],
        issuerRevenueAccount: directory.record.issuerRevenueAccount,
        clearingAccount: directory.record.clearingAccount,
        status: directory.record.status,
        publishedAt: directory.record.publishedAt,
      },
      state: "ACTIVE" as const,
      acceptedAt: directory.acceptedAt,
    };
  },
});
