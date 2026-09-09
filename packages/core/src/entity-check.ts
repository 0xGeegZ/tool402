export type EntityCheckJurisdiction = "FR";

export interface EntityCheckRequestInput {
  readonly requestRef: string;
  readonly jurisdiction: EntityCheckJurisdiction;
  readonly query: string;
  readonly registrationNumber?: string;
}

export interface EntityCheckRequest {
  readonly requestRef: string;
  readonly jurisdiction: EntityCheckJurisdiction;
  readonly query: string;
  readonly registrationNumber?: string;
}

export type EntityAdministrativeStatus = "active" | "ceased";

export interface EntityRegistryCandidate {
  readonly siren: string;
  readonly legalName: string;
  readonly administrativeStatus: EntityAdministrativeStatus;
  readonly incorporationDate: string;
  readonly registeredAddress: string;
  readonly officerCount: number;
  readonly registryUpdatedAt: string;
}

export interface EntityRegistrySource {
  readonly source: "FR_RECHERCHE_ENTREPRISES";
  readonly readAt: string;
}

export interface SanctionsEntry {
  readonly entryId: string;
  readonly name: string;
  readonly entryType: string;
  readonly programs: readonly string[];
}

export interface SanctionsDatasetDescriptor {
  readonly source: "OFAC_SDN";
  readonly lastModified: string;
  readonly contentHash: string;
}

export interface SanctionsDataset extends SanctionsDatasetDescriptor {
  readonly entries: readonly SanctionsEntry[];
}

export interface EntityCheckRecords {
  readonly registryCandidates: readonly EntityRegistryCandidate[];
  readonly registrySource: EntityRegistrySource;
  readonly sanctionsDataset: SanctionsDataset;
}

export type EntityCheckDisposition = "found" | "ambiguous" | "not_found";
export type EntitySanctionsScreen = "clear" | "hit" | "not_screened";

export type SanctionsMatch = SanctionsEntry;

export interface EntityCheckAmbiguityCandidate {
  readonly siren: string;
  readonly legalName: string;
}

interface EntityCheckResultBase extends EntityCheckRequest {
  readonly registrySource: EntityRegistrySource;
  readonly sanctionsDataset: SanctionsDatasetDescriptor;
  readonly limitations: readonly string[];
}

export interface EntityCheckFoundResult extends EntityCheckResultBase {
  readonly disposition: "found";
  readonly entity: EntityRegistryCandidate;
  readonly sanctionsScreen: "clear" | "hit";
  readonly sanctionsMatches: readonly SanctionsMatch[];
}

export interface EntityCheckAmbiguousResult extends EntityCheckResultBase {
  readonly disposition: "ambiguous";
  readonly candidateCount: number;
  readonly candidates: readonly EntityCheckAmbiguityCandidate[];
  readonly sanctionsScreen: "not_screened";
}

export interface EntityCheckNotFoundResult extends EntityCheckResultBase {
  readonly disposition: "not_found";
  readonly sanctionsScreen: "not_screened";
}

export type EntityCheckResult =
  | EntityCheckFoundResult
  | EntityCheckAmbiguousResult
  | EntityCheckNotFoundResult;

export const ENTITY_CHECK_BASELINE_LIMITATION =
  "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";
export const ENTITY_CHECK_AMBIGUITY_LIMITATION =
  "Supply the SIREN as registrationNumber to disambiguate.";

const ambiguityCandidateCap = 5;
const sirenPattern = /^[0-9]{9}$/u;
const calendarDatePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u;
const canonicalTimestampPattern =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;

function requireRecord(
  value: unknown,
  fields: readonly string[],
  label: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !fields.includes(key)) {
      throw new RangeError(`${label} has unsupported field ${String(key)}`);
    }
  }
  return value as Record<string, unknown>;
}

function requireTrimmedString(
  value: unknown,
  maximumLength: number,
  field: string,
): string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }
  if (value.length === 0 || value.trim() !== value) {
    throw new RangeError(`${field} must be a trimmed, nonblank string`);
  }
  if (value.length > maximumLength) {
    throw new RangeError(`${field} must not exceed ${maximumLength} characters`);
  }
  return value;
}

