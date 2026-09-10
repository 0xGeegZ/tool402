import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/lib/entity-check-sources.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const oneMebibyte = 1_048_576;
const sixteenMebibytes = 16_777_216;
const initialNow = Date.UTC(2026, 8, 10, 6, 0, 0);
let api;

function request(overrides = {}) {
  return {
    requestRef: "entity_check_request_001",
    jurisdiction: "FR",
    query: "Example et Cie",
    ...overrides,
  };
}

function environment(overrides = {}) {
  return {
    ENTITYCHECK_REGISTRY_BASE_URL: "https://registry.example.test/",
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/sdn.csv",
    ...overrides,
  };
}

function readConfiguration(overrides = {}) {
  const configuration = api.readEntityCheckSourceConfiguration(environment(overrides));
  assert.notEqual(configuration, null);
  return configuration;
}

function registryRecord(overrides = {}) {
  return {
    siren: "123456789",
    nom_complet: "Example et Cie",
    etat_administratif: "A",
    date_creation: "2020-02-29",
    siege: { adresse: "1 rue de la Paix, 75000 Paris" },
    dirigeants: [{ nom: "Responsable" }],
    date_mise_a_jour: "2026-09-09T12:00:00.000Z",
    ...overrides,
  };
}

function registryResponse(results = [registryRecord()]) {
  return new Response(JSON.stringify({ results }), { status: 200 });
}

function csvCell(value) {
  const text = String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function sanctionsRow({
  entryId = "1",
  name = "Example et Cie",
  entryType = "Entity",
  programs = "-0-",
  extra = [],
} = {}) {
  const values = [entryId, name, entryType, programs, ...extra];
  while (values.length < 12) {
    values.push("");
  }
  assert.equal(values.length, 12);
  return values.map(csvCell).join(",");
}

function sanctionsCsv(rows = [sanctionsRow()], lineEnding = "\r\n") {
  return `${rows.join(lineEnding)}${lineEnding}`;
}

function exactSizedCsv(byteLength) {
  const firstElevenColumns = [
    "exact-entry",
    "Exact dataset",
    "Entity",
    "-0-",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  const prefix = `${firstElevenColumns.map(csvCell).join(",")},`;
  const paddingLength = byteLength - new TextEncoder().encode(`${prefix}\r\n`).byteLength;
  assert.ok(paddingLength >= 0);
  const csv = `${prefix}${" ".repeat(paddingLength)}\r\n`;
  assert.equal(new TextEncoder().encode(csv).byteLength, byteLength);
  return csv;
}

function sanctionsResponse(csv, headers = {}) {
  return new Response(csv, { status: 200, headers });
}

function exactSizedJsonResponse(body, byteLength) {
  const json = JSON.stringify(body);
  const actualLength = new TextEncoder().encode(json).byteLength;
  assert.ok(actualLength <= byteLength);
  return new Response(`${json}${" ".repeat(byteLength - actualLength)}`, { status: 200 });
}

function oversizedResponse(byteLength, onCancel) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(byteLength));
      },
      cancel: onCancel,
    }),
    { status: 200 },
  );
}

async function settlesBefore(promise, milliseconds = 100) {
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("operation did not settle")), milliseconds);
  });

  try {
    return await Promise.race([promise, deadline]);
  } finally {
    clearTimeout(timeout);
  }
}

