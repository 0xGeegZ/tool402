import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/entity-check.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;
let index;

const baselineLimitation =
  "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";
const ambiguityLimitation = "Supply the SIREN as registrationNumber to disambiguate.";

const validRequestInput = Object.freeze({
  requestRef: "entity-42",
  jurisdiction: "FR",
  query: "Société Générale",
});

function candidate(overrides = {}) {
  return {
    siren: "552120222",
    legalName: "SOCIETE GENERALE",
    administrativeStatus: "active",
    incorporationDate: "1864-05-04",
    registeredAddress: "29 BD HAUSSMANN 75009 PARIS",
    officerCount: 12,
    registryUpdatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function entry(overrides = {}) {
  return {
    entryId: "12345",
    name: "SOCIETE GENERALE",
    entryType: "Entity",
    programs: ["SDGT"],
    ...overrides,
  };
}

const registrySource = Object.freeze({
  source: "FR_RECHERCHE_ENTREPRISES",
  readAt: "2026-09-09T12:00:00.000Z",
});

function dataset(entries = []) {
  return {
    source: "OFAC_SDN",
    lastModified: "2026-09-08T00:00:00.000Z",
    contentHash: "a".repeat(64),
    entries,
  };
}

function records(overrides = {}) {
  return {
    registryCandidates: [candidate()],
    registrySource,
    sanctionsDataset: dataset(),
    ...overrides,
  };
}

function assess(requestInput = validRequestInput, overrides = {}) {
  return api.assessEntityCheck(api.parseEntityCheckRequest(requestInput), records(overrides));
}

test("requires the declared EntityCheck core module before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared core module: ${sourcePath}`);
});

test.before(async () => {
  if (!sourceExists) return;
  api = await import(sourceUrl.href);
  index = await import("@tool402/core");
});

implementedTest("exports the EntityCheck values from the package index without reordering anything else", () => {
  assert.equal(index.parseEntityCheckRequest, api.parseEntityCheckRequest);
  assert.equal(index.assessEntityCheck, api.assessEntityCheck);
  assert.equal(index.normaliseEntityName, api.normaliseEntityName);
  assert.equal(typeof index.assessRiskScanQuick, "function");
});

implementedTest("rejects malformed requests and preserves a valid one", () => {
  const rejected = [
    ["undefined", undefined],
    ["null", null],
    ["array", []],
    ["missing requestRef", { jurisdiction: "FR", query: "x" }],
    ["blank requestRef", { ...validRequestInput, requestRef: "   " }],
    ["untrimmed requestRef", { ...validRequestInput, requestRef: " entity-42" }],
    ["oversized requestRef", { ...validRequestInput, requestRef: "r".repeat(97) }],
    ["non-string query", { ...validRequestInput, query: 42 }],
    ["blank query", { ...validRequestInput, query: "" }],
    ["oversized query", { ...validRequestInput, query: "q".repeat(161) }],
    ["wrong jurisdiction", { ...validRequestInput, jurisdiction: "DE" }],
    ["lower-case jurisdiction", { ...validRequestInput, jurisdiction: "fr" }],
    ["missing jurisdiction", { requestRef: "entity-42", query: "x" }],
    ["eight-digit registrationNumber", { ...validRequestInput, registrationNumber: "55212022" }],
    ["ten-digit registrationNumber", { ...validRequestInput, registrationNumber: "5521202220" }],
    ["non-ASCII digits registrationNumber", { ...validRequestInput, registrationNumber: "٥٥٢١٢٠٢٢٢" }],
    ["numeric registrationNumber", { ...validRequestInput, registrationNumber: 552120222 }],
    ["null registrationNumber", { ...validRequestInput, registrationNumber: null }],
    ["unsupported field", { ...validRequestInput, score: 1 }],
  ];
  for (const [label, input] of rejected) {
    assert.throws(() => api.parseEntityCheckRequest(input), { name: /TypeError|RangeError/u }, label);
  }

  assert.deepEqual(api.parseEntityCheckRequest(validRequestInput), {
    requestRef: "entity-42",
    jurisdiction: "FR",
    query: "Société Générale",
  });
  const withSiren = api.parseEntityCheckRequest({ ...validRequestInput, registrationNumber: "552120222" });
  assert.deepEqual(withSiren, { ...validRequestInput, registrationNumber: "552120222" });
  assert.equal(Object.isFrozen(withSiren), true);
  assert.equal(Object.hasOwn(api.parseEntityCheckRequest(validRequestInput), "registrationNumber"), false);
});

implementedTest("rejects malformed candidates, entries, and source descriptors as a whole", () => {
  const request = api.parseEntityCheckRequest(validRequestInput);
  const rejected = [
    ["non-array candidates", { registryCandidates: null }],
    ["candidate with eight-digit siren", { registryCandidates: [candidate({ siren: "55212022" })] }],
    ["candidate with blank legal name", { registryCandidates: [candidate({ legalName: " " })] }],
    ["candidate with unknown status", { registryCandidates: [candidate({ administrativeStatus: "dormant" })] }],
    ["candidate with malformed date", { registryCandidates: [candidate({ incorporationDate: "1864-5-4" })] }],
    ["candidate with impossible date", { registryCandidates: [candidate({ incorporationDate: "1864-13-40" })] }],
    ["candidate with non-string address", { registryCandidates: [candidate({ registeredAddress: null })] }],
    ["candidate with negative officer count", { registryCandidates: [candidate({ officerCount: -1 })] }],
    ["candidate with fractional officer count", { registryCandidates: [candidate({ officerCount: 1.5 })] }],
    ["candidate with non-canonical timestamp", { registryCandidates: [candidate({ registryUpdatedAt: "2026-09-01" })] }],
    ["candidate with extra field", { registryCandidates: [candidate({ score: 0.9 })] }],
    ["second candidate malformed", { registryCandidates: [candidate(), candidate({ siren: "x" })] }],
    ["wrong registry source", { registrySource: { source: "FR_INSEE", readAt: registrySource.readAt } }],
    ["registry source without readAt", { registrySource: { source: "FR_RECHERCHE_ENTREPRISES" } }],
    ["wrong sanctions source", { sanctionsDataset: { ...dataset(), source: "EU_FSF" } }],
    ["sanctions dataset without hash", { sanctionsDataset: { ...dataset(), contentHash: "" } }],
    ["sanctions dataset with non-array entries", { sanctionsDataset: { ...dataset(), entries: {} } }],
    ["entry with blank id", { sanctionsDataset: dataset([entry({ entryId: "" })]) }],
    ["entry with blank name", { sanctionsDataset: dataset([entry({ name: " " })]) }],
    ["entry with non-string program", { sanctionsDataset: dataset([entry({ programs: [1] })]) }],
    ["entry with extra field", { sanctionsDataset: dataset([entry({ score: 1 })]) }],
    ["null records", null],
  ];
  for (const [label, overrides] of rejected) {
    const input = overrides === null ? null : records(overrides);
    assert.throws(() => api.assessEntityCheck(request, input), { name: /TypeError|RangeError/u }, label);
  }
  assert.throws(() => api.assessEntityCheck({ ...request, jurisdiction: "DE" }, records()), { name: /TypeError|RangeError/u });
});

implementedTest("resolves found by single candidate and by SIREN match, echoing both sources without entries", () => {
  const single = assess();
  assert.equal(single.disposition, "found");
  assert.deepEqual(single.entity, candidate());
  assert.equal(single.sanctionsScreen, "clear");
  assert.deepEqual(single.sanctionsMatches, []);
  assert.deepEqual(single.registrySource, registrySource);
  assert.deepEqual(single.sanctionsDataset, { source: "OFAC_SDN", lastModified: "2026-09-08T00:00:00.000Z", contentHash: "a".repeat(64) });
  assert.equal(Object.hasOwn(single.sanctionsDataset, "entries"), false);
  assert.equal(single.requestRef, "entity-42");
  assert.equal(single.jurisdiction, "FR");
  assert.equal(single.query, "Société Générale");
  assert.deepEqual(single.limitations, [baselineLimitation]);
  assert.equal(Object.isFrozen(single), true);

  const other = candidate({ siren: "123456789", legalName: "SOCIETE GENERALE FACTORING" });
  const bySiren = assess({ ...validRequestInput, registrationNumber: "123456789" }, { registryCandidates: [candidate(), other] });
  assert.equal(bySiren.disposition, "found");
  assert.deepEqual(bySiren.entity, other);
  assert.equal(bySiren.registrationNumber, "123456789");
});

implementedTest("marks two or more unmatched candidates ambiguous with the five-pair cap and exact limitation", () => {
  const candidates = Array.from({ length: 7 }, (_, index) =>
    candidate({ siren: String(100000000 + index), legalName: `CANDIDATE ${index}` }),
  );
  const ambiguous = assess(validRequestInput, { registryCandidates: candidates });
  assert.equal(ambiguous.disposition, "ambiguous");
  assert.equal(ambiguous.candidateCount, 7);
  assert.deepEqual(
    ambiguous.candidates,
    candidates.slice(0, 5).map(({ siren, legalName }) => ({ siren, legalName })),
  );
  assert.equal(ambiguous.sanctionsScreen, "not_screened");
  assert.deepEqual(ambiguous.limitations, [baselineLimitation, ambiguityLimitation]);
  assert.equal(Object.hasOwn(ambiguous, "entity"), false);
  assert.equal(Object.hasOwn(ambiguous, "sanctionsMatches"), false);

  const unmatchedSiren = assess({ ...validRequestInput, registrationNumber: "999999999" }, { registryCandidates: candidates.slice(0, 2) });
  assert.equal(unmatchedSiren.disposition, "ambiguous");
  assert.equal(unmatchedSiren.candidateCount, 2);

  const duplicateSiren = assess({ ...validRequestInput, registrationNumber: "552120222" }, {
    registryCandidates: [candidate(), candidate({ legalName: "SOCIETE GENERALE BIS" })],
  });
  assert.equal(duplicateSiren.disposition, "ambiguous");
});

implementedTest("marks zero candidates not_found and not_screened", () => {
  const missing = assess(validRequestInput, { registryCandidates: [], sanctionsDataset: dataset([entry()]) });
  assert.equal(missing.disposition, "not_found");
  assert.equal(missing.sanctionsScreen, "not_screened");
  assert.deepEqual(missing.limitations, [baselineLimitation]);
  assert.equal(Object.hasOwn(missing, "entity"), false);
  assert.equal(Object.hasOwn(missing, "candidateCount"), false);
});

implementedTest("screens a found entity against every matching entry in dataset order", () => {
  const entries = [
    entry({ entryId: "1", name: "Société Générale", programs: ["SDGT"] }),
    entry({ entryId: "2", name: "ANOTHER ENTITY", programs: [] }),
    entry({ entryId: "3", name: "societe-generale", entryType: "Individual", programs: ["CYBER2", "SDGT"] }),
    entry({ entryId: "4", name: "SOCIETE GENERALE SA" }),
  ];
  const hit = assess(validRequestInput, { sanctionsDataset: dataset(entries) });
  assert.equal(hit.disposition, "found");
  assert.equal(hit.sanctionsScreen, "hit");
  assert.deepEqual(hit.sanctionsMatches, [
    { entryId: "1", name: "Société Générale", entryType: "Entity", programs: ["SDGT"] },
    { entryId: "3", name: "societe-generale", entryType: "Individual", programs: ["CYBER2", "SDGT"] },
  ]);
  for (const match of hit.sanctionsMatches) {
    assert.equal(Object.isFrozen(match), true);
    assert.equal(Object.isFrozen(match.programs), true);
  }

  const clear = assess(validRequestInput, { sanctionsDataset: dataset([entries[1], entries[3]]) });
  assert.equal(clear.sanctionsScreen, "clear");
  assert.deepEqual(clear.sanctionsMatches, []);
});

implementedTest("normalises names by NFKD, mark removal, case, punctuation, and whitespace exactly", () => {
  const cases = [
    ["Société Générale", "SOCIETE GENERALE"],
    ["  société   générale ", "SOCIETE GENERALE"],
    ["Société-Générale, S.A.", "SOCIETE GENERALE S A"],
    ["Ｓｏｃｉｅｔｅ", "SOCIETE"],
    ["Ærø A/S", "ÆRØ A S"],
    ["l'Oréal", "L OREAL"],
    ["Tab\tand\nnewline", "TAB AND NEWLINE"],
    ["", ""],
    ["...", ""],
  ];
  for (const [input, expected] of cases) {
    assert.equal(api.normaliseEntityName(input), expected, JSON.stringify(input));
  }
  assert.throws(() => api.normaliseEntityName(42), TypeError);
});

implementedTest("carries the baseline limitation and no score, price, receipt, payment, settlement, evidence, or availability field", () => {
  const results = [
    assess(),
    assess(validRequestInput, { registryCandidates: [] }),
    assess(validRequestInput, { registryCandidates: [candidate(), candidate({ siren: "123456789" })] }),
    assess(validRequestInput, { sanctionsDataset: dataset([entry()]) }),
  ];
  const forbidden = /score|price|receipt|payment|settlement|evidence|availab/iu;
  for (const result of results) {
    assert.equal(result.limitations[0], baselineLimitation);
    for (const key of Object.keys(result)) {
      assert.doesNotMatch(key, forbidden, `${result.disposition} carries ${key}`);
    }
  }
});
