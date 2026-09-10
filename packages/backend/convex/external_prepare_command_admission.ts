import { internalMutationGeneric, type DataModelFromSchemaDefinition, type MutationBuilder } from "convex/server";
import { v, type GenericId } from "convex/values";
import { parseExternalPreparePayload, type ExternalPreparePayload } from "@tool402/core";
import { keccak256, stringToHex } from "viem";
import { assertCurrentAtsPrepareAuthority } from "./ats_prepare_authority.ts";
import { assertStageBAtsCreateRuntimeBinding } from "./stage_b_ats_create_runtime_binding.ts";
import {
  linkAtsCreateAttemptToDraftOffering,
  readAtsCreateReplayOffering,
} from "./offerings.ts";
import type schema from "./schema.ts";

const contextValidators = {
  version: v.literal(1),
  type: v.literal("external.prepare"),
  chainId: v.literal(296),
  canonicalSignerAddress: v.string(),
  principalPublicId: v.string(),
  role: v.union(v.literal("ISSUER"), v.literal("BACKER")),
  authorityVersion: v.string(),
  payloadHash: v.string(),
};
const payloadFields = {
  operationKind: v.union(
    v.literal("ATS_CREATE"), v.literal("ATS_CONTROL_LIST"), v.literal("ATS_ISSUE"),
    v.literal("ATS_TRANSFER"), v.literal("ATS_COUPON"), v.literal("HEDERA_FUNDING"),
  ),
  subjectPublicId: v.string(),
  network: v.literal("hedera:testnet"),
  chainId: v.literal(296),
  expectedTarget: v.string(),
  canonicalParametersHash: v.string(),
  idempotencyKey: v.string(),
  expiresAt: v.string(),
};
const payloadValidator = v.object(payloadFields);
const contextKeys = Object.keys(contextValidators);
const payloadKeys = Object.keys(payloadFields);

function reject(): never {
  throw new TypeError("invalid durable external prepare record");
}

function readRecord(input: unknown, fields: readonly string[], stored = false): Record<string, unknown> {
  if (
    input === null || typeof input !== "object"
    || Object.getPrototypeOf(input) !== Object.prototype
  ) return reject();

  const allowed = stored ? [...fields, "_id", "_creationTime"] : fields;
  const keys = Reflect.ownKeys(input);
  if (keys.some((key) => typeof key !== "string" || !allowed.includes(key))) return reject();
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (typeof key !== "string") return reject();
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return reject();
    result[key] = descriptor.value;
  }
  if (fields.some((key) => !Object.hasOwn(result, key))) return reject();
  if (stored && (
    typeof result._id !== "string" || result._id.length === 0
    || (Object.hasOwn(result, "_creationTime")
      && (typeof result._creationTime !== "number" || !Number.isFinite(result._creationTime)))
  )) return reject();
  return result;
}

function pick(record: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => [key, record[key]]));
}

function isInt64(value: unknown): value is bigint {
  return typeof value === "bigint"
    && value >= 0n && value <= 9_223_372_036_854_775_807n;
}

function isAttemptId(value: unknown): value is GenericId<"externalPrepareCommandAttempts"> {
  return typeof value === "string" && value.length > 0;
}

function payloadDigest(payload: ExternalPreparePayload): string {
  // M26 permits only ASCII strings and the fixed integer, so this sorted object is RFC8785 JCS.
  return keccak256(stringToHex(JSON.stringify({
    canonicalParametersHash: payload.canonicalParametersHash,
    chainId: payload.chainId,
    expectedTarget: payload.expectedTarget,
    expiresAt: payload.expiresAt,
    idempotencyKey: payload.idempotencyKey,
    network: payload.network,
    operationKind: payload.operationKind,
    subjectPublicId: payload.subjectPublicId,
  })));
}

