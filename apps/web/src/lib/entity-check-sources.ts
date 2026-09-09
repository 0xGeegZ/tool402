import type {
  EntityCheckRequest,
  EntityRegistryCandidate,
  EntityRegistrySource,
  SanctionsDataset,
  SanctionsDatasetDescriptor,
  SanctionsEntry,
} from "@tool402/core";

export interface EntityCheckSourceConfiguration {
  readonly registryBaseUrl: string;
  readonly sanctionsUrl: string;
}

export interface EntityCheckSourceDependencies {
  readonly fetch: typeof fetch;
  readonly now: () => number;
}

export type EntityCheckSourcesOutcome =
  | {
      readonly kind: "read";
      readonly registryCandidates: readonly EntityRegistryCandidate[];
      readonly droppedCandidates: number;
      readonly registrySource: EntityRegistrySource;
      readonly sanctionsDataset: SanctionsDataset;
    }
  | { readonly kind: "not_configured" }
  | { readonly kind: "registry_unavailable" }
  | { readonly kind: "sanctions_unavailable" };

export const ENTITYCHECK_REGISTRY_TIMEOUT_MILLISECONDS = 5_000;
export const ENTITYCHECK_REGISTRY_MAX_BYTES = 1_048_576;
export const ENTITYCHECK_SANCTIONS_TIMEOUT_MILLISECONDS = 20_000;
export const ENTITYCHECK_SANCTIONS_MAX_BYTES = 16_777_216;
export const ENTITYCHECK_SANCTIONS_CACHE_MILLISECONDS = 24 * 60 * 60 * 1000;

interface CachedSanctionsDataset {
  readonly dataset: SanctionsDataset;
  readonly readAtMilliseconds: number;
}

const sanctionsCache = new Map<string, CachedSanctionsDataset>();
const registryPerPage = 5;
const sirenPattern = /^[0-9]{9}$/u;
const calendarDatePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u;
const registryTimestampPattern =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?Z?$/u;
const sdnEmptyMarker = "-0-";
const sdnColumnCount = 12;
const sdnTrailingEndOfFile = /+$/u;

function parseHttpsUrl(
  value: string | undefined,
  allowQuery: boolean,
): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
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
    url.hash !== "" ||
    (!allowQuery && url.search !== "")
  ) {
    return null;
  }
  return url.href;
}

export function readEntityCheckSourceConfiguration(
  environment: Readonly<Record<string, string | undefined>>,
): EntityCheckSourceConfiguration | null {
  const registryBaseUrl = parseHttpsUrl(
    environment.ENTITYCHECK_REGISTRY_BASE_URL,
    false,
  );
  const sanctionsUrl = parseHttpsUrl(
    environment.ENTITYCHECK_SANCTIONS_URL,
    true,
  );
  if (registryBaseUrl === null || sanctionsUrl === null) {
    return null;
  }
  return Object.freeze({
    registryBaseUrl: registryBaseUrl.replace(/\/+$/u, ""),
    sanctionsUrl,
  });
}

async function readBoundedBody(
  response: Response,
  limit: number,
): Promise<Uint8Array | null> {
  if (response.body === null) {
    return new Uint8Array(0);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function readBounded(
  fetchImplementation: typeof fetch,
  url: string,
  timeoutMilliseconds: number,
  limit: number,
): Promise<{ readonly bytes: Uint8Array; readonly headers: Headers } | null> {
  let response: Response;
  try {
    response = await fetchImplementation(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });
  } catch {
    return null;
  }
  if (response.status !== 200) {
    return null;
  }
  const bytes = await readBoundedBody(response, limit);
  return bytes === null ? null : { bytes, headers: response.headers };
}

function canonicalRegistryTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !registryTimestampPattern.test(value)) {
    return null;
  }
  const instant = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

function mapRegistryCandidate(item: unknown): EntityRegistryCandidate | null {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return null;
  }
  const record = item as Record<string, unknown>;
  const {
    siren,
    nom_complet: legalName,
    etat_administratif: status,
    date_creation: created,
    siege,
    dirigeants,
  } = record;
  const administrativeStatus =
    status === "A" ? "active" : status === "C" ? "ceased" : null;
  const registryUpdatedAt = canonicalRegistryTimestamp(record.date_mise_a_jour);
  if (
    typeof siren !== "string" ||
    !sirenPattern.test(siren) ||
    typeof legalName !== "string" ||
    legalName.trim().length === 0 ||
    administrativeStatus === null ||
    typeof created !== "string" ||
    !calendarDatePattern.test(created) ||
    registryUpdatedAt === null
  ) {
    return null;
  }
  const seat =
    typeof siege === "object" && siege !== null
      ? (siege as Record<string, unknown>)
      : {};
  return Object.freeze({
    siren,
    legalName: legalName.trim(),
    administrativeStatus,
    incorporationDate: created,
    registeredAddress: typeof seat.adresse === "string" ? seat.adresse : "",
    officerCount: Array.isArray(dirigeants) ? dirigeants.length : 0,
    registryUpdatedAt,
  });
}

