export const PROVIDER_OFFERING_PUBLIC_ID = "riskscan_revenue_note_demo";
export const OFFERING_READ_TIMEOUT_MILLISECONDS = 5_000;
export const DIRECTORY_READ_TIMEOUT_MILLISECONDS = 5_000;
export const PROJECTION_MAX_RESPONSE_BYTES = 65_536;

export type OfferingState = "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";

export interface OfferingProjectionRecord {
  readonly offeringPublicId: string;
  readonly version: number;
  readonly subjectPublicId: string;
  readonly state: OfferingState;
  readonly definition: {
    readonly schemaVersion: 1;
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
  readonly acceptedAt: string;
  readonly updatedAt: string;
}

export interface DirectoryProjectionRecord {
  readonly schemaVersion: 1;
  readonly serviceId: string;
  readonly serviceSlug: "riskscan";
  readonly offeringPublicId: string;
  readonly offeringVersion: number;
  readonly capabilities: readonly string[];
  readonly x402Endpoint: string;
  readonly webUrl?: string;
  readonly paymentProtocol: "x402";
  readonly paymentNetwork: "hedera-testnet";
  readonly asset: "HBAR";
  readonly advertisedTiers: readonly string[];
  readonly issuerRevenueAccount: string;
  readonly clearingAccount: string;
  readonly status: "active";
  readonly publishedAt: string;
}

export type ProjectionFailure =
  | { readonly kind: "not_configured" }
  | { readonly kind: "absent" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "unexpected_response" };

export type OfferingProjectionOutcome =
  | ProjectionFailure
  | { readonly kind: "loaded"; readonly record: OfferingProjectionRecord };

export type DirectoryProjectionOutcome =
  | ProjectionFailure
  | { readonly kind: "loaded"; readonly record: DirectoryProjectionRecord; readonly directoryVersion: number };

export interface ProviderStatus {
  readonly offering: OfferingProjectionOutcome;
  readonly directory: DirectoryProjectionOutcome;
}

export interface ProjectionDependencies {
  readonly fetch?: typeof fetch;
}

const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const canonicalAddressPattern = /^0x[0-9a-f]{40}$/u;
const canonicalIntegerPattern = /^(?:0|[1-9][0-9]*)$/u;
const offeringStates: readonly OfferingState[] = ["DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"];
const termsFields = [
  "version",
  "fundingTargetTinybars",
  "noteUnitPriceTinybars",
  "maximumNoteUnits",
  "minimumPurchaseUnits",
  "reserveShareBps",
  "issuerShareBps",
  "platformFeeBps",
  "payoutCapTinybars",
] as const;
const directoryFields = [
  "schemaVersion",
  "serviceId",
  "serviceSlug",
  "offeringPublicId",
  "offeringVersion",
  "capabilities",
  "x402Endpoint",
  "paymentProtocol",
  "paymentNetwork",
  "asset",
  "advertisedTiers",
  "issuerRevenueAccount",
  "clearingAccount",
  "status",
  "publishedAt",
] as const;

export function isOfferingPublicId(value: unknown): value is string {
  return typeof value === "string" && publicIdPattern.test(value);
}

export function readProjectionSite(
  environment: Readonly<Record<string, string | undefined>>,
): string | null {
  const value = environment.TOOL402_CONVEX_SITE_URL;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    return null;
  }
  return url.origin;
}

function exactRecord(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  for (const key of required) {
    if (!keys.includes(key)) return null;
  }
  for (const key of keys) {
    if (!required.includes(key) && !optional.includes(key)) return null;
  }
  return value as Record<string, unknown>;
}

function stringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return null;
  return Object.freeze([...value] as string[]);
}

