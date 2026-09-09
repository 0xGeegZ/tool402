import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const readerUrl = new URL("../src/lib/offering-projection.ts", import.meta.url);
const declaredPaths = ["src/lib/offering-projection.ts", "src/app/api/offerings/route.ts"];
const sourceExists = declaredPaths.every((path) => existsSync(join(appRoot, path)));
const implementedTest = sourceExists ? test : test.skip;
let api;

const site = "https://shocking-caiman-843.convex.site";
const offeringPublicId = "riskscan_revenue_note_demo";
const offeringUrl = `${site}/public/offerings/${offeringPublicId}`;
const directoryUrl = `${site}/public/directory/riskscan/active`;

const offeringRecord = Object.freeze({
  offeringPublicId,
  version: 1,
  subjectPublicId: offeringPublicId,
  state: "ASSET_PENDING",
  definition: {
    schemaVersion: 1,
    terms: {
      version: "v1",
      fundingTargetTinybars: "100000000000",
      noteUnitPriceTinybars: "100000000",
      maximumNoteUnits: "1000",
      minimumPurchaseUnits: "10",
      reserveShareBps: "2000",
      issuerShareBps: "8000",
      platformFeeBps: "0",
      payoutCapTinybars: "150000000000",
    },
    maturityAt: "2026-12-31T00:00:00.000Z",
    qualifyingResource: "riskscan-local-assessment",
  },
  narrative: {
    title: "RiskScan",
    customerProblem: "Tool operators need a bounded way to assess request risk.",
    customerUseCases: ["Security-oriented agent operators"],
    useOfFunds: ["Maintain the local assessment workflow."],
    risks: ["Testnet terms do not promise yield, principal, or return."],
  },
  advertisedQuickPriceTinybars: "10000000",
  advertisedStandardPriceTinybars: "10000000",
  canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
  acceptedAt: "1789430400000",
  updatedAt: "1789430400000",
});

