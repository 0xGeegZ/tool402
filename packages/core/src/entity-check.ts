export interface EntityCheckRequest {
  requestRef: string;
  jurisdiction: "FR";
  query: string;
  registrationNumber?: string;
}

export interface EntityRegistryCandidate {
  siren: string;
  legalName: string;
  administrativeStatus: "active" | "ceased";
  incorporationDate: string;
  registeredAddress: string;
  officerCount: number;
  registryUpdatedAt: string;
}

export interface EntityRegistrySource {
  source: "FR_RECHERCHE_ENTREPRISES";
  readAt: string;
}

export interface EntitySanctionsEntry {
  entryId: string;
  name: string;
  entryType: string;
  programs: readonly string[];
}

export interface EntitySanctionsDataset {
  source: "OFAC_SDN";
  lastModified: string;
  contentHash: string;
  entries: readonly EntitySanctionsEntry[];
}

export interface EntitySanctionsSource {
  source: "OFAC_SDN";
  lastModified: string;
  contentHash: string;
}

export interface EntityCheckAssessmentInput {
  registryCandidates: readonly EntityRegistryCandidate[];
  registrySource: EntityRegistrySource;
  sanctionsDataset: EntitySanctionsDataset;
}

export type EntityCheckDisposition = "found" | "ambiguous" | "not_found";
export type EntityCheckScreen = "clear" | "hit" | "not_screened";

interface EntityCheckResultBase extends EntityCheckRequest {
  registrySource: EntityRegistrySource;
  sanctionsSource: EntitySanctionsSource;
  limitations: readonly string[];
}

interface EntityCheckFoundBase extends EntityCheckResultBase {
  disposition: "found";
  candidate: EntityRegistryCandidate;
}

interface EntityCheckFoundClear extends EntityCheckFoundBase {
  sanctionsScreen: "clear";
}

interface EntityCheckFoundHit extends EntityCheckFoundBase {
  sanctionsScreen: "hit";
  sanctionsMatches: readonly EntitySanctionsEntry[];
}

interface EntityCheckAmbiguous extends EntityCheckResultBase {
  disposition: "ambiguous";
  candidateCount: number;
  candidates: readonly Pick<EntityRegistryCandidate, "siren" | "legalName">[];
  sanctionsScreen: "not_screened";
}

interface EntityCheckNotFound extends EntityCheckResultBase {
  disposition: "not_found";
  sanctionsScreen: "not_screened";
}

export type EntityCheckResult =
  | EntityCheckFoundClear
  | EntityCheckFoundHit
  | EntityCheckAmbiguous
  | EntityCheckNotFound;

const requestFields = ["requestRef", "jurisdiction", "query"] as const;
const requestOptionalFields = ["registrationNumber"] as const;
const assessmentFields = [
  "registryCandidates",
  "registrySource",
  "sanctionsDataset",
] as const;
const candidateFields = [
  "siren",
  "legalName",
  "administrativeStatus",
  "incorporationDate",
  "registeredAddress",
  "officerCount",
  "registryUpdatedAt",
] as const;
const registrySourceFields = ["source", "readAt"] as const;
const sanctionsDatasetFields = [
  "source",
  "lastModified",
  "contentHash",
  "entries",
] as const;
const sanctionsEntryFields = ["entryId", "name", "entryType", "programs"] as const;

const sirenPattern = /^[0-9]{9}$/u;
const contentHashPattern = /^[0-9a-f]{64}$/u;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const isoTimestampPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u;
const imfFixdatePattern = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/u;

const baselineLimitation =
  "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";
const ambiguityLimitation = "Supply the SIREN as registrationNumber to disambiguate.";

function rejectEntityCheck(): never {
  throw new TypeError("invalid EntityCheck input");
}

function isDataDescriptor(descriptor: PropertyDescriptor | undefined): descriptor is PropertyDescriptor & { value: unknown } {
  return (
    descriptor !== undefined &&
    descriptor.enumerable === true &&
    Object.hasOwn(descriptor, "value") &&
    !Object.hasOwn(descriptor, "get") &&
    !Object.hasOwn(descriptor, "set")
  );
}

function captureRecord(
  input: unknown,
  requiredFields: readonly string[],
  optionalFields: readonly string[] = [],
): Map<string, unknown> {
  try {
    if (input === null || typeof input !== "object") {
      return rejectEntityCheck();
    }
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return rejectEntityCheck();
    }

    const keys = Reflect.ownKeys(input);
    if (
      keys.length < requiredFields.length ||
      keys.length > requiredFields.length + optionalFields.length
    ) {
      return rejectEntityCheck();
    }

    const allFields = new Set([...requiredFields, ...optionalFields]);
    const presentKeys = new Set<string>();
    for (const key of keys) {
      if (typeof key !== "string" || !allFields.has(key)) {
        return rejectEntityCheck();
      }
      presentKeys.add(key);
    }

    for (const field of requiredFields) {
      if (!presentKeys.has(field)) {
        return rejectEntityCheck();
      }
    }

    const captured = new Map<string, unknown>();
    for (const field of [...requiredFields, ...optionalFields]) {
      if (!presentKeys.has(field)) {
        continue;
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (!isDataDescriptor(descriptor)) {
        return rejectEntityCheck();
      }
      captured.set(field, descriptor.value);
    }
    return captured;
  } catch {
    return rejectEntityCheck();
  }
}