function bindContext(record: Record<string, unknown>) {
  const { canonicalSignerAddress, principalPublicId, role, authorityVersion, payloadHash } = record;
  if (
    record.version !== 1 || record.type !== "external.prepare" || record.chainId !== 296
    || typeof canonicalSignerAddress !== "string" || !/^0x[0-9a-f]{40}$/u.test(canonicalSignerAddress)
    || typeof principalPublicId !== "string" || principalPublicId.length === 0
    || (role !== "ISSUER" && role !== "BACKER")
    || typeof authorityVersion !== "string" || authorityVersion.length === 0
    || typeof payloadHash !== "string" || !/^0x[0-9a-f]{64}$/u.test(payloadHash)
  ) return reject();
  const payload = parseExternalPreparePayload(record.payload);
  if (payloadDigest(payload) !== payloadHash) return reject();
  return {
    version: 1 as const, type: "external.prepare" as const, chainId: 296 as const,
    canonicalSignerAddress, principalPublicId, role, authorityVersion, payloadHash, payload,
  } as const;
}

function readAttempt(input: unknown, requested: ReturnType<typeof bindContext>) {
  const record = readRecord(input, [
    ...new Set([...contextKeys, ...payloadKeys]), "state", "acceptedAt",
  ], true);
  if (!isAttemptId(record._id) || record.state !== "PREPARED" || !isInt64(record.acceptedAt)) return reject();
  const persisted = bindContext({
    ...pick(record, contextKeys),
    payload: pick(record, payloadKeys),
  });
  const requestedContext = pick(requested, contextKeys);
  const requestedPayload = pick({ ...requested.payload }, payloadKeys);
  if (
    contextKeys.some((key) => record[key] !== requestedContext[key])
    || payloadKeys.some((key) => record[key] !== requestedPayload[key])
  ) return reject();
  return {
    attemptId: record._id, state: "PREPARED" as const, acceptedAt: record.acceptedAt,
    ...persisted,
  };
}

const internalMutation: MutationBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalMutationGeneric;
const commandValidators = {
  ...contextValidators,
  nonce: v.string(),
  issuedAt: v.string(),
  expiresAt: v.string(),
  replayIdentity: v.string(),
  payload: payloadValidator,
};

function timestamp(value: unknown): number {
  if (
    typeof value !== "string"
    || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u.test(value)
  ) return reject();
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) return reject();
  return milliseconds;
}

function bindCommand(input: unknown) {
  const record = readRecord(input, Object.keys(commandValidators));
  const bound = bindContext(record);
  const { nonce, replayIdentity } = record;
  const issuedAt = timestamp(record.issuedAt);
  const expiresAt = timestamp(record.expiresAt);
  const durableNow = Date.now();
  if (
    typeof nonce !== "string" || !/^[A-Za-z0-9_-]{21}[AQgw]$/u.test(nonce)
    || replayIdentity !== "tool402:wallet-command:v1:296:" + bound.canonicalSignerAddress + ":" + nonce
    || record.expiresAt !== bound.payload.expiresAt
    || expiresAt <= issuedAt || expiresAt - issuedAt > 300_000
    || issuedAt > durableNow + 60_000 || durableNow > expiresAt
    || !Number.isSafeInteger(durableNow)
  ) return reject();
  return { bound, replayIdentity, durableNow: BigInt(durableNow) };
}

function revalidateAuthority(input: unknown, command: ReturnType<typeof bindContext>): void {
  const record = readRecord(input, [
    "principalPublicId", "canonicalSignerAddress", "chainId", "role",
    "ownedSubjectPublicIds", "authorityVersion", "enabled",
  ], true);
  const subjects = record.ownedSubjectPublicIds;
  if (
    !Array.isArray(subjects) || Object.getPrototypeOf(subjects) !== Array.prototype
    || Reflect.ownKeys(subjects).length !== subjects.length + 1
  ) return reject();
  const ownedSubjects: string[] = [];
  for (let index = 0; index < subjects.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(subjects, String(index));
    if (
      !descriptor?.enumerable || !Object.hasOwn(descriptor, "value")
      || typeof descriptor.value !== "string"
    ) return reject();
    ownedSubjects.push(descriptor.value);
  }
  if (
    record.enabled !== true || record.chainId !== command.chainId
    || record.canonicalSignerAddress !== command.canonicalSignerAddress
    || record.principalPublicId !== command.principalPublicId
    || record.role !== command.role || record.authorityVersion !== command.authorityVersion
    || (command.payload.operationKind === "HEDERA_FUNDING"
      ? command.role !== "BACKER"
      : command.role !== "ISSUER" || !ownedSubjects.includes(command.payload.subjectPublicId))
  ) reject();
}

