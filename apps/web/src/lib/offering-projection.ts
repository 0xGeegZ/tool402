export type OfferingState = "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";

export type OfferingRecord = {
  readonly offeringPublicId: string;
  readonly version: number;
  readonly subjectPublicId: string;
  readonly state: OfferingState;
  readonly definition: {
    readonly terms: {
      readonly version: string;
      readonly fundingTargetTinybars: string;
      readonly noteUnitPriceTinybars: string;
      readonly maximumNoteUnits: string;
      readonly minimumPurchaseUnits: string;
      readonly reserveShareBps: string;
      readonly issuerShareBps: string;
      readonly platformFeeBps: string;
      readonly payoutCapTinybars: string;
    };
    readonly maturityAt: string;
    readonly qualifyingResource: string;
  };
  readonly narrative: {
    readonly title: string;
    readonly customerProblem: string;
    readonly customerUseCases: readonly string[];
    readonly useOfFunds: readonly string[];
    readonly risks: readonly string[];
  };
  readonly advertisedQuickPriceTinybars: string;
  readonly advertisedStandardPriceTinybars: string;
  readonly canonicalSignerAddress: string;
  readonly atsAssetEvmAddress?: string;
  readonly atsAttemptPublicId?: string;
  readonly acceptedAt: number | string;
  readonly updatedAt: number | string;
};

export type DirectoryRecord = AgentDirectoryRecordCandidate;

export type OfferingOutcome =
  | { readonly outcome: "not_configured" }
  | { readonly outcome: "absent" }
  | { readonly outcome: "loaded"; readonly record: OfferingRecord }
  | { readonly outcome: "unavailable" }
  | { readonly outcome: "unexpected_response" };

export type DirectoryOutcome =
  | { readonly outcome: "not_configured" }
  | { readonly outcome: "absent" }
  | { readonly outcome: "loaded"; readonly directoryVersion: number; readonly record: DirectoryRecord }
  | { readonly outcome: "unavailable" }
  | { readonly outcome: "unexpected_response" };

export type ProviderProjections = {
  readonly offering: OfferingOutcome;
  readonly directory: DirectoryOutcome;
};

export type ProviderProjectionFetcher = (input: URL, init: RequestInit) => Promise<Response>;

const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const siteEnvironmentKey = "TOOL402_CONVEX_SITE_URL";
const maximumResponseBytes = 16_384;
const timeoutMilliseconds = 2_000;
const jsonContentType = /^application\/json(?:;|$)/iu;
const abortedRead = Symbol("aborted provider projection read");
const canonicalEvmAddressPattern = /^0x[0-9a-f]{40}$/u;
const canonicalAttemptPublicIdPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const canonicalIntegerPattern = /^(?:0|[1-9][0-9]*)$/u;
const maximumInt64 = 9_223_372_036_854_775_807n;

function hasOnlyOwnFields(input: unknown, fields: readonly string[]): input is Record<string, unknown> {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return false;
  const keys = Reflect.ownKeys(input);
  return keys.length === fields.length
    && keys.every((key) => typeof key === "string" && fields.includes(key))
    && fields.every((field) => Object.hasOwn(input, field));
}

function readString(input: unknown): string | null {
  return typeof input === "string" ? input : null;
}

function readTimestamp(input: unknown): string | null {
  if (typeof input !== "string" || !canonicalIntegerPattern.test(input)) return null;
  try {
    return BigInt(input) <= maximumInt64 ? input : null;
  } catch {
    return null;
  }
}

function readStringArray(input: unknown): readonly string[] | null {
  return Array.isArray(input) && input.every((item) => typeof item === "string") ? [...input] : null;
}

function readOfferingDefinition(input: unknown): OfferingRecord["definition"] | null {
  try {
    const definition = parseOfferingDefinition(input);
    return {
      terms: {
        version: definition.terms.version,
        fundingTargetTinybars: definition.terms.fundingTargetTinybars.toString(),
        noteUnitPriceTinybars: definition.terms.noteUnitPriceTinybars.toString(),
        maximumNoteUnits: definition.terms.maximumNoteUnits.toString(),
        minimumPurchaseUnits: definition.terms.minimumPurchaseUnits.toString(),
        reserveShareBps: definition.terms.reserveShareBps.toString(),
        issuerShareBps: definition.terms.issuerShareBps.toString(),
        platformFeeBps: definition.terms.platformFeeBps.toString(),
        payoutCapTinybars: definition.terms.payoutCapTinybars.toString(),
      },
      maturityAt: definition.maturityAt,
      qualifyingResource: definition.qualifyingResource,
    };
  } catch {
    return null;
  }
}

