import { canonicalizeRequirements, createOfferingTerms } from "@tool402/core";
import { internalMutationGeneric, type DataModelFromSchemaDefinition, type MutationBuilder } from "convex/server";
import { v } from "convex/values";
import { keccak256 } from "viem";

import { isCanonicalEvmAddress, isInt64, readStoredRecord } from "../src/offering-command-admission.ts";
import type schema from "./schema.ts";
import { isPublicTestnetSelfServiceEnabled, readSelfServiceMaxPendingAttempts } from "./self_service_accounts.ts";

const internalMutation: MutationBuilder<DataModelFromSchemaDefinition<typeof schema>, "internal"> = internalMutationGeneric;
const noncePattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const integerPattern = /^(?:0|[1-9][0-9]*)$/u;
const timestampPattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;
const parameterHashPattern = /^[0-9a-f]{64}$/u;
const maxLifetimeMilliseconds = 300_000;

const intentValidator = v.object({
  idempotencyKey: v.string(),
  purchaseIntentId: v.string(),
  offeringPublicId: v.string(),
  subjectPublicId: v.string(),
  recipient: v.string(),
  units: v.string(),
  tinybars: v.string(),
  canonicalParametersHash: v.string(),
  expiresAt: v.string(),
});
const outcomeValidator = v.union(v.object({ outcome: v.literal("PREPARED"), intent: intentValidator }), v.object({ outcome: v.literal("REJECTED") }));
type FrozenIntent = Readonly<{
  idempotencyKey: string;
  purchaseIntentId: string;
  offeringPublicId: string;
  subjectPublicId: string;
  recipient: string;
  units: string;
  tinybars: string;
  canonicalParametersHash: string;
  expiresAt: string;
}>;

function reject(): { outcome: "REJECTED" } { return { outcome: "REJECTED" }; }

function timestamp(value: unknown): number | null {
  if (typeof value !== "string" || !timestampPattern.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isSafeInteger(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}

function ownObject(value: unknown, fields: readonly string[]): Readonly<Record<string, unknown>> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== fields.length || keys.some((key) => typeof key !== "string" || !fields.includes(key))) return null;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return null;
    result[field] = descriptor.value;
  }
  return result;
}

function readOpenOffering(value: unknown): Readonly<{ offeringPublicId: string; offeringVersion: 1; offeringTermsDigest: string; subjectPublicId: string; recipient: string; minimumPurchaseUnits: bigint; maximumNoteUnits: bigint; noteUnitPriceTinybars: bigint }> | null {
  try {
    const offering = readStoredRecord(value, [
      "offeringPublicId", "subjectPublicId", "canonicalSignerAddress", "principalPublicId", "authorityVersion",
      "payloadHash", "idempotencyKey", "advertisedQuickPriceTinybars", "advertisedStandardPriceTinybars",
      "version", "acceptedAt", "updatedAt", "definition", "narrative", "state",
    ], ["atsAttemptId", "atsAssetEvmAddress", "activeDirectoryVersionId", "fundingRecipient"]);
    if (
      offering.version !== 1 || offering.state !== "OPEN" || !publicIdPattern.test(offering.offeringPublicId as string)
      || !publicIdPattern.test(offering.subjectPublicId as string) || !isCanonicalEvmAddress(offering.canonicalSignerAddress)
      || !isInt64(offering.acceptedAt) || !isInt64(offering.updatedAt)
    ) return null;
    const definition = ownObject(offering.definition, ["schemaVersion", "terms", "maturityAt", "qualifyingResource"]);
    if (definition === null || definition.schemaVersion !== 1) return null;
    const termsInput = ownObject(definition.terms, [
      "version", "fundingTargetTinybars", "noteUnitPriceTinybars", "maximumNoteUnits", "minimumPurchaseUnits",
      "reserveShareBps", "issuerShareBps", "platformFeeBps", "payoutCapTinybars",
    ]);
    if (termsInput === null) return null;
    const termKeys = [
      "version", "fundingTargetTinybars", "noteUnitPriceTinybars", "maximumNoteUnits", "minimumPurchaseUnits",
      "reserveShareBps", "issuerShareBps", "platformFeeBps", "payoutCapTinybars",
    ] as const;
    if (termKeys.some((key) => typeof termsInput[key] !== "string")) return null;
    const terms = createOfferingTerms({
      version: termsInput.version as string,
      fundingTargetTinybars: termsInput.fundingTargetTinybars as string,
      noteUnitPriceTinybars: termsInput.noteUnitPriceTinybars as string,
      maximumNoteUnits: termsInput.maximumNoteUnits as string,
      minimumPurchaseUnits: termsInput.minimumPurchaseUnits as string,
      reserveShareBps: termsInput.reserveShareBps as string,
      issuerShareBps: termsInput.issuerShareBps as string,
      platformFeeBps: termsInput.platformFeeBps as string,
      payoutCapTinybars: termsInput.payoutCapTinybars as string,
    });
    const fundingRecipient = offering.fundingRecipient;
    const recipient = fundingRecipient === undefined
      ? process.env.TOOL402_FUNDING_EVM_ADDRESS
      : fundingRecipient;
    if (
      !isCanonicalEvmAddress(recipient)
      || (fundingRecipient !== undefined && fundingRecipient !== offering.canonicalSignerAddress)
    ) return null;
    return {
      offeringPublicId: offering.offeringPublicId as string,
      offeringVersion: 1,
      // Persist the canonical terms digest with the prepared intent so later
      // offering edits cannot rewrite the evidence a backer reviewed.
      offeringTermsDigest: keccak256(new TextEncoder().encode(canonicalizeRequirements(termsInput))).slice(2),
      subjectPublicId: offering.subjectPublicId as string,
      recipient,
      minimumPurchaseUnits: terms.minimumPurchaseUnits,
      maximumNoteUnits: terms.maximumNoteUnits,
      noteUnitPriceTinybars: terms.noteUnitPriceTinybars,
    };
  } catch {
    return null;
  }
}

