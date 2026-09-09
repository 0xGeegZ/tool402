import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const sourceUrl = new URL("../src/entity-check.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const barrelUrl = new URL("../src/index.ts", import.meta.url);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;

let assessEntityCheck;
let normaliseEntityName;
let parseEntityCheckRequest;

test("requires the declared EntityCheck source module before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M46 source module: ${sourcePath}`);
});

implementedTest("exports the declared EntityCheck values and types through the public Core barrel", async () => {
  const core = await import(barrelUrl.href);

  for (const exportName of [
    "parseEntityCheckRequest",
    "normaliseEntityName",
    "assessEntityCheck",
  ]) {
    assert.equal(
      typeof core[exportName],
      "function",
      `${exportName} must be exported through packages/core/src/index.ts`,
    );
  }

  const barrelSource = readFileSync(barrelUrl, "utf8");
  for (const typeName of [
    "EntityCheckAssessmentInput",
    "EntityCheckDisposition",
    "EntityCheckRequest",
    "EntityCheckResult",
    "EntityCheckScreen",
    "EntityRegistryCandidate",
    "EntityRegistrySource",
    "EntitySanctionsDataset",
    "EntitySanctionsEntry",
    "EntitySanctionsSource",
  ]) {
    assert.match(
      barrelSource,
      new RegExp(`\\b${typeName}\\b`, "u"),
      `${typeName} must be exported through packages/core/src/index.ts`,
    );
  }
});