function parseOfferingRecord(value: unknown): OfferingProjectionRecord | null {
  const record = exactRecord(value, [
    "offeringPublicId",
    "version",
    "subjectPublicId",
    "state",
    "definition",
    "narrative",
    "advertisedQuickPriceTinybars",
    "advertisedStandardPriceTinybars",
    "canonicalSignerAddress",
    "acceptedAt",
    "updatedAt",
  ], ["atsAssetEvmAddress"]);
  if (record === null) return null;
  const definition = exactRecord(record.definition, ["schemaVersion", "terms", "maturityAt", "qualifyingResource"]);
  const terms = definition === null ? null : exactRecord(definition.terms, termsFields);
  const narrative = exactRecord(record.narrative, ["title", "customerProblem", "customerUseCases", "useOfFunds", "risks"]);
  if (
    definition === null ||
    terms === null ||
    narrative === null ||
    !isOfferingPublicId(record.offeringPublicId) ||
    !isOfferingPublicId(record.subjectPublicId) ||
    typeof record.version !== "number" ||
    !Number.isSafeInteger(record.version) ||
    record.version < 1 ||
    !offeringStates.includes(record.state as OfferingState) ||
    definition.schemaVersion !== 1 ||
    termsFields.some((field) => typeof terms[field] !== "string") ||
    typeof definition.maturityAt !== "string" ||
    typeof definition.qualifyingResource !== "string" ||
    typeof narrative.title !== "string" ||
    typeof narrative.customerProblem !== "string" ||
    typeof record.advertisedQuickPriceTinybars !== "string" ||
    typeof record.advertisedStandardPriceTinybars !== "string" ||
    typeof record.canonicalSignerAddress !== "string" ||
    !canonicalAddressPattern.test(record.canonicalSignerAddress) ||
    typeof record.acceptedAt !== "string" ||
    !canonicalIntegerPattern.test(record.acceptedAt) ||
    typeof record.updatedAt !== "string" ||
    !canonicalIntegerPattern.test(record.updatedAt) ||
    (Object.hasOwn(record, "atsAssetEvmAddress") &&
      (typeof record.atsAssetEvmAddress !== "string" || !canonicalAddressPattern.test(record.atsAssetEvmAddress)))
  ) {
    return null;
  }
  const customerUseCases = stringArray(narrative.customerUseCases);
  const useOfFunds = stringArray(narrative.useOfFunds);
  const risks = stringArray(narrative.risks);
  if (customerUseCases === null || useOfFunds === null || risks === null) return null;
  return Object.freeze({
    offeringPublicId: record.offeringPublicId,
    version: record.version,
    subjectPublicId: record.subjectPublicId,
    state: record.state as OfferingState,
    definition: Object.freeze({
      schemaVersion: 1 as const,
      terms: Object.freeze(Object.fromEntries(termsFields.map((field) => [field, terms[field] as string]))) as OfferingProjectionRecord["definition"]["terms"],
      maturityAt: definition.maturityAt,
      qualifyingResource: definition.qualifyingResource,
    }),
    narrative: Object.freeze({
      title: narrative.title,
      customerProblem: narrative.customerProblem,
      customerUseCases,
      useOfFunds,
      risks,
    }),
    advertisedQuickPriceTinybars: record.advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars: record.advertisedStandardPriceTinybars,
    canonicalSignerAddress: record.canonicalSignerAddress,
    ...(Object.hasOwn(record, "atsAssetEvmAddress") ? { atsAssetEvmAddress: record.atsAssetEvmAddress as string } : {}),
    acceptedAt: record.acceptedAt,
    updatedAt: record.updatedAt,
  });
}

function parseDirectoryRecord(value: unknown): DirectoryProjectionRecord | null {
  const record = exactRecord(value, directoryFields, ["webUrl"]);
  if (record === null) return null;
  const capabilities = stringArray(record.capabilities);
  const advertisedTiers = stringArray(record.advertisedTiers);
  if (
    capabilities === null ||
    advertisedTiers === null ||
    record.schemaVersion !== 1 ||
    typeof record.serviceId !== "string" ||
    record.serviceSlug !== "riskscan" ||
    !isOfferingPublicId(record.offeringPublicId) ||
    typeof record.offeringVersion !== "number" ||
    !Number.isSafeInteger(record.offeringVersion) ||
    record.offeringVersion < 1 ||
    typeof record.x402Endpoint !== "string" ||
    (Object.hasOwn(record, "webUrl") && typeof record.webUrl !== "string") ||
    record.paymentProtocol !== "x402" ||
    record.paymentNetwork !== "hedera-testnet" ||
    record.asset !== "HBAR" ||
    typeof record.issuerRevenueAccount !== "string" ||
    typeof record.clearingAccount !== "string" ||
    record.status !== "active" ||
    typeof record.publishedAt !== "string"
  ) {
    return null;
  }
  return Object.freeze({
    schemaVersion: 1 as const,
    serviceId: record.serviceId,
    serviceSlug: "riskscan" as const,
    offeringPublicId: record.offeringPublicId,
    offeringVersion: record.offeringVersion,
    capabilities,
    x402Endpoint: record.x402Endpoint,
    ...(Object.hasOwn(record, "webUrl") ? { webUrl: record.webUrl as string } : {}),
    paymentProtocol: "x402" as const,
    paymentNetwork: "hedera-testnet" as const,
    asset: "HBAR" as const,
    advertisedTiers,
    issuerRevenueAccount: record.issuerRevenueAccount,
    clearingAccount: record.clearingAccount,
    status: "active" as const,
    publishedAt: record.publishedAt,
  });
}