function captureDenseArray(input: unknown): readonly unknown[] {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) {
      return rejectEntityCheck();
    }

    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(input, "length");
    if (
      lengthDescriptor === undefined ||
      lengthDescriptor.enumerable !== false ||
      lengthDescriptor.configurable !== false ||
      !Object.hasOwn(lengthDescriptor, "value") ||
      Object.hasOwn(lengthDescriptor, "get") ||
      Object.hasOwn(lengthDescriptor, "set") ||
      typeof lengthDescriptor.value !== "number" ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return rejectEntityCheck();
    }

    const length = lengthDescriptor.value;
    const keys = Reflect.ownKeys(input);
    if (keys.length !== length + 1) {
      return rejectEntityCheck();
    }
    const keySet = new Set(keys);
    if (!keySet.has("length")) {
      return rejectEntityCheck();
    }

    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const field = String(index);
      if (!keySet.has(field)) {
        return rejectEntityCheck();
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (!isDataDescriptor(descriptor)) {
        return rejectEntityCheck();
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return rejectEntityCheck();
  }
}

function requiredString(value: unknown): string {
  if (typeof value !== "string") {
    return rejectEntityCheck();
  }
  return value;
}

function requiredNonblankString(value: unknown): string {
  const text = requiredString(value);
  if (text.trim().length === 0) {
    return rejectEntityCheck();
  }
  return text;
}

function requiredTrimmedNonblankString(value: unknown, maximumLength: number): string {
  const text = requiredString(value);
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > maximumLength) {
    return rejectEntityCheck();
  }
  return trimmed;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function hasValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
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
  const maximumDay = daysInMonth[month - 1];
  return maximumDay !== undefined && day <= maximumDay;
}

function parseCalendarDate(value: unknown): string {
  const text = requiredString(value);
  const match = datePattern.exec(text);
  if (match === null) {
    return rejectEntityCheck();
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!hasValidCalendarDate(year, month, day)) {
    return rejectEntityCheck();
  }
  return text;
}