function readIntent(value: unknown): FrozenIntent | null {
  try {
    const record = readStoredRecord(value, [
      "idempotencyKey", "purchaseIntentId", "canonicalSignerAddress", "offeringPublicId", "offeringVersion", "offeringTermsDigest", "subjectPublicId",
      "recipient", "units", "tinybars", "canonicalParametersHash", "expiresAt", "createdAt",
    ]);
    if (
      !noncePattern.test(record.idempotencyKey as string) || !noncePattern.test(record.purchaseIntentId as string)
      || !isCanonicalEvmAddress(record.canonicalSignerAddress) || !publicIdPattern.test(record.offeringPublicId as string)
      || record.offeringVersion !== 1 || !parameterHashPattern.test(record.offeringTermsDigest as string)
      || !publicIdPattern.test(record.subjectPublicId as string) || !isCanonicalEvmAddress(record.recipient)
      || !integerPattern.test(record.units as string) || !integerPattern.test(record.tinybars as string)
      || !parameterHashPattern.test(record.canonicalParametersHash as string) || timestamp(record.expiresAt) === null
      || !isInt64(record.createdAt)
    ) return null;
    return {
      idempotencyKey: record.idempotencyKey as string,
      purchaseIntentId: record.purchaseIntentId as string,
      offeringPublicId: record.offeringPublicId as string,
      subjectPublicId: record.subjectPublicId as string,
      recipient: record.recipient as string,
      units: record.units as string,
      tinybars: record.tinybars as string,
      canonicalParametersHash: record.canonicalParametersHash as string,
      expiresAt: record.expiresAt as string,
    };
  } catch {
    return null;
  }
}