function revalidateClaim(input: unknown, replayIdentity: string): void {
  if (input === null || typeof input !== "object") return reject();
  const outcome = Object.getOwnPropertyDescriptor(input, "outcome")?.value;
  const linked = outcome === "NEW" || outcome === "IDEMPOTENCY_REPLAYED";
  const record = readRecord(input, [
    "replayIdentity", "outcome", "claimedAt", ...(linked ? ["attemptId"] : []),
  ], true);
  if (
    typeof record._id !== "string" || record._id.length === 0
    || record.replayIdentity !== replayIdentity || !isInt64(record.claimedAt)
    || (!linked && outcome !== "IDEMPOTENCY_CONFLICT")
    || (linked && !isAttemptId(record.attemptId))
  ) reject();
}

export const admitExternalPrepareCommand = internalMutation({
  args: commandValidators,
  returns: v.union(
    v.object({ status: v.literal("NEW"), attemptId: v.id("externalPrepareCommandAttempts"), state: v.literal("PREPARED") }),
    v.object({ status: v.literal("IDEMPOTENCY_REPLAYED"), attemptId: v.id("externalPrepareCommandAttempts"), state: v.literal("PREPARED") }),
    v.object({ status: v.literal("COMMAND_REPLAYED") }),
    v.object({ status: v.literal("IDEMPOTENCY_CONFLICT") }),
  ),
  handler: async (ctx, args) => {
    const { bound, replayIdentity, durableNow } = bindCommand(args);
    const authorities = await ctx.db.query("commandAuthorities")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) =>
        query.eq("chainId", bound.chainId).eq("canonicalSignerAddress", bound.canonicalSignerAddress))
      .take(2);
    if (authorities.length !== 1) return reject();
    revalidateAuthority(authorities[0], bound);
    if (bound.payload.operationKind === "ATS_CREATE") return reject();
    assertCurrentAtsPrepareAuthority(bound.payload);

    const claims = await ctx.db.query("externalPrepareCommandReplayClaims")
      .withIndex("by_replay_identity", (query) => query.eq("replayIdentity", replayIdentity))
      .take(2);
    if (claims.length > 1) return reject();
    if (claims.length === 1) {
      revalidateClaim(claims[0], replayIdentity);
      return { status: "COMMAND_REPLAYED" as const };
    }

    const attempts = await ctx.db.query("externalPrepareCommandAttempts")
      .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", bound.payload.idempotencyKey))
      .take(2);
    if (attempts.length === 0) {
      const { payload, ...context } = bound;
      const attemptId = await ctx.db.insert("externalPrepareCommandAttempts", {
        ...context, ...payload, state: "PREPARED", acceptedAt: durableNow,
      });
      await ctx.db.insert("externalPrepareCommandReplayClaims", {
        replayIdentity, outcome: "NEW", attemptId, claimedAt: durableNow,
      });
      return { status: "NEW" as const, attemptId, state: "PREPARED" as const };
    }

    let stored = null;
    if (attempts.length === 1) {
      try {
        stored = readAttempt(attempts[0], bound);
      } catch {
        // An unsafe existing record consumes this fresh identity as a conflict.
      }
    }
    if (stored === null) {
      await ctx.db.insert("externalPrepareCommandReplayClaims", {
        replayIdentity, outcome: "IDEMPOTENCY_CONFLICT", claimedAt: durableNow,
      });
      return { status: "IDEMPOTENCY_CONFLICT" as const };
    }
    await ctx.db.insert("externalPrepareCommandReplayClaims", {
      replayIdentity, outcome: "IDEMPOTENCY_REPLAYED", attemptId: stored.attemptId, claimedAt: durableNow,
    });
    return { status: "IDEMPOTENCY_REPLAYED" as const, attemptId: stored.attemptId, state: "PREPARED" as const };
  },
});

