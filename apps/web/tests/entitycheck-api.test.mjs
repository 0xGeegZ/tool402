import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const { decodePaymentRequiredHeader, encodePaymentSignatureHeader } = require("@x402/core/http");

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const declaredPaths = [
  "src/lib/x402-protected-route.ts",
  "src/lib/entity-check-x402.ts",
  "src/app/api/entitycheck/route.ts",
];
const sourceExists = declaredPaths.every((path) => existsSync(join(appRoot, path)));
const implementedTest = sourceExists ? test : test.skip;
let api;
let core;

const registryBaseUrl = "https://registry.invalid/api";
const registryUrl = `${registryBaseUrl}/search?q=Soci%C3%A9t%C3%A9%20G%C3%A9n%C3%A9rale&per_page=5`;
const nowMilliseconds = Date.parse("2026-09-09T18:00:00.000Z");
let sanctionsSequence = 0;

function x402Environment() {
  return {
    ENTITYCHECK_X402_PAY_TO: `0x${"1".repeat(40)}`,
    ENTITYCHECK_X402_FACILITATOR_URL: "https://facilitator.invalid",
    ENTITYCHECK_X402_NETWORK: "eip155:84532",
    ENTITYCHECK_X402_PRICE: "$0.01",
  };
}

function sourceEnvironment() {
  sanctionsSequence += 1;
  return {
    ENTITYCHECK_REGISTRY_BASE_URL: registryBaseUrl,
    ENTITYCHECK_SANCTIONS_URL: `https://sanctions.invalid/sdn-${sanctionsSequence}.csv`,
  };
}

function validInput() {
  return { requestRef: "entity-api-42", jurisdiction: "FR", query: "Société Générale" };
}