function readAdvertisedPrice(input: unknown): string | null {
  const price = parseTinybar(input);
  return typeof input === "string" && input.length <= 8 && price !== undefined && price >= 1n && price <= 10_000_000n
    ? input
    : null;
}

function readOfferingRecord(input: unknown): OfferingRecord | null {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
  const record = input as Record<string, unknown>;
  const baseFields = ["offeringPublicId", "version", "subjectPublicId", "state", "definition", "narrative", "advertisedQuickPriceTinybars", "advertisedStandardPriceTinybars", "canonicalSignerAddress", "acceptedAt", "updatedAt"] as const;
  const fields = [
    baseFields,
    [...baseFields, "atsAssetEvmAddress"],
    [...baseFields, "atsAttemptPublicId"],
  ];
  if (!fields.some((candidate) => hasOnlyOwnFields(record, candidate))) return null;

  const offeringPublicId = readString(record.offeringPublicId);
  const version = record.version;
  const subjectPublicId = readString(record.subjectPublicId);
  const state = record.state;
  const definition = readOfferingDefinition(record.definition);
  const narrative = record.narrative;
  const advertisedQuickPriceTinybars = readAdvertisedPrice(record.advertisedQuickPriceTinybars);
  const advertisedStandardPriceTinybars = readAdvertisedPrice(record.advertisedStandardPriceTinybars);
  const canonicalSignerAddress = readString(record.canonicalSignerAddress);
  const acceptedAt = readTimestamp(record.acceptedAt);
  const updatedAt = readTimestamp(record.updatedAt);
  if (
    offeringPublicId === null || !publicIdPattern.test(offeringPublicId)
    || typeof version !== "number" || !Number.isSafeInteger(version) || version < 1
    || subjectPublicId === null || !publicIdPattern.test(subjectPublicId) || !["DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"].includes(state as OfferingState)
    || definition === null || advertisedQuickPriceTinybars === null || advertisedStandardPriceTinybars === null || canonicalSignerAddress === null || !canonicalEvmAddressPattern.test(canonicalSignerAddress)
    || acceptedAt === null || updatedAt === null
  ) return null;

  if (!hasOnlyOwnFields(narrative, ["title", "customerProblem", "customerUseCases", "useOfFunds", "risks"])) return null;
  const title = readString(narrative.title);
  const customerProblem = readString(narrative.customerProblem);
  const customerUseCases = readStringArray(narrative.customerUseCases);
  const useOfFunds = readStringArray(narrative.useOfFunds);
  const risks = readStringArray(narrative.risks);
  if (title === null || customerProblem === null || customerUseCases === null || useOfFunds === null || risks === null) return null;

  const atsAssetEvmAddress = Object.hasOwn(record, "atsAssetEvmAddress") ? readString(record.atsAssetEvmAddress) : undefined;
  if (atsAssetEvmAddress === null || (atsAssetEvmAddress !== undefined && !canonicalEvmAddressPattern.test(atsAssetEvmAddress))) return null;
  const atsAttemptPublicId = Object.hasOwn(record, "atsAttemptPublicId") ? readString(record.atsAttemptPublicId) : undefined;
  if (atsAttemptPublicId === null || (atsAttemptPublicId !== undefined && !canonicalAttemptPublicIdPattern.test(atsAttemptPublicId))) return null;
  return {
    offeringPublicId,
    version,
    subjectPublicId,
    state: state as OfferingState,
    definition,
    narrative: { title, customerProblem, customerUseCases, useOfFunds, risks },
    advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars,
    canonicalSignerAddress,
    ...(atsAssetEvmAddress === undefined ? {} : { atsAssetEvmAddress }),
    ...(atsAttemptPublicId === undefined ? {} : { atsAttemptPublicId }),
    acceptedAt,
    updatedAt,
  };
}

function readDirectoryRecord(input: unknown): DirectoryRecord | null {
  try {
    return parseAgentDirectoryRecordCandidate(input);
  } catch {
    return null;
  }
}