implementedTest("exports the declared EntityCheck type-only API through the public Core barrel", () => {
  const fixturePath = resolve(
    fileURLToPath(new URL("./entity-check.public-types.generated.ts", import.meta.url)),
  );
  const fixtureSource = `
import {
  assessEntityCheck,
  normaliseEntityName,
  parseEntityCheckRequest,
} from "../src/index.ts";
import type {
  EntityCheckAssessmentInput,
  EntityCheckDisposition,
  EntityCheckRequest,
  EntityCheckResult,
  EntityCheckScreen,
  EntityRegistryCandidate,
  EntityRegistrySource,
  EntitySanctionsDataset,
  EntitySanctionsEntry,
  EntitySanctionsSource,
} from "../src/index.ts";

type Assert<Condition extends true> = Condition;
type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
  ? (<Value>() => Value extends Right ? 1 : 2) extends
      (<Value>() => Value extends Left ? 1 : 2)
    ? true
    : false
  : false;

type _RequestMatchesParser = Assert<
  Equal<EntityCheckRequest, ReturnType<typeof parseEntityCheckRequest>>
>;
type _AssessmentInputMatchesAssessor = Assert<
  Equal<EntityCheckAssessmentInput, Parameters<typeof assessEntityCheck>[1]>
>;
type _ResultMatchesAssessor = Assert<
  Equal<EntityCheckResult, ReturnType<typeof assessEntityCheck>>
>;
type _NormalizerReturnsString = Assert<
  Equal<ReturnType<typeof normaliseEntityName>, string>
>;
type _CandidateMatchesInput = Assert<
  Equal<EntityRegistryCandidate, EntityCheckAssessmentInput["registryCandidates"][number]>
>;
type _RegistrySourceMatchesInput = Assert<
  Equal<EntityRegistrySource, EntityCheckAssessmentInput["registrySource"]>
>;
type _SanctionsDatasetMatchesInput = Assert<
  Equal<EntitySanctionsDataset, EntityCheckAssessmentInput["sanctionsDataset"]>
>;
type _SanctionsEntryMatchesDataset = Assert<
  Equal<EntitySanctionsEntry, EntitySanctionsDataset["entries"][number]>
>;
type _SanctionsSourceMatchesResult = Assert<
  Equal<EntitySanctionsSource, EntityCheckResult["sanctionsSource"]>
>;
type _DispositionIsClosed = Assert<
  Equal<EntityCheckDisposition, "found" | "ambiguous" | "not_found">
>;
type _ScreenIsClosed = Assert<
  Equal<EntityCheckScreen, "clear" | "hit" | "not_screened">
>;
`;
  const compilerOptions = {
    target: typescript.ScriptTarget.ES2022,
    module: typescript.ModuleKind.NodeNext,
    moduleResolution: typescript.ModuleResolutionKind.NodeNext,
    strict: true,
    noEmit: true,
    allowImportingTsExtensions: true,
    isolatedModules: true,
    erasableSyntaxOnly: true,
    verbatimModuleSyntax: true,
  };
  const host = typescript.createCompilerHost(compilerOptions, true);
  const originalFileExists = host.fileExists.bind(host);
  const originalReadFile = host.readFile.bind(host);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.fileExists = (fileName) =>
    resolve(fileName) === fixturePath || originalFileExists(fileName);
  host.readFile = (fileName) =>
    resolve(fileName) === fixturePath ? fixtureSource : originalReadFile(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
    resolve(fileName) === fixturePath
      ? typescript.createSourceFile(
        fileName,
        fixtureSource,
        languageVersion,
        true,
        typescript.ScriptKind.TS,
      )
      : originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);

  const program = typescript.createProgram({
    rootNames: [fixturePath],
    options: compilerOptions,
    host,
  });
  const diagnostics = typescript.getPreEmitDiagnostics(program);

  assert.deepEqual(
    diagnostics.map((diagnostic) => typescript.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
    [],
    "the public Core barrel must directly export the exact named EntityCheck type-only API",
  );
});

test.before(async () => {
  if (sourceExists) {
    ({
      assessEntityCheck,
      normaliseEntityName,
      parseEntityCheckRequest,
    } = await import(sourceUrl.href));
  }
});

const baselineLimitation =
  "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";
const ambiguityLimitation =
  "Supply the SIREN as registrationNumber to disambiguate.";

function request(overrides = {}) {
  return {
    requestRef: "entitycheck-request-42",
    jurisdiction: "FR",
    query: "Société Étoile",
    ...overrides,
  };
}

function candidate(overrides = {}) {
  return {
    siren: "123456789",
    legalName: "Société Étoile SAS",
    administrativeStatus: "active",
    incorporationDate: "2018-06-14",
    registeredAddress: "12 rue de la Paix, 75002 Paris",
    officerCount: 2,
    registryUpdatedAt: "2026-09-09T12:00:00.000Z",
    ...overrides,
  };
}

function registrySource(overrides = {}) {
  return {
    source: "FR_RECHERCHE_ENTREPRISES",
    readAt: "2026-09-10T10:00:00.000Z",
    ...overrides,
  };
}

function sanctionsDataset(overrides = {}) {
  return {
    source: "OFAC_SDN",
    lastModified: "2026-09-09T00:00:00.000Z",
    contentHash: "a".repeat(64),
    entries: [],
    ...overrides,
  };
}

function sanctionsEntry(overrides = {}) {
  return {
    entryId: "ofac-1",
    name: "Société Étoile SAS",
    entryType: "Entity",
    programs: [],
    ...overrides,
  };
}

function assessmentInput(overrides = {}) {
  return {
    registryCandidates: [candidate()],
    registrySource: registrySource(),
    sanctionsDataset: sanctionsDataset(),
    ...overrides,
  };
}

function assertInputError(callback, description) {
  assert.throws(
    callback,
    (error) => error instanceof TypeError || error instanceof RangeError,
    description,
  );
}

function customPrototypeRecord(record) {
  return Object.assign(Object.create({}), record);
}

function inheritedFieldsRecord(record) {
  return Object.create(record);
}

function nonEnumerableFieldRecord(record) {
  Object.defineProperty(record, "hidden", { value: true });
  return record;
}

function symbolFieldRecord(record) {
  record[Symbol("hidden")] = true;
  return record;
}

function accessorFieldRecord(record, field, reads) {
  const value = record[field];

  Object.defineProperty(record, field, {
    configurable: true,
    enumerable: true,
    get() {
      reads.push(field);
      return value;
    },
  });

  return record;
}

function reflectionFailureRecord(record, trap) {
  return new Proxy(record, {
    [trap]() {
      throw new TypeError(`${trap} failed`);
    },
  });
}

function customPrototypeArray(values) {
  Object.setPrototypeOf(values, {});
  return values;
}

function nullPrototypeArray(values) {
  Object.setPrototypeOf(values, null);
  return values;
}

function nonEnumerableArrayField(values) {
  Object.defineProperty(values, "hidden", { value: true });
  return values;
}

function symbolArrayField(values) {
  values[Symbol("hidden")] = true;
  return values;
}

function accessorArrayItem(values, index, reads) {
  const value = values[index];
  Object.defineProperty(values, String(index), {
    configurable: true,
    enumerable: true,
    get() {
      reads.push(String(index));
      return value;
    },
  });
  return values;
}

function reflectionFailureArray(values, trap) {
  return new Proxy(values, {
    [trap]() {
      throw new TypeError(`${trap} failed`);
    },
  });
}

function importedSpecifiers(source) {
  const staticMatches = source.matchAll(
    /(?:^|\n)\s*(?:import|export)\s+(?:(?:type\s+)?[\s\S]*?\s+from\s+)?["']([^"']+)["']/gu,
  );
  const dynamicMatches = source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu);

  return [...staticMatches, ...dynamicMatches].map((match) => match[1]);
}

