import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL(
  "../src/lib/entity-check-sources.ts",
  import.meta.url,
);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const registryBaseUrl = "https://registry.invalid/api";
const sanctionsUrl = "https://sanctions.invalid/sdn.csv";
const registryUrl = `${registryBaseUrl}/search?q=Soci%C3%A9t%C3%A9%20G%C3%A9n%C3%A9rale&per_page=5`;
const nowMilliseconds = Date.parse("2026-09-09T18:00:00.000Z");
const request = Object.freeze({
  requestRef: "entity-7",
  jurisdiction: "FR",
  query: "Société Générale",
});

// Redacted excerpt of a public recherche-entreprises response observed on 2026-09-09.
const registryFixture = {
  results: [
    {
      siren: "552120222",
      nom_complet: "SOCIETE GENERALE (SG)",
      nom_raison_sociale: "SOCIETE GENERALE",
      nombre_etablissements: 4258,
      siege: {
        adresse: "29 BOULEVARD HAUSSMANN 75009 PARIS",
        code_postal: "75009",
      },
      date_creation: "1900-01-01",
      date_mise_a_jour: "2026-09-09T14:50:03",
      dirigeants: Array.from({ length: 18 }, (_, index) => ({
        nom: `D${index}`,
        qualite: "Administrateur",
      })),
      etat_administratif: "A",
      nature_juridique: "5599",
    },
    {
      siren: "123456789",
      nom_complet: "CEASED COMPANY",
      siege: {},
      date_creation: "2001-02-03",
      date_mise_a_jour: "2026-01-01T00:00:00",
      dirigeants: [],
      etat_administratif: "C",
    },
    {
      siren: "999999999",
      nom_complet: "DISSOLVED",
      etat_administratif: "X",
      date_creation: "2001-02-03",
      date_mise_a_jour: "2026-01-01T00:00:00",
      dirigeants: [],
    },
    {
      siren: "12345678",
      nom_complet: "SHORT SIREN",
      etat_administratif: "A",
      date_creation: "2001-02-03",
      date_mise_a_jour: "2026-01-01T00:00:00",
      dirigeants: [],
    },
    {
      siren: "111111111",
      nom_complet: "  ",
      etat_administratif: "A",
      date_creation: "2001-02-03",
      date_mise_a_jour: "2026-01-01T00:00:00",
      dirigeants: [],
    },
    {
      siren: "222222222",
      nom_complet: "BAD DATE",
      etat_administratif: "A",
      date_creation: "2001-2-3",
      date_mise_a_jour: "2026-01-01T00:00:00",
      dirigeants: [],
    },
    "not an object",
  ],
  total_results: 7,
  page: 1,
  per_page: 5,
  total_pages: 1,
};

// Redacted excerpt of the public OFAC SDN CSV observed on 2026-09-09: twelve
// columns, no header, `-0- ` for empty, CRLF rows, and a trailing 0x1A byte.
const sanctionsFixture =
  [
    '36,"AEROCARIBBEAN AIRLINES",-0- ,"CUBA",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ',
    '3751,"MOA NICKEL SA",-0- ,"CUBA] [CUBA-EO14404",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,"Organization Established Date 1994; Organization Type: Mining."',
    '4632,"BANK MARKAZI JOMHOURI ISLAMI IRAN","individual","IRAN] [SDGT] [IRGC] [IFSR",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,"Additional Sanctions Information, with a comma."',
    '7001,"SOCIETE ""GENERALE"" TEST",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ',
    "8001,short row",
  ].join("\r\n") + "\r\n";

function createFetch(handlers) {
  const calls = [];
  const fetchImplementation = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, init });
    const handler = handlers[url];
    if (handler === undefined) throw new TypeError(`unexpected fetch ${url}`);
    return handler(init);
  };
  return { fetchImplementation, calls };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function csvResponse(
  body = sanctionsFixture,
  headers = { "last-modified": "Wed, 09 Sep 2026 13:32:00 GMT" },
) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/csv", ...headers },
  });
}

