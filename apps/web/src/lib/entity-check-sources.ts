import type {
  EntityCheckRequest,
  EntityRegistryCandidate,
  EntityRegistrySource,
  EntitySanctionsDataset,
  EntitySanctionsEntry,
} from "@tool402/core";
import { createHash } from "node:crypto";

export type EntityCheckSourceConfiguration = Readonly<{
  registryBaseUrl: string;
  sanctionsUrl: string;
}>;

export type EntityCheckSourceFetcher = (
  input: URL,
  init: RequestInit,
) => Promise<Response>;

export type EntityCheckSourceDependencies = Readonly<{
  fetch: EntityCheckSourceFetcher;
  now: () => number;
}>;

export type EntityCheckSourceResult =
  | Readonly<{
      kind: "read";
      registryCandidates: readonly EntityRegistryCandidate[];
      droppedCandidates: number;
      registrySource: EntityRegistrySource;
      sanctionsDataset: EntitySanctionsDataset;
    }>
  | Readonly<{ kind: "not_configured" }>
  | Readonly<{ kind: "registry_unavailable" }>
  | Readonly<{ kind: "sanctions_unavailable" }>;

type CanonicalClock = Readonly<{
  milliseconds: number;
  timestamp: string;
}>;

type RegistryRead = Readonly<{
  candidates: readonly EntityRegistryCandidate[];
  droppedCandidates: number;
}>;

type BoundedResponse = Readonly<{
  bytes: Uint8Array;
  headers: Headers;
}>;

type CachedSanctionsDataset = Readonly<{
  cachedAt: number;
  dataset: EntitySanctionsDataset;
}>;

const registryBaseKey = "ENTITYCHECK_REGISTRY_BASE_URL";
const sanctionsUrlKey = "ENTITYCHECK_SANCTIONS_URL";
const registryTimeoutMilliseconds = 5_000;
const sanctionsTimeoutMilliseconds = 20_000;
const registryMaximumBytes = 1_048_576;
const sanctionsMaximumBytes = 16_777_216;
const sanctionsCacheLifetimeMilliseconds = 86_400_000;
const sirenPattern = /^[0-9]{9}$/u;
const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const isoTimestampPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u;
const imfFixdatePattern = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/u;
const abortedRead = Symbol("aborted EntityCheck source read");
const notConfigured: EntityCheckSourceResult = Object.freeze({ kind: "not_configured" });
const registryUnavailable: EntityCheckSourceResult = Object.freeze({ kind: "registry_unavailable" });
const sanctionsUnavailable: EntityCheckSourceResult = Object.freeze({ kind: "sanctions_unavailable" });
const sanctionsCache = new Map<string, CachedSanctionsDataset>();

function ownPrimitiveString(input: unknown, key: string): string | null {
  if (input === null || typeof input !== "object") {
    return null;
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set") ||
      typeof descriptor.value !== "string"
    ) {
      return null;
    }
    const value = descriptor.value.trim();
    return value.length === 0 ? null : value;
  } catch {
    return null;
  }
}

function parseRegistryBase(value: string): URL | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname.length === 0 ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function parseSanctionsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname.length === 0 ||
      url.username !== "" ||
      url.password !== ""
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function readEntityCheckSourceConfiguration(
  environment: NodeJS.ProcessEnv,
): EntityCheckSourceConfiguration | null {
  const registryBase = ownPrimitiveString(environment, registryBaseKey);
  const sanctionsSource = ownPrimitiveString(environment, sanctionsUrlKey);
  if (registryBase === null || sanctionsSource === null) {
    return null;
  }

  const registryUrl = parseRegistryBase(registryBase);
  const sanctionsUrl = parseSanctionsUrl(sanctionsSource);
  if (registryUrl === null || sanctionsUrl === null) {
    return null;
  }

  return Object.freeze({
    registryBaseUrl: registryUrl.href,
    sanctionsUrl: sanctionsUrl.href,
  });
}