export const admitAtsCreateAndMarkAssetPending = internalMutation({
  args: commandValidators,
  returns: v.union(
    v.object({ status: v.literal("NEW"), attemptId: v.id("externalPrepareCommandAttempts"), state: v.literal("PREPARED") }),
    v.object({ status: v.literal("IDEMPOTENCY_REPLAYED"), attemptId: v.id("externalPrepareCommandAttempts"), state: v.literal("PREPARED") }),
    v.object({ status: v.literal("COMMAND_REPLAYED") }),
    v.object({ status: v.literal("IDEMPOTENCY_CONFLICT") }),
  ),
  handler: async (ctx, args) => {
    const { bound, replayIdentity, durableNow } = bindCommand(args);
    if (bound.payload.operationKind !== "ATS_CREATE") return reject();

    const authorities = await ctx.db.query("commandAuthorities")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) =>
        query.eq("chainId", bound.chainId).eq("canonicalSignerAddress", bound.canonicalSignerAddress))
      .take(2);
    if (authorities.length !== 1) return reject();
    revalidateAuthority(authorities[0], bound);
    assertStageBAtsCreateRuntimeBinding(bound);
    assertCurrentAtsPrepareAuthority(bound.payload);

    const claims = await ctx.db.query("externalPrepareCommandReplayClaims")
      .withIndex("by_replay_identity", (query) => query.eq("replayIdentity", replayIdentity))
      .take(2);
    if (claims.length > 1) return reject();
    if (claims.length === 1) {
      revalidateClaim(claims[0], replayIdentity);
      return { status: "COMMAND_REPLAYED" as const };
    }

    const attempts = await ctx.db.query("externalPrepareCommandAttempts")
      .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", bound.payload.idempotencyKey))
      .take(2);
    if (attempts.length === 0) {
      const { payload, ...context } = bound;
      const attemptId = await ctx.db.insert("externalPrepareCommandAttempts", {
        ...context, ...payload, state: "PREPARED", acceptedAt: durableNow,
      });
      await linkAtsCreateAttemptToDraftOffering(ctx, {
        attemptId,
        subjectPublicId: bound.payload.subjectPublicId,
        canonicalSignerAddress: bound.canonicalSignerAddress,
        principalPublicId: bound.principalPublicId,
        authorityVersion: bound.authorityVersion,
      });
      await ctx.db.insert("externalPrepareCommandReplayClaims", {
        replayIdentity, outcome: "NEW", attemptId, claimedAt: durableNow,
      });
      return { status: "NEW" as const, attemptId, state: "PREPARED" as const };
    }

    let stored = null;
    if (attempts.length === 1) {
      try {
        stored = readAttempt(attempts[0], bound);
      } catch {
        stored = null;
      }
    }
    if (stored === null) {
      await ctx.db.insert("externalPrepareCommandReplayClaims", {
        replayIdentity, outcome: "IDEMPOTENCY_CONFLICT", claimedAt: durableNow,
      });
      return { status: "IDEMPOTENCY_CONFLICT" as const };
    }

    const offeringRows = await ctx.db.query("offerings")
      .withIndex("by_ats_attempt_id", (query) => query.eq("atsAttemptId", stored.attemptId))
      .take(2);
    if (offeringRows.length !== 1) {
      await ctx.db.insert("externalPrepareCommandReplayClaims", {
        replayIdentity, outcome: "IDEMPOTENCY_CONFLICT", claimedAt: durableNow,
      });
      return { status: "IDEMPOTENCY_CONFLICT" as const };
    }
    const offering = readAtsCreateReplayOffering(offeringRows[0]);
    if (
      offering === null
      || offering.atsAttemptId !== stored.attemptId
      || offering.state !== "ASSET_PENDING"
      || offering.subjectPublicId !== bound.payload.subjectPublicId
      || offering.canonicalSignerAddress !== bound.canonicalSignerAddress
      || offering.principalPublicId !== bound.principalPublicId
      || offering.authorityVersion !== bound.authorityVersion
    ) {
      await ctx.db.insert("externalPrepareCommandReplayClaims", {
        replayIdentity, outcome: "IDEMPOTENCY_CONFLICT", claimedAt: durableNow,
      });
      return { status: "IDEMPOTENCY_CONFLICT" as const };
    }
    await ctx.db.insert("externalPrepareCommandReplayClaims", {
      replayIdentity, outcome: "IDEMPOTENCY_REPLAYED", attemptId: stored.attemptId, claimedAt: durableNow,
    });
    return {
      status: "IDEMPOTENCY_REPLAYED" as const,
      attemptId: stored.attemptId,
      state: "PREPARED" as const,
    };
  },
});