function expectedSources(input) {
  return {
    registrySource: input.registrySource,
    sanctionsSource: {
      source: input.sanctionsDataset.source,
      lastModified: input.sanctionsDataset.lastModified,
      contentHash: input.sanctionsDataset.contentHash,
    },
  };
}

implementedTest("parses the closed French request and preserves its normalized optional SIREN", () => {
  assert.equal(
    typeof parseEntityCheckRequest,
    "function",
    "the EntityCheck request parser must be exported from its declared Core module",
  );

  assert.deepEqual(
    parseEntityCheckRequest(
      request({
        requestRef: " entitycheck-request-43 ",
        query: " Société Étoile ",
        registrationNumber: "123456789",
      }),
    ),
    {
      requestRef: "entitycheck-request-43",
      jurisdiction: "FR",
      query: "Société Étoile",
      registrationNumber: "123456789",
    },
  );

  assert.deepEqual(parseEntityCheckRequest(request()), request());

  const invalidInputs = [
    ["null root", null],
    ["array root", []],
    ["missing query", { requestRef: "entitycheck-request-42", jurisdiction: "FR" }],
    ["unknown root field", request({ unsupported: true })],
    ["blank requestRef", request({ requestRef: "   " })],
    ["oversized requestRef", request({ requestRef: "r".repeat(97) })],
    ["blank query", request({ query: "   " })],
    ["oversized query", request({ query: "q".repeat(161) })],
    ["non-French jurisdiction", request({ jurisdiction: "BE" })],
    ["non-string jurisdiction", request({ jurisdiction: null })],
    ["short SIREN", request({ registrationNumber: "12345678" })],
    ["non-ASCII SIREN digit", request({ registrationNumber: "１２３４５６７８９" })],
    ["spaced SIREN", request({ registrationNumber: " 123456789 " })],
  ];

  for (const [description, input] of invalidInputs) {
    assertInputError(() => parseEntityCheckRequest(input), description);
  }
});

implementedTest("normalises names with NFKD, mark removal, punctuation replacement, and collapsed whitespace", () => {
  assert.equal(
    typeof normaliseEntityName,
    "function",
    "the EntityCheck normaliser must be exported from its declared Core module",
  );
  assert.equal(
    normaliseEntityName("  Société, Étoile---S.A.S.  "),
    "SOCIETE ETOILE S A S",
  );
  assert.equal(normaliseEntityName("Crédit & Coopération"), "CREDIT COOPERATION");
  assert.equal(normaliseEntityName("A\u00a0B\tC\nD"), "A B C D");
});

