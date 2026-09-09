import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const stateUrl = new URL("../src/components/provider/status/provider-status-state.ts", import.meta.url);
const declaredPaths = [
  "src/app/provider/page.tsx",
  "src/components/provider/status/provider-status.tsx",
  "src/components/provider/status/provider-status-state.ts",
];
const sourceExists = declaredPaths.every((path) => existsSync(join(appRoot, path)));
const implementedTest = sourceExists ? test : test.skip;
let state;

const assetAddress = `0x${"a".repeat(40)}`;

function offering(overrides = {}) {
  return {
    offeringPublicId: "riskscan_revenue_note_demo",
    version: 1,
    subjectPublicId: "riskscan_revenue_note_demo",
    state: "DRAFT",
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
    narrative: { title: "RiskScan", customerProblem: "p", customerUseCases: ["u"], useOfFunds: ["f"], risks: ["r"] },
    advertisedQuickPriceTinybars: "10000000",
    advertisedStandardPriceTinybars: "10000000",
    canonicalSignerAddress: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
    acceptedAt: "1789430400000",
    updatedAt: "1789430400000",
    ...overrides,
  };
}

function loadedDirectory() {
  return {
    kind: "loaded",
    directoryVersion: 1,
    record: {
      schemaVersion: 1,
      serviceId: "riskscan",
      serviceSlug: "riskscan",
      offeringPublicId: "riskscan_revenue_note_demo",
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
    },
  };
}

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("requires the declared page, component, and state paths before GREEN", () => {
  for (const path of declaredPaths) {
    assert.equal(existsSync(join(appRoot, path)), true, `missing declared S17 path: ${path}`);
  }
});

test.before(async () => {
  if (sourceExists) state = await import(stateUrl.href);
});

implementedTest("derives the next action from the offering state alone with no control for CLOSED", () => {
  assert.deepEqual(state.nextActionFor("DRAFT"), { label: "Prepare the revenue note asset", control: "/provider/deploy" });
  assert.deepEqual(state.nextActionFor("ASSET_PENDING"), { label: "Create the note in MetaMask", control: "/provider/deploy" });
  assert.deepEqual(state.nextActionFor("READY"), { label: "Publish the directory version", control: "/provider/deploy" });
  assert.deepEqual(state.nextActionFor("OPEN"), { label: "Whitelist the first backer and issue their units", control: "/provider/deploy" });
  assert.deepEqual(state.nextActionFor("CLOSED"), { label: "None. The offering is closed.", control: null });
  assert.throws(() => state.nextActionFor("LIVE"), TypeError);
  for (const kind of ["not_configured", "absent", "unavailable", "unexpected_response"]) {
    assert.equal(typeof state.outcomeStatement(kind), "string");
    assert.ok(state.outcomeStatement(kind).length > 0, kind);
  }
  assert.throws(() => state.outcomeStatement("loaded"), TypeError);
});

implementedTest("builds exactly four evidence rows from projection fields with explicit not recorded cells", () => {
  const notRecorded = "not recorded";
  const draft = state.evidenceRows({ kind: "loaded", record: offering() }, { kind: "absent" });
  assert.deepEqual(draft, [
    { record: "offering.create", reference: "riskscan_revenue_note_demo v1", verification: "signed command admitted", time: "2026-07-14T08:00:00.000Z" },
    { record: "external.prepare ATS_CREATE", reference: notRecorded, verification: notRecorded, time: notRecorded },
    { record: "revenue note", reference: notRecorded, verification: notRecorded, time: notRecorded },
    { record: "directory.publish", reference: notRecorded, verification: notRecorded, time: notRecorded },
  ]);

  const pending = state.evidenceRows({ kind: "loaded", record: offering({ state: "ASSET_PENDING" }) }, { kind: "unavailable" });
  assert.equal(pending[1].verification, "prepared attempt recorded");
  assert.equal(pending[1].reference, notRecorded);
  assert.equal(pending[1].time, notRecorded);
  assert.equal(pending[2].verification, notRecorded);

  const ready = state.evidenceRows({ kind: "loaded", record: offering({ state: "READY", atsAssetEvmAddress: assetAddress }) }, loadedDirectory());
  assert.equal(ready[1].verification, "prepared attempt recorded");
  assert.equal(ready[2].reference, assetAddress);
  assert.equal(ready[2].verification, "address recorded");
  assert.equal(ready[2].time, notRecorded);
  assert.deepEqual(ready[3], { record: "directory.publish", reference: "riskscan v1", verification: "published directory version 1", time: "2026-09-10T00:00:00.000Z" });

  const pendingWithAddress = state.evidenceRows({ kind: "loaded", record: offering({ state: "ASSET_PENDING", atsAssetEvmAddress: assetAddress }) }, { kind: "absent" });
  assert.equal(pendingWithAddress[2].reference, assetAddress);
  assert.equal(pendingWithAddress[2].verification, notRecorded);

  const closed = state.evidenceRows({ kind: "loaded", record: offering({ state: "CLOSED", atsAssetEvmAddress: assetAddress }) }, loadedDirectory());
  assert.equal(closed[2].verification, "address recorded");
  assert.equal(closed.length, 4);
  assert.deepEqual(state.evidenceRows({ kind: "not_configured" }, { kind: "not_configured" }).map((row) => row.record), draft.map((row) => row.record));
  for (const row of state.evidenceRows({ kind: "not_configured" }, loadedDirectory()).slice(0, 3)) {
    assert.deepEqual([row.reference, row.verification, row.time], [notRecorded, notRecorded, notRecorded]);
  }
  assert.equal(state.evidenceRows({ kind: "not_configured" }, loadedDirectory())[3].reference, "riskscan v1");
  for (const row of ready) assert.equal(Object.isFrozen(row), true);
});

