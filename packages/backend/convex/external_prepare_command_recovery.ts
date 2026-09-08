import { internalQueryGeneric, type DataModelFromSchemaDefinition, type QueryBuilder } from "convex/server";
import { v, type GenericId } from "convex/values";
import { parseExternalPreparePayload, type ExternalPreparePayload } from "@tool402/core";
import { keccak256, stringToHex } from "viem";
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
const recoveryKeys = [...contextKeys, "payload"];

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

const internalQuery: QueryBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalQueryGeneric;

export const recoverExternalPrepareCommand = internalQuery({
  args: { ...contextValidators, payload: payloadValidator },
  returns: v.union(v.null(), v.object({
    attemptId: v.id("externalPrepareCommandAttempts"),
    state: v.literal("PREPARED"),
    acceptedAt: v.int64(),
    ...contextValidators,
    payload: payloadValidator,
  })),
  handler: async (ctx, args) => {
    const requested = bindContext(readRecord(args, recoveryKeys));
    const attempts = await ctx.db.query("externalPrepareCommandAttempts")
      .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", requested.payload.idempotencyKey))
      .take(2);
    if (attempts.length === 0) return null;
    if (attempts.length !== 1) return reject();
    return readAttempt(attempts[0], requested);
  },
});