implementedTest("rejects malformed registry candidates, source descriptors, and sanctions entries as a whole", () => {
  assert.equal(
    typeof assessEntityCheck,
    "function",
    "the pure EntityCheck assessor must be exported from its declared Core module",
  );

  const validRequest = parseEntityCheckRequest(request());
  const invalidInputs = [
    ["unknown assessment field", assessmentInput({ unsupported: true })],
    [
      "candidate with malformed SIREN",
      assessmentInput({ registryCandidates: [candidate({ siren: "123" })] }),
    ],
    [
      "candidate with blank legal name",
      assessmentInput({ registryCandidates: [candidate({ legalName: "   " })] }),
    ],
    [
      "candidate with unsupported status",
      assessmentInput({ registryCandidates: [candidate({ administrativeStatus: "pending" })] }),
    ],
    [
      "candidate with malformed incorporation date",
      assessmentInput({ registryCandidates: [candidate({ incorporationDate: "2026-02-30" })] }),
    ],
    [
      "candidate with non-integer officer count",
      assessmentInput({ registryCandidates: [candidate({ officerCount: 1.5 })] }),
    ],
    [
      "candidate with malformed update timestamp",
      assessmentInput({ registryCandidates: [candidate({ registryUpdatedAt: "not-a-timestamp" })] }),
    ],
    [
      "registry descriptor with another source",
      assessmentInput({ registrySource: registrySource({ source: "OTHER" }) }),
    ],
    [
      "registry descriptor with malformed read time",
      assessmentInput({ registrySource: registrySource({ readAt: "not-a-timestamp" }) }),
    ],
    [
      "sanctions descriptor with another source",
      assessmentInput({ sanctionsDataset: sanctionsDataset({ source: "OTHER" }) }),
    ],
    [
      "sanctions descriptor with malformed content hash",
      assessmentInput({ sanctionsDataset: sanctionsDataset({ contentHash: "abc" }) }),
    ],
    [
      "sanctions descriptor with uppercase content hash",
      assessmentInput({ sanctionsDataset: sanctionsDataset({ contentHash: "A".repeat(64) }) }),
    ],
    [
      "sanctions descriptor with non-hex content hash",
      assessmentInput({ sanctionsDataset: sanctionsDataset({ contentHash: "g".repeat(64) }) }),
    ],
    [
      "sanctions descriptor with malformed Last-Modified",
      assessmentInput({ sanctionsDataset: sanctionsDataset({ lastModified: "Wed, 09 Sep 2026 00:00:00 UTC" }) }),
    ],
    [
      "sparse registry candidates",
      assessmentInput({ registryCandidates: [, candidate()] }),
    ],
    [
      "sparse sanctions entries",
      assessmentInput({ sanctionsDataset: sanctionsDataset({ entries: [, { entryId: "1", name: "Société Étoile SAS", entryType: "Entity", programs: [] }] }) }),
    ],
    [
      "sparse sanctions programs",
      assessmentInput({
        sanctionsDataset: sanctionsDataset({
          entries: [{ entryId: "1", name: "Société Étoile SAS", entryType: "Entity", programs: [, "SDNTK"] }],
        }),
      }),
    ],
    [
      "sanctions entry with blank identifier",
      assessmentInput({
        sanctionsDataset: sanctionsDataset({
          entries: [{ entryId: " ", name: "Société Étoile SAS", entryType: "Entity", programs: [] }],
        }),
      }),
    ],
    [
      "sanctions entry with non-array programs",
      assessmentInput({
        sanctionsDataset: sanctionsDataset({
          entries: [{ entryId: "1", name: "Société Étoile SAS", entryType: "Entity", programs: "SDNTK" }],
        }),
      }),
    ],
  ];

  for (const [description, input] of invalidInputs) {
    assertInputError(() => assessEntityCheck(validRequest, input), description);
  }
});

implementedTest("rejects every non-ordinary caller record without invoking accessors", () => {
  const validRequest = parseEntityCheckRequest(request());
  const recordChecks = [
    {
      label: "request",
      create: () => request(),
      field: "query",
      assess: (value) => parseEntityCheckRequest(value),
    },
    {
      label: "assessment input",
      create: () => assessmentInput(),
      field: "registryCandidates",
      assess: (value) => assessEntityCheck(validRequest, value),
    },
    {
      label: "registry candidate",
      create: () => candidate(),
      field: "legalName",
      assess: (value) => assessEntityCheck(
        validRequest,
        assessmentInput({ registryCandidates: [value] }),
      ),
    },
    {
      label: "registry source",
      create: () => registrySource(),
      field: "source",
      assess: (value) => assessEntityCheck(
        validRequest,
        assessmentInput({ registrySource: value }),
      ),
    },
    {
      label: "sanctions dataset",
      create: () => sanctionsDataset(),
      field: "source",
      assess: (value) => assessEntityCheck(
        validRequest,
        assessmentInput({ sanctionsDataset: value }),
      ),
    },
    {
      label: "sanctions entry",
      create: () => sanctionsEntry(),
      field: "entryId",
      assess: (value) => assessEntityCheck(
        validRequest,
        assessmentInput({ sanctionsDataset: sanctionsDataset({ entries: [value] }) }),
      ),
    },
  ];
  const mutations = [
    {
      label: "custom prototype",
      apply: (record) => customPrototypeRecord(record),
    },
    {
      label: "inherited document fields",
      apply: (record) => inheritedFieldsRecord(record),
    },
    {
      label: "unexpected enumerable field",
      apply: (record) => ({ ...record, unexpected: true }),
    },
    {
      label: "non-enumerable field",
      apply: (record) => nonEnumerableFieldRecord(record),
    },
    {
      label: "symbol field",
      apply: (record) => symbolFieldRecord(record),
    },
    {
      label: "accessor field",
      apply: (record, field, reads) => accessorFieldRecord(record, field, reads),
    },
    {
      label: "ownKeys reflection failure",
      apply: (record) => reflectionFailureRecord(record, "ownKeys"),
    },
    {
      label: "descriptor reflection failure",
      apply: (record) => reflectionFailureRecord(record, "getOwnPropertyDescriptor"),
    },
    {
      label: "prototype reflection failure",
      apply: (record) => reflectionFailureRecord(record, "getPrototypeOf"),
    },
  ];

  for (const recordCheck of recordChecks) {
    for (const mutation of mutations) {
      const reads = [];
      const malformed = mutation.apply(recordCheck.create(), recordCheck.field, reads);
      const description = `${recordCheck.label} with ${mutation.label}`;

      assertInputError(() => recordCheck.assess(malformed), description);
      assert.deepEqual(reads, [], `${description} must not invoke a getter`);
    }
  }
});

