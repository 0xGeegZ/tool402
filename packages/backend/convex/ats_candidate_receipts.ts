import {
  type GenericMutationCtx,
  internalMutationGeneric,
  internalQueryGeneric,
} from "convex/server";
import type {
  DataModelFromSchemaDefinition,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";
import {
  v,
  type GenericId,
} from "convex/values";
import {
  parseExternalPreparePayload,
  parseHederaTransactionId,
  type ExternalOperationKind,
} from "@tool402/core";
import {
  isCanonicalEvmAddress,
  isInt64,
  readStoredRecord,
} from "../src/offering-command-admission.ts";
import {
  readAtsCreateReplayOffering,
  readSelectedAtsCreateCorroborationOffering,
} from "./offerings.ts";
import {
  isSelectedProviderToolSubject,
  resolveSelectedProviderToolSubject,
} from "./provider_tool_authority.ts";
import { claimAtsReceiptBinding } from "./provider_tool_receipts.ts";
import { createProviderToolAtsConfiguration } from "../src/ats/provider-tool-ats-configuration.ts";
import { createProviderToolReceiptExpectation } from "../src/ats/provider-tool-receipt-expectation.ts";
import { verifyProviderToolReceipt } from "../src/ats/provider-tool-receipt.ts";
import type schema from "./schema.ts";

type AttemptState =
  | "PREPARED"
  | "SUBMITTED"
  | "CONFIRMED"
  | "OUTCOME_UNKNOWN"
  | "REJECTED";

type Attachment = {
  readonly attemptPublicId: string;
  readonly operationKind: ExternalOperationKind;
  readonly candidateTransactionId: string;
  readonly candidateEvmAddress?: string;
  readonly canonicalSignerAddress: string;
  readonly principalPublicId: string;
  readonly role: "ISSUER" | "BACKER";
  readonly authorityVersion: string;
  readonly replayIdentity: string;
};

type StoredAttempt = {
  readonly attemptId: GenericId<"externalPrepareCommandAttempts">;
  readonly canonicalSignerAddress: string;
  readonly principalPublicId: string;
  readonly role: "ISSUER" | "BACKER";
  readonly authorityVersion: string;
  readonly operationKind: ExternalOperationKind;
  readonly subjectPublicId: string;
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly expectedTarget: string;
  readonly canonicalParametersHash: string;
  readonly idempotencyKey: string;
  readonly state: AttemptState;
  readonly candidateTransactionId?: string;
  readonly candidateEvmAddress?: string;
  readonly verifiedEvmTransactionHash?: string;
};

const operationKinds: readonly ExternalOperationKind[] = [
  "ATS_CREATE",
  "ATS_CONTROL_LIST",
  "ATS_ISSUE",
  "ATS_TRANSFER",
  "ATS_COUPON",
  "HEDERA_FUNDING",
];
const attemptStates: readonly AttemptState[] = [
  "PREPARED",
  "SUBMITTED",
  "CONFIRMED",
  "OUTCOME_UNKNOWN",
  "REJECTED",
];
const attachmentFields = [
  "attemptPublicId",
  "operationKind",
  "candidateTransactionId",
  "canonicalSignerAddress",
  "principalPublicId",
  "role",
  "authorityVersion",
  "replayIdentity",
] as const;
const attemptFields = [
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
const attemptOptionalFields = [
  "candidateTransactionId",
  "candidateEvmAddress",
  "verifiedEvmTransactionHash",
  "nextReconciliationAt",
] as const;
const canonicalIdPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const canonicalSignerPattern = /^0x[0-9a-f]{40}$/u;
const transactionHashPattern = /^0x[0-9a-f]{64}$/u;
const mirrorTransactionIdPattern =
  /^0\.0\.(?:0|[1-9][0-9]*)-(?:0|[1-9][0-9]*)-[0-9]{9}$/u;
const reconciliationInterval = 60_000n;
const maximumInt64 = 9_223_372_036_854_775_807n;

const operationKindValidator = v.union(
  v.literal("ATS_CREATE"),
  v.literal("ATS_CONTROL_LIST"),
  v.literal("ATS_ISSUE"),
  v.literal("ATS_TRANSFER"),
  v.literal("ATS_COUPON"),
  v.literal("HEDERA_FUNDING"),
);
const attemptStateValidator = v.union(
  v.literal("PREPARED"),
  v.literal("SUBMITTED"),
  v.literal("CONFIRMED"),
  v.literal("OUTCOME_UNKNOWN"),
  v.literal("REJECTED"),
);

const internalMutation: MutationBuilder<
  DataModelFromSchemaDefinition<typeof schema>,
  "internal"
> = internalMutationGeneric;
const internalQuery: QueryBuilder<
  DataModelFromSchemaDefinition<typeof schema>,
  "internal"
> = internalQueryGeneric;

function reject(): never {
  throw new RangeError("ATS candidate receipt is not eligible for this attempt");
}

function freezeNullPrototypeRecord<T extends object>(values: T): Readonly<T> {
  const record = Object.create(null) as T;
  Object.defineProperties(record, Object.getOwnPropertyDescriptors(values));
  return Object.freeze(record);
}

function captureAttachment(input: unknown): Readonly<Record<string, unknown>> {
  try {
    if (
      input === null
      || typeof input !== "object"
      || Object.getPrototypeOf(input) !== Object.prototype
    ) {
      return reject();
    }
    const allowed = new Set([...attachmentFields, "candidateEvmAddress"]);
    const keys = Reflect.ownKeys(input);
    if (
      keys.some((key) => typeof key !== "string" || !allowed.has(key))
      || attachmentFields.some((field) => !keys.includes(field))
    ) {
      return reject();
    }
    const captured = Object.create(null) as Record<string, unknown>;
    for (const key of keys) {
      if (typeof key !== "string") return reject();
      const descriptor = Reflect.getOwnPropertyDescriptor(input, key);
      if (
        descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.hasOwn(descriptor, "value")
        || Object.hasOwn(descriptor, "get")
        || Object.hasOwn(descriptor, "set")
      ) {
        return reject();
      }
      Object.defineProperty(captured, key, {
        configurable: false,
        enumerable: true,
        value: descriptor.value,
        writable: false,
      });
    }
    return Object.freeze(captured);
  } catch {
    return reject();
  }
}

function isOperationKind(value: unknown): value is ExternalOperationKind {
  return typeof value === "string"
    && operationKinds.includes(value as ExternalOperationKind);
}

function isAttemptState(value: unknown): value is AttemptState {
  return typeof value === "string"
    && attemptStates.includes(value as AttemptState);
}

function isCandidateTransactionId(value: unknown): value is string {
  return typeof value === "string"
    && (
      parseHederaTransactionId(value) !== undefined
      || mirrorTransactionIdPattern.test(value)
    );
}

function bindAttachment(input: unknown): Attachment {
  const record = captureAttachment(input);
  const {
    attemptPublicId,
    operationKind,
    candidateTransactionId,
    candidateEvmAddress,
    canonicalSignerAddress,
    principalPublicId,
    role,
    authorityVersion,
    replayIdentity,
  } = record;
  if (
    typeof attemptPublicId !== "string"
    || !canonicalIdPattern.test(attemptPublicId)
    || !isOperationKind(operationKind)
    || !isCandidateTransactionId(candidateTransactionId)
    || typeof canonicalSignerAddress !== "string"
    || !canonicalSignerPattern.test(canonicalSignerAddress)
    || typeof principalPublicId !== "string"
    || principalPublicId.length === 0
    || (role !== "ISSUER" && role !== "BACKER")
    || typeof authorityVersion !== "string"
    || authorityVersion.length === 0
    || typeof replayIdentity !== "string"
  ) {
    return reject();
  }
  const replayPrefix = `tool402:wallet-command:v1:296:${canonicalSignerAddress}:`;
  const nonce = replayIdentity.slice(replayPrefix.length);
  const hasCandidateEvmAddress = Object.hasOwn(record, "candidateEvmAddress");
  if (
    !replayIdentity.startsWith(replayPrefix)
    || !canonicalIdPattern.test(nonce)
    || (operationKind === "ATS_CREATE"
      ? !hasCandidateEvmAddress || !isCanonicalEvmAddress(candidateEvmAddress)
      : hasCandidateEvmAddress)
  ) {
    return reject();
  }
  return freezeNullPrototypeRecord<Attachment>({
    attemptPublicId,
    operationKind,
    candidateTransactionId,
    ...(typeof candidateEvmAddress === "string" ? { candidateEvmAddress } : {}),
    canonicalSignerAddress,
    principalPublicId,
    role,
    authorityVersion,
    replayIdentity,
  });
}

function readAttempt(input: unknown): StoredAttempt {
  try {
    const record = readStoredRecord(
      input,
      attemptFields,
      attemptOptionalFields,
    );
    const payload = parseExternalPreparePayload({
      operationKind: record.operationKind,
      subjectPublicId: record.subjectPublicId,
      network: record.network,
      chainId: record.chainId,
      expectedTarget: record.expectedTarget,
      canonicalParametersHash: record.canonicalParametersHash,
      idempotencyKey: record.idempotencyKey,
      expiresAt: record.expiresAt,
    });
    const hasCandidateTransactionId = Object.hasOwn(
      record,
      "candidateTransactionId",
    );
    const hasCandidateEvmAddress = Object.hasOwn(record, "candidateEvmAddress");
    const hasNextReconciliationAt = Object.hasOwn(
      record,
      "nextReconciliationAt",
    );
    const hasVerifiedEvmTransactionHash = Object.hasOwn(record, "verifiedEvmTransactionHash");
    const state = record.state;
    const candidateTransactionId = hasCandidateTransactionId
      ? record.candidateTransactionId
      : undefined;
    const candidateEvmAddress = hasCandidateEvmAddress
      ? record.candidateEvmAddress
      : undefined;
    const nextReconciliationAt = hasNextReconciliationAt
      ? record.nextReconciliationAt
      : undefined;
    const verifiedEvmTransactionHash = hasVerifiedEvmTransactionHash
      ? record.verifiedEvmTransactionHash
      : undefined;
    if (
      record.version !== 1
      || record.type !== "external.prepare"
      || typeof record._id !== "string"
      || record._id.length === 0
      || typeof record.canonicalSignerAddress !== "string"
      || !canonicalSignerPattern.test(record.canonicalSignerAddress)
      || typeof record.principalPublicId !== "string"
      || record.principalPublicId.length === 0
      || (record.role !== "ISSUER" && record.role !== "BACKER")
      || typeof record.authorityVersion !== "string"
      || record.authorityVersion.length === 0
      || typeof record.payloadHash !== "string"
      || !/^0x[0-9a-f]{64}$/u.test(record.payloadHash)
      || !isAttemptState(state)
      || !isInt64(record.acceptedAt)
      || (candidateTransactionId !== undefined
        && !isCandidateTransactionId(candidateTransactionId))
      || (candidateEvmAddress !== undefined
        && !isCanonicalEvmAddress(candidateEvmAddress))
      || (nextReconciliationAt !== undefined
        && !isInt64(nextReconciliationAt))
      || (verifiedEvmTransactionHash !== undefined
        && (typeof verifiedEvmTransactionHash !== "string" || !transactionHashPattern.test(verifiedEvmTransactionHash)))
      || (state === "PREPARED"
        ? hasCandidateTransactionId
          || hasCandidateEvmAddress
          || hasVerifiedEvmTransactionHash
          || hasNextReconciliationAt
        : !hasCandidateTransactionId
          || candidateTransactionId === undefined
          || (payload.operationKind === "ATS_CREATE"
            ? !hasCandidateEvmAddress || candidateEvmAddress === undefined
            : hasCandidateEvmAddress)
          || (state === "OUTCOME_UNKNOWN"
            ? !hasNextReconciliationAt || nextReconciliationAt === undefined
            : hasNextReconciliationAt))
    ) {
      return reject();
    }
    return freezeNullPrototypeRecord<StoredAttempt>({
      attemptId: record._id as GenericId<"externalPrepareCommandAttempts">,
      canonicalSignerAddress: record.canonicalSignerAddress,
      principalPublicId: record.principalPublicId,
      role: record.role,
      authorityVersion: record.authorityVersion,
      operationKind: payload.operationKind,
      subjectPublicId: payload.subjectPublicId,
      network: payload.network,
      chainId: payload.chainId,
      expectedTarget: payload.expectedTarget,
      canonicalParametersHash: payload.canonicalParametersHash,
      idempotencyKey: payload.idempotencyKey,
      state,
      ...(candidateTransactionId === undefined ? {} : { candidateTransactionId }),
      ...(candidateEvmAddress === undefined ? {} : { candidateEvmAddress }),
      ...(verifiedEvmTransactionHash === undefined ? {} : { verifiedEvmTransactionHash }),
    });
  } catch {
    return reject();
  }
}

async function readSelectedProviderToolReceiptContext(
  ctx: GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>,
  attempt: StoredAttempt,
) {
  if (
    attempt.state !== "SUBMITTED"
    || attempt.operationKind !== "ATS_CREATE"
    || attempt.role !== "ISSUER"
    || attempt.candidateTransactionId === undefined
    || attempt.candidateEvmAddress === undefined
    || !isSelectedProviderToolSubject(attempt.subjectPublicId)
  ) return reject();
  const authorities = await ctx.db.query("commandAuthorities")
    .withIndex("by_chain_id_and_canonical_signer_address", (query) => (
      query.eq("chainId", 296).eq("canonicalSignerAddress", attempt.canonicalSignerAddress)
    ))
    .take(2);
  if (authorities.length !== 1) return reject();
  const selected = await resolveSelectedProviderToolSubject(ctx, authorities[0], {
    subjectPublicId: attempt.subjectPublicId,
  });
  const offerings = await ctx.db.query("offerings")
    .withIndex("by_ats_attempt_id", (query) => query.eq("atsAttemptId", attempt.attemptId))
    .take(2);
  if (offerings.length !== 1) return reject();
  const offering = readSelectedAtsCreateCorroborationOffering(offerings[0]);
  if (
    offering === null
    || offering.atsAttemptId !== attempt.attemptId
    || offering.offeringPublicId !== selected.offeringPublicId
    || offering.subjectPublicId !== selected.subjectPublicId
    || offering.canonicalSignerAddress !== attempt.canonicalSignerAddress
    || offering.principalPublicId !== attempt.principalPublicId
    || offering.authorityVersion !== attempt.authorityVersion
  ) return reject();
  const configuration = createProviderToolAtsConfiguration({
    toolPublicId: selected.subjectPublicId,
    subjectPublicId: offering.subjectPublicId,
    title: offering.title,
    canonicalSignerAddress: offering.canonicalSignerAddress,
  });
  if (
    configuration.canonicalParametersHash !== attempt.canonicalParametersHash
    || configuration.atsCreateConfiguration.expectedTarget !== attempt.expectedTarget
  ) return reject();
  return Object.freeze({ offering, configuration });
}

function revalidateReplayClaim(
  input: unknown,
  replayIdentity: string,
): "offering.create" | "directory.publish" | "external.attachCandidate" {
  try {
    const record = readStoredRecord(
      input,
      ["replayIdentity", "commandType", "outcome", "claimedAt"],
      ["targetId"],
    );
    const linked = record.outcome === "NEW"
      || record.outcome === "IDEMPOTENCY_REPLAYED";
    const hasTargetId = Object.hasOwn(record, "targetId");
    if (
      record.replayIdentity !== replayIdentity
      || (record.commandType !== "offering.create"
        && record.commandType !== "directory.publish"
        && record.commandType !== "external.attachCandidate")
      || (!linked && record.outcome !== "IDEMPOTENCY_CONFLICT")
      || !isInt64(record.claimedAt)
      || record.claimedAt === 0n
      || (linked
        ? !hasTargetId
          || typeof record.targetId !== "string"
          || record.targetId.length === 0
        : hasTargetId)
    ) {
      return reject();
    }
    return record.commandType;
  } catch {
    return reject();
  }
}

function durableNow(): bigint {
  const now = Date.now();
  if (!Number.isSafeInteger(now) || now < 0) return reject();
  return BigInt(now);
}

function readCorroborationTransactionHash(input: unknown): string | null {
  try {
    if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
    const descriptor = Reflect.getOwnPropertyDescriptor(input, "hash");
    if (
      descriptor === undefined
      || descriptor.enumerable !== true
      || !Object.hasOwn(descriptor, "value")
      || Object.hasOwn(descriptor, "get")
      || Object.hasOwn(descriptor, "set")
      || typeof descriptor.value !== "string"
      || !transactionHashPattern.test(descriptor.value)
    ) return null;
    return descriptor.value;
  } catch {
    return null;
  }
}

function matchesAttachmentAttempt(attempt: StoredAttempt, attachment: Attachment): boolean {
  return attempt.idempotencyKey === attachment.attemptPublicId
    && attempt.canonicalSignerAddress === attachment.canonicalSignerAddress
    && attempt.principalPublicId === attachment.principalPublicId
    && attempt.role === attachment.role
    && attempt.authorityVersion === attachment.authorityVersion
    && attempt.operationKind === attachment.operationKind
    && attempt.chainId === 296
    && attempt.network === "hedera:testnet";
}

async function readLinkedPendingAtsCreateOffering(
  ctx: GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>,
  attempt: StoredAttempt,
  attachment: Attachment,
  required = true,
) {
  if (attachment.operationKind !== "ATS_CREATE") return null;
  const offerings = await ctx.db.query("offerings")
    .withIndex("by_ats_attempt_id", (query) => query.eq("atsAttemptId", attempt.attemptId))
    .take(2);
  if (offerings.length !== 1) return required ? reject() : null;
  const offering = readAtsCreateReplayOffering(offerings[0]);
  if (
    offering === null
    || offering.atsAttemptId !== attempt.attemptId
    || offering.subjectPublicId !== attempt.subjectPublicId
    || offering.canonicalSignerAddress !== attachment.canonicalSignerAddress
    || offering.principalPublicId !== attachment.principalPublicId
    || offering.authorityVersion !== attachment.authorityVersion
  ) {
    return required ? reject() : null;
  }
  return offering;
}

async function claimLegacyAtsReceiptBinding(
  ctx: GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>,
  offering: NonNullable<Awaited<ReturnType<typeof readLinkedPendingAtsCreateOffering>>>,
  attempt: StoredAttempt,
  attachment: Attachment,
): Promise<void> {
  if (
    attachment.candidateEvmAddress === undefined
    || isSelectedProviderToolSubject(offering.subjectPublicId)
  ) return;
  await claimAtsReceiptBinding(ctx, {
    offeringId: offering.offeringId,
    offeringPublicId: offering.offeringPublicId ?? offering.offeringId,
    attemptId: attempt.attemptId,
    candidateTransactionId: attachment.candidateTransactionId,
    assetEvmAddress: attachment.candidateEvmAddress,
  });
}

export const attachAtsCandidateReceipt = internalMutation({
  args: {
    attemptPublicId: v.string(),
    operationKind: operationKindValidator,
    candidateTransactionId: v.string(),
    candidateEvmAddress: v.optional(v.string()),
    canonicalSignerAddress: v.string(),
    principalPublicId: v.string(),
    role: v.union(v.literal("ISSUER"), v.literal("BACKER")),
    authorityVersion: v.string(),
    replayIdentity: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.literal("ATTACHED"),
      attemptId: v.id("externalPrepareCommandAttempts"),
      state: v.literal("SUBMITTED"),
    }),
    v.object({
      status: v.literal("ALREADY_ATTACHED"),
      attemptId: v.id("externalPrepareCommandAttempts"),
      state: v.literal("SUBMITTED"),
    }),
    v.object({ status: v.literal("COMMAND_REPLAYED") }),
  ),
  handler: async (ctx, args) => {
    const attachment = bindAttachment(args);
    const claims = await ctx.db.query("walletCommandReplayClaims")
      .withIndex("by_replay_identity", (query) => (
        query.eq("replayIdentity", attachment.replayIdentity)
      ))
      .take(2);
    if (claims.length > 1) return reject();
    if (claims.length === 1) {
      const commandType = revalidateReplayClaim(claims[0], attachment.replayIdentity);
      if (commandType === "external.attachCandidate" && attachment.operationKind === "ATS_CREATE") {
        const attempts = await ctx.db.query("externalPrepareCommandAttempts")
          .withIndex("by_idempotency_key", (query) => (
            query.eq("idempotencyKey", attachment.attemptPublicId)
          ))
          .take(2);
        if (attempts.length !== 1) return reject();
        const attempt = readAttempt(attempts[0]);
        if (
          matchesAttachmentAttempt(attempt, attachment)
          && attempt.state === "SUBMITTED"
          && attempt.candidateTransactionId === attachment.candidateTransactionId
          && attempt.candidateEvmAddress === attachment.candidateEvmAddress
        ) {
          const offering = await readLinkedPendingAtsCreateOffering(ctx, attempt, attachment, false);
          if (offering === null) return reject();
          if (!isSelectedProviderToolSubject(offering.subjectPublicId)) {
            await claimLegacyAtsReceiptBinding(ctx, offering, attempt, attachment);
            await ctx.db.patch(offering.offeringId, {
              state: "READY",
              atsAssetEvmAddress: attachment.candidateEvmAddress,
              updatedAt: durableNow(),
            });
          }
          return {
            status: "ATTACHED" as const,
            attemptId: attempt.attemptId,
            state: "SUBMITTED" as const,
          };
        }
      }
      return { status: "COMMAND_REPLAYED" as const };
    }

    const attempts = await ctx.db.query("externalPrepareCommandAttempts")
      .withIndex("by_idempotency_key", (query) => (
        query.eq("idempotencyKey", attachment.attemptPublicId)
      ))
      .take(2);
    if (attempts.length !== 1) return reject();
    const attempt = readAttempt(attempts[0]);
    if (!matchesAttachmentAttempt(attempt, attachment)) {
      return reject();
    }
    if (attempt.state === "SUBMITTED") {
      if (
        attempt.candidateTransactionId !== attachment.candidateTransactionId
        || attempt.candidateEvmAddress !== attachment.candidateEvmAddress
      ) {
        return reject();
      }
      const offering = await readLinkedPendingAtsCreateOffering(ctx, attempt, attachment, false);
      if (offering !== null && !isSelectedProviderToolSubject(offering.subjectPublicId)) {
        await claimLegacyAtsReceiptBinding(ctx, offering, attempt, attachment);
        await ctx.db.patch(offering.offeringId, {
          state: "READY",
          atsAssetEvmAddress: attachment.candidateEvmAddress,
          updatedAt: durableNow(),
        });
        return {
          status: "ATTACHED" as const,
          attemptId: attempt.attemptId,
          state: "SUBMITTED" as const,
        };
      }
      return {
        status: "ALREADY_ATTACHED" as const,
        attemptId: attempt.attemptId,
        state: "SUBMITTED" as const,
      };
    }
    if (attempt.state !== "PREPARED") return reject();

    const offering = await readLinkedPendingAtsCreateOffering(ctx, attempt, attachment);

    await ctx.db.insert("walletCommandReplayClaims", {
      replayIdentity: attachment.replayIdentity,
      commandType: "external.attachCandidate",
      outcome: "NEW",
      targetId: attempt.attemptId,
      claimedAt: durableNow(),
    });
    await ctx.db.patch(attempt.attemptId, {
      state: "SUBMITTED",
      candidateTransactionId: attachment.candidateTransactionId,
      ...(attachment.candidateEvmAddress === undefined
        ? {}
        : { candidateEvmAddress: attachment.candidateEvmAddress }),
    });
    if (offering !== null && !isSelectedProviderToolSubject(offering.subjectPublicId)) {
      await claimLegacyAtsReceiptBinding(ctx, offering, attempt, attachment);
      await ctx.db.patch(offering.offeringId, {
        state: "READY",
        atsAssetEvmAddress: attachment.candidateEvmAddress,
        updatedAt: durableNow(),
      });
    }
    return {
      status: "ATTACHED" as const,
      attemptId: attempt.attemptId,
      state: "SUBMITTED" as const,
    };
  },
});