function requireSiren(value: unknown, field: string): string {
  if (typeof value !== "string" || !sirenPattern.test(value)) {
    throw new RangeError(`${field} must be exactly nine ASCII digits`);
  }
  return value;
}

function requireCalendarDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !calendarDatePattern.test(value)) {
    throw new RangeError(`${field} must be a YYYY-MM-DD date`);
  }
  const instant = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(instant.getTime()) || !instant.toISOString().startsWith(value)) {
    throw new RangeError(`${field} must be a real calendar date`);
  }
  return value;
}

function requireTimestamp(value: unknown, field: string): string {
  if (typeof value !== "string" || !canonicalTimestampPattern.test(value)) {
    throw new RangeError(`${field} must be a canonical UTC timestamp`);
  }
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
    throw new RangeError(`${field} must be a real canonical UTC timestamp`);
  }
  return value;
}

export function parseEntityCheckRequest(input: unknown): EntityCheckRequest {
  const record = requireRecord(
    input,
    ["requestRef", "jurisdiction", "query", "registrationNumber"],
    "request",
  );
  if (record.jurisdiction !== "FR") {
    throw new RangeError("jurisdiction must be FR");
  }
  const request: EntityCheckRequest = {
    requestRef: requireTrimmedString(record.requestRef, 96, "requestRef"),
    jurisdiction: "FR",
    query: requireTrimmedString(record.query, 160, "query"),
  };
  if (!Object.hasOwn(record, "registrationNumber")) {
    return Object.freeze(request);
  }
  return Object.freeze({
    ...request,
    registrationNumber: requireSiren(record.registrationNumber, "registrationNumber"),
  });
}

function parseCandidate(value: unknown, label: string): EntityRegistryCandidate {
  const record = requireRecord(
    value,
    [
      "siren",
      "legalName",
      "administrativeStatus",
      "incorporationDate",
      "registeredAddress",
      "officerCount",
      "registryUpdatedAt",
    ],
    label,
  );
  const { administrativeStatus, registeredAddress, officerCount } = record;
  if (administrativeStatus !== "active" && administrativeStatus !== "ceased") {
    throw new RangeError(`${label}.administrativeStatus must be active or ceased`);
  }
  if (typeof registeredAddress !== "string") {
    throw new TypeError(`${label}.registeredAddress must be a string`);
  }
  if (typeof officerCount !== "number" || !Number.isSafeInteger(officerCount) || officerCount < 0) {
    throw new RangeError(`${label}.officerCount must be a nonnegative integer`);
  }
  return Object.freeze({
    siren: requireSiren(record.siren, `${label}.siren`),
    legalName: requireTrimmedString(record.legalName, 512, `${label}.legalName`),
    administrativeStatus,
    incorporationDate: requireCalendarDate(record.incorporationDate, `${label}.incorporationDate`),
    registeredAddress,
    officerCount,
    registryUpdatedAt: requireTimestamp(record.registryUpdatedAt, `${label}.registryUpdatedAt`),
  });
}

function parseRegistrySource(value: unknown): EntityRegistrySource {
  const record = requireRecord(value, ["source", "readAt"], "registrySource");
  if (record.source !== "FR_RECHERCHE_ENTREPRISES") {
    throw new RangeError("registrySource.source must be FR_RECHERCHE_ENTREPRISES");
  }
  return Object.freeze({
    source: "FR_RECHERCHE_ENTREPRISES",
    readAt: requireTimestamp(record.readAt, "registrySource.readAt"),
  });
}

function parseEntry(value: unknown, label: string): SanctionsEntry {
  const record = requireRecord(value, ["entryId", "name", "entryType", "programs"], label);
  const { entryType, programs } = record;
  if (typeof entryType !== "string") {
    throw new TypeError(`${label}.entryType must be a string`);
  }
  if (!Array.isArray(programs) || programs.some((program) => typeof program !== "string")) {
    throw new TypeError(`${label}.programs must be a string array`);
  }
  return Object.freeze({
    entryId: requireTrimmedString(record.entryId, 96, `${label}.entryId`),
    name: requireTrimmedString(record.name, 512, `${label}.name`),
    entryType,
    programs: Object.freeze([...programs] as string[]),
  });
}