export const freezeBackingIntent = internalMutation({
  args: {
    canonicalSignerAddress: v.string(), offeringPublicId: v.string(), units: v.string(),
    idempotencyKey: v.string(), purchaseIntentId: v.string(), expiresAt: v.string(),
  },
  returns: outcomeValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    const expires = timestamp(args.expiresAt);
    if (
      !isPublicTestnetSelfServiceEnabled() || !isCanonicalEvmAddress(args.canonicalSignerAddress)
      || !publicIdPattern.test(args.offeringPublicId) || !integerPattern.test(args.units) || BigInt(args.units) < 1n
      || !noncePattern.test(args.idempotencyKey) || !noncePattern.test(args.purchaseIntentId)
      || expires === null || !Number.isSafeInteger(now) || expires <= now || expires - now > maxLifetimeMilliseconds
    ) return reject();

    const accounts = await ctx.db.query("selfServiceAccounts")
      .withIndex("by_chain_id_and_canonical_signer_address", (query) => query.eq("chainId", 296).eq("canonicalSignerAddress", args.canonicalSignerAddress))
      .take(2);
    if (accounts.length !== 1) return reject();
    const account = readStoredRecord(accounts[0], ["canonicalSignerAddress", "chainId", "principalPublicId", "policyVersion", "status", "createdAt", "updatedAt"]);
    if (
      account.canonicalSignerAddress !== args.canonicalSignerAddress || account.chainId !== 296
      || account.principalPublicId !== `self_service_${args.canonicalSignerAddress.slice(2)}`
      || account.policyVersion !== "public_testnet_v1" || account.status !== "ACTIVE"
      || !isInt64(account.createdAt) || !isInt64(account.updatedAt)
    ) return reject();

    const offerings = await ctx.db.query("offerings")
      .withIndex("by_offering_public_id_and_version", (query) => query.eq("offeringPublicId", args.offeringPublicId).eq("version", 1))
      .take(2);
    if (offerings.length !== 1) return reject();
    const offering = readOpenOffering(offerings[0]);
    if (offering === null || offering.recipient === args.canonicalSignerAddress) return reject();
    const units = BigInt(args.units);
    if (units < offering.minimumPurchaseUnits || units > offering.maximumNoteUnits) return reject();
    const parameters = {
      offeringPublicId: offering.offeringPublicId,
      units: args.units,
      tinybars: (units * offering.noteUnitPriceTinybars).toString(),
      purchaseIntentId: args.purchaseIntentId,
    };
    const intent: FrozenIntent = {
      idempotencyKey: args.idempotencyKey,
      purchaseIntentId: args.purchaseIntentId,
      offeringPublicId: offering.offeringPublicId,
      subjectPublicId: offering.subjectPublicId,
      recipient: offering.recipient,
      units: parameters.units,
      tinybars: parameters.tinybars,
      canonicalParametersHash: keccak256(new TextEncoder().encode(canonicalizeRequirements(parameters))).slice(2),
      expiresAt: args.expiresAt,
    };
    const existing = await ctx.db.query("backingIntents")
      .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", args.idempotencyKey))
      .take(2);
    if (existing.length > 1) return reject();
    if (existing.length === 1) return reject();
    const maximumPending = readSelfServiceMaxPendingAttempts();
    if (maximumPending === null) return reject();
    const pending = await ctx.db.query("backingIntents")
      .withIndex("by_canonical_signer_address_and_created_at", (query) => (
        query.eq("canonicalSignerAddress", args.canonicalSignerAddress)
      ))
      .order("desc")
      .take(maximumPending + 1);
    let active = 0;
    for (const candidate of pending) {
      const stored = readIntent(candidate);
      if (stored === null) return reject();
      const expiry = timestamp(stored.expiresAt);
      if (expiry === null) return reject();
      if (expiry > now) active += 1;
    }
    if (active >= maximumPending) return reject();
    await ctx.db.insert("backingIntents", {
      ...intent,
      canonicalSignerAddress: args.canonicalSignerAddress,
      offeringVersion: offering.offeringVersion,
      offeringTermsDigest: offering.offeringTermsDigest,
      createdAt: BigInt(now),
    });
    return { outcome: "PREPARED" as const, intent };
  },
});

export function readFrozenBackingIntentForTest(value: unknown): FrozenIntent | null {
  return readIntent(value);
}

export function matchesFrozenBackingIntent(
  value: unknown,
  expected: Readonly<{
    canonicalSignerAddress: string;
    idempotencyKey: string;
    subjectPublicId: string;
    expectedTarget: string;
    canonicalParametersHash: string;
    expiresAt: string;
  }>,
): boolean {
  try {
    const record = readStoredRecord(value, [
      "idempotencyKey", "purchaseIntentId", "canonicalSignerAddress", "offeringPublicId", "offeringVersion", "offeringTermsDigest", "subjectPublicId",
      "recipient", "units", "tinybars", "canonicalParametersHash", "expiresAt", "createdAt",
    ]);
    const intent = readIntent(value);
    return intent !== null
      && record.canonicalSignerAddress === expected.canonicalSignerAddress
      && intent.idempotencyKey === expected.idempotencyKey
      && intent.subjectPublicId === expected.subjectPublicId
      && intent.recipient === expected.expectedTarget
      && intent.canonicalParametersHash === expected.canonicalParametersHash
      && intent.expiresAt === expected.expiresAt;
  } catch {
    return false;
  }
}
