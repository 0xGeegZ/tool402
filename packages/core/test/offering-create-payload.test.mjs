import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { canonicalizeRequirements } from "@tool402/core";

const sourceUrl = new URL("../src/offering-create-payload.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const validIdempotencyKey = `${"A".repeat(21)}A`;
const validExpiry = "2026-09-15T00:00:00.000Z";
const validTerms = {
  version: "riskscan-revenue-note-v1",
  fundingTargetTinybars: "1000",
  noteUnitPriceTinybars: "10",
  maximumNoteUnits: "100",
  minimumPurchaseUnits: "1",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "1500",
};

function payload(overrides = {}) {
  return {
    schemaVersion: 1,
    offeringPublicId: "riskscan_revenue_note_demo",
    offeringVersion: 1,
    subjectPublicId: "riskscan_revenue_note_demo",
    definition: {
      schemaVersion: 1,
      terms: { ...validTerms },
      maturityAt: "2026-12-31T00:00:00.000Z",
      qualifyingResource: "riskscan.quick",
    },
    narrative: {
      title: "RiskScan Revenue Note",
      customerProblem: "Teams need a bounded signal before an EVM contract interaction.",
      customerUseCases: ["Inspect a contract before use"],
      useOfFunds: ["Maintain the RiskScan service"],
      risks: ["Testnet-only demonstration"],
    },
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    idempotencyKey: validIdempotencyKey,
    expiresAt: validExpiry,
    ...overrides,
  };
}

function assertInputError(action) {
  assert.throws(
    action,
    (error) => error instanceof TypeError || error instanceof RangeError,
  );
}

test("requires the declared offering-create source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("parses a frozen detached offering-create payload", () => {
  const input = payload();
  const parsed = api.parseOfferingCreatePayload(input);

  assert.deepEqual(parsed, {
    ...input,
    definition: {
      ...input.definition,
      terms: {
        ...input.definition.terms,
        fundingTargetTinybars: 1000n,
        noteUnitPriceTinybars: 10n,
        maximumNoteUnits: 100n,
        minimumPurchaseUnits: 1n,
        reserveShareBps: 2000n,
        issuerShareBps: 8000n,
        platformFeeBps: 0n,
        payoutCapTinybars: 1500n,
      },
    },
    narrative: {
      ...input.narrative,
      customerUseCases: ["Inspect a contract before use"],
      useOfFunds: ["Maintain the RiskScan service"],
      risks: ["Testnet-only demonstration"],
    },
    advertisedQuickPriceTinybars: 10n,
    advertisedStandardPriceTinybars: 25n,
  });
  assert.notEqual(parsed, input);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.definition), true);
  assert.equal(Object.isFrozen(parsed.narrative), true);
  assert.equal(Object.isFrozen(parsed.narrative.customerUseCases), true);

  input.narrative.title = "changed";
  input.narrative.customerUseCases[0] = "changed";
  input.definition.terms.fundingTargetTinybars = "1";
  assert.equal(parsed.narrative.title, "RiskScan Revenue Note");
  assert.deepEqual(parsed.narrative.customerUseCases, ["Inspect a contract before use"]);
  assert.equal(parsed.definition.terms.fundingTargetTinybars, 1000n);
});

implementedTest("requires the exact closed root and delegates the offering definition", () => {
  const missing = payload();
  delete missing.subjectPublicId;
  const symbol = payload();
  symbol[Symbol("unexpected")] = true;
  const inherited = Object.assign(Object.create({ offeringVersion: 1 }), payload());
  delete inherited.offeringVersion;
  const customPrototype = Object.assign(Object.create(null), payload());

  for (const malformed of [
    null,
    [],
    missing,
    payload({ unexpected: true }),
    symbol,
    inherited,
    customPrototype,
    payload({ definition: { ...payload().definition, unexpected: true } }),
  ]) {
    assertInputError(() => api.parseOfferingCreatePayload(malformed));
  }
});