function calendarDateIsValid(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysByMonth = [
    31,
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  const maximum = daysByMonth[month - 1];
  return maximum !== undefined && day <= maximum;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const match = calendarDatePattern.exec(value);
  if (match === null) {
    return false;
  }
  return calendarDateIsValid(Number(match[1]), Number(match[2]), Number(match[3]));
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const match = isoTimestampPattern.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  return (
    calendarDateIsValid(year, month, day) &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    !Number.isNaN(Date.parse(value))
  );
}

function isLastModified(value: string): boolean {
  if (isIsoTimestamp(value)) {
    return true;
  }
  if (!imfFixdatePattern.test(value)) {
    return false;
  }
  const milliseconds = Date.parse(value);
  return !Number.isNaN(milliseconds) && new Date(milliseconds).toUTCString() === value;
}

function canonicalClock(dependencies: unknown): CanonicalClock | null {
  if (dependencies === null || typeof dependencies !== "object") {
    return null;
  }

  try {
    const now = Reflect.get(dependencies, "now");
    if (typeof now !== "function") {
      return null;
    }
    const milliseconds = Reflect.apply(now, dependencies, []);
    if (typeof milliseconds !== "number" || !Number.isSafeInteger(milliseconds)) {
      return null;
    }
    const timestamp = new Date(milliseconds).toISOString();
    if (!isIsoTimestamp(timestamp)) {
      return null;
    }
    return Object.freeze({ milliseconds, timestamp });
  } catch {
    return null;
  }
}

function injectedFetcher(dependencies: unknown): EntityCheckSourceFetcher | null {
  if (dependencies === null || typeof dependencies !== "object") {
    return null;
  }

  try {
    const fetcher = Reflect.get(dependencies, "fetch");
    return typeof fetcher === "function" ? fetcher as EntityCheckSourceFetcher : null;
  } catch {
    return null;
  }
}

function configuredSources(
  configuration: EntityCheckSourceConfiguration | null,
): Readonly<{ registryUrl: URL; sanctionsUrl: URL }> | null {
  if (configuration === null || typeof configuration !== "object") {
    return null;
  }

  try {
    const registryUrl = parseRegistryBase(configuration.registryBaseUrl);
    const sanctionsUrl = parseSanctionsUrl(configuration.sanctionsUrl);
    if (registryUrl === null || sanctionsUrl === null) {
      return null;
    }
    return Object.freeze({ registryUrl, sanctionsUrl });
  } catch {
    return null;
  }
}

function cancelResponse(response: Response): void {
  try {
    const cancellation = response.body?.cancel();
    void cancellation?.catch(() => undefined);
  } catch {
    // Best effort after a rejected bounded read.
  }
}

function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  try {
    void reader.cancel().catch(() => undefined);
  } catch {
    // Best effort after a deadline or bounded-read failure.
  }
}

async function settleBeforeDeadline<T>(
  operation: Promise<T>,
  deadline: AbortSignal,
): Promise<T | typeof abortedRead> {
  if (deadline.aborted) {
    return abortedRead;
  }

  let removeAbortListener = () => {};
  const abort = new Promise<typeof abortedRead>((resolve) => {
    const onAbort = () => resolve(abortedRead);
    deadline.addEventListener("abort", onAbort, { once: true });
    removeAbortListener = () => deadline.removeEventListener("abort", onAbort);
  });

  try {
    return await Promise.race([operation, abort]);
  } finally {
    removeAbortListener();
  }
}