test("requires the declared M46 EntityCheck source module before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M46 source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("fails closed for missing, malformed, inherited, or accessor-backed configuration", () => {
  const accepted = api.readEntityCheckSourceConfiguration(environment());
  assert.notEqual(accepted, null);

  const malformedRegistryValues = [
    undefined,
    "",
    "http://registry.example.test/",
    "https://user:pass@registry.example.test/",
    "https://registry.example.test/subpath/",
    "https://registry.example.test/?query=1",
    "https://registry.example.test/#fragment",
    ["https://registry.example.test/"],
  ];
  for (const value of malformedRegistryValues) {
    assert.equal(
      api.readEntityCheckSourceConfiguration(environment({ ENTITYCHECK_REGISTRY_BASE_URL: value })),
      null,
    );
  }

  const malformedSanctionsValues = [
    undefined,
    "",
    "http://sanctions.example.test/sdn.csv",
    "https://user:pass@sanctions.example.test/sdn.csv",
    ["https://sanctions.example.test/sdn.csv"],
  ];
  for (const value of malformedSanctionsValues) {
    assert.equal(
      api.readEntityCheckSourceConfiguration(environment({ ENTITYCHECK_SANCTIONS_URL: value })),
      null,
    );
  }

  const inherited = Object.create(environment());
  assert.equal(api.readEntityCheckSourceConfiguration(inherited), null);

  let accessed = false;
  const accessorBacked = {};
  Object.defineProperty(accessorBacked, "ENTITYCHECK_REGISTRY_BASE_URL", {
    enumerable: true,
    get() {
      accessed = true;
      return "https://registry.example.test/";
    },
  });
  Object.defineProperty(accessorBacked, "ENTITYCHECK_SANCTIONS_URL", {
    enumerable: true,
    value: "https://sanctions.example.test/sdn.csv",
  });
  assert.equal(api.readEntityCheckSourceConfiguration(accessorBacked), null);
  assert.equal(accessed, false);
});

implementedTest("does not send a request without a complete configuration or an injected fetch", async (t) => {
  let calls = 0;
  const noConfiguration = await api.readEntityCheckSources(request(), null, {
    fetch: async () => {
      calls += 1;
      throw new Error("must not fetch");
    },
    now: () => initialNow,
  });
  assert.deepEqual(noConfiguration, { kind: "not_configured" });
  assert.equal(calls, 0);

  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    throw new Error("must not use global fetch");
  });
  const missingInjectedFetch = await api.readEntityCheckSources(request(), readConfiguration(), {
    now: () => initialNow,
  });
  assert.deepEqual(missingInjectedFetch, { kind: "registry_unavailable" });
  assert.equal(calls, 0);
});

implementedTest("maps the fixed registry and sanctions fixtures using a SIREN ahead of query", async () => {
  const now = Date.UTC(2026, 8, 10, 6, 0, 0);
  const lastModified = new Date(Date.UTC(2026, 8, 9, 12, 0, 0)).toUTCString();
  const csv = sanctionsCsv([
    sanctionsRow({
      entryId: "100",
      name: "Café, \"Example\"",
      entryType: "Entity",
      programs: "[SDNTK] [IRAN]",
    }),
    sanctionsRow({ entryId: "101", name: "No Programme", programs: "-0-" }),
  ]);
  const registry = [
    registryRecord(),
    registryRecord({
      siren: "987654321",
      nom_complet: "Ceased Example",
      etat_administratif: "C",
      siege: undefined,
      dirigeants: [],
      date_mise_a_jour: "2026-09-08T11:00:00.000Z",
    }),
    registryRecord({ siren: "987654322", etat_administratif: "X" }),
    registryRecord({ siren: "not-a-siren" }),
    registryRecord({ nom_complet: "   " }),
    registryRecord({ date_creation: "2026-02-30" }),
    registryRecord({ date_mise_a_jour: "2026-09-31T12:00:00.000Z" }),
    registryRecord({ dirigeants: {} }),
  ];
  const calls = [];
  const result = await api.readEntityCheckSources(
    request({ query: "ignored query", registrationNumber: "123456789" }),
    readConfiguration(),
    {
      fetch: async (input, init) => {
        calls.push({ input, init });
        if (input.hostname === "registry.example.test") {
          return registryResponse(registry);
        }
        return sanctionsResponse(csv, { "last-modified": lastModified });
      },
      now: () => now,
    },
  );

  assert.equal(calls.length, 2);
  assert.equal(
    calls[0].input.href,
    "https://registry.example.test/search?q=123456789&per_page=5",
  );
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.equal(calls[1].input.href, "https://sanctions.example.test/sdn.csv");
  assert.equal(calls[1].init.method, "GET");
  assert.equal(calls[1].init.credentials, "omit");
  assert.equal(calls[1].init.redirect, "error");
  assert.equal(calls[1].init.cache, "no-store");
  assert.ok(calls[1].init.signal instanceof AbortSignal);

  assert.deepEqual(result, {
    kind: "read",
    registryCandidates: [
      {
        siren: "123456789",
        legalName: "Example et Cie",
        administrativeStatus: "active",
        incorporationDate: "2020-02-29",
        registeredAddress: "1 rue de la Paix, 75000 Paris",
        officerCount: 1,
        registryUpdatedAt: "2026-09-09T12:00:00.000Z",
      },
      {
        siren: "987654321",
        legalName: "Ceased Example",
        administrativeStatus: "ceased",
        incorporationDate: "2020-02-29",
        registeredAddress: "",
        officerCount: 0,
        registryUpdatedAt: "2026-09-08T11:00:00.000Z",
      },
    ],
    droppedCandidates: 6,
    registrySource: {
      source: "FR_RECHERCHE_ENTREPRISES",
      readAt: new Date(now).toISOString(),
    },
    sanctionsDataset: {
      source: "OFAC_SDN",
      lastModified,
      contentHash: createHash("sha256").update(csv).digest("hex"),
      entries: [
        {
          entryId: "100",
          name: "Café, \"Example\"",
          entryType: "Entity",
          programs: ["SDNTK", "IRAN"],
        },
        {
          entryId: "101",
          name: "No Programme",
          entryType: "Entity",
          programs: [],
        },
      ],
    },
  });
});