function bytesResponse(byteLength) {
  return new Response(new Uint8Array(byteLength), { status: 200 });
}

async function sha256Hex(text) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function configuration(overrides = {}) {
  return api.readEntityCheckSourceConfiguration({
    ENTITYCHECK_REGISTRY_BASE_URL: registryBaseUrl,
    ENTITYCHECK_SANCTIONS_URL: sanctionsUrl,
    ...overrides,
  });
}

function read(handlers, options = {}) {
  const { fetchImplementation, calls } = createFetch(handlers);
  const outcome = api.readEntityCheckSources(
    options.request ?? request,
    options.configuration === undefined
      ? configuration()
      : options.configuration,
    { fetch: fetchImplementation, now: options.now ?? (() => nowMilliseconds) },
  );
  return { outcome, calls };
}

test("requires the declared EntityCheck source adapter module before GREEN", () => {
  assert.equal(
    sourceExists,
    true,
    `missing declared source module: ${sourcePath}`,
  );
});

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest(
  "reads configuration only when both HTTPS values are well formed",
  () => {
    assert.deepEqual(configuration(), { registryBaseUrl, sanctionsUrl });
    assert.deepEqual(
      configuration({ ENTITYCHECK_REGISTRY_BASE_URL: `${registryBaseUrl}/` }),
      { registryBaseUrl, sanctionsUrl },
    );
    const rejected = [
      { ENTITYCHECK_REGISTRY_BASE_URL: undefined },
      { ENTITYCHECK_REGISTRY_BASE_URL: "   " },
      { ENTITYCHECK_REGISTRY_BASE_URL: "http://registry.invalid/api" },
      { ENTITYCHECK_REGISTRY_BASE_URL: "https://user:pw@registry.invalid/api" },
      { ENTITYCHECK_REGISTRY_BASE_URL: "https://registry.invalid/api?x=1" },
      { ENTITYCHECK_REGISTRY_BASE_URL: "https://registry.invalid/api#frag" },
      { ENTITYCHECK_REGISTRY_BASE_URL: "not a url" },
      { ENTITYCHECK_SANCTIONS_URL: undefined },
      { ENTITYCHECK_SANCTIONS_URL: "" },
      { ENTITYCHECK_SANCTIONS_URL: "http://sanctions.invalid/sdn.csv" },
      { ENTITYCHECK_SANCTIONS_URL: "https://user@sanctions.invalid/sdn.csv" },
      { ENTITYCHECK_SANCTIONS_URL: "ftp://sanctions.invalid/sdn.csv" },
    ];
    for (const overrides of rejected) {
      assert.equal(configuration(overrides), null, JSON.stringify(overrides));
    }
    assert.equal(api.readEntityCheckSourceConfiguration({}), null);
  },
);

implementedTest(
  "returns not_configured without any fetch when configuration is null",
  async () => {
    const { outcome, calls } = read({}, { configuration: null });
    assert.deepEqual(await outcome, { kind: "not_configured" });
    assert.deepEqual(calls, []);
  },
);

implementedTest(
  "requests the exact registry URL with SIREN precedence over the query",
  async () => {
    const bySiren = read(
      {
        [`${registryBaseUrl}/search?q=552120222&per_page=5`]: () =>
          jsonResponse({ results: [] }),
        [sanctionsUrl]: () => csvResponse(),
      },
      { request: { ...request, registrationNumber: "552120222" } },
    );
    assert.equal((await bySiren.outcome).kind, "read");
    assert.equal(
      bySiren.calls[0].url,
      `${registryBaseUrl}/search?q=552120222&per_page=5`,
    );
    assert.equal(bySiren.calls[0].init.method ?? "GET", "GET");
    assert.ok(bySiren.calls[0].init.signal instanceof AbortSignal);

    const byQuery = read({
      [registryUrl]: () => jsonResponse({ results: [] }),
      [sanctionsUrl]: () => csvResponse(),
    });
    assert.equal((await byQuery.outcome).kind, "read");
    assert.equal(byQuery.calls[0].url, registryUrl);
  },
);