async function readBoundedBytes(
  response: Response,
  deadline: AbortSignal,
  maximumBytes: number,
): Promise<Uint8Array | null> {
  const stream = response.body;
  if (stream === null) {
    return null;
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    reader = stream.getReader();
  } catch {
    cancelResponse(response);
    return null;
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    for (;;) {
      const read = await settleBeforeDeadline(reader.read(), deadline);
      if (read === abortedRead) {
        cancelReader(reader);
        return null;
      }
      if (read.done) {
        break;
      }
      if (!(read.value instanceof Uint8Array)) {
        cancelReader(reader);
        return null;
      }

      byteLength += read.value.byteLength;
      if (byteLength > maximumBytes) {
        cancelReader(reader);
        return null;
      }
      chunks.push(read.value);
    }
  } catch {
    cancelReader(reader);
    return null;
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function fetchBounded(
  fetcher: EntityCheckSourceFetcher,
  url: URL,
  timeoutMilliseconds: number,
  maximumBytes: number,
): Promise<BoundedResponse | null> {
  try {
    const deadline = AbortSignal.timeout(timeoutMilliseconds);
    const pendingResponse = Promise.resolve().then(() =>
      fetcher(url, {
        method: "GET",
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
        signal: deadline,
      }),
    );

    const response = await settleBeforeDeadline(pendingResponse, deadline);
    if (response === abortedRead) {
      void pendingResponse.then(cancelResponse, () => undefined);
      return null;
    }
    if (!(response instanceof Response)) {
      return null;
    }
    if (response.status !== 200) {
      cancelResponse(response);
      return null;
    }

    const bytes = await readBoundedBytes(response, deadline, maximumBytes);
    if (bytes === null) {
      cancelResponse(response);
      return null;
    }
    return Object.freeze({ bytes, headers: response.headers });
  } catch {
    return null;
  }
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function plainRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    return null;
  }
  return value as Record<string, unknown>;
}

function mapRegistryCandidate(value: unknown): EntityRegistryCandidate | null {
  const record = plainRecord(value);
  if (record === null) {
    return null;
  }

  const siren = record.siren;
  const legalName = record.nom_complet;
  const state = record.etat_administratif;
  const incorporationDate = record.date_creation;
  const updatedAt = record.date_mise_a_jour;
  if (
    typeof siren !== "string" ||
    !sirenPattern.test(siren) ||
    typeof legalName !== "string" ||
    legalName.trim().length === 0 ||
    !isCalendarDate(incorporationDate) ||
    !isIsoTimestamp(updatedAt)
  ) {
    return null;
  }

  const administrativeStatus = state === "A" ? "active" : state === "C" ? "ceased" : null;
  if (administrativeStatus === null || !Array.isArray(record.dirigeants)) {
    return null;
  }
  const officerCount = record.dirigeants.length;
  if (!Number.isSafeInteger(officerCount) || officerCount < 0) {
    return null;
  }

  let registeredAddress = "";
  const registeredOffice = plainRecord(record.siege);
  if (registeredOffice !== null && Object.hasOwn(registeredOffice, "adresse")) {
    if (typeof registeredOffice.adresse !== "string") {
      return null;
    }
    registeredAddress = registeredOffice.adresse;
  }

  return Object.freeze({
    siren,
    legalName,
    administrativeStatus,
    incorporationDate,
    registeredAddress,
    officerCount,
    registryUpdatedAt: updatedAt,
  });
}

function parseRegistryRead(bytes: Uint8Array): RegistryRead | null {
  const text = decodeUtf8(bytes);
  if (text === null) {
    return null;
  }

  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return null;
  }
  const root = plainRecord(input);
  if (root === null || !Array.isArray(root.results)) {
    return null;
  }

  const candidates: EntityRegistryCandidate[] = [];
  let droppedCandidates = 0;
  for (const record of root.results) {
    const candidate = mapRegistryCandidate(record);
    if (candidate === null) {
      droppedCandidates += 1;
    } else {
      candidates.push(candidate);
    }
  }
  return Object.freeze({
    candidates: Object.freeze(candidates),
    droppedCandidates,
  });
}

function appendCsvRow(
  rows: string[][],
  row: string[],
  field: string,
  quotedFieldClosed: boolean,
): void {
  if (row.length === 0 && field.length === 0 && !quotedFieldClosed) {
    return;
  }
  row.push(field);
  rows.push(row);
}

function parseCsv(text: string): readonly (readonly string[])[] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let quotedFieldClosed = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === undefined) {
      return null;
    }

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          quotedFieldClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (quotedFieldClosed && character !== "," && character !== "\r" && character !== "\n") {
      return null;
    }
    if (character === '"') {
      if (field.length !== 0) {
        return null;
      }
      quoted = true;
      continue;
    }
    if (character === ",") {
      row.push(field);
      field = "";
      quotedFieldClosed = false;
      continue;
    }
    if (character === "\r") {
      if (text[index + 1] !== "\n") {
        return null;
      }
      appendCsvRow(rows, row, field, quotedFieldClosed);
      row = [];
      field = "";
      quotedFieldClosed = false;
      index += 1;
      continue;
    }
    if (character === "\n") {
      appendCsvRow(rows, row, field, quotedFieldClosed);
      row = [];
      field = "";
      quotedFieldClosed = false;
      continue;
    }
    field += character;
  }

  if (quoted) {
    return null;
  }
  if (field.length > 0 || row.length > 0 || quotedFieldClosed) {
    appendCsvRow(rows, row, field, quotedFieldClosed);
  }
  return Object.freeze(rows.map((parsedRow) => Object.freeze(parsedRow)));
}