export const readAtsCandidateVerificationContext = internalQuery({
  args: { attemptId: v.id("externalPrepareCommandAttempts") },
  returns: v.union(v.null(), v.object({
    attemptId: v.id("externalPrepareCommandAttempts"),
    state: attemptStateValidator,
    operationKind: operationKindValidator,
    network: v.literal("hedera:testnet"),
    chainId: v.literal(296),
    expectedTarget: v.string(),
    candidateTransactionId: v.optional(v.string()),
    candidateEvmAddress: v.optional(v.string()),
    selectedProviderTool: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.attemptId);
    if (row === null) return null;
    const attempt = readAttempt(row);
    if (attempt.attemptId !== args.attemptId) return reject();
    return {
      attemptId: attempt.attemptId,
      state: attempt.state,
      operationKind: attempt.operationKind,
      network: attempt.network,
      chainId: attempt.chainId,
      expectedTarget: attempt.expectedTarget,
      ...(attempt.candidateTransactionId === undefined
        ? {}
        : { candidateTransactionId: attempt.candidateTransactionId }),
      ...(attempt.candidateEvmAddress === undefined
        ? {}
        : { candidateEvmAddress: attempt.candidateEvmAddress }),
      selectedProviderTool: isSelectedProviderToolSubject(attempt.subjectPublicId),
    };
  },
});

/**
 * Attach a selected tool's ATS asset only after a trusted caller supplies
 * receipt documents matching the durable, server-rederived Factory calldata.
 * This mutation intentionally performs no RPC work; the pinned internal reader
 * supplies documents, while unavailable or malformed evidence leaves the offering pending.
 */
export const corroborateSelectedProviderToolAtsReceipt = internalMutation({
  args: {
    attemptId: v.id("externalPrepareCommandAttempts"),
    transaction: v.any(),
    receipt: v.any(),
  },
  returns: v.union(
    v.object({ status: v.literal("CONFIRMED"), state: v.literal("READY") }),
    v.object({ status: v.literal("ALREADY_CONFIRMED"), state: v.literal("READY") }),
    v.object({ status: v.literal("REJECTED"), state: v.literal("ASSET_PENDING") }),
    v.object({ status: v.literal("OUTCOME_UNKNOWN"), state: v.literal("ASSET_PENDING") }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.attemptId);
    if (row === null) return reject();
    const attempt = readAttempt(row);
    if (attempt.attemptId !== args.attemptId) return reject();
    const context = await readSelectedProviderToolReceiptContext(ctx, attempt);
    const observedTransactionHash = readCorroborationTransactionHash(args.transaction);
    if (observedTransactionHash === null) {
      return { status: "OUTCOME_UNKNOWN" as const, state: "ASSET_PENDING" as const };
    }
    if (
      attempt.verifiedEvmTransactionHash !== undefined
      && attempt.verifiedEvmTransactionHash !== observedTransactionHash
    ) return reject();
    const transactionHash = attempt.verifiedEvmTransactionHash ?? observedTransactionHash;
    const verification = verifyProviderToolReceipt({
      expected: createProviderToolReceiptExpectation({
        configuration: context.configuration.atsCreateConfiguration,
        transactionHash,
        asset: attempt.candidateEvmAddress as string,
      }),
      transaction: args.transaction,
      receipt: args.receipt,
    });
    if (verification.outcome === "UNKNOWN") {
      return { status: "OUTCOME_UNKNOWN" as const, state: "ASSET_PENDING" as const };
    }
    if (verification.outcome === "REJECTED") {
      return { status: "REJECTED" as const, state: "ASSET_PENDING" as const };
    }
    if (context.offering.state === "READY") {
      if (context.offering.atsAssetEvmAddress !== verification.asset) return reject();
      await claimAtsReceiptBinding(ctx, {
        offeringId: context.offering.offeringId,
        offeringPublicId: context.offering.offeringPublicId,
        attemptId: attempt.attemptId,
        candidateTransactionId: attempt.candidateTransactionId as string,
        evmTransactionHash: verification.transactionHash,
        assetEvmAddress: verification.asset,
      });
      if (attempt.verifiedEvmTransactionHash === undefined) {
        await ctx.db.patch(attempt.attemptId, {
          verifiedEvmTransactionHash: verification.transactionHash,
        });
      }
      return { status: "ALREADY_CONFIRMED" as const, state: "READY" as const };
    }
    await claimAtsReceiptBinding(ctx, {
      offeringId: context.offering.offeringId,
      offeringPublicId: context.offering.offeringPublicId,
      attemptId: attempt.attemptId,
      candidateTransactionId: attempt.candidateTransactionId as string,
      evmTransactionHash: verification.transactionHash,
      assetEvmAddress: verification.asset,
    });
    await ctx.db.patch(attempt.attemptId, {
      verifiedEvmTransactionHash: verification.transactionHash,
    });
    await ctx.db.patch(context.offering.offeringId, {
      state: "READY",
      atsAssetEvmAddress: verification.asset,
      updatedAt: durableNow(),
    });
    return { status: "CONFIRMED" as const, state: "READY" as const };
  },
});

export const recordAtsCandidateOutcome = internalMutation({
  args: {
    attemptId: v.id("externalPrepareCommandAttempts"),
    outcome: v.union(
      v.literal("CONFIRMED"),
      v.literal("OUTCOME_UNKNOWN"),
      v.literal("REJECTED"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (
      args.outcome !== "CONFIRMED"
      && args.outcome !== "OUTCOME_UNKNOWN"
      && args.outcome !== "REJECTED"
    ) {
      return reject();
    }
    const row = await ctx.db.get(args.attemptId);
    if (row === null) return reject();
    const attempt = readAttempt(row);
    if (attempt.attemptId !== args.attemptId || attempt.state !== "SUBMITTED") {
      return reject();
    }
    if (args.outcome === "OUTCOME_UNKNOWN") {
      const now = durableNow();
      if (now > maximumInt64 - reconciliationInterval) return reject();
      await ctx.db.patch(attempt.attemptId, {
        state: args.outcome,
        nextReconciliationAt: now + reconciliationInterval,
      });
    } else {
      await ctx.db.patch(attempt.attemptId, { state: args.outcome });
    }
    return null;
  },
});
