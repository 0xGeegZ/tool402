import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { canonicalizeRequirements } from "@tool402/core";

const sourceUrl = new URL("../src/directory-publish-payload.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const validIdempotencyKey = `${"B".repeat(21)}Q`;
const validExpiry = "2026-09-15T00:00:00.000Z";

function record(overrides = {}) {
  return {
    schemaVersion: 1,
    serviceId: "riskscan_quick",
    serviceSlug: "riskscan",
    offeringPublicId: "riskscan_revenue_note_demo",
    offeringVersion: 1,
    capabilities: ["evm-contract-risk-signals"],
    x402Endpoint: "https://api.tool402.test/riskscan",
    webUrl: "https://tool402.test/",
    paymentProtocol: "x402",
    paymentNetwork: "hedera-testnet",
    asset: "HBAR",
    advertisedTiers: ["quick", "standard"],
    issuerRevenueAccount: "0.0.123",
    clearingAccount: "0.0.456",
    status: "active",
    publishedAt: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}

function payload(overrides = {}) {
  return {
    schemaVersion: 1,
    offeringPublicId: "riskscan_revenue_note_demo",
    offeringVersion: 1,
    directoryVersion: 1,
    record: record(),
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

test("requires the declared directory-publish source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("parses a frozen detached directory-publish payload", () => {
  const input = payload();
  const parsed = api.parseDirectoryPublishPayload(input);

  assert.deepEqual(parsed, input);
  assert.notEqual(parsed, input);
  assert.notEqual(parsed.record, input.record);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.record), true);
  assert.equal(Object.isFrozen(parsed.record.capabilities), true);
  assert.equal(Object.isFrozen(parsed.record.advertisedTiers), true);

  input.record.serviceId = "mutated";
  input.record.advertisedTiers.pop();
  assert.equal(parsed.record.serviceId, "riskscan_quick");
  assert.deepEqual(parsed.record.advertisedTiers, ["quick", "standard"]);
});

implementedTest("requires exact roots and record-to-payload identity", () => {
  const missing = payload();
  delete missing.directoryVersion;
  const nonenumerable = payload();
  Object.defineProperty(nonenumerable, "offeringVersion", { enumerable: false });
  const symbol = payload();
  symbol[Symbol("unexpected")] = true;
  const inherited = Object.assign(Object.create({ directoryVersion: 1 }), payload());
  delete inherited.directoryVersion;
  const customPrototype = Object.assign(Object.create(null), payload());

  for (const malformed of [
    null,
    [],
    missing,
    nonenumerable,
    symbol,
    inherited,
    customPrototype,
    payload({ unexpected: true }),
    payload({ schemaVersion: 0 }),
    payload({ schemaVersion: "1" }),
    payload({ offeringPublicId: "another_offering" }),
    payload({ offeringVersion: 2 }),
    payload({ directoryVersion: 0 }),
    payload({ directoryVersion: Number.MAX_SAFE_INTEGER + 1 }),
  ]) {
    assertInputError(() => api.parseDirectoryPublishPayload(malformed));
  }
});

implementedTest("rejects caller URLs that the delegated record parser would normalize", () => {
  for (const malformedRecord of [
    record({ x402Endpoint: "https://api.tool402.test" }),
    record({ webUrl: "https://tool402.test" }),
    record({ x402Endpoint: "https://API.tool402.test/riskscan" }),
    record({ webUrl: "https://tool402.test/%2e%2e/provider" }),
  ]) {
    assertInputError(() => api.parseDirectoryPublishPayload(payload({ record: malformedRecord })));
  }
  const withoutWebUrl = record();
  delete withoutWebUrl.webUrl;
  const parsed = api.parseDirectoryPublishPayload(payload({ record: withoutWebUrl }));
  assert.equal(Object.hasOwn(parsed.record, "webUrl"), false);
});

implementedTest("reuses M26 idempotency and expiry grammars and rejects delegated record failures", () => {
  for (const malformed of [
    payload({ idempotencyKey: `${"B".repeat(21)}B` }),
    payload({ idempotencyKey: "B".repeat(22) }),
    payload({ expiresAt: "2026-09-15T00:00:00Z" }),
    payload({ expiresAt: "2026-02-29T00:00:00.000Z" }),
    payload({ record: record({ paymentProtocol: "other" }) }),
    payload({ record: record({ capabilities: ["wrong"] }) }),
  ]) {
    assertInputError(() => api.parseDirectoryPublishPayload(malformed));
  }
});

implementedTest("rejects accessors and hostile reflection without invoking caller fields", () => {
  const accessor = payload();
  let reads = 0;
  Object.defineProperty(accessor, "record", {
    enumerable: true,
    get() {
      reads += 1;
      throw new Error("must not invoke accessor");
    },
  });
  assertInputError(() => api.parseDirectoryPublishPayload(accessor));
  assert.equal(reads, 0);

  const descriptorOnly = new Proxy(payload(), {
    get() { throw new Error("must not directly read caller fields"); },
  });
  assert.equal(api.parseDirectoryPublishPayload(descriptorOnly).record.serviceId, "riskscan_quick");

  for (const malformed of [
    new Proxy(payload(), { ownKeys() { throw new Error("ownKeys failed"); } }),
    new Proxy(payload(), { getOwnPropertyDescriptor() { throw new Error("descriptor failed"); } }),
    new Proxy(payload(), { getPrototypeOf() { throw new Error("prototype failed"); } }),
  ]) {
    assertInputError(() => api.parseDirectoryPublishPayload(malformed));
  }
});

implementedTest("rejects a record whose URL descriptor changes after capture", () => {
  let webUrlDescriptorReads = 0;
  const changingRecord = new Proxy(record(), {
    getOwnPropertyDescriptor(target, property) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
      if (property !== "webUrl" || descriptor === undefined) {
        return descriptor;
      }

      webUrlDescriptorReads += 1;
      return {
        ...descriptor,
        value: webUrlDescriptorReads === 1
          ? undefined
          : "https://TOOL402.test",
      };
    },
  });

  assertInputError(() => api.parseDirectoryPublishPayload(payload({ record: changingRecord })));
  assert.equal(webUrlDescriptorReads, 1);
});

implementedTest("emits fresh canonical JCS bytes and exposes no runtime adapter", async () => {
  const input = payload();
  const parsed = api.parseDirectoryPublishPayload(input);
  const first = api.canonicalDirectoryPublishPayloadBytes(parsed);
  const second = api.canonicalDirectoryPublishPayloadBytes(parsed);

  assert.deepEqual(first, new TextEncoder().encode(canonicalizeRequirements(input)));
  assert.deepEqual(second, first);
  assert.notEqual(first, second);

  const withoutWebUrl = payload();
  delete withoutWebUrl.record.webUrl;
  const withoutWebUrlBytes = api.canonicalDirectoryPublishPayloadBytes(
    api.parseDirectoryPublishPayload(withoutWebUrl),
  );
  assert.deepEqual(
    withoutWebUrlBytes,
    new TextEncoder().encode(canonicalizeRequirements(withoutWebUrl)),
  );
  assert.doesNotMatch(new TextDecoder().decode(withoutWebUrlBytes), /"webUrl"/u);

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
  assert.equal(publicApi.parseDirectoryPublishPayload, api.parseDirectoryPublishPayload);
  assert.equal(publicApi.canonicalDirectoryPublishPayloadBytes, api.canonicalDirectoryPublishPayloadBytes);
});