function parsePrograms(value: string): readonly string[] | null {
  if (value === "-0-") {
    return Object.freeze([]);
  }
  const programs = value
    .split("] [")
    .map((program) => program.replaceAll("[", "").replaceAll("]", ""));
  if (programs.some((program) => program.trim().length === 0)) {
    return null;
  }
  return Object.freeze(programs);
}

function parseSanctionsDataset(
  bytes: Uint8Array,
  lastModifiedHeader: string | null,
  clock: CanonicalClock,
): EntitySanctionsDataset | null {
  const text = decodeUtf8(bytes);
  if (text === null) {
    return null;
  }
  const rows = parseCsv(text);
  if (rows === null || rows.length === 0) {
    return null;
  }

  const entries: EntitySanctionsEntry[] = [];
  for (const row of rows) {
    if (row.length !== 12) {
      return null;
    }
    const [entryId, name, entryType, rawPrograms] = row;
    if (
      typeof entryId !== "string" ||
      entryId.trim().length === 0 ||
      typeof name !== "string" ||
      name.trim().length === 0 ||
      typeof entryType !== "string" ||
      typeof rawPrograms !== "string"
    ) {
      return null;
    }
    const programs = parsePrograms(rawPrograms);
    if (programs === null) {
      return null;
    }
    entries.push(Object.freeze({ entryId, name, entryType, programs }));
  }
  if (entries.length === 0) {
    return null;
  }

  const lastModified = lastModifiedHeader ?? clock.timestamp;
  if (!isLastModified(lastModified)) {
    return null;
  }
  return Object.freeze({
    source: "OFAC_SDN" as const,
    lastModified,
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    entries: Object.freeze(entries),
  });
}

function registryTarget(source: URL, request: EntityCheckRequest): URL {
  const target = new URL("search", source);
  target.searchParams.set("q", request.registrationNumber ?? request.query);
  target.searchParams.set("per_page", "5");
  return target;
}

async function readRegistry(
  fetcher: EntityCheckSourceFetcher,
  request: EntityCheckRequest,
  source: URL,
): Promise<RegistryRead | null> {
  const response = await fetchBounded(
    fetcher,
    registryTarget(source, request),
    registryTimeoutMilliseconds,
    registryMaximumBytes,
  );
  return response === null ? null : parseRegistryRead(response.bytes);
}

async function readSanctions(
  fetcher: EntityCheckSourceFetcher,
  source: URL,
  clock: CanonicalClock,
): Promise<EntitySanctionsDataset | null> {
  const cacheKey = source.href;
  const cached = sanctionsCache.get(cacheKey);
  if (cached !== undefined) {
    const age = clock.milliseconds - cached.cachedAt;
    if (age >= 0 && age < sanctionsCacheLifetimeMilliseconds) {
      return cached.dataset;
    }
    sanctionsCache.delete(cacheKey);
  }

  const response = await fetchBounded(
    fetcher,
    source,
    sanctionsTimeoutMilliseconds,
    sanctionsMaximumBytes,
  );
  if (response === null) {
    return null;
  }
  const dataset = parseSanctionsDataset(
    response.bytes,
    response.headers.get("last-modified"),
    clock,
  );
  if (dataset === null) {
    return null;
  }
  sanctionsCache.set(cacheKey, Object.freeze({ cachedAt: clock.milliseconds, dataset }));
  return dataset;
}

export async function readEntityCheckSources(
  request: EntityCheckRequest,
  configuration: EntityCheckSourceConfiguration | null,
  dependencies: EntityCheckSourceDependencies,
): Promise<EntityCheckSourceResult> {
  const sources = configuredSources(configuration);
  if (sources === null) {
    return notConfigured;
  }

  const clock = canonicalClock(dependencies);
  const fetcher = injectedFetcher(dependencies);
  if (clock === null || fetcher === null) {
    return registryUnavailable;
  }

  const registry = await readRegistry(fetcher, request, sources.registryUrl);
  if (registry === null) {
    return registryUnavailable;
  }
  const sanctionsDataset = await readSanctions(fetcher, sources.sanctionsUrl, clock);
  if (sanctionsDataset === null) {
    return sanctionsUnavailable;
  }

  const registrySource: EntityRegistrySource = Object.freeze({
    source: "FR_RECHERCHE_ENTREPRISES" as const,
    readAt: clock.timestamp,
  });
  return Object.freeze({
    kind: "read" as const,
    registryCandidates: registry.candidates,
    droppedCandidates: registry.droppedCandidates,
    registrySource,
    sanctionsDataset,
  });
}