implementedTest("rejects accessors and reflection failures without reading caller fields", () => {
  const accessor = payload();
  let reads = 0;
  Object.defineProperty(accessor, "subjectPublicId", {
    enumerable: true,
    get() {
      reads += 1;
      throw new Error("must not read an accessor");
    },
  });
  assertInputError(() => api.parseOfferingCreatePayload(accessor));
  assert.equal(reads, 0);

  const descriptorOnly = new Proxy(payload(), {
    get() {
      throw new Error("must not directly read caller fields");
    },
  });
  assert.equal(
    api.parseOfferingCreatePayload(descriptorOnly).offeringPublicId,
    "riskscan_revenue_note_demo",
  );

  for (const malformed of [
    new Proxy(payload(), { ownKeys() { throw new Error("ownKeys failed"); } }),
    new Proxy(payload(), {
      getOwnPropertyDescriptor() { throw new Error("descriptor failed"); },
    }),
    new Proxy(payload(), { getPrototypeOf() { throw new Error("prototype failed"); } }),
  ]) {
    assertInputError(() => api.parseOfferingCreatePayload(malformed));
  }
});

implementedTest("enforces identifier, version, expiry, and bounded canonical tinybar rules", () => {
  for (const publicId of ["_leading", "-leading", "A", "A".repeat(96)]) {
    assert.equal(api.parseOfferingCreatePayload(payload({ offeringPublicId: publicId })).offeringPublicId, publicId);
  }
  for (const malformed of [
    payload({ offeringPublicId: "" }),
    payload({ subjectPublicId: "contains.period" }),
    payload({ offeringVersion: 0 }),
    payload({ offeringVersion: Number.MAX_SAFE_INTEGER + 1 }),
    payload({ offeringVersion: "1" }),
    payload({ idempotencyKey: `${"A".repeat(21)}B` }),
    payload({ expiresAt: "2026-09-15T00:00:00Z" }),
    payload({ advertisedQuickPriceTinybars: "0" }),
    payload({ advertisedQuickPriceTinybars: "10000001" }),
    payload({ advertisedStandardPriceTinybars: "100000000" }),
    payload({ advertisedStandardPriceTinybars: "0001" }),
  ]) {
    assertInputError(() => api.parseOfferingCreatePayload(malformed));
  }
  assert.equal(
    api.parseOfferingCreatePayload(payload({ advertisedQuickPriceTinybars: "10000000" })).advertisedQuickPriceTinybars,
    10000000n,
  );
});

implementedTest("enforces narrative arrays, UTF-8 bounds, controls, and surrogate safety", () => {
  const atMaximum = payload({
    narrative: {
      title: "a".repeat(100),
      customerProblem: "a".repeat(1000),
      customerUseCases: Array.from({ length: 6 }, () => "a".repeat(400)),
      useOfFunds: ["funds"],
      risks: ["risk"],
    },
  });
  assert.equal(api.parseOfferingCreatePayload(atMaximum).narrative.title.length, 100);

  for (const narrative of [
    { ...payload().narrative, customerUseCases: [] },
    { ...payload().narrative, customerUseCases: Array.from({ length: 7 }, () => "item") },
    { ...payload().narrative, title: "a".repeat(101) },
    { ...payload().narrative, customerProblem: "a".repeat(1001) },
    { ...payload().narrative, risks: ["a".repeat(401)] },
    { ...payload().narrative, title: " leading" },
    { ...payload().narrative, title: "contains\u0000control" },
    { ...payload().narrative, title: "\ud800" },
  ]) {
    assertInputError(() => api.parseOfferingCreatePayload(payload({ narrative })));
  }
});

implementedTest("emits fresh canonical JCS bytes and exposes no runtime adapter", async () => {
  const input = payload();
  const parsed = api.parseOfferingCreatePayload(input);
  const first = api.canonicalOfferingCreatePayloadBytes(parsed);
  const second = api.canonicalOfferingCreatePayloadBytes(parsed);

  assert.deepEqual(first, new TextEncoder().encode(canonicalizeRequirements(input)));
  assert.deepEqual(second, first);
  assert.notEqual(second, first);

  const source = await readFile(sourceUrl, "utf8");
  for (const prohibited of [
    /\bJSON\.parse\b/u,
    /\bprocess\.env\b/u,
    /\bfetch\s*\(/u,
    /\bDate\.now\b/u,
    /\bkeccak\b/iu,
    /from\s+["'][^"']*(?:convex|viem|provider|storage|database)[^"']*["']/iu,
  ]) {
    assert.doesNotMatch(source, prohibited);
  }
  const publicApi = await import("@tool402/core");
  assert.equal(publicApi.parseOfferingCreatePayload, api.parseOfferingCreatePayload);
  assert.equal(publicApi.canonicalOfferingCreatePayloadBytes, api.canonicalOfferingCreatePayloadBytes);
});