const directoryRecord = Object.freeze({
  schemaVersion: 1,
  serviceId: "riskscan",
  serviceSlug: "riskscan",
  offeringPublicId,
  offeringVersion: 1,
  capabilities: ["evm-contract-risk-signals"],
  x402Endpoint: "https://api.tool402.test/riskscan",
  paymentProtocol: "x402",
  paymentNetwork: "hedera-testnet",
  asset: "HBAR",
  advertisedTiers: ["quick", "standard"],
  issuerRevenueAccount: "0.0.10430887",
  clearingAccount: "0.0.4200",
  status: "active",
  publishedAt: "2026-09-10T00:00:00.000Z",
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

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

function environment(overrides = {}) {
  return { TOOL402_CONVEX_SITE_URL: site, ...overrides };
}

test("requires the declared reader and offerings route paths before GREEN", () => {
  for (const path of declaredPaths) {
    assert.equal(existsSync(join(appRoot, path)), true, `missing declared S17 path: ${path}`);
  }
});

test.before(async () => {
  if (sourceExists) api = await import(readerUrl.href);
});

implementedTest("returns not_configured for both reads without a request when the site is absent or malformed", async () => {
  const cases = [
    {},
    { TOOL402_CONVEX_SITE_URL: "" },
    { TOOL402_CONVEX_SITE_URL: "http://shocking-caiman-843.convex.site" },
    { TOOL402_CONVEX_SITE_URL: "https://user:pw@shocking-caiman-843.convex.site" },
    { TOOL402_CONVEX_SITE_URL: "https://shocking-caiman-843.convex.site/path" },
    { TOOL402_CONVEX_SITE_URL: "https://shocking-caiman-843.convex.site/?x=1" },
    { TOOL402_CONVEX_SITE_URL: "not a url" },
  ];
  for (const env of cases) {
    const { fetchImplementation, calls } = createFetch({});
    const status = await api.readProviderStatus(offeringPublicId, env, { fetch: fetchImplementation });
    assert.deepEqual(status, { offering: { kind: "not_configured" }, directory: { kind: "not_configured" } }, JSON.stringify(env));
    assert.deepEqual(calls, []);
  }
  assert.equal(api.PROVIDER_OFFERING_PUBLIC_ID, offeringPublicId);
});

implementedTest("validates the public id before it enters a URL and issues bounded no-store reads without redirects", async () => {
  for (const invalid of ["", "a".repeat(97), "bad id", "id/../x", "%2e%2e", 42, null, undefined]) {
    assert.equal(api.isOfferingPublicId(invalid), false, String(invalid));
    const { fetchImplementation, calls } = createFetch({});
    await assert.rejects(() => api.readOfferingProjection(invalid, environment(), { fetch: fetchImplementation }), RangeError);
    assert.deepEqual(calls, []);
  }
  assert.equal(api.isOfferingPublicId(offeringPublicId), true);

  const { fetchImplementation, calls } = createFetch({
    [offeringUrl]: () => json({ outcome: "FOUND", record: offeringRecord }),
    [directoryUrl]: () => json({ outcome: "FOUND", record: directoryRecord, directoryVersion: 1 }),
  });
  await api.readProviderStatus(offeringPublicId, environment(), { fetch: fetchImplementation });
  assert.deepEqual(calls.map((call) => call.url), [offeringUrl, directoryUrl]);
  for (const call of calls) {
    assert.equal(call.init.method ?? "GET", "GET");
    assert.equal(call.init.redirect, "error");
    assert.equal(call.init.cache, "no-store");
    assert.ok(call.init.signal instanceof AbortSignal);
  }
});

implementedTest("maps 200, 404, 503, thrown, and unexpected responses onto the closed offering union", async () => {
  const oversized = `{"outcome":"FOUND","record":${JSON.stringify({ ...offeringRecord, narrative: { ...offeringRecord.narrative, customerProblem: "x".repeat(api.PROJECTION_MAX_RESPONSE_BYTES) } })}}`;
  const cases = [
    ["found", () => json({ outcome: "FOUND", record: offeringRecord }), { kind: "loaded", record: offeringRecord }],
    ["found with asset", () => json({ outcome: "FOUND", record: { ...offeringRecord, state: "READY", atsAssetEvmAddress: `0x${"a".repeat(40)}` } }), { kind: "loaded", record: { ...offeringRecord, state: "READY", atsAssetEvmAddress: `0x${"a".repeat(40)}` } }],
    ["not found", () => json({ outcome: "NOT_FOUND" }, 404), { kind: "absent" }],
    ["unavailable", () => json({ outcome: "UNAVAILABLE" }, 503), { kind: "unavailable" }],
    ["thrown", () => { throw new TypeError("fetch failed: secret-host"); }, { kind: "unavailable" }],
    ["aborted", () => { const error = new Error("aborted"); error.name = "AbortError"; throw error; }, { kind: "unavailable" }],
    ["status 500", () => json({ outcome: "UNAVAILABLE" }, 500), { kind: "unexpected_response" }],
    ["status 302", () => new Response(null, { status: 302, headers: { location: "https://elsewhere.invalid" } }), { kind: "unexpected_response" }],
    ["not json", () => new Response("<html>secret</html>", { status: 200 }), { kind: "unexpected_response" }],
    ["wrong outcome", () => json({ outcome: "OK", record: offeringRecord }), { kind: "unexpected_response" }],
    ["missing record", () => json({ outcome: "FOUND" }), { kind: "unexpected_response" }],
    ["unknown state", () => json({ outcome: "FOUND", record: { ...offeringRecord, state: "LIVE" } }), { kind: "unexpected_response" }],
    ["missing field", () => json({ outcome: "FOUND", record: { ...offeringRecord, acceptedAt: undefined } }), { kind: "unexpected_response" }],
    ["extra field", () => json({ outcome: "FOUND", record: { ...offeringRecord, fundingRaised: "1" } }), { kind: "unexpected_response" }],
    ["malformed signer", () => json({ outcome: "FOUND", record: { ...offeringRecord, canonicalSignerAddress: "0xABC" } }), { kind: "unexpected_response" }],
    ["malformed accepted time", () => json({ outcome: "FOUND", record: { ...offeringRecord, acceptedAt: 1789430400000 } }), { kind: "unexpected_response" }],
    ["404 with record", () => json({ outcome: "FOUND", record: offeringRecord }, 404), { kind: "absent" }],
    ["oversized", () => new Response(oversized, { status: 200, headers: { "content-type": "application/json" } }), { kind: "unexpected_response" }],
  ];
  for (const [label, handler, expected] of cases) {
    const { fetchImplementation } = createFetch({ [offeringUrl]: handler });
    const outcome = await api.readOfferingProjection(offeringPublicId, environment(), { fetch: fetchImplementation });
    assert.deepEqual(outcome, expected, label);
    assert.doesNotMatch(JSON.stringify(outcome), /secret|elsewhere|\b500\b|\b302\b/u, label);
    if (outcome.kind === "loaded") assert.equal(Object.isFrozen(outcome.record), true, label);
  }
});

implementedTest("maps the directory read independently so a failed directory read never changes the offering result", async () => {
  const directoryCases = [
    ["found", () => json({ outcome: "FOUND", record: directoryRecord, directoryVersion: 1 }), { kind: "loaded", record: directoryRecord, directoryVersion: 1 }],
    ["not found", () => json({ outcome: "NOT_FOUND" }, 404), { kind: "absent" }],
    ["unavailable", () => json({ outcome: "UNAVAILABLE" }, 503), { kind: "unavailable" }],
    ["thrown", () => { throw new TypeError("fetch failed"); }, { kind: "unavailable" }],
    ["missing version", () => json({ outcome: "FOUND", record: directoryRecord }), { kind: "unexpected_response" }],
    ["bad record", () => json({ outcome: "FOUND", record: { ...directoryRecord, status: "draft" }, directoryVersion: 1 }), { kind: "unexpected_response" }],
    ["extra record field", () => json({ outcome: "FOUND", record: { ...directoryRecord, unitsIssued: 5 }, directoryVersion: 1 }), { kind: "unexpected_response" }],
  ];
  for (const [label, handler, expected] of directoryCases) {
    const { fetchImplementation } = createFetch({
      [offeringUrl]: () => json({ outcome: "FOUND", record: offeringRecord }),
      [directoryUrl]: handler,
    });
    const status = await api.readProviderStatus(offeringPublicId, environment(), { fetch: fetchImplementation });
    assert.deepEqual(status.offering, { kind: "loaded", record: offeringRecord }, label);
    assert.deepEqual(status.directory, expected, label);
  }

  const { fetchImplementation } = createFetch({
    [offeringUrl]: () => json({ outcome: "UNAVAILABLE" }, 503),
    [directoryUrl]: () => json({ outcome: "FOUND", record: directoryRecord, directoryVersion: 1 }),
  });
  const status = await api.readProviderStatus(offeringPublicId, environment(), { fetch: fetchImplementation });
  assert.deepEqual(status, {
    offering: { kind: "unavailable" },
    directory: { kind: "loaded", record: directoryRecord, directoryVersion: 1 },
  });
});

implementedTest("exposes both outcomes through /api/offerings under no-store with no reason detail", async () => {
  const { fetchImplementation, calls } = createFetch({
    [offeringUrl]: () => { throw new TypeError("fetch failed: secret-host"); },
    [directoryUrl]: () => json({ outcome: "FOUND", record: directoryRecord, directoryVersion: 1 }),
  });
  const response = await api.offeringsResponse(offeringPublicId, environment(), { fetch: fetchImplementation });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("content-type") ?? "", /^application\/json(?:;|$)/u);
  const body = await response.text();
  assert.deepEqual(JSON.parse(body), {
    offering: { kind: "unavailable" },
    directory: { kind: "loaded", record: directoryRecord, directoryVersion: 1 },
  });
  assert.doesNotMatch(body, /secret|fetch failed|convex\.site/u);
  assert.equal(calls.length, 2);

  for (const invalid of [null, "", "bad id", "a".repeat(97)]) {
    const rejected = createFetch({});
    const invalidResponse = await api.offeringsResponse(invalid, environment(), { fetch: rejected.fetchImplementation });
    assert.equal(invalidResponse.status, 400, String(invalid));
    assert.equal(invalidResponse.headers.get("cache-control"), "no-store");
    assert.deepEqual(await invalidResponse.json(), { error: "invalid_offering_public_id" });
    assert.deepEqual(rejected.calls, []);
  }

  const unconfigured = await api.offeringsResponse(offeringPublicId, {}, { fetch: createFetch({}).fetchImplementation });
  assert.deepEqual(await unconfigured.json(), { offering: { kind: "not_configured" }, directory: { kind: "not_configured" } });
});

implementedTest("registers only a GET route that reads process.env once at request time and logs nothing", async () => {
  const [route, reader] = await Promise.all(declaredPaths.slice().reverse().map((path) => readFile(join(appRoot, path), "utf8")));
  assert.match(route, /import\s*\{\s*connection\s*\}\s*from\s*["']next\/server["']/u);
  assert.match(route, /export\s+async\s+function\s+GET\s*\(/u);
  assert.doesNotMatch(route, /export\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/u);
  assert.equal((route.match(/\bexport\b/gu) ?? []).length, 1);
  assert.equal((route.match(/process\.env/gu) ?? []).length, 1);
  assert.match(route, /await\s+connection\(\)/u);
  assert.match(route, /offeringsResponse\(/u);
  assert.doesNotMatch(`${route}\n${reader}`, /console\./u);
  assert.doesNotMatch(reader, /\bimport\b[^\n]*["'](?:react|convex|@x402|next\/link)/u);
  assert.doesNotMatch(reader, /localStorage|sessionStorage|setInterval|setTimeout\(/u);
});
