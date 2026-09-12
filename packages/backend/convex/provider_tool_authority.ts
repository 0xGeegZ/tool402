import type {
  DataModelFromSchemaDefinition,
  GenericQueryCtx,
} from "convex/server";
import { parseProviderToolId } from "@tool402/core";
import type schema from "./schema.ts";

const authorityFields = [
  "principalPublicId",
  "canonicalSignerAddress",
  "chainId",
  "role",
  "ownedSubjectPublicIds",
  "authorityVersion",
  "enabled",
] as const;
const providerToolFields = [
  "toolPublicId",
  "subjectPublicId",
  "offeringPublicId",
  "serviceId",
  "serviceSlug",
  "canonicalSignerAddress",
  "chainId",
  "principalPublicId",
  "authorityVersion",
  "requestId",
  "offeringVersion",
  "directoryVersion",
  "createdAt",
] as const;
const storedMetadataFields = ["_id", "_creationTime"] as const;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

type DatabaseContext = Pick<
  GenericQueryCtx<DataModelFromSchemaDefinition<typeof schema>>,
  "db"
>;

export type SelectedProviderToolSubject = Readonly<{
  subjectPublicId: string;
  offeringPublicId?: string;
}>;

export type ResolvedProviderToolSubject = Readonly<{
  subjectPublicId: string;
  offeringPublicId: string;
}>;

function reject(): never {
  throw new TypeError("invalid selected provider tool authority");
}

function readRecord(
  input: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) {
    return reject();
  }
  const allowed = new Set([...required, ...optional]);
  const keys = Reflect.ownKeys(input);
  if (
    keys.some((key) => typeof key !== "string" || !allowed.has(key))
    || required.some((field) => !Object.hasOwn(input, field))
  ) return reject();
  const record: Record<string, unknown> = {};
  for (const key of keys) {
    if (typeof key !== "string") return reject();
    const descriptor = Reflect.getOwnPropertyDescriptor(input, key);
    if (
      descriptor === undefined
      || descriptor.enumerable !== true
      || !Object.hasOwn(descriptor, "value")
      || Object.hasOwn(descriptor, "get")
      || Object.hasOwn(descriptor, "set")
    ) return reject();
    record[key] = descriptor.value;
  }
  return record;
}

function readStringArray(input: unknown): readonly string[] {
  if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) return reject();
  const keys = Reflect.ownKeys(input);
  if (
    keys.length !== input.length + 1
    || keys.some((key, index) => key !== (index === input.length ? "length" : String(index)))
  ) return reject();
  const values: string[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const descriptor = Reflect.getOwnPropertyDescriptor(input, String(index));
    if (
      descriptor === undefined
      || descriptor.enumerable !== true
      || !Object.hasOwn(descriptor, "value")
      || typeof descriptor.value !== "string"
    ) return reject();
    values.push(descriptor.value);
  }
  return values;
}

function readCurrentIssuer(input: unknown) {
  const record = readRecord(input, authorityFields, storedMetadataFields);
  const principalPublicId = record.principalPublicId;
  const canonicalSignerAddress = record.canonicalSignerAddress;
  const authorityVersion = record.authorityVersion;
  readStringArray(record.ownedSubjectPublicIds);
  if (
    typeof principalPublicId !== "string" || principalPublicId.length === 0
    || typeof canonicalSignerAddress !== "string" || !addressPattern.test(canonicalSignerAddress)
    || record.chainId !== 296 || record.role !== "ISSUER" || record.enabled !== true
    || typeof authorityVersion !== "string" || authorityVersion.length === 0
  ) return reject();
  return { principalPublicId, canonicalSignerAddress, authorityVersion } as const;
}

function readSelectedTool(input: unknown) {
  const record = readRecord(input, providerToolFields, storedMetadataFields);
  const toolPublicId = parseProviderToolId(record.toolPublicId);
  const suffix = toolPublicId?.slice("tool_".length);
  if (
    toolPublicId === null || suffix === undefined
    || record.subjectPublicId !== toolPublicId
    || record.offeringPublicId !== `offering_${suffix}`
    || record.serviceId !== toolPublicId
    || record.serviceSlug !== `tool-${suffix}`
    || typeof record.canonicalSignerAddress !== "string"
    || !addressPattern.test(record.canonicalSignerAddress)
    || record.chainId !== 296
    || typeof record.principalPublicId !== "string" || record.principalPublicId.length === 0
    || typeof record.authorityVersion !== "string" || record.authorityVersion.length === 0
    || typeof record.requestId !== "string" || !requestIdPattern.test(record.requestId)
    || record.offeringVersion !== 1 || record.directoryVersion !== 1
    || typeof record.createdAt !== "bigint" || record.createdAt < 0n
  ) return reject();
  return {
    subjectPublicId: toolPublicId,
    offeringPublicId: record.offeringPublicId as string,
    canonicalSignerAddress: record.canonicalSignerAddress,
    principalPublicId: record.principalPublicId,
    authorityVersion: record.authorityVersion,
  } as const;
}

export function isSelectedProviderToolSubject(subjectPublicId: string): boolean {
  return parseProviderToolId(subjectPublicId) !== null;
}

export async function resolveSelectedProviderToolSubject(
  ctx: DatabaseContext,
  currentAuthority: unknown,
  selection: SelectedProviderToolSubject,
): Promise<ResolvedProviderToolSubject> {
  const authority = readCurrentIssuer(currentAuthority);
  const subjectPublicId = parseProviderToolId(selection.subjectPublicId);
  if (subjectPublicId === null) return reject();
  const rows = await ctx.db.query("providerTools")
    .withIndex("by_tool_public_id", (query) => query.eq("toolPublicId", subjectPublicId))
    .take(2);
  if (rows.length !== 1) return reject();
  const tool = readSelectedTool(rows[0]);
  if (
    tool.subjectPublicId !== subjectPublicId
    || tool.canonicalSignerAddress !== authority.canonicalSignerAddress
    || tool.principalPublicId !== authority.principalPublicId
    || tool.authorityVersion !== authority.authorityVersion
    || (selection.offeringPublicId !== undefined
      && tool.offeringPublicId !== selection.offeringPublicId)
  ) return reject();
  return Object.freeze({
    subjectPublicId: tool.subjectPublicId,
    offeringPublicId: tool.offeringPublicId,
  });
}