implementedTest("rejects every non-ordinary caller array without invoking accessors", () => {
  const validRequest = parseEntityCheckRequest(request());
  const arrayChecks = [
    {
      label: "registry candidates",
      create: () => [candidate(), candidate({ siren: "987654321" })],
      assess: (value) => assessEntityCheck(
        validRequest,
        assessmentInput({ registryCandidates: value }),
      ),
    },
    {
      label: "sanctions entries",
      create: () => [sanctionsEntry(), sanctionsEntry({ entryId: "ofac-2" })],
      assess: (value) => assessEntityCheck(
        validRequest,
        assessmentInput({ sanctionsDataset: sanctionsDataset({ entries: value }) }),
      ),
    },
    {
      label: "sanctions programs",
      create: () => ["SDNTK", "IRAN"],
      assess: (value) => assessEntityCheck(
        validRequest,
        assessmentInput({
          sanctionsDataset: sanctionsDataset({
            entries: [sanctionsEntry({ programs: value })],
          }),
        }),
      ),
    },
  ];
  const mutations = [
    { label: "custom prototype", apply: (values) => customPrototypeArray(values) },
    { label: "null prototype", apply: (values) => nullPrototypeArray(values) },
    { label: "extra enumerable field", apply: (values) => Object.assign(values, { unexpected: true }) },
    { label: "non-enumerable field", apply: (values) => nonEnumerableArrayField(values) },
    { label: "symbol field", apply: (values) => symbolArrayField(values) },
    { label: "accessor first item", apply: (values, reads) => accessorArrayItem(values, 0, reads) },
    { label: "accessor later item", apply: (values, reads) => accessorArrayItem(values, 1, reads) },
    { label: "ownKeys reflection failure", apply: (values) => reflectionFailureArray(values, "ownKeys") },
    { label: "descriptor reflection failure", apply: (values) => reflectionFailureArray(values, "getOwnPropertyDescriptor") },
    { label: "prototype reflection failure", apply: (values) => reflectionFailureArray(values, "getPrototypeOf") },
  ];

  for (const arrayCheck of arrayChecks) {
    for (const mutation of mutations) {
      const reads = [];
      const malformed = mutation.apply(arrayCheck.create(), reads);
      const description = `${arrayCheck.label} with ${mutation.label}`;

      assertInputError(() => arrayCheck.assess(malformed), description);
      assert.deepEqual(reads, [], `${description} must not invoke an accessor`);
    }
  }
});

implementedTest("preserves mapped public-source strings above 512 characters", () => {
  const longValue = "x".repeat(513);
  const longEntry = sanctionsEntry({
    entryId: longValue,
    name: longValue,
    entryType: longValue,
    programs: [longValue],
  });
  const input = assessmentInput({
    registryCandidates: [candidate({
      legalName: longValue,
      registeredAddress: longValue,
    })],
    sanctionsDataset: sanctionsDataset({
      entries: [longEntry],
    }),
  });

  const result = assessEntityCheck(parseEntityCheckRequest(request()), input);

  assert.equal(result.disposition, "found");
  assert.equal(result.sanctionsScreen, "hit");
  assert.equal(result.candidate.legalName, longValue);
  assert.equal(result.candidate.registeredAddress, longValue);
  assert.deepEqual(result.sanctionsMatches, [longEntry]);
});

implementedTest("accepts and preserves the reader's IMF-fixdate Last-Modified and lowercase content hash", () => {
  const lastModified = "Wed, 09 Sep 2026 00:00:00 GMT";
  const contentHash = "0123456789abcdef".repeat(4);
  const input = assessmentInput({
    sanctionsDataset: sanctionsDataset({ lastModified, contentHash }),
  });

  const result = assessEntityCheck(parseEntityCheckRequest(request()), input);

  assert.deepEqual(result.sanctionsSource, {
    source: "OFAC_SDN",
    lastModified,
    contentHash,
  });
});

