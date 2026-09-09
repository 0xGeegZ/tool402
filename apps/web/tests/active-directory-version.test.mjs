import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/lib/active-directory-version.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

function candidate(overrides = {}) {
  return {
    schemaVersion: 1,
    serviceId: "riskscan_service_v1",
    serviceSlug: "riskscan",
    offeringPublicId: "riskscan_revenue_note_demo",
    offeringVersion: 1,
    capabilities: ["evm-contract-risk-signals"],
    x402Endpoint: "https://tool402.example.test/api/riskscan",
    paymentProtocol: "x402",
    paymentNetwork: "hedera-testnet",
    asset: "HBAR",
    advertisedTiers: ["quick", "standard"],
    issuerRevenueAccount: "0.0.123",
    clearingAccount: "0.0.456",
    status: "active",
    publishedAt: "2026-09-09T00:00:00.000Z",
    ...overrides,
  };
}

function foundProjection(overrides = {}) {
  return {
    outcome: "FOUND",
    record: candidate(),
    directoryVersion: 1,
    ...overrides,
  };
}

function jsonResponse(body, options = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...options.headers },
    ...options,
  });
}

function stallingJsonResponse(onCancel) {
  return new Response(
    new ReadableStream({
      cancel: onCancel,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function oversizedJsonResponse(onCancel) {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("x".repeat(16_385)));
    },
    cancel: onCancel,
  });

  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/json" },
  });
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

test("requires the declared M45 active-directory source module before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M45 source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest("recognises only the exact opt-in active-directory query", () => {
  for (const url of [
    "https://tool402.example.test/api/tools?view=active-directory-version",
  ]) {
    assert.equal(api.activeDirectoryViewRequested(new Request(url)), true, url);
  }

  for (const url of [
    "https://tool402.example.test/api/tools",
    "https://tool402.example.test/api/tools?view=",
    "https://tool402.example.test/api/tools?view=other",
    "https://tool402.example.test/api/tools?other=active-directory-version",
    "https://tool402.example.test/api/tools?view=active-directory-version&other=1",
    "https://tool402.example.test/api/tools?view=active-directory-version&view=active-directory-version",
    "https://tool402.example.test/api/tools?view=active-directory-version%20",
  ]) {
    assert.equal(api.activeDirectoryViewRequested(new Request(url)), false, url);
  }
});