implementedTest("uses the query when SIREN is absent and returns only closed transport failures", async () => {
  const registryCalls = [];
  const registryFailure = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/registry-failure.csv",
  }), {
    fetch: async (input) => {
      registryCalls.push(input);
      return new Response("untrusted detail", { status: 503 });
    },
    now: () => initialNow,
  });
  assert.deepEqual(registryFailure, { kind: "registry_unavailable" });
  assert.equal(registryCalls.length, 1);
  assert.equal(
    registryCalls[0].href,
    "https://registry.example.test/search?q=Example+et+Cie&per_page=5",
  );

  const sanctionsCalls = [];
  const sanctionsFailure = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/sanctions-failure.csv",
  }), {
    fetch: async (input) => {
      sanctionsCalls.push(input);
      if (input.hostname === "registry.example.test") {
        return registryResponse();
      }
      return new Response("untrusted detail", { status: 502 });
    },
    now: () => initialNow,
  });
  assert.deepEqual(sanctionsFailure, { kind: "sanctions_unavailable" });
  assert.equal(sanctionsCalls.length, 2);
});

implementedTest("fails closed for malformed registry JSON and top-level result shapes", async () => {
  const malformedBodies = ["{", JSON.stringify({}), JSON.stringify({ results: {} })];
  for (const [index, body] of malformedBodies.entries()) {
    let calls = 0;
    const result = await api.readEntityCheckSources(request(), readConfiguration({
      ENTITYCHECK_SANCTIONS_URL: `https://sanctions.example.test/malformed-registry-${index}.csv`,
    }), {
      fetch: async () => {
        calls += 1;
        return new Response(body, { status: 200 });
      },
      now: () => initialNow,
    });
    assert.deepEqual(result, { kind: "registry_unavailable" });
    assert.equal(calls, 1);
  }
});