implementedTest(
  "maps the recorded registry fixture field for field and reports every dropped item",
  async () => {
    const { outcome } = read({
      [registryUrl]: () => jsonResponse(registryFixture),
      [sanctionsUrl]: () => csvResponse(),
    });
    const result = await outcome;
    assert.equal(result.kind, "read");
    assert.deepEqual(result.registryCandidates, [
      {
        siren: "552120222",
        legalName: "SOCIETE GENERALE (SG)",
        administrativeStatus: "active",
        incorporationDate: "1900-01-01",
        registeredAddress: "29 BOULEVARD HAUSSMANN 75009 PARIS",
        officerCount: 18,
        registryUpdatedAt: "2026-09-09T14:50:03.000Z",
      },
      {
        siren: "123456789",
        legalName: "CEASED COMPANY",
        administrativeStatus: "ceased",
        incorporationDate: "2001-02-03",
        registeredAddress: "",
        officerCount: 0,
        registryUpdatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    assert.equal(result.droppedCandidates, 5);
    assert.deepEqual(result.registrySource, {
      source: "FR_RECHERCHE_ENTREPRISES",
      readAt: "2026-09-09T18:00:00.000Z",
    });
    for (const candidate of result.registryCandidates)
      assert.equal(Object.isFrozen(candidate), true);
  },
);

implementedTest(
  "fails closed to registry_unavailable on rejection, timeout, cap, non-200, and unparsable bodies",
  async () => {
    const abort = () => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      throw error;
    };
    const cases = [
      [
        "rejection",
        () => {
          throw new TypeError("fetch failed");
        },
      ],
      ["timeout", abort],
      ["cap", () => bytesResponse(api.ENTITYCHECK_REGISTRY_MAX_BYTES + 1)],
      ["status 500", () => jsonResponse({ results: [] }, 500)],
      ["not json", () => new Response("<html>", { status: 200 })],
      ["json without results", () => jsonResponse({ items: [] })],
      ["json array", () => jsonResponse([])],
    ];
    for (const [label, handler] of cases) {
      const { outcome, calls } = read({
        [registryUrl]: handler,
        [sanctionsUrl]: () => csvResponse(),
      });
      assert.deepEqual(await outcome, { kind: "registry_unavailable" }, label);
      assert.equal(
        calls.length,
        1,
        `${label} must not read sanctions after a registry failure`,
      );
    }
  },
);

implementedTest(
  "parses the recorded SDN fixture columns, -0- blanks, program lists, and reports Last-Modified and SHA-256",
  async () => {
    const { outcome } = read({
      [registryUrl]: () => jsonResponse({ results: [] }),
      [sanctionsUrl]: () => csvResponse(),
    });
    const result = await outcome;
    assert.equal(result.kind, "read");
    assert.deepEqual(result.sanctionsDataset, {
      source: "OFAC_SDN",
      lastModified: "2026-09-09T13:32:00.000Z",
      contentHash: await sha256Hex(sanctionsFixture),
      entries: [
        {
          entryId: "36",
          name: "AEROCARIBBEAN AIRLINES",
          entryType: "",
          programs: ["CUBA"],
        },
        {
          entryId: "3751",
          name: "MOA NICKEL SA",
          entryType: "",
          programs: ["CUBA", "CUBA-EO14404"],
        },
        {
          entryId: "4632",
          name: "BANK MARKAZI JOMHOURI ISLAMI IRAN",
          entryType: "individual",
          programs: ["IRAN", "SDGT", "IRGC", "IFSR"],
        },
        {
          entryId: "7001",
          name: 'SOCIETE "GENERALE" TEST',
          entryType: "",
          programs: [],
        },
      ],
    });
    assert.equal(Object.isFrozen(result.sanctionsDataset), true);
    assert.equal(Object.isFrozen(result.sanctionsDataset.entries), true);

    const withoutHeader = read(
      {
        [registryUrl]: () => jsonResponse({ results: [] }),
        "https://sanctions.invalid/no-header.csv": () =>
          csvResponse(sanctionsFixture, {}),
      },
      {
        configuration: {
          registryBaseUrl,
          sanctionsUrl: "https://sanctions.invalid/no-header.csv",
        },
      },
    );
    assert.equal(
      (await withoutHeader.outcome).sanctionsDataset.lastModified,
      "2026-09-09T18:00:00.000Z",
    );
  },
);

implementedTest(
  "fails closed to sanctions_unavailable without a cached dataset and never exposes upstream detail",
  async () => {
    const cases = [
      [
        "rejection",
        () => {
          throw new TypeError("fetch failed: secret-host");
        },
      ],
      ["status-404", () => new Response("secret body", { status: 404 })],
      ["cap", () => bytesResponse(api.ENTITYCHECK_SANCTIONS_MAX_BYTES + 1)],
    ];
    for (const [label, handler] of cases) {
      const url = `https://sanctions.invalid/${label}.csv`;
      const { outcome } = read(
        { [registryUrl]: () => jsonResponse({ results: [] }), [url]: handler },
        { configuration: { registryBaseUrl, sanctionsUrl: url } },
      );
      const result = await outcome;
      assert.deepEqual(result, { kind: "sanctions_unavailable" }, label);
      assert.doesNotMatch(JSON.stringify(result), /secret|404|fetch failed/u);
    }
  },
);

implementedTest(
  "reuses a parsed dataset for 24 hours per URL, holds no raw body, and re-reads after expiry",
  async () => {
    const url = "https://sanctions.invalid/cached.csv";
    const cachedConfiguration = { registryBaseUrl, sanctionsUrl: url };
    let sanctionsReads = 0;
    const handlers = {
      [registryUrl]: () => jsonResponse({ results: [] }),
      [url]: () => {
        sanctionsReads += 1;
        return csvResponse();
      },
    };

    const first = await read(handlers, { configuration: cachedConfiguration })
      .outcome;
    assert.equal(first.kind, "read");
    assert.equal(sanctionsReads, 1);

    const later = read(handlers, {
      configuration: cachedConfiguration,
      now: () => nowMilliseconds + 23 * 60 * 60 * 1000,
    });
    const laterResult = await later.outcome;
    assert.equal(laterResult.kind, "read");
    assert.equal(sanctionsReads, 1);
    assert.equal(later.calls.length, 1);
    assert.deepEqual(laterResult.sanctionsDataset, first.sanctionsDataset);

    const failing = read(
      {
        [registryUrl]: () => jsonResponse({ results: [] }),
        [url]: () => new Response("x", { status: 500 }),
      },
      {
        configuration: cachedConfiguration,
        now: () => nowMilliseconds + 23 * 60 * 60 * 1000,
      },
    );
    assert.equal(
      (await failing.outcome).kind,
      "read",
      "a cached dataset serves while it is fresh",
    );

    const expired = read(handlers, {
      configuration: cachedConfiguration,
      now: () => nowMilliseconds + 24 * 60 * 60 * 1000 + 1,
    });
    assert.equal((await expired.outcome).kind, "read");
    assert.equal(sanctionsReads, 2);

    const cacheText = JSON.stringify(api.inspectEntityCheckSanctionsCache());
    assert.doesNotMatch(cacheText, /AEROCARIBBEAN AIRLINES",-0-/u);
    assert.doesNotMatch(cacheText, //u);
    assert.match(cacheText, /contentHash/u);
  },
);

implementedTest(
  "has no default fetch, no environment read outside the parser, no logging, and rejects missing dependencies",
  async () => {
    const source = await readFile(sourcePath, "utf8");
    assert.doesNotMatch(source, /globalThis\.fetch|[^.]\bfetch\s*\(/u);
    assert.doesNotMatch(source, /console\./u);
    assert.doesNotMatch(source, /process\.env/u);
    assert.doesNotMatch(
      source,
      /\bimport\b[^\n]*["'](?:next|react|convex|@x402)/u,
    );
    await assert.rejects(
      () =>
        api.readEntityCheckSources(request, configuration(), {
          now: () => nowMilliseconds,
        }),
      TypeError,
    );
  },
);
