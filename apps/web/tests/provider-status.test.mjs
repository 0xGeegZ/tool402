import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePaths = [
  "src/app/provider/page.tsx",
  "src/lib/offering-projection.ts",
  "src/components/provider/status/provider-status.tsx",
  "src/components/provider/status/provider-status-state.ts",
];
const sourceExists = sourcePaths.every((path) => existsSync(join(appRoot, path)));
const implementedTest = sourceExists ? test : test.skip;
let projection;

async function readSources() {
  return Object.fromEntries(await Promise.all(
    sourcePaths.map(async (path) => [path, await readFile(join(appRoot, path), "utf8")]),
  ));
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function directoryRecord(overrides = {}) {
  return {
    schemaVersion: 1,
    serviceId: "riskscan_service_v1",
    serviceSlug: "riskscan",
    offeringPublicId: "riskscan_offering_demo",
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
    publishedAt: "2026-09-10T01:00:00.000Z",
    ...overrides,
  };
}

function offeringRecord(overrides = {}) {
  return {
    offeringPublicId: "riskscan_offering_demo",
    version: 1,
    subjectPublicId: "riskscan_offering_demo",
    state: "READY",
    definition: {
      schemaVersion: 1,
      terms: {
        version: "riskscan-revenue-note-v1",
        fundingTargetTinybars: "1000",
        noteUnitPriceTinybars: "10",
        maximumNoteUnits: "100",
        minimumPurchaseUnits: "1",
        reserveShareBps: "2000",
        issuerShareBps: "8000",
        platformFeeBps: "0",
        payoutCapTinybars: "1500",
      },
      maturityAt: "2026-12-31T00:00:00.000Z",
      qualifyingResource: "riskscan.quick",
    },
    narrative: {
      title: "RiskScan Revenue Note",
      customerProblem: "Bounded contract-risk signals.",
      customerUseCases: ["Inspect a contract"],
      useOfFunds: ["Maintain the service"],
      risks: ["Testnet-only demonstration"],
    },
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    canonicalSignerAddress: "0x1111111111111111111111111111111111111111",
    atsAssetEvmAddress: "0x2222222222222222222222222222222222222222",
    acceptedAt: "1",
    updatedAt: "2",
    ...overrides,
  };
}

function oversizedJson() {
  return new Response("x".repeat(16_385), {
    headers: { "content-type": "application/json" },
  });
}

test("requires the declared S17 provider status source paths before GREEN", () => {
  for (const path of sourcePaths) {
    assert.equal(existsSync(join(appRoot, path)), true, `missing declared S17 source path: ${path}`);
  }
});

test.before(async () => {
  if (sourceExists) projection = await import(new URL("../src/lib/offering-projection.ts", import.meta.url).href);
});

implementedTest("keeps the two projection outcome unions closed and independent", async () => {
  const environment = { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" };
  const calls = [];
  const result = await projection.readProviderProjections(environment, async (input, init) => {
    calls.push({ input, init });
    return input.pathname.startsWith("/public/offerings/")
      ? json(null, 404)
      : json({ malformed: true });
  }, "riskscan_offering_demo");

  assert.deepEqual(result, {
    offering: { outcome: "absent" },
    directory: { outcome: "unexpected_response" },
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].input.href, "https://convex.example.test/public/offerings/riskscan_offering_demo");
  assert.equal(calls[1].input.href, "https://convex.example.test/public/directory/riskscan/active");
  for (const { init } of calls) {
    assert.equal(init.method, "GET");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal instanceof AbortSignal);
  }
});

implementedTest("loads only a complete valid directory projection", async () => {
  const record = directoryRecord();
  const environment = { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" };
  const result = await projection.readProviderProjections(environment, async (input) => (
    input.pathname.startsWith("/public/offerings/")
      ? json(null, 404)
      : json({ outcome: "FOUND", record, directoryVersion: 2 })
  ), "riskscan_offering_demo");
  assert.deepEqual(result, {
    offering: { outcome: "absent" },
    directory: { outcome: "loaded", record, directoryVersion: 2 },
  });

  for (const malformed of [
    directoryRecord({ schemaVersion: 999 }),
    directoryRecord({ offeringPublicId: null }),
    directoryRecord({ paymentProtocol: null }),
    directoryRecord({ x402Endpoint: "not a URL" }),
    directoryRecord({ clearingAccount: "not-an-account" }),
    directoryRecord({ status: "pending" }),
    directoryRecord({ publishedAt: "not a timestamp" }),
  ]) {
    const malformedResult = await projection.readProviderProjections(environment, async (input) => (
      input.pathname.startsWith("/public/offerings/")
        ? json(null, 404)
        : json({ outcome: "FOUND", record: malformed, directoryVersion: 2 })
    ), "riskscan_offering_demo");
    assert.deepEqual(malformedResult, {
      offering: { outcome: "absent" },
      directory: { outcome: "unexpected_response" },
    });
  }
});

implementedTest("loads only an offering with canonical admitted values", async () => {
  const record = offeringRecord();
  const { schemaVersion: _schemaVersion, ...definition } = record.definition;
  const environment = { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" };
  const result = await projection.readProviderProjections(environment, async (input) => (
    input.pathname.startsWith("/public/offerings/")
      ? json({ outcome: "FOUND", record })
      : json(null, 404)
  ), "riskscan_offering_demo");
  assert.deepEqual(result, {
    offering: { outcome: "loaded", record: { ...record, definition } },
    directory: { outcome: "absent" },
  });

  for (const malformed of [
    offeringRecord({ canonicalSignerAddress: "0x111111111111111111111111111111111111111A" }),
    offeringRecord({ atsAssetEvmAddress: "not-an-address" }),
    offeringRecord({ acceptedAt: "01" }),
    offeringRecord({ updatedAt: "9223372036854775808" }),
    offeringRecord({ advertisedQuickPriceTinybars: "01" }),
    offeringRecord({ definition: { ...record.definition, maturityAt: "not a timestamp" } }),
    offeringRecord({ definition: { ...record.definition, terms: { ...record.definition.terms, fundingTargetTinybars: "not-an-amount" } } }),
  ]) {
    const malformedResult = await projection.readProviderProjections(environment, async (input) => (
      input.pathname.startsWith("/public/offerings/")
        ? json({ outcome: "FOUND", record: malformed })
        : json(null, 404)
    ), "riskscan_offering_demo");
    assert.deepEqual(malformedResult, {
      offering: { outcome: "unexpected_response" },
      directory: { outcome: "absent" },
    });
  }
});

implementedTest("returns explicit not-configured outcomes and makes no request when the site origin is absent", async () => {
  let calls = 0;
  const result = await projection.readProviderProjections({}, async () => {
    calls += 1;
    throw new Error("not-configured must not fetch");
  }, "riskscan_offering_demo");

  assert.deepEqual(result, {
    offering: { outcome: "not_configured" },
    directory: { outcome: "not_configured" },
  });
  assert.equal(calls, 0);
});

implementedTest("rejects an invalid public id before either projection request", async () => {
  let calls = 0;
  const result = await projection.readProviderProjections(
    { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" },
    async () => {
      calls += 1;
      throw new Error("an invalid public id must not fetch");
    },
    "not/a/public/id",
  );

  assert.equal(calls, 0);
  assert.deepEqual(result, {
    offering: { outcome: "unexpected_response" },
    directory: { outcome: "unexpected_response" },
  });
});

implementedTest("gives each projection its own deadline and rejects bodies above the fixed response cap", async (t) => {
  const timeouts = [];
  t.mock.method(AbortSignal, "timeout", (milliseconds) => {
    const controller = new AbortController();
    timeouts.push({ milliseconds, controller });
    return controller.signal;
  });
  const calls = [];
  const result = await projection.readProviderProjections(
    { TOOL402_CONVEX_SITE_URL: "https://convex.example.test/" },
    async (input, init) => {
      calls.push({ input, init });
      return oversizedJson();
    },
    "riskscan_offering_demo",
  );

  assert.deepEqual(result, {
    offering: { outcome: "unexpected_response" },
    directory: { outcome: "unexpected_response" },
  });
  assert.equal(calls.length, 2);
  assert.equal(timeouts.length, 2);
  assert.notEqual(timeouts[0].controller, timeouts[1].controller);
  assert.deepEqual(timeouts.map(({ milliseconds }) => milliseconds), [2_000, 2_000]);
});

implementedTest("renders only the fixed status regions, actions, evidence rows, and gated external link", async () => {
  const sources = await readSources();
  const page = sources["src/app/provider/page.tsx"];
  const status = sources["src/components/provider/status/provider-status.tsx"];
  const state = sources["src/components/provider/status/provider-status-state.ts"];
  const presentation = `${page}\n${status}\n${state}`;

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.equal((page.match(/<Suspense\b/g) ?? []).length, 1);
  assert.doesNotMatch(page, /["']use client["']|\bfetch\s*\(|set(?:Timeout|Interval)\s*\(/);
  for (const text of [
    "Prepare the revenue note asset",
    "Create the note in MetaMask",
    "Publish the directory version",
    "Whitelist the first backer and issue their units",
    "None. The offering is closed.",
    "offering.create",
    "external.prepare",
    "revenue note",
    "directory.publish",
    "not recorded",
  ]) assert.match(presentation, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(presentation, /https:\/\/hashscan\.io\/testnet\/contract\//);
  assert.match(presentation, /rel=["']noreferrer["']/);
  assert.doesNotMatch(presentation, /funding raised|units issued|paid task|balance|Live testnet|Connected|New offering version/i);
});

implementedTest("derives the fixed region order, next actions, evidence cells, and Hashscan gate from admitted projection data", async () => {
  const state = await import(new URL("../src/components/provider/status/provider-status-state.ts", import.meta.url).href);
  assert.deepEqual(state.providerStatusRegionOrder, [
    "state ribbon",
    "next action",
    "deployment evidence table",
    "active terms card",
    "active directory card",
    "signer card",
  ]);
  assert.deepEqual(
    ["DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"].map((value) => state.nextProviderAction(value)),
    [
      { message: "Prepare the revenue note asset", href: "/provider/deploy" },
      { message: "Create the note in MetaMask", href: "/provider/deploy" },
      { message: "Publish the directory version", href: "/provider/deploy" },
      { message: "Whitelist the first backer and issue their units", href: "/provider/deploy" },
      { message: "None. The offering is closed.", href: null },
    ],
  );

  const rows = state.providerEvidenceRows({
    offeringPublicId: "riskscan_offering_demo",
    version: 1,
    state: "READY",
    acceptedAt: "2026-09-10T00:00:00.000Z",
    atsAssetEvmAddress: "0x1111111111111111111111111111111111111111",
  }, {
    directoryVersion: 2,
    record: { publishedAt: "2026-09-10T01:00:00.000Z" },
  });
  assert.deepEqual(rows, [
    ["offering.create", "riskscan_offering_demo v1", "signed command admitted", "2026-09-10T00:00:00.000Z"],
    ["external.prepare", "not recorded", "prepared attempt recorded", "not recorded"],
    ["revenue note", "0x1111111111111111111111111111111111111111", "address recorded", "not recorded"],
    ["directory.publish", "riskscan v2", "a published directory version exists", "2026-09-10T01:00:00.000Z"],
  ]);
  assert.deepEqual(
    state.providerEvidenceRows({
      offeringPublicId: "riskscan_offering_demo",
      version: 1,
      state: "DRAFT",
      acceptedAt: "2026-09-10T00:00:00.000Z",
    }, undefined)[1],
    ["external.prepare", "not recorded", "not recorded", "not recorded"],
  );
  for (const stateValue of ["DRAFT", "ASSET_PENDING"]) {
    assert.equal(state.hashscanContractUrl(stateValue, "0x1111111111111111111111111111111111111111"), null);
  }
  for (const stateValue of ["READY", "OPEN", "CLOSED"]) {
    assert.equal(
      state.hashscanContractUrl(stateValue, "0x1111111111111111111111111111111111111111"),
      "https://hashscan.io/testnet/contract/0x1111111111111111111111111111111111111111",
    );
  }
  assert.equal(state.hashscanContractUrl("READY", undefined), null);
});