implementedTest("renders the Hashscan link only for a recorded asset address in READY, OPEN, or CLOSED", () => {
  assert.equal(state.hashscanLink(offering()), null);
  assert.equal(state.hashscanLink(offering({ state: "READY" })), null);
  assert.equal(state.hashscanLink(offering({ state: "ASSET_PENDING", atsAssetEvmAddress: assetAddress })), null);
  assert.equal(state.hashscanLink(offering({ state: "DRAFT", atsAssetEvmAddress: assetAddress })), null);
  for (const stateValue of ["READY", "OPEN", "CLOSED"]) {
    assert.equal(state.hashscanLink(offering({ state: stateValue, atsAssetEvmAddress: assetAddress })), `https://hashscan.io/testnet/contract/${assetAddress}`);
  }
  assert.equal(state.formatAcceptedAt("1789430400000"), "2026-07-14T08:00:00.000Z");
  assert.equal(state.formatAcceptedAt("not a time"), "not recorded");
});

implementedTest("renders the fixed region order on a server page with one main, one h1, and synchronous local links", async () => {
  const [page, component, stateSource] = await Promise.all(declaredPaths.map(readAppFile));
  const sources = [page, component, stateSource].join("\n");

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /import\s*\{[^}]*\bSuspense\b[^}]*\}\s*from\s*["']react["']/u);
  assert.match(page, /<Suspense\b/u);
  assert.match(page, /href=["']\/provider\/deploy["']/u);
  assert.match(page, /href=["']\/explore\/riskscan["']/u);
  assert.match(page, /readProviderStatus\(/u);
  assert.match(page, /PROVIDER_OFFERING_PUBLIC_ID/u);
  assert.doesNotMatch(page, /process\.env/u);

  const regionIds = [...component.matchAll(/aria-labelledby=["']([^"']+)["']/gu)].map(([, id]) => id);
  assert.deepEqual(regionIds, [
    "provider-state",
    "provider-next-action",
    "provider-evidence",
    "provider-terms",
    "provider-directory",
    "provider-signer",
  ]);
  assert.match(component, /nextActionFor\(/u);
  assert.match(component, /evidenceRows\(/u);
  assert.match(component, /hashscanLink\(/u);
  assert.match(component, /outcomeStatement\(/u);
  assert.match(component, /rel=["']noreferrer["']/u);
  assert.match(component, /leaves this site/iu);
  assert.match(component, /signer of the admitted command/iu);
  assert.match(component, /new offering version with its own signature and directory version/iu);
  assert.match(component, /\bnot recorded\b/u);
  assert.match(component, /\b296\b/u);
  assert.doesNotMatch(component, /advertisedTiers/u);

  assert.doesNotMatch(sources, /["']use client["']/u);
  assert.doesNotMatch(sources, /\b(?:useState|useEffect|useMemo|useRef|setInterval|setTimeout|fetch\(|localStorage|sessionStorage)\b/u);
  assert.doesNotMatch(sources, /\b(?:funding raised|units issued|paid tasks?|balance|Live testnet|Design sample|Connected|New offering version)\b/iu);
  const externalOrigins = [...sources.matchAll(/https?:\/\/[^\s"'`)]+/gu)].map(([url]) => url);
  assert.deepEqual([...new Set(externalOrigins)], ["https://hashscan.io/testnet/contract/"]);
});