type BoundedRead =
  | { readonly kind: "response"; readonly status: number; readonly body: unknown }
  | { readonly kind: "thrown" }
  | { readonly kind: "unparsable" };

async function readBounded(
  fetchImplementation: typeof fetch,
  url: string,
  timeoutMilliseconds: number,
): Promise<BoundedRead> {
  let response: Response;
  try {
    response = await fetchImplementation(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });
  } catch {
    return { kind: "thrown" };
  }
  if (response.body === null) {
    return { kind: "unparsable" };
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > PROJECTION_MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return { kind: "unparsable" };
      }
      chunks.push(value);
    }
  } catch {
    return { kind: "unparsable" };
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return {
      kind: "response",
      status: response.status,
      body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    return { kind: "unparsable" };
  }
}

function outcomeOf(read: BoundedRead): { readonly body: unknown } | ProjectionFailure {
  if (read.kind === "thrown") return { kind: "unavailable" };
  if (read.kind === "unparsable") return { kind: "unexpected_response" };
  if (read.status === 404) return { kind: "absent" };
  if (read.status === 503) return { kind: "unavailable" };
  if (read.status !== 200) return { kind: "unexpected_response" };
  return { body: read.body };
}

function foundBody(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  const body = exactRecord(value, ["outcome", ...fields]);
  return body === null || body.outcome !== "FOUND" ? null : body;
}

export async function readOfferingProjection(
  offeringPublicId: unknown,
  environment: Readonly<Record<string, string | undefined>>,
  dependencies: ProjectionDependencies = {},
): Promise<OfferingProjectionOutcome> {
  if (!isOfferingPublicId(offeringPublicId)) {
    throw new RangeError("offeringPublicId must match the accepted public-id grammar");
  }
  const site = readProjectionSite(environment);
  if (site === null) return { kind: "not_configured" };
  const read = outcomeOf(
    await readBounded(dependencies.fetch ?? globalThis.fetch, `${site}/public/offerings/${offeringPublicId}`, OFFERING_READ_TIMEOUT_MILLISECONDS),
  );
  if ("kind" in read) return read;
  const body = foundBody(read.body, ["record"]);
  const record = body === null ? null : parseOfferingRecord(body.record);
  return record === null ? { kind: "unexpected_response" } : { kind: "loaded", record };
}

export async function readActiveDirectory(
  environment: Readonly<Record<string, string | undefined>>,
  dependencies: ProjectionDependencies = {},
): Promise<DirectoryProjectionOutcome> {
  const site = readProjectionSite(environment);
  if (site === null) return { kind: "not_configured" };
  const read = outcomeOf(
    await readBounded(dependencies.fetch ?? globalThis.fetch, `${site}/public/directory/riskscan/active`, DIRECTORY_READ_TIMEOUT_MILLISECONDS),
  );
  if ("kind" in read) return read;
  const body = foundBody(read.body, ["record", "directoryVersion"]);
  const record = body === null ? null : parseDirectoryRecord(body.record);
  const directoryVersion = body?.directoryVersion;
  if (
    record === null ||
    typeof directoryVersion !== "number" ||
    !Number.isSafeInteger(directoryVersion) ||
    directoryVersion < 1
  ) {
    return { kind: "unexpected_response" };
  }
  return { kind: "loaded", record, directoryVersion };
}

export async function readProviderStatus(
  offeringPublicId: unknown,
  environment: Readonly<Record<string, string | undefined>> = process.env,
  dependencies: ProjectionDependencies = {},
): Promise<ProviderStatus> {
  const [offering, directory] = await Promise.all([
    readOfferingProjection(offeringPublicId, environment, dependencies),
    readActiveDirectory(environment, dependencies),
  ]);
  return { offering, directory };
}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function offeringsResponse(
  offeringPublicId: unknown,
  environment: Readonly<Record<string, string | undefined>>,
  dependencies: ProjectionDependencies = {},
): Promise<Response> {
  if (!isOfferingPublicId(offeringPublicId)) {
    return jsonResponse({ error: "invalid_offering_public_id" }, 400);
  }
  return jsonResponse(await readProviderStatus(offeringPublicId, environment, dependencies), 200);
}