implementedTest("admits only an own, primitive HTTPS origin and builds the fixed active target", () => {
  const accepted = { TOOL402_CONVEX_SITE_URL: " https://convex.example.test/ " };
  assert.equal(
    api.activeDirectorySource(accepted)?.href,
    "https://convex.example.test/public/directory/riskscan/active",
  );

  const inherited = Object.create({ TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" });
  const rejected = [
    {},
    inherited,
    { TOOL402_CONVEX_SITE_URL: "" },
    { TOOL402_CONVEX_SITE_URL: "http://convex.example.test/" },
    { TOOL402_CONVEX_SITE_URL: "https://user:pass@convex.example.test/" },
    { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/not-root" },
    { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/?query=1" },
    { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/#fragment" },
    { TOOL402_CONVEX_SITE_URL: ["https://convex.example.test/"] },
    { TOOL402_CONVEX_SITE_URL: { toString() { return "https://convex.example.test/"; } } },
  ];
  for (const environment of rejected) {
    assert.equal(api.activeDirectorySource(environment), null);
  }
});

implementedTest("never calls a fetcher for an unavailable source and makes one bounded fixed request", async () => {
  await assert.doesNotReject(async () => {
    assert.deepEqual(
      await api.readActiveDirectoryVersion({}, () => { throw new Error("must not fetch"); }),
      { state: "no_active_version" },
    );
  });

  const calls = [];
  const view = await api.readActiveDirectoryVersion(
    { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" },
    async (input, init) => {
      calls.push({ input, init });
      return jsonResponse(foundProjection());
    },
  );
  assert.deepEqual(view, {
    state: "active_version",
    directoryVersion: 1,
    record: candidate(),
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.href, "https://convex.example.test/public/directory/riskscan/active");
  assert.equal(calls[0].init.method, "GET");
  assert.deepEqual(calls[0].init.headers, { accept: "application/json" });
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
  assert.ok(calls[0].init.signal instanceof AbortSignal);

  const acceptedContentType = await api.readActiveDirectoryVersion(
    { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" },
    async () => jsonResponse(foundProjection(), {
      headers: { "content-type": "Application/JSON; Charset=UTF-8" },
    }),
  );
  assert.deepEqual(acceptedContentType, view);
});

implementedTest("fails closed for every bounded-read transport and body failure without retrying", async () => {
  const environment = { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" };
  const oversized = `x`.repeat(16_385);
  const responses = [
    async () => { throw new Error("network"); },
    async () => new Response("", { status: 503 }),
    async () => new Response("{}", { status: 200, headers: { "content-type": "text/plain" } }),
    async () => new Response("{", { status: 200, headers: { "content-type": "application/json" } }),
    async () => jsonResponse({ outcome: "NOT_FOUND" }),
    async () => jsonResponse(foundProjection({ directoryVersion: 0 })),
    async () => jsonResponse(foundProjection({ record: { ...candidate(), asset: "USDC" } })),
  ];

  for (const fetcher of responses) {
    let calls = 0;
    const view = await api.readActiveDirectoryVersion(environment, async (...args) => {
      calls += 1;
      return fetcher(...args);
    });
    assert.deepEqual(view, { state: "no_active_version" });
    assert.equal(calls, 1);
  }
});

implementedTest("uses one 2-second abort signal to cancel stalling and over-cap streams", async (t) => {
  const environment = { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" };
  const timeoutControllers = [];
  t.mock.method(AbortSignal, "timeout", (milliseconds) => {
    const controller = new AbortController();
    timeoutControllers.push({ milliseconds, controller });
    return controller.signal;
  });

  let stallingCalls = 0;
  let stallingCancelled = false;
  const stallingRead = api.readActiveDirectoryVersion(environment, async () => {
    stallingCalls += 1;
    return stallingJsonResponse(() => { stallingCancelled = true; });
  });
  await Promise.resolve();
  assert.equal(timeoutControllers.length, 1);
  assert.equal(timeoutControllers[0].milliseconds, 2_000);
  timeoutControllers[0].controller.abort();
  assert.deepEqual(await settlesBefore(stallingRead), { state: "no_active_version" });
  assert.equal(stallingCalls, 1);
  assert.equal(stallingCancelled, true);

  let overCapCalls = 0;
  let overCapCancelled = false;
  const overCap = await settlesBefore(
    api.readActiveDirectoryVersion(environment, async () => {
      overCapCalls += 1;
      return oversizedJsonResponse(() => { overCapCancelled = true; });
    }),
  );
  assert.deepEqual(overCap, { state: "no_active_version" });
  assert.equal(overCapCalls, 1);
  assert.equal(overCapCancelled, true);
  assert.equal(timeoutControllers.length, 2);
  assert.equal(timeoutControllers[1].milliseconds, 2_000);
});

implementedTest("rejects closed or accessor-backed projections without invoking an accessor and detaches a frozen accepted view", () => {
  const accesses = [];
  const accessorBacked = ["outcome", "record", "directoryVersion"].map((field) => {
    const projection = foundProjection();
    const value = projection[field];
    Object.defineProperty(projection, field, {
      enumerable: true,
      get() {
        accesses.push(field);
        return value;
      },
    });
    return projection;
  });
  const symbolKey = foundProjection();
  symbolKey[Symbol("unexpected")] = true;
  const nonEnumerable = foundProjection();
  Object.defineProperty(nonEnumerable, "unexpected", { value: true });
  const ownKeysFailure = new Proxy(foundProjection(), {
    ownKeys() { throw new Error("reflection failed"); },
  });
  const descriptorFailure = new Proxy(foundProjection(), {
    getOwnPropertyDescriptor() { throw new Error("reflection failed"); },
  });
  const prototypeFailure = new Proxy(foundProjection(), {
    getPrototypeOf() { throw new Error("reflection failed"); },
  });
  for (const projection of [
    null,
    [],
    { ...foundProjection(), extra: true },
    { outcome: "FOUND", record: candidate() },
    Object.create(foundProjection()),
    symbolKey,
    nonEnumerable,
    ownKeysFailure,
    descriptorFailure,
    prototypeFailure,
    ...accessorBacked,
    foundProjection({ directoryVersion: -1 }),
    foundProjection({ directoryVersion: 1.5 }),
    foundProjection({ directoryVersion: Number.MAX_SAFE_INTEGER + 1 }),
    foundProjection({ directoryVersion: "1" }),
  ]) {
    assert.deepEqual(api.parseActiveDirectoryProjection(projection), { state: "no_active_version" });
  }
  assert.deepEqual(accesses, []);

  const input = foundProjection();
  const parsed = api.parseActiveDirectoryProjection(input);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(parsed.state, "active_version");
  assert.equal(Object.isFrozen(parsed.record), true);
  input.record.serviceId = "changed";
  assert.equal(parsed.record.serviceId, "riskscan_service_v1");
});

implementedTest("keeps the opt-in response detached from controlled environment values", async () => {
  const { buildToolDirectory, toolDirectoryResponse } = await import("../src/lib/tool-directory.ts");
  const environment = {
    TOOL402_CONVEX_SITE_URL: "https://convex.example.test/",
    CREDENTIAL: "controlled-credential",
    KEY: "controlled-key",
    RISKSCAN_X402_FACILITATOR_URL: "https://facilitator.example.test/controlled",
    RISKSCAN_X402_FEE_PAYER: "0.0.654",
    PAYMENT_HEADER: "controlled-payment-header",
    PAYMENT_PAYLOAD: "controlled-payment-payload",
    TRANSACTION: "controlled-transaction",
    RECEIPT: "controlled-receipt",
  };
  for (const defaultEnvironment of [{}, environment]) {
    const defaultResponse = toolDirectoryResponse(defaultEnvironment);
    assert.deepEqual(await defaultResponse.json(), buildToolDirectory(defaultEnvironment));
  }
  const response = toolDirectoryResponse(environment, api.parseActiveDirectoryProjection(foundProjection()));
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.text();
  assert.deepEqual(JSON.parse(body), {
    view: "active-directory-version",
    directory: {
      state: "active_version",
      directoryVersion: 1,
      record: candidate(),
    },
  });
  for (const value of Object.values(environment)) {
    assert.equal(body.includes(value), false);
  }
});