function providerSiteSource(environment: NodeJS.ProcessEnv): URL | null {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(environment, siteEnvironmentKey);
    if (descriptor === undefined || !Object.hasOwn(descriptor, "value") || Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set") || typeof descriptor.value !== "string") return null;
    const source = new URL(descriptor.value.trim());
    if (source.protocol !== "https:" || source.hostname.length === 0 || source.username !== "" || source.password !== "" || source.pathname !== "/" || source.search !== "" || source.hash !== "") return null;
    return source;
  } catch {
    return null;
  }
}

async function settleBeforeDeadline<T>(operation: Promise<T>, deadline: AbortSignal): Promise<T | typeof abortedRead> {
  if (deadline.aborted) return abortedRead;
  let removeAbortListener = () => {};
  const aborted = new Promise<typeof abortedRead>((resolve) => {
    const onAbort = () => resolve(abortedRead);
    deadline.addEventListener("abort", onAbort, { once: true });
    removeAbortListener = () => deadline.removeEventListener("abort", onAbort);
  });
  try {
    return await Promise.race([operation, aborted]);
  } finally {
    removeAbortListener();
  }
}

async function readBoundedJson(response: Response, deadline: AbortSignal): Promise<unknown | null> {
  if (!jsonContentType.test(response.headers.get("content-type") ?? "") || response.body === null) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    for (;;) {
      const read = await settleBeforeDeadline(reader.read(), deadline);
      if (read === abortedRead) return null;
      const { done, value } = read;
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maximumResponseBytes) return null;
      chunks.push(value);
    }
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}

async function readProjection(
  source: URL,
  fetcher: ProviderProjectionFetcher,
  parse: (input: unknown) => OfferingOutcome | DirectoryOutcome,
  absent: OfferingOutcome | DirectoryOutcome,
): Promise<OfferingOutcome | DirectoryOutcome> {
  try {
    const deadline = AbortSignal.timeout(timeoutMilliseconds);
    const response = await fetcher(source, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      signal: deadline,
    });
    if (response.status === 404) return absent;
    if (response.status !== 200) return { outcome: "unavailable" };
    const body = await readBoundedJson(response, deadline);
    return body === null ? { outcome: "unexpected_response" } : parse(body);
  } catch {
    return { outcome: "unavailable" };
  }
}

function parseOfferingProjection(input: unknown): OfferingOutcome {
  if (!hasOnlyOwnFields(input, ["outcome", "record"]) || input.outcome !== "FOUND") return { outcome: "unexpected_response" };
  const record = readOfferingRecord(input.record);
  return record === null ? { outcome: "unexpected_response" } : { outcome: "loaded", record };
}

function parseDirectoryProjection(input: unknown): DirectoryOutcome {
  if (!hasOnlyOwnFields(input, ["outcome", "record", "directoryVersion"]) || input.outcome !== "FOUND") return { outcome: "unexpected_response" };
  const directoryVersion = input.directoryVersion;
  const record = readDirectoryRecord(input.record);
  if (typeof directoryVersion !== "number" || !Number.isSafeInteger(directoryVersion) || directoryVersion < 1 || record === null) return { outcome: "unexpected_response" };
  return { outcome: "loaded", directoryVersion, record };
}

export function isValidOfferingPublicId(offeringPublicId: string): boolean {
  return publicIdPattern.test(offeringPublicId);
}

export async function readProviderProjections(
  environment: NodeJS.ProcessEnv,
  fetcher: ProviderProjectionFetcher,
  offeringPublicId: string,
): Promise<ProviderProjections> {
  const source = providerSiteSource(environment);
  if (source === null || typeof fetcher !== "function") {
    return { offering: { outcome: "not_configured" }, directory: { outcome: "not_configured" } };
  }
  if (!isValidOfferingPublicId(offeringPublicId)) {
    return { offering: { outcome: "unexpected_response" }, directory: { outcome: "unexpected_response" } };
  }

  const [offering, directory] = await Promise.all([
    readProjection(new URL(`/public/offerings/${offeringPublicId}`, source), fetcher, parseOfferingProjection, { outcome: "absent" }),
    readProjection(new URL("/public/directory/riskscan/active", source), fetcher, parseDirectoryProjection, { outcome: "absent" }),
  ]);
  return { offering: offering as OfferingOutcome, directory: directory as DirectoryOutcome };
}
import {
  parseAgentDirectoryRecordCandidate,
  parseOfferingDefinition,
  parseTinybar,
  type AgentDirectoryRecordCandidate,
} from "@tool402/core";
