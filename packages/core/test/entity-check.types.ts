import { assessEntityCheck, normaliseEntityName, parseEntityCheckRequest } from "../src/index.ts";
import type {
  EntityCheckAmbiguousResult,
  EntityCheckDisposition,
  EntityCheckFoundResult,
  EntityCheckNotFoundResult,
  EntityCheckRecords,
  EntityCheckRequest,
  EntityCheckRequestInput,
  EntityCheckResult,
  EntityRegistryCandidate,
  EntityRegistrySource,
  EntitySanctionsScreen,
  SanctionsDataset,
  SanctionsDatasetDescriptor,
  SanctionsEntry,
  SanctionsMatch,
} from "../src/index.ts";

declare const requestInput: EntityCheckRequestInput;
declare const records: EntityCheckRecords;
declare const candidateValue: EntityRegistryCandidate;
declare const registrySource: EntityRegistrySource;
declare const sanctionsDataset: SanctionsDataset;
declare const sanctionsEntry: SanctionsEntry;

const request: EntityCheckRequest = parseEntityCheckRequest(requestInput);
const jurisdiction: "FR" = request.jurisdiction;
const registrationNumber: string | undefined = request.registrationNumber;
const normalised: string = normaliseEntityName(candidateValue.legalName);
const result: EntityCheckResult = assessEntityCheck(request, {
  registryCandidates: [candidateValue],
  registrySource,
  sanctionsDataset,
});
const disposition: EntityCheckDisposition = result.disposition;
const screen: EntitySanctionsScreen = result.sanctionsScreen;
const descriptor: SanctionsDatasetDescriptor = result.sanctionsDataset;
const limitations: readonly string[] = result.limitations;

void jurisdiction;
void registrationNumber;
void normalised;
void records;
void disposition;
void screen;
void descriptor;
void limitations;
void sanctionsEntry;

if (result.disposition === "found") {
  const found: EntityCheckFoundResult = result;
  const entity: EntityRegistryCandidate = found.entity;
  const matches: readonly SanctionsMatch[] = found.sanctionsMatches;
  const foundScreen: "clear" | "hit" = found.sanctionsScreen;
  void entity;
  void matches;
  void foundScreen;
  // @ts-expect-error A found result carries no ambiguity candidates.
  found.candidates;
} else if (result.disposition === "ambiguous") {
  const ambiguous: EntityCheckAmbiguousResult = result;
  const count: number = ambiguous.candidateCount;
  const notScreened: "not_screened" = ambiguous.sanctionsScreen;
  void count;
  void notScreened;
  // @ts-expect-error An ambiguous result carries no resolved entity.
  ambiguous.entity;
} else {
  const notFound: EntityCheckNotFoundResult = result;
  const notScreened: "not_screened" = notFound.sanctionsScreen;
  void notScreened;
}

// @ts-expect-error The sanctions descriptor never carries entries.
result.sanctionsDataset.entries;
// @ts-expect-error The jurisdiction is the closed FR literal.
parseEntityCheckRequest({ requestRef: "r", jurisdiction: "DE", query: "q" });
// @ts-expect-error A result has no score field.
result.score;