function parseRegistryBody(bytes: Uint8Array): {
  readonly candidates: readonly EntityRegistryCandidate[];
  readonly dropped: number;
} | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const { results } = parsed as { results?: unknown };
  if (!Array.isArray(results)) {
    return null;
  }
  const candidates: EntityRegistryCandidate[] = [];
  let dropped = 0;
  for (const item of results) {
    const candidate = mapRegistryCandidate(item);
    if (candidate === null) {
      dropped += 1;
    } else {
      candidates.push(candidate);
    }
  }
  return { candidates: Object.freeze(candidates), dropped };
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] as string;
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function sdnValue(column: string | undefined): string {
  const value = (column ?? "").trim();
  return value === sdnEmptyMarker ? "" : value;
}

function sdnPrograms(column: string | undefined): readonly string[] {
  const value = sdnValue(column).replace(/^\[/u, "").replace(/\]$/u, "");
  return Object.freeze(
    value
      .split("] [")
      .map((program) => program.trim())
      .filter((program) => program.length > 0),
  );
}

function parseSanctionsEntries(bytes: Uint8Array): readonly SanctionsEntry[] {
  const text = new TextDecoder("utf-8")
    .decode(bytes)
    .replace(sdnTrailingEndOfFile, "");
  const entries: SanctionsEntry[] = [];
  for (const row of parseCsvRows(text)) {
    if (row.length !== sdnColumnCount) continue;
    const entryId = sdnValue(row[0]);
    const name = sdnValue(row[1]);
    if (entryId.length === 0 || name.length === 0) continue;
    entries.push(
      Object.freeze({
        entryId,
        name,
        entryType: sdnValue(row[2]),
        programs: sdnPrograms(row[3]),
      }),
    );
  }
  return Object.freeze(entries);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    bytes as BufferSource,
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function headerTimestamp(
  headers: Headers,
  fallbackMilliseconds: number,
): string {
  const lastModified = headers.get("last-modified");
  const parsed = lastModified === null ? Number.NaN : Date.parse(lastModified);
  return new Date(
    Number.isNaN(parsed) ? fallbackMilliseconds : parsed,
  ).toISOString();
}

async function readSanctionsDataset(
  url: string,
  dependencies: EntityCheckSourceDependencies,
): Promise<SanctionsDataset | null> {
  const nowMilliseconds = dependencies.now();
  const cached = sanctionsCache.get(url);
  if (
    cached !== undefined &&
    nowMilliseconds - cached.readAtMilliseconds <
      ENTITYCHECK_SANCTIONS_CACHE_MILLISECONDS
  ) {
    return cached.dataset;
  }
  const read = await readBounded(
    dependencies.fetch,
    url,
    ENTITYCHECK_SANCTIONS_TIMEOUT_MILLISECONDS,
    ENTITYCHECK_SANCTIONS_MAX_BYTES,
  );
  if (read === null) {
    return null;
  }
  const descriptor: SanctionsDatasetDescriptor = {
    source: "OFAC_SDN",
    lastModified: headerTimestamp(read.headers, nowMilliseconds),
    contentHash: await sha256Hex(read.bytes),
  };
  const dataset: SanctionsDataset = Object.freeze({
    ...descriptor,
    entries: parseSanctionsEntries(read.bytes),
  });
  sanctionsCache.set(url, { dataset, readAtMilliseconds: nowMilliseconds });
  return dataset;
}

export function inspectEntityCheckSanctionsCache(): readonly {
  readonly url: string;
  readonly descriptor: SanctionsDatasetDescriptor;
  readonly entryCount: number;
  readonly readAt: string;
}[] {
  return Object.freeze(
    [...sanctionsCache.entries()].map(([url, cached]) =>
      Object.freeze({
        url,
        descriptor: Object.freeze({
          source: cached.dataset.source,
          lastModified: cached.dataset.lastModified,
          contentHash: cached.dataset.contentHash,
        }),
        entryCount: cached.dataset.entries.length,
        readAt: new Date(cached.readAtMilliseconds).toISOString(),
      }),
    ),
  );
}

export async function readEntityCheckSources(
  request: EntityCheckRequest,
  configuration: EntityCheckSourceConfiguration | null,
  dependencies: EntityCheckSourceDependencies,
): Promise<EntityCheckSourcesOutcome> {
  if (
    typeof dependencies.fetch !== "function" ||
    typeof dependencies.now !== "function"
  ) {
    throw new TypeError(
      "EntityCheck source reads need an injected fetch and clock",
    );
  }
  if (configuration === null) {
    return { kind: "not_configured" };
  }
  const term = request.registrationNumber ?? request.query;
  const registryUrl = `${configuration.registryBaseUrl}/search?q=${encodeURIComponent(term)}&per_page=${registryPerPage}`;
  const readAt = new Date(dependencies.now()).toISOString();
  const registryRead = await readBounded(
    dependencies.fetch,
    registryUrl,
    ENTITYCHECK_REGISTRY_TIMEOUT_MILLISECONDS,
    ENTITYCHECK_REGISTRY_MAX_BYTES,
  );
  const registry =
    registryRead === null ? null : parseRegistryBody(registryRead.bytes);
  if (registry === null) {
    return { kind: "registry_unavailable" };
  }
  const sanctionsDataset = await readSanctionsDataset(
    configuration.sanctionsUrl,
    dependencies,
  );
  if (sanctionsDataset === null) {
    return { kind: "sanctions_unavailable" };
  }
  return {
    kind: "read",
    registryCandidates: registry.candidates,
    droppedCandidates: registry.dropped,
    registrySource: Object.freeze({
      source: "FR_RECHERCHE_ENTREPRISES",
      readAt,
    }),
    sanctionsDataset,
  };
}