function parseIsoTimestamp(value: unknown): string {
  const text = requiredString(value);
  const match = isoTimestampPattern.exec(text);
  if (match === null) {
    return rejectEntityCheck();
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (
    !hasValidCalendarDate(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    Number.isNaN(Date.parse(text))
  ) {
    return rejectEntityCheck();
  }
  return text;
}

function parseLastModified(value: unknown): string {
  const text = requiredString(value);
  if (isoTimestampPattern.test(text)) {
    return parseIsoTimestamp(text);
  }
  if (!imfFixdatePattern.test(text)) {
    return rejectEntityCheck();
  }
  const timestamp = Date.parse(text);
  if (Number.isNaN(timestamp) || new Date(timestamp).toUTCString() !== text) {
    return rejectEntityCheck();
  }
  return text;
}

function parseSiren(value: unknown): string {
  const text = requiredString(value);
  if (!sirenPattern.test(text)) {
    return rejectEntityCheck();
  }
  return text;
}

function parseCandidate(input: unknown): EntityRegistryCandidate {
  const values = captureRecord(input, candidateFields);
  const siren = parseSiren(values.get("siren"));
  const legalName = requiredNonblankString(values.get("legalName"));
  const administrativeStatus = values.get("administrativeStatus");
  if (administrativeStatus !== "active" && administrativeStatus !== "ceased") {
    return rejectEntityCheck();
  }
  const incorporationDate = parseCalendarDate(values.get("incorporationDate"));
  const registeredAddress = requiredString(values.get("registeredAddress"));
  const officerCount = values.get("officerCount");
  if (
    typeof officerCount !== "number" ||
    !Number.isSafeInteger(officerCount) ||
    officerCount < 0
  ) {
    return rejectEntityCheck();
  }
  const registryUpdatedAt = parseIsoTimestamp(values.get("registryUpdatedAt"));

  return Object.freeze({
    siren,
    legalName,
    administrativeStatus,
    incorporationDate,
    registeredAddress,
    officerCount,
    registryUpdatedAt,
  });
}

function parseRegistrySource(input: unknown): EntityRegistrySource {
  const values = captureRecord(input, registrySourceFields);
  if (values.get("source") !== "FR_RECHERCHE_ENTREPRISES") {
    return rejectEntityCheck();
  }
  return Object.freeze({
    source: "FR_RECHERCHE_ENTREPRISES" as const,
    readAt: parseIsoTimestamp(values.get("readAt")),
  });
}

function parseSanctionsEntry(input: unknown): EntitySanctionsEntry {
  const values = captureRecord(input, sanctionsEntryFields);
  const programs = captureDenseArray(values.get("programs"));
  const parsedPrograms = programs.map((program) => requiredString(program));

  return Object.freeze({
    entryId: requiredNonblankString(values.get("entryId")),
    name: requiredNonblankString(values.get("name")),
    entryType: requiredString(values.get("entryType")),
    programs: Object.freeze(parsedPrograms),
  });
}

function parseSanctionsDataset(input: unknown): EntitySanctionsDataset {
  const values = captureRecord(input, sanctionsDatasetFields);
  if (values.get("source") !== "OFAC_SDN") {
    return rejectEntityCheck();
  }
  const entries = captureDenseArray(values.get("entries"));
  const parsedEntries = entries.map((entry) => parseSanctionsEntry(entry));
  const contentHash = requiredString(values.get("contentHash"));
  if (!contentHashPattern.test(contentHash)) {
    return rejectEntityCheck();
  }

  return Object.freeze({
    source: "OFAC_SDN" as const,
    lastModified: parseLastModified(values.get("lastModified")),
    contentHash,
    entries: Object.freeze(parsedEntries),
  });
}

function parseAssessmentInput(input: EntityCheckAssessmentInput): EntityCheckAssessmentInput {
  const values = captureRecord(input, assessmentFields);
  const candidates = captureDenseArray(values.get("registryCandidates"));
  const parsedCandidates = candidates.map((candidate) => parseCandidate(candidate));

  return Object.freeze({
    registryCandidates: Object.freeze(parsedCandidates),
    registrySource: parseRegistrySource(values.get("registrySource")),
    sanctionsDataset: parseSanctionsDataset(values.get("sanctionsDataset")),
  });
}

function resultBase(
  request: EntityCheckRequest,
  input: EntityCheckAssessmentInput,
): EntityCheckResultBase {
  const requestFields = request.registrationNumber === undefined
    ? {
      requestRef: request.requestRef,
      jurisdiction: request.jurisdiction,
      query: request.query,
    }
    : {
      requestRef: request.requestRef,
      jurisdiction: request.jurisdiction,
      query: request.query,
      registrationNumber: request.registrationNumber,
    };

  return {
    ...requestFields,
    registrySource: input.registrySource,
    sanctionsSource: Object.freeze({
      source: input.sanctionsDataset.source,
      lastModified: input.sanctionsDataset.lastModified,
      contentHash: input.sanctionsDataset.contentHash,
    }),
    limitations: Object.freeze([baselineLimitation]),
  };
}

function parseEntityCheckRequestRecord(input: unknown): EntityCheckRequest {
  const values = captureRecord(input, requestFields, requestOptionalFields);
  if (values.get("jurisdiction") !== "FR") {
    return rejectEntityCheck();
  }

  const request: EntityCheckRequest = {
    requestRef: requiredTrimmedNonblankString(values.get("requestRef"), 96),
    jurisdiction: "FR",
    query: requiredTrimmedNonblankString(values.get("query"), 160),
  };
  if (values.has("registrationNumber")) {
    request.registrationNumber = parseSiren(values.get("registrationNumber"));
  }
  return Object.freeze(request);
}

export function parseEntityCheckRequest(input: EntityCheckRequest): EntityCheckRequest {
  return parseEntityCheckRequestRecord(input);
}

export function normaliseEntityName(value: string): string {
  if (typeof value !== "string") {
    return rejectEntityCheck();
  }
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toUpperCase()
    .replace(/\p{P}+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function assessEntityCheck(
  requestInput: unknown,
  assessmentInput: EntityCheckAssessmentInput,
): EntityCheckResult {
  const request = parseEntityCheckRequestRecord(requestInput);
  const input = parseAssessmentInput(assessmentInput);
  const base = resultBase(request, input);
  const candidates = input.registryCandidates;
  const matchingSirenCandidates = request.registrationNumber === undefined
    ? []
    : candidates.filter((candidate) => candidate.siren === request.registrationNumber);
  const candidate = matchingSirenCandidates.length === 1
    ? matchingSirenCandidates[0]
    : candidates.length === 1
      ? candidates[0]
      : undefined;

  if (candidate === undefined) {
    if (candidates.length === 0) {
      return Object.freeze({
        ...base,
        disposition: "not_found" as const,
        sanctionsScreen: "not_screened" as const,
      });
    }

    return Object.freeze({
      ...base,
      disposition: "ambiguous" as const,
      candidateCount: candidates.length,
      candidates: Object.freeze(
        candidates.slice(0, 5).map((entry) =>
          Object.freeze({ siren: entry.siren, legalName: entry.legalName })),
      ),
      sanctionsScreen: "not_screened" as const,
      limitations: Object.freeze([baselineLimitation, ambiguityLimitation]),
    });
  }

  const normalisedCandidateName = normaliseEntityName(candidate.legalName);
  const sanctionsMatches = input.sanctionsDataset.entries.filter(
    (entry) => normaliseEntityName(entry.name) === normalisedCandidateName,
  );
  if (sanctionsMatches.length === 0) {
    return Object.freeze({
      ...base,
      disposition: "found" as const,
      candidate,
      sanctionsScreen: "clear" as const,
    });
  }

  return Object.freeze({
    ...base,
    disposition: "found" as const,
    candidate,
    sanctionsScreen: "hit" as const,
    sanctionsMatches: Object.freeze(sanctionsMatches),
  });
}