implementedTest("uses the exact bounded deadlines and does not retry stalled reads", async (t) => {
  const deadlines = [];
  t.mock.method(AbortSignal, "timeout", (milliseconds) => {
    const controller = new AbortController();
    deadlines.push({ milliseconds, controller });
    return controller.signal;
  });

  let registryCalls = 0;
  const pendingRegistry = api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/pending-registry.csv",
  }), {
    fetch: async () => {
      registryCalls += 1;
      return new Promise(() => {});
    },
    now: () => initialNow,
  });
  await Promise.resolve();
  assert.equal(deadlines.length, 1);
  assert.equal(deadlines[0].milliseconds, 5_000);
  deadlines[0].controller.abort();
  assert.deepEqual(await settlesBefore(pendingRegistry), { kind: "registry_unavailable" });
  assert.equal(registryCalls, 1);

  let sanctionsCalls = 0;
  const pendingSanctions = api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/pending-sanctions.csv",
  }), {
    fetch: async (input) => {
      sanctionsCalls += 1;
      if (input.hostname === "registry.example.test") {
        return registryResponse();
      }
      return new Promise(() => {});
    },
    now: () => initialNow,
  });
  await Promise.resolve();
  assert.equal(deadlines.length, 3);
  assert.equal(deadlines[1].milliseconds, 5_000);
  assert.equal(deadlines[2].milliseconds, 20_000);
  deadlines[2].controller.abort();
  assert.deepEqual(await settlesBefore(pendingSanctions), { kind: "sanctions_unavailable" });
  assert.equal(sanctionsCalls, 2);
});

implementedTest("enforces each response cap without retrying or retaining failure detail", async () => {
  let registryCancelled = false;
  let registryCalls = 0;
  const registryOverCap = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/registry-cap.csv",
  }), {
    fetch: async () => {
      registryCalls += 1;
      return oversizedResponse(oneMebibyte + 1, () => { registryCancelled = true; });
    },
    now: () => initialNow,
  });
  assert.deepEqual(registryOverCap, { kind: "registry_unavailable" });
  assert.equal(registryCalls, 1);
  assert.equal(registryCancelled, true);

  let sanctionsCancelled = false;
  let sanctionsCalls = 0;
  const sanctionsOverCap = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/sanctions-cap.csv",
  }), {
    fetch: async (input) => {
      sanctionsCalls += 1;
      if (input.hostname === "registry.example.test") {
        return registryResponse();
      }
      return oversizedResponse(sixteenMebibytes + 1, () => { sanctionsCancelled = true; });
    },
    now: () => initialNow,
  });
  assert.deepEqual(sanctionsOverCap, { kind: "sanctions_unavailable" });
  assert.equal(sanctionsCalls, 2);
  assert.equal(sanctionsCancelled, true);
});

implementedTest("accepts a registry JSON response at exactly the one MiB cap", async () => {
  const result = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/exact-cap.csv",
  }), {
    fetch: async (input) => {
      if (input.hostname === "registry.example.test") {
        return exactSizedJsonResponse({ results: [registryRecord()] }, oneMebibyte);
      }
      return sanctionsResponse(sanctionsCsv());
    },
    now: () => initialNow,
  });
  assert.equal(result.kind, "read");

  const exactSanctions = exactSizedCsv(sixteenMebibytes);
  const sanctionsResult = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/exact-sanctions-cap.csv",
  }), {
    fetch: async (input) => input.hostname === "registry.example.test"
      ? registryResponse()
      : sanctionsResponse(exactSanctions),
    now: () => initialNow,
  });
  assert.equal(sanctionsResult.kind, "read");
  assert.equal(sanctionsResult.sanctionsDataset.entries[0].entryId, "exact-entry");
});