function parseSanctionsDataset(value: unknown): SanctionsDataset {
  const record = requireRecord(
    value,
    ["source", "lastModified", "contentHash", "entries"],
    "sanctionsDataset",
  );
  if (record.source !== "OFAC_SDN") {
    throw new RangeError("sanctionsDataset.source must be OFAC_SDN");
  }
  if (!Array.isArray(record.entries)) {
    throw new TypeError("sanctionsDataset.entries must be an array");
  }
  return Object.freeze({
    source: "OFAC_SDN",
    lastModified: requireTimestamp(record.lastModified, "sanctionsDataset.lastModified"),
    contentHash: requireTrimmedString(record.contentHash, 128, "sanctionsDataset.contentHash"),
    entries: Object.freeze(
      record.entries.map((entry, index) => parseEntry(entry, `sanctionsDataset.entries[${index}]`)),
    ),
  });
}

function parseRecords(value: unknown): EntityCheckRecords {
  const record = requireRecord(
    value,
    ["registryCandidates", "registrySource", "sanctionsDataset"],
    "records",
  );
  if (!Array.isArray(record.registryCandidates)) {
    throw new TypeError("registryCandidates must be an array");
  }
  return {
    registryCandidates: record.registryCandidates.map((candidate, index) =>
      parseCandidate(candidate, `registryCandidates[${index}]`),
    ),
    registrySource: parseRegistrySource(record.registrySource),
    sanctionsDataset: parseSanctionsDataset(record.sanctionsDataset),
  };
}

export function normaliseEntityName(value: string): string {
  if (typeof value !== "string") {
    throw new TypeError("an entity name must be a string");
  }
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toUpperCase()
    .replace(/\p{P}+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function resolveCandidate(
  request: EntityCheckRequest,
  candidates: readonly EntityRegistryCandidate[],
): EntityRegistryCandidate | null {
  if (candidates.length === 1) {
    return candidates[0] ?? null;
  }
  if (request.registrationNumber === undefined) {
    return null;
  }
  const matches = candidates.filter((candidate) => candidate.siren === request.registrationNumber);
  return matches.length === 1 ? matches[0] ?? null : null;
}

export function assessEntityCheck(
  requestInput: EntityCheckRequest,
  recordsInput: EntityCheckRecords,
): EntityCheckResult {
  const request = parseEntityCheckRequest(requestInput);
  const { registryCandidates, registrySource, sanctionsDataset } = parseRecords(recordsInput);
  const descriptor: SanctionsDatasetDescriptor = Object.freeze({
    source: sanctionsDataset.source,
    lastModified: sanctionsDataset.lastModified,
    contentHash: sanctionsDataset.contentHash,
  });
  const base = { ...request, registrySource, sanctionsDataset: descriptor };

  if (registryCandidates.length === 0) {
    return Object.freeze({
      ...base,
      disposition: "not_found",
      sanctionsScreen: "not_screened",
      limitations: Object.freeze([ENTITY_CHECK_BASELINE_LIMITATION]),
    });
  }

  const entity = resolveCandidate(request, registryCandidates);
  if (entity === null) {
    return Object.freeze({
      ...base,
      disposition: "ambiguous",
      candidateCount: registryCandidates.length,
      candidates: Object.freeze(
        registryCandidates
          .slice(0, ambiguityCandidateCap)
          .map(({ siren, legalName }) => Object.freeze({ siren, legalName })),
      ),
      sanctionsScreen: "not_screened",
      limitations: Object.freeze([
        ENTITY_CHECK_BASELINE_LIMITATION,
        ENTITY_CHECK_AMBIGUITY_LIMITATION,
      ]),
    });
  }

  const target = normaliseEntityName(entity.legalName);
  const sanctionsMatches = Object.freeze(
    sanctionsDataset.entries.filter((entry) => normaliseEntityName(entry.name) === target),
  );
  return Object.freeze({
    ...base,
    disposition: "found",
    entity,
    sanctionsScreen: sanctionsMatches.length > 0 ? "hit" : "clear",
    sanctionsMatches,
    limitations: Object.freeze([ENTITY_CHECK_BASELINE_LIMITATION]),
  });
}
