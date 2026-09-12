import type {
  DataModelFromSchemaDefinition,
  GenericMutationCtx,
} from "convex/server";
import type { GenericId } from "convex/values";
import { isCanonicalEvmAddress, readStoredRecord } from "../src/offering-command-admission.ts";
import type schema from "./schema.ts";

type ReceiptBinding = Readonly<{
  offeringId: GenericId<"offerings">;
  offeringPublicId: string;
  attemptId: GenericId<"externalPrepareCommandAttempts">;
  candidateTransactionId: string;
  assetEvmAddress: string;
}>;

type BindingContext = Pick<
  GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>,
  "db"
>;

const network = "hedera:testnet" as const;
const transactionIdPattern =
  /^0\.0\.(?:0|[1-9][0-9]*)-(?:0|[1-9][0-9]*)-[0-9]{9}$/u;
const hederaTransactionIdPattern =
  /^(0\.0\.(?:0|[1-9][0-9]*))@((?:0|[1-9][0-9]*)\.([0-9]{1,9}))$/u;

function reject(): never {
  throw new RangeError("ATS receipt is already bound to another offering");
}

function canonicalCandidateTransactionId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (transactionIdPattern.test(value)) return value;
  const match = hederaTransactionIdPattern.exec(value);
  if (match === null || match[1] === undefined || match[2] === undefined || match[3] === undefined) return null;
  return `${match[1]}-${match[2].replace(".", "-").padEnd(match[2].length + (9 - match[3].length), "0")}`;
}

function readBinding(input: unknown): ReceiptBinding {
  try {
    const record = readStoredRecord(input, [
      "network",
      "offeringId",
      "offeringPublicId",
      "attemptId",
      "candidateTransactionId",
      "assetEvmAddress",
    ], ["_id", "_creationTime"]);
    if (
      record.network !== network
      || typeof record.offeringId !== "string" || record.offeringId.length === 0
      || typeof record.offeringPublicId !== "string" || record.offeringPublicId.length === 0
      || typeof record.attemptId !== "string" || record.attemptId.length === 0
      || typeof record.candidateTransactionId !== "string" || !transactionIdPattern.test(record.candidateTransactionId)
      || !isCanonicalEvmAddress(record.assetEvmAddress)
    ) return reject();
    return Object.freeze({
      offeringId: record.offeringId as GenericId<"offerings">,
      offeringPublicId: record.offeringPublicId,
      attemptId: record.attemptId as GenericId<"externalPrepareCommandAttempts">,
      candidateTransactionId: record.candidateTransactionId,
      assetEvmAddress: record.assetEvmAddress,
    });
  } catch {
    return reject();
  }
}

function readClaimInput(input: unknown): ReceiptBinding {
  try {
    if (
      input === null
      || typeof input !== "object"
      || Object.getPrototypeOf(input) !== Object.prototype
    ) return reject();
    const fields = [
      "offeringId",
      "offeringPublicId",
      "attemptId",
      "candidateTransactionId",
      "assetEvmAddress",
    ] as const;
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== fields.length
      || keys.some((key) => typeof key !== "string" || !fields.includes(key as (typeof fields)[number]))
    ) return reject();
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.hasOwn(descriptor, "value")
        || Object.hasOwn(descriptor, "get")
        || Object.hasOwn(descriptor, "set")
      ) return reject();
      values[field] = descriptor.value;
    }
    if (typeof values.offeringId !== "string" || values.offeringId.length === 0) return reject();
    if (typeof values.offeringPublicId !== "string" || values.offeringPublicId.length === 0) return reject();
    if (typeof values.attemptId !== "string" || values.attemptId.length === 0) return reject();
    if (canonicalCandidateTransactionId(values.candidateTransactionId) === null) return reject();
    if (!isCanonicalEvmAddress(values.assetEvmAddress)) return reject();
    return Object.freeze({
      offeringId: values.offeringId as GenericId<"offerings">,
      offeringPublicId: values.offeringPublicId,
      attemptId: values.attemptId as GenericId<"externalPrepareCommandAttempts">,
      candidateTransactionId: canonicalCandidateTransactionId(values.candidateTransactionId) as string,
      assetEvmAddress: values.assetEvmAddress,
    });
  } catch {
    return reject();
  }
}

function isSameBinding(left: ReceiptBinding, right: ReceiptBinding): boolean {
  return left.offeringId === right.offeringId
    && left.offeringPublicId === right.offeringPublicId
    && left.attemptId === right.attemptId
    && left.candidateTransactionId === right.candidateTransactionId
    && left.assetEvmAddress === right.assetEvmAddress;
}

/**
 * Claim both immutable receipt identities in the caller's Convex mutation.
 * The table indexes make concurrent legacy/new claims contend through OCC;
 * an exact same-offering replay remains the only no-op replay.
 */
export async function claimAtsReceiptBinding(
  ctx: BindingContext,
  input: ReceiptBinding,
): Promise<"CLAIMED" | "REPLAYED"> {
  const binding = readClaimInput(input);
  const [transactionRows, assetRows] = await Promise.all([
    ctx.db.query("providerToolReceiptBindings")
      .withIndex("by_network_and_candidate_transaction_id", (query) => (
        query.eq("network", network).eq("candidateTransactionId", binding.candidateTransactionId)
      ))
      .take(2),
    ctx.db.query("providerToolReceiptBindings")
      .withIndex("by_network_and_asset_evm_address", (query) => (
        query.eq("network", network).eq("assetEvmAddress", binding.assetEvmAddress)
      ))
      .take(2),
  ]);
  if (transactionRows.length > 1 || assetRows.length > 1) return reject();
  const existing = [...transactionRows, ...assetRows].map(readBinding);
  if (existing.length === 0) {
    await ctx.db.insert("providerToolReceiptBindings", {
      network,
      offeringId: binding.offeringId,
      offeringPublicId: binding.offeringPublicId,
      attemptId: binding.attemptId,
      candidateTransactionId: binding.candidateTransactionId,
      assetEvmAddress: binding.assetEvmAddress,
    });
    return "CLAIMED";
  }
  if (existing.every((row) => isSameBinding(row, binding))) return "REPLAYED";
  return reject();
}