implementedTest("fails closed for malformed sanctions metadata or CSV and uses the clock only when Last-Modified is absent", async () => {
  const invalidHeader = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/invalid-header.csv",
  }), {
    fetch: async (input) => input.hostname === "registry.example.test"
      ? registryResponse()
      : sanctionsResponse(sanctionsCsv(), { "last-modified": "not-a-date" }),
    now: () => initialNow,
  });
  assert.deepEqual(invalidHeader, { kind: "sanctions_unavailable" });

  const malformedCsv = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/malformed.csv",
  }), {
    fetch: async (input) => input.hostname === "registry.example.test"
      ? registryResponse()
      : sanctionsResponse("only,two\r\n"),
    now: () => initialNow,
  });
  assert.deepEqual(malformedCsv, { kind: "sanctions_unavailable" });

  const emptyCsv = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/empty.csv",
  }), {
    fetch: async (input) => input.hostname === "registry.example.test"
      ? registryResponse()
      : sanctionsResponse(""),
    now: () => initialNow,
  });
  assert.deepEqual(emptyCsv, { kind: "sanctions_unavailable" });

  const fallback = await api.readEntityCheckSources(request(), readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/no-last-modified.csv",
  }), {
    fetch: async (input) => input.hostname === "registry.example.test"
      ? registryResponse()
      : sanctionsResponse(sanctionsCsv([sanctionsRow()], "\n")),
    now: () => initialNow,
  });
  assert.equal(fallback.kind, "read");
  assert.equal(fallback.sanctionsDataset.lastModified, new Date(initialNow).toISOString());
});

implementedTest("fails closed before a request when the injected clock is not finite and safe", async () => {
  for (const now of [NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    let calls = 0;
    const result = await api.readEntityCheckSources(request(), readConfiguration({
      ENTITYCHECK_SANCTIONS_URL: `https://sanctions.example.test/invalid-clock-${String(now)}.csv`,
    }), {
      fetch: async () => {
        calls += 1;
        return registryResponse();
      },
      now: () => now,
    });
    assert.deepEqual(result, { kind: "registry_unavailable" });
    assert.equal(calls, 0);
  }
});

implementedTest("reuses only a fresh dataset for the same canonical sanctions URL", async () => {
  let now = initialNow;
  const calls = [];
  const configuration = readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/cache-boundary.csv",
  });
  const dependencies = {
    fetch: async (input) => {
      calls.push(input.href);
      if (input.hostname === "registry.example.test") {
        return registryResponse();
      }
      return sanctionsResponse(sanctionsCsv([sanctionsRow({ entryId: "cached-entry" })]));
    },
    now: () => now,
  };

  const first = await api.readEntityCheckSources(request(), configuration, dependencies);
  assert.equal(first.kind, "read");
  now += 86_399_999;
  const canonicalEquivalentConfiguration = readConfiguration({
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test:443/cache-boundary.csv",
  });
  const freshCache = await api.readEntityCheckSources(
    request(),
    canonicalEquivalentConfiguration,
    dependencies,
  );
  assert.equal(freshCache.kind, "read");
  assert.equal(calls.filter((url) => url.includes("cache-boundary.csv")).length, 1);
  assert.equal(calls.filter((url) => url.includes("/search?")).length, 2);

  now += 1;
  const expiredCache = await api.readEntityCheckSources(request(), configuration, dependencies);
  assert.equal(expiredCache.kind, "read");
  assert.equal(calls.filter((url) => url.includes("cache-boundary.csv")).length, 2);
  assert.equal(calls.filter((url) => url.includes("/search?")).length, 3);
  assert.equal(JSON.stringify(expiredCache).includes("cached-entry"), true);

  now -= 1;
  const clockRollback = await api.readEntityCheckSources(request(), configuration, dependencies);
  assert.equal(clockRollback.kind, "read");
  assert.equal(calls.filter((url) => url.includes("cache-boundary.csv")).length, 3);
  assert.equal(calls.filter((url) => url.includes("/search?")).length, 4);
});

implementedTest("keeps the adapter server-only and free of ambient configuration or logging", () => {
  const source = readFileSync(sourcePath, "utf8");
  assert.doesNotMatch(source, /process\.env/iu);
  assert.doesNotMatch(source, /globalThis\.fetch/iu);
  assert.doesNotMatch(source, /console\.(?:debug|error|info|log|warn)/iu);
});