function createRequest(body = validInput(), headers = {}) {
  return new NextRequest("http://tool402.test/api/entitycheck", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const registryFixture = {
  results: [
    {
      siren: "552120222",
      nom_complet: "SOCIETE GENERALE (SG)",
      siege: { adresse: "29 BOULEVARD HAUSSMANN 75009 PARIS" },
      date_creation: "1900-01-01",
      date_mise_a_jour: "2026-09-09T14:50:03",
      dirigeants: [{ nom: "D0" }],
      etat_administratif: "A",
    },
  ],
};
const sanctionsFixture = '36,"AEROCARIBBEAN AIRLINES",-0- ,"CUBA",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- \r\n';

function createSourceFetch(environment, overrides = {}) {
  const calls = [];
  const handlers = {
    [registryUrl]: () => new Response(JSON.stringify(registryFixture), { status: 200, headers: { "content-type": "application/json" } }),
    [environment.ENTITYCHECK_SANCTIONS_URL]: () =>
      new Response(sanctionsFixture, { status: 200, headers: { "content-type": "text/csv", "last-modified": "Wed, 09 Sep 2026 13:32:00 GMT" } }),
    ...overrides,
  };
  const fetchImplementation = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    const handler = handlers[url];
    if (handler === undefined) throw new TypeError(`unexpected fetch ${url}`);
    return handler();
  };
  return { calls, dependencies: { fetch: fetchImplementation, now: () => nowMilliseconds } };
}

function createFacilitator({ verify, settle } = {}) {
  const calls = { getSupported: 0, verify: 0, settle: 0 };
  return {
    calls,
    client: {
      async getSupported() {
        calls.getSupported += 1;
        return { kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:84532" }], extensions: [], signers: {} };
      },
      async verify() {
        calls.verify += 1;
        if (verify === undefined) throw new Error("an unsigned request must not be verified");
        return verify();
      },
      async settle(payload, requirements) {
        calls.settle += 1;
        if (settle === undefined) throw new Error("this request must not settle");
        return settle({ payload, requirements });
      },
    },
  };
}

async function signedRequest(handle, body = validInput()) {
  const challenge = await handle(createRequest(body));
  assert.equal(challenge.status, 402);
  const requiredHeader = challenge.headers.get("payment-required");
  assert.notEqual(requiredHeader, null);
  const paymentRequired = decodePaymentRequiredHeader(requiredHeader);
  const paymentSignature = encodePaymentSignatureHeader({ x402Version: 2, accepted: paymentRequired.accepts[0], payload: {} });
  return createRequest(body, { "payment-signature": paymentSignature });
}

function expectedResult(environment) {
  return core.assessEntityCheck(core.parseEntityCheckRequest(validInput()), {
    registryCandidates: [
      {
        siren: "552120222",
        legalName: "SOCIETE GENERALE (SG)",
        administrativeStatus: "active",
        incorporationDate: "1900-01-01",
        registeredAddress: "29 BOULEVARD HAUSSMANN 75009 PARIS",
        officerCount: 1,
        registryUpdatedAt: "2026-09-09T14:50:03.000Z",
      },
    ],
    registrySource: { source: "FR_RECHERCHE_ENTREPRISES", readAt: "2026-09-09T18:00:00.000Z" },
    sanctionsDataset: {
      source: "OFAC_SDN",
      lastModified: "2026-09-09T13:32:00.000Z",
      contentHash: environment.contentHash,
      entries: [{ entryId: "36", name: "AEROCARIBBEAN AIRLINES", entryType: "", programs: ["CUBA"] }],
    },
  });
}

async function sha256Hex(text) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

test("requires the declared factory, EntityCheck route module, and App Router handler before GREEN", () => {
  for (const path of declaredPaths) {
    assert.equal(existsSync(join(appRoot, path)), true, `missing declared M46-T030 path: ${path}`);
  }
});

test.before(async () => {
  if (!sourceExists) return;
  api = await import(new URL("../src/lib/entity-check-x402.ts", import.meta.url).href);
  core = await import("@tool402/core");
});

implementedTest("returns 503 without a payment header when x402 or source configuration is absent", async () => {
  const cases = [
    ["nothing configured", {}],
    ["x402 only", x402Environment()],
    ["sources only", sourceEnvironment()],
    ["malformed x402 price", { ...x402Environment(), ...sourceEnvironment(), ENTITYCHECK_X402_PRICE: "free" }],
    ["malformed sanctions url", { ...x402Environment(), ...sourceEnvironment(), ENTITYCHECK_SANCTIONS_URL: "http://sanctions.invalid/sdn.csv" }],
  ];
  for (const [label, environment] of cases) {
    const facilitator = createFacilitator();
    const sources = createSourceFetch({ ENTITYCHECK_SANCTIONS_URL: "https://sanctions.invalid/unused.csv" });
    const response = await api.handleEntityCheckPost(createRequest(), environment, {
      facilitatorClient: facilitator.client,
      sourceDependencies: sources.dependencies,
    });
    assert.equal(response.status, 503, label);
    assert.equal(response.headers.get("payment-required"), null, label);
    assert.deepEqual(await response.json(), { error: "entity_check_unavailable" }, label);
    assert.equal(facilitator.calls.getSupported, 0, label);
    assert.deepEqual(sources.calls, [], label);
  }
});

implementedTest("issues the x402 challenge for an unsigned request without reading any source", async () => {
  const environment = { ...x402Environment(), ...sourceEnvironment() };
  const facilitator = createFacilitator();
  const sources = createSourceFetch(environment);
  const response = await api.handleEntityCheckPost(createRequest(), environment, {
    facilitatorClient: facilitator.client,
    sourceDependencies: sources.dependencies,
  });

  assert.equal(response.status, 402);
  const requiredHeader = response.headers.get("payment-required");
  assert.match(requiredHeader ?? "", /\S/u);
  const paymentRequired = decodePaymentRequiredHeader(requiredHeader);
  assert.equal(paymentRequired.accepts[0].network, "eip155:84532");
  assert.equal(paymentRequired.accepts[0].payTo, `0x${"1".repeat(40)}`);
  assert.doesNotMatch(await response.text(), /disposition/u);
  assert.equal(facilitator.calls.getSupported, 1);
  assert.equal(facilitator.calls.verify, 0);
  assert.equal(facilitator.calls.settle, 0);
  assert.deepEqual(sources.calls, []);
});

implementedTest("returns 400 for malformed input on a verified request without settling or reading a source", async () => {
  const environment = { ...x402Environment(), ...sourceEnvironment() };
  const facilitator = createFacilitator({ verify: () => ({ isValid: true }) });
  const sources = createSourceFetch(environment);
  const handle = (request) => api.handleEntityCheckPost(request, environment, {
    facilitatorClient: facilitator.client,
    sourceDependencies: sources.dependencies,
  });
  const response = await handle(await signedRequest(handle, { requestRef: "entity-api-42", jurisdiction: "DE", query: "x" }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_entitycheck_request" });
  assert.equal(response.headers.get("payment-response"), null);
  assert.equal(facilitator.calls.verify, 1);
  assert.equal(facilitator.calls.settle, 0);
  assert.deepEqual(sources.calls, []);
});

implementedTest("returns 503 naming only the outcome kind when a source is unavailable and does not settle", async () => {
  const cases = [
    ["registry_unavailable", { [registryUrl]: () => new Response("upstream secret", { status: 500 }) }],
    ["sanctions_unavailable", (environment) => ({ [environment.ENTITYCHECK_SANCTIONS_URL]: () => { throw new TypeError("fetch failed: secret-host"); } })],
  ];
  for (const [kind, overrides] of cases) {
    const environment = { ...x402Environment(), ...sourceEnvironment() };
    const facilitator = createFacilitator({ verify: () => ({ isValid: true }) });
    const sources = createSourceFetch(environment, typeof overrides === "function" ? overrides(environment) : overrides);
    const handle = (request) => api.handleEntityCheckPost(request, environment, {
      facilitatorClient: facilitator.client,
      sourceDependencies: sources.dependencies,
    });
    const response = await handle(await signedRequest(handle));

    assert.equal(response.status, 503, kind);
    assert.deepEqual(await response.json(), { error: kind }, kind);
    assert.equal(response.headers.get("payment-response"), null, kind);
    assert.equal(facilitator.calls.settle, 0, kind);
  }
});

implementedTest("returns the core result with 200 for a read outcome and settles exactly once", async () => {
  const environment = { ...x402Environment(), ...sourceEnvironment() };
  const facilitator = createFacilitator({
    verify: () => ({ isValid: true }),
    settle: ({ requirements }) => ({ success: true, transaction: "settlement-entity-42", network: requirements.network }),
  });
  const sources = createSourceFetch(environment);
  const handle = (request) => api.handleEntityCheckPost(request, environment, {
    facilitatorClient: facilitator.client,
    sourceDependencies: sources.dependencies,
  });
  const response = await handle(await signedRequest(handle));

  assert.equal(response.status, 200);
  assert.match(response.headers.get("payment-response") ?? "", /\S/u);
  const body = await response.json();
  assert.deepEqual(body, JSON.parse(JSON.stringify(expectedResult({ contentHash: await sha256Hex(sanctionsFixture) }))));
  assert.equal(body.disposition, "found");
  assert.equal(body.sanctionsScreen, "clear");
  assert.equal(facilitator.calls.verify, 1);
  assert.equal(facilitator.calls.settle, 1);
  assert.equal(sources.calls.length, 2);
});

implementedTest("does not release the result on a wrong-network or blank-transaction settlement", async () => {
  const cases = [
    ["wrong network", () => ({ success: true, network: "eip155:1", transaction: "wrong-network" })],
    ["blank transaction", ({ requirements }) => ({ success: true, network: requirements.network, transaction: "  " })],
    ["failed settlement", ({ requirements }) => ({ success: false, network: requirements.network, transaction: "failed" })],
  ];
  for (const [label, settle] of cases) {
    const environment = { ...x402Environment(), ...sourceEnvironment() };
    const facilitator = createFacilitator({ verify: () => ({ isValid: true }), settle });
    const sources = createSourceFetch(environment);
    const handle = (request) => api.handleEntityCheckPost(request, environment, {
      facilitatorClient: facilitator.client,
      sourceDependencies: sources.dependencies,
    });
    const response = await handle(await signedRequest(handle));

    assert.equal(response.status, 402, label);
    assert.match(response.headers.get("payment-response") ?? "", /\S/u, label);
    assert.doesNotMatch(await response.text(), /"disposition"/u, label);
    assert.equal(facilitator.calls.settle, 1, label);
  }
});

implementedTest("registers only POST, reads process.env only at the handler entry, and keeps the factory route-agnostic", async () => {
  const [route, entityCheck, factory, riskScan] = await Promise.all(
    [...declaredPaths.slice(2), declaredPaths[1], declaredPaths[0], "src/lib/riskscan-x402.ts"].map((path) => readFile(join(appRoot, path), "utf8")),
  );

  assert.match(route, /export\s+(?:async\s+)?function\s+POST\b/u);
  assert.doesNotMatch(route, /export\s+(?:async\s+)?function\s+(?:GET|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/u);
  assert.match(route, /handleEntityCheckPost\(\s*request\s*,\s*process\.env\s*\)/u);
  assert.equal((route.match(/process\.env/gu) ?? []).length, 1);
  assert.doesNotMatch(entityCheck, /process\.env/u);
  assert.doesNotMatch(factory, /process\.env|RISKSCAN|ENTITYCHECK|\/api\/riskscan|\/api\/entitycheck/u);
  assert.match(riskScan, /from\s+["']\.\/x402-protected-route\.ts["']/u);
  assert.match(entityCheck, /from\s+["']\.\/x402-protected-route\.ts["']/u);
  assert.match(entityCheck, /from\s+["']\.\/entity-check-sources\.ts["']/u);
  assert.doesNotMatch(`${route}\n${entityCheck}\n${factory}`, /console\./u);
});