implementedTest("returns one clear found result and echoes descriptors without sanctions entries", () => {
  const validRequest = parseEntityCheckRequest(
    request({ requestRef: " entitycheck-request-44 ", query: " Société Étoile SAS " }),
  );
  const input = assessmentInput();

  const result = assessEntityCheck(validRequest, input);

  assert.deepEqual(result, {
    requestRef: "entitycheck-request-44",
    jurisdiction: "FR",
    query: "Société Étoile SAS",
    ...expectedSources(input),
    disposition: "found",
    candidate: candidate(),
    sanctionsScreen: "clear",
    limitations: [baselineLimitation],
  });
  assert.equal("entries" in result.sanctionsSource, false);
  assert.equal("sanctionsMatches" in result, false);
});

implementedTest("selects the SIREN-matched candidate and returns every exact-normalised sanctions hit in dataset order", () => {
  const first = candidate({ siren: "987654321", legalName: "Unrelated Industrie SAS" });
  const matched = candidate({ siren: "123456789", legalName: "Société Étoile SAS" });
  const firstHit = {
    entryId: "ofac-1",
    name: "SOCIETE ETOILE S A S",
    entryType: "Entity",
    programs: ["SDNTK"],
  };
  const secondHit = {
    entryId: "ofac-2",
    name: "Société, Étoile---S.A.S.",
    entryType: "Entity",
    programs: ["IRAN", "SDNTK"],
  };
  const nearMiss = {
    entryId: "ofac-3",
    name: "Société Étoile",
    entryType: "Entity",
    programs: [],
  };
  const input = assessmentInput({
    registryCandidates: [first, matched],
    sanctionsDataset: sanctionsDataset({ entries: [firstHit, secondHit, nearMiss] }),
  });
  const validRequest = parseEntityCheckRequest(
    request({ registrationNumber: "123456789" }),
  );

  assert.deepEqual(assessEntityCheck(validRequest, input), {
    ...validRequest,
    ...expectedSources(input),
    disposition: "found",
    candidate: matched,
    sanctionsScreen: "hit",
    sanctionsMatches: [firstHit, secondHit],
    limitations: [baselineLimitation],
  });
});

implementedTest("caps ambiguous candidates at five pairs and records the SIREN disambiguation limitation", () => {
  const registryCandidates = Array.from({ length: 6 }, (_, index) =>
    candidate({
      siren: String(index + 1).padStart(9, "0"),
      legalName: `Candidate ${index + 1} SAS`,
    }),
  );
  const input = assessmentInput({ registryCandidates });
  const validRequest = parseEntityCheckRequest(request({ query: "Candidate" }));

  assert.deepEqual(assessEntityCheck(validRequest, input), {
    ...validRequest,
    ...expectedSources(input),
    disposition: "ambiguous",
    candidateCount: 6,
    candidates: registryCandidates.slice(0, 5).map(({ siren, legalName }) => ({ siren, legalName })),
    sanctionsScreen: "not_screened",
    limitations: [baselineLimitation, ambiguityLimitation],
  });
});

implementedTest("returns not_found without a sanctions assertion", () => {
  const input = assessmentInput({ registryCandidates: [] });
  const validRequest = parseEntityCheckRequest(request({ query: "Absent Company" }));

  assert.deepEqual(assessEntityCheck(validRequest, input), {
    ...validRequest,
    ...expectedSources(input),
    disposition: "not_found",
    sanctionsScreen: "not_screened",
    limitations: [baselineLimitation],
  });
});

implementedTest("keeps EntityCheck results free of scoring, payment, settlement, evidence, and availability claims", () => {
  const result = assessEntityCheck(
    parseEntityCheckRequest(request()),
    assessmentInput(),
  );

  for (const field of [
    "score",
    "price",
    "receipt",
    "payment",
    "settlement",
    "evidenceRecord",
    "availability",
  ]) {
    assert.equal(field in result, false, `${field} must not be part of EntityCheck`);
  }
});

implementedTest("keeps the EntityCheck implementation free of external, framework, network, and RiskScan imports", () => {
  const source = readFileSync(sourcePath, "utf8");
  const specifiers = importedSpecifiers(source);

  for (const specifier of specifiers) {
    assert.match(
      specifier,
      /^\.\.?(?:\/|$)/u,
      `EntityCheck must not import an external, framework, or network module: ${specifier}`,
    );
    assert.doesNotMatch(
      specifier,
      /risk-?scan/iu,
      `EntityCheck must not import a RiskScan module: ${specifier}`,
    );
  }
});
