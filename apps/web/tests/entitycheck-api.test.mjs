import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
} = require("@x402/core/http");

const protectedRouteUrl = new URL("../src/lib/x402-protected-route.ts", import.meta.url);
const entityCheckUrl = new URL("../src/lib/entity-check-x402.ts", import.meta.url);
const routeUrl = new URL("../src/app/api/entitycheck/route.ts", import.meta.url);
const requiredSources = [
  ["shared x402 factory", protectedRouteUrl],
  ["EntityCheck handler", entityCheckUrl],
  ["EntityCheck POST route", routeUrl],
];
const missingSources = requiredSources
  .filter(([, sourceUrl]) => !existsSync(sourceUrl))
  .map(([name, sourceUrl]) => `${name}: ${fileURLToPath(sourceUrl)}`);
const implementedTest = missingSources.length === 0 ? test : test.skip;

let protectedRoute;
let entityCheck;
let routeSource;

function createRequest(body = validRequest(), headers = {}) {
  return new NextRequest("http://tool402.test/api/entitycheck", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function validRequest(overrides = {}) {
  return {
    requestRef: "entitycheck-api-42",
    jurisdiction: "FR",
    query: "Société Étoile",
    ...overrides,
  };
}

function configuredEnvironment(overrides = {}) {
  return {
    ENTITYCHECK_X402_PAY_TO: `0x${"1".repeat(40)}`,
    ENTITYCHECK_X402_FACILITATOR_URL: "https://facilitator.invalid",
    ENTITYCHECK_X402_NETWORK: "eip155:84532",
    ENTITYCHECK_X402_PRICE: "$0.01",
    ENTITYCHECK_REGISTRY_BASE_URL: "https://registry.example.test/",
    ENTITYCHECK_SANCTIONS_URL: "https://sanctions.example.test/sdn.csv",
    ...overrides,
  };
}

function sourceResult(overrides = {}) {
  return {
    kind: "read",
    registryCandidates: [
      {
        siren: "123456789",
        legalName: "Société Étoile SAS",
        administrativeStatus: "active",
        incorporationDate: "2018-06-14",
        registeredAddress: "12 rue de la Paix, 75002 Paris",
        officerCount: 2,
        registryUpdatedAt: "2026-09-09T12:00:00.000Z",
      },
    ],
    droppedCandidates: 0,
    registrySource: {
      source: "FR_RECHERCHE_ENTREPRISES",
      readAt: "2026-09-10T06:00:00.000Z",
    },
    sanctionsDataset: {
      source: "OFAC_SDN",
      lastModified: "2026-09-09T00:00:00.000Z",
      contentHash: "a".repeat(64),
      entries: [],
    },
    ...overrides,
  };
}

function createLocalFacilitator(settle = ({ requirements }) => ({
  success: true,
  network: requirements.network,
  transaction: "entitycheck-settlement-42",
})) {
  const calls = { getSupported: 0, verify: 0, settle: 0 };

  return {
    calls,
    client: {
      async getSupported() {
        calls.getSupported += 1;
        return {
          kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:84532" }],
          extensions: [],
          signers: {},
        };
      },
      async verify() {
        calls.verify += 1;
        return { isValid: true };
      },
      async settle(payload, requirements) {
        calls.settle += 1;
        return settle({ calls, payload, requirements });
      },
    },
  };
}

function createSourceReader(result, calls) {
  return async (request, configuration, dependencies) => {
    calls.push({ request, configuration, dependencies });
    return result;
  };
}

async function createSignedRequest(handler, body = validRequest()) {
  const challenge = await handler(createRequest(body));
  const requiredHeader = challenge.headers.get("payment-required");

  assert.equal(challenge.status, 402);
  assert.notEqual(requiredHeader, null);

  const paymentRequired = decodePaymentRequiredHeader(requiredHeader);
  return createRequest(body, {
    "payment-signature": encodePaymentSignatureHeader({
      x402Version: 2,
      accepted: paymentRequired.accepts[0],
      payload: {},
    }),
  });
}

async function createProtectedHandler({
  environment = configuredEnvironment(),
  facilitator = createLocalFacilitator(),
  readSources = createSourceReader(sourceResult(), []),
} = {}) {
  return entityCheck.createEntityCheckProtectedHandler(environment, {
    facilitatorClient: facilitator.client,
    readSources,
  });
}

test("requires every declared M46 EntityCheck API module before GREEN", () => {
  assert.deepEqual(
    missingSources,
    [],
    `missing declared M46 EntityCheck API module(s): ${missingSources.join(", ")}`,
  );
});

test.before(async () => {
  if (missingSources.length === 0) {
    protectedRoute = await import(protectedRouteUrl.href);
    entityCheck = await import(entityCheckUrl.href);
    routeSource = readFileSync(routeUrl, "utf8");
  }
});

implementedTest("shares one route-agnostic protected-handler factory with the EntityCheck boundary", () => {
  assert.equal(
    typeof protectedRoute.createX402ProtectedHandler,
    "function",
    "the shared factory must expose the route-agnostic protected-handler constructor",
  );
  assert.equal(
    typeof entityCheck.createEntityCheckProtectedHandler,
    "function",
    "the EntityCheck boundary must expose its injected protected handler",
  );
  assert.equal(
    typeof entityCheck.handleEntityCheckPost,
    "function",
    "the EntityCheck boundary must expose its App Router handler",
  );
});

implementedTest("fails closed without a payment challenge when EntityCheck x402 configuration is missing or malformed", async () => {
  for (const [description, environment] of [
    ["missing recipient", configuredEnvironment({ ENTITYCHECK_X402_PAY_TO: undefined })],
    ["malformed recipient", configuredEnvironment({ ENTITYCHECK_X402_PAY_TO: "0xabc" })],
    ["unencrypted facilitator", configuredEnvironment({ ENTITYCHECK_X402_FACILITATOR_URL: "http://facilitator.invalid" })],
    ["unsupported network", configuredEnvironment({ ENTITYCHECK_X402_NETWORK: "eip155:1" })],
  ]) {
    const reads = [];
    const response = await entityCheck.handleEntityCheckPost(createRequest(), environment, {
      readSources: createSourceReader(sourceResult(), reads),
    });

    assert.equal(response.status, 503, description);
    assert.equal(response.headers.get("payment-required"), null, description);
    assert.deepEqual(await response.json(), { error: "entity_check_unavailable" }, description);
    assert.equal(reads.length, 0, description);
  }
});

implementedTest("fails closed without a payment challenge when EntityCheck source configuration is missing", async () => {
  const reads = [];
  const response = await entityCheck.handleEntityCheckPost(
    createRequest(),
    configuredEnvironment({ ENTITYCHECK_SANCTIONS_URL: undefined }),
    { readSources: createSourceReader(sourceResult(), reads) },
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("payment-required"), null);
  assert.deepEqual(await response.json(), { error: "entity_check_unavailable" });
  assert.equal(reads.length, 0);
});

implementedTest("issues an unsigned EntityCheck challenge without reading a source", async () => {
  const reads = [];
  const facilitator = createLocalFacilitator();
  const handler = await createProtectedHandler({
    facilitator,
    readSources: createSourceReader(sourceResult(), reads),
  });
  const response = await handler(createRequest());

  assert.equal(response.status, 402);
  assert.match(response.headers.get("payment-required") ?? "", /\S/u);
  assert.equal(facilitator.calls.getSupported, 1);
  assert.equal(facilitator.calls.verify, 0);
  assert.equal(facilitator.calls.settle, 0);
  assert.equal(reads.length, 0);
});

implementedTest("rejects an authorised malformed EntityCheck request without settling or reading a source", async () => {
  const reads = [];
  const facilitator = createLocalFacilitator();
  const handler = await createProtectedHandler({
    facilitator,
    readSources: createSourceReader(sourceResult(), reads),
  });
  const signedRequest = await createSignedRequest(handler, validRequest({ query: " " }));
  const response = await handler(signedRequest);

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("payment-response"), null);
  assert.deepEqual(await response.json(), { error: "invalid_entity_check_request" });
  assert.equal(facilitator.calls.settle, 0);
  assert.equal(reads.length, 0);
});

implementedTest("returns each source-unavailable outcome without settling", async () => {
  for (const kind of ["registry_unavailable", "sanctions_unavailable"]) {
    const reads = [];
    const facilitator = createLocalFacilitator();
    const handler = await createProtectedHandler({
      facilitator,
      readSources: createSourceReader({ kind }, reads),
    });
    const response = await handler(await createSignedRequest(handler));

    assert.equal(response.status, 503, kind);
    assert.equal(response.headers.get("payment-response"), null, kind);
    assert.deepEqual(await response.json(), { error: kind }, kind);
    assert.equal(facilitator.calls.settle, 0, kind);
    assert.equal(reads.length, 1, kind);
  }
});

implementedTest("returns the bounded core assessment and settles only after the source result", async () => {
  const phases = [];
  const reads = [];
  const facilitator = createLocalFacilitator(({ requirements }) => {
    assert.deepEqual(phases, ["source_read"]);
    phases.push("settled");
    return {
      success: true,
      network: requirements.network,
      transaction: "entitycheck-settlement-42",
    };
  });
  const readSources = async (request, configuration, dependencies) => {
    reads.push({ request, configuration, dependencies });
    phases.push("source_read");
    return sourceResult();
  };
  const handler = await createProtectedHandler({ facilitator, readSources });
  const response = await handler(await createSignedRequest(handler));

  assert.equal(response.status, 200);
  assert.match(response.headers.get("payment-response") ?? "", /\S/u);
  assert.deepEqual(await response.json(), {
    requestRef: "entitycheck-api-42",
    jurisdiction: "FR",
    query: "Société Étoile",
    registrySource: {
      source: "FR_RECHERCHE_ENTREPRISES",
      readAt: "2026-09-10T06:00:00.000Z",
    },
    sanctionsSource: {
      source: "OFAC_SDN",
      lastModified: "2026-09-09T00:00:00.000Z",
      contentHash: "a".repeat(64),
    },
    limitations: [
      "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.",
    ],
    disposition: "found",
    candidate: {
      siren: "123456789",
      legalName: "Société Étoile SAS",
      administrativeStatus: "active",
      incorporationDate: "2018-06-14",
      registeredAddress: "12 rue de la Paix, 75002 Paris",
      officerCount: 2,
      registryUpdatedAt: "2026-09-09T12:00:00.000Z",
    },
    sanctionsScreen: "clear",
  });
  assert.deepEqual(phases, ["source_read", "settled"]);
  assert.equal(reads.length, 1);
  assert.equal(facilitator.calls.settle, 1);
});

implementedTest("does not release an EntityCheck result for wrong-network or blank-transaction settlements", async () => {
  for (const [description, settle] of [
    ["wrong network", () => ({ success: true, network: "eip155:1", transaction: "wrong-network" })],
    ["blank transaction", ({ requirements }) => ({ success: true, network: requirements.network, transaction: "  " })],
  ]) {
    const reads = [];
    const facilitator = createLocalFacilitator(settle);
    const handler = await createProtectedHandler({
      facilitator,
      readSources: createSourceReader(sourceResult(), reads),
    });
    const response = await handler(await createSignedRequest(handler));

    assert.equal(response.status, 402, description);
    assert.match(response.headers.get("payment-response") ?? "", /\S/u, description);
    assert.doesNotMatch(await response.clone().text(), /"disposition"/u, description);
    assert.equal(facilitator.calls.settle, 1, description);
    assert.equal(reads.length, 1, description);
  }
});

implementedTest("registers only POST and passes ambient configuration only at the route entry point", () => {
  const exports = [
    ...routeSource.matchAll(
      /^export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z_$][\w$]*)/gmu,
    ),
  ].map(([, name]) => name);

  assert.deepEqual(exports, ["POST"]);
  assert.match(routeSource, /export\s+async\s+function\s+POST\s*\(\s*request\s*\)/u);
  assert.match(
    routeSource,
    /handleEntityCheckPost\s*\(\s*request\s*,\s*process\.env\s*\)/u,
  );
  assert.equal(routeSource.match(/process\.env/gu)?.length, 1);
});
