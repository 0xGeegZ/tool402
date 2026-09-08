import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { canonicalizeRequirements } from "@tool402/core";

const sourceUrl = new URL("../src/attach-candidate-payload.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const validAttemptPublicId = `${"C".repeat(21)}g`;
const validIdempotencyKey = `${"D".repeat(21)}w`;
const validExpiry = "2026-09-15T00:00:00.000Z";
const validAddress = `0x${"a".repeat(40)}`;

function payload(overrides = {}) {
  return {
    schemaVersion: 1,
    attemptPublicId: validAttemptPublicId,
    operationKind: "ATS_CREATE",
    candidateTransactionId: "0.0.123@1735689600.123456789",
    candidateEvmAddress: validAddress,
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

test("requires the declared attach-candidate source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("parses a frozen detached ATS candidate payload", () => {
  const input = payload();
  const parsed = api.parseAttachCandidatePayload(input);
  assert.deepEqual(parsed, input);
  assert.notEqual(parsed, input);
  assert.equal(Object.isFrozen(parsed), true);

  input.candidateTransactionId = "0.0.999@1.000000001";
  assert.equal(parsed.candidateTransactionId, "0.0.123@1735689600.123456789");
});

implementedTest("retains both transaction forms without converting either", () => {
  const canonical = api.parseAttachCandidatePayload(payload());
  const mirrorInput = payload({
    operationKind: "ATS_ISSUE",
    candidateTransactionId: "0.0.123-1735689600-123456789",
  });
  delete mirrorInput.candidateEvmAddress;
  const mirror = api.parseAttachCandidatePayload(mirrorInput);

  assert.equal(canonical.candidateTransactionId, "0.0.123@1735689600.123456789");
  assert.equal(mirror.candidateTransactionId, "0.0.123-1735689600-123456789");
  for (const candidateTransactionId of [
    "0.0.123-1735689600-12345678",
    "0.0.0123-1735689600-123456789",
    "0.0.123@1735689600.1234567890",
    "0.0.123@1735689600-123456789",
    "not-a-transaction",
  ]) {
    assertInputError(() => api.parseAttachCandidatePayload(payload({ candidateTransactionId })));
  }
});

implementedTest("requires a candidate address exactly for ATS_CREATE", () => {
  const missingAddress = payload();
  delete missingAddress.candidateEvmAddress;
  assertInputError(() => api.parseAttachCandidatePayload(missingAddress));

  for (const operationKind of ["ATS_CONTROL_LIST", "ATS_ISSUE", "ATS_TRANSFER", "ATS_COUPON", "HEDERA_FUNDING"]) {
    const withoutAddress = payload({ operationKind });
    delete withoutAddress.candidateEvmAddress;
    assert.equal(api.parseAttachCandidatePayload(withoutAddress).operationKind, operationKind);
    assertInputError(() => api.parseAttachCandidatePayload(payload({ operationKind })));
  }
  for (const candidateEvmAddress of [
    `0x${"a".repeat(39)}`,
    `0x${"A".repeat(40)}`,
    `0x${"g".repeat(40)}`,
    `0X${"a".repeat(40)}`,
  ]) {
    assertInputError(() => api.parseAttachCandidatePayload(payload({ candidateEvmAddress })));
  }
});

implementedTest("enforces the closed root plus distinct M26-shaped attempt and idempotency keys", () => {
  const missing = payload();
  delete missing.attemptPublicId;
  const accessor = payload();
  let reads = 0;
  Object.defineProperty(accessor, "attemptPublicId", {
    enumerable: true,
    get() { reads += 1; throw new Error("must not invoke accessor"); },
  });

  for (const malformed of [
    null,
    [],
    missing,
    payload({ unexpected: true }),
    payload({ attemptPublicId: validIdempotencyKey }),
    payload({ attemptPublicId: `${"C".repeat(21)}B` }),
    payload({ idempotencyKey: `${"D".repeat(21)}B` }),
    payload({ expiresAt: "2026-09-15T00:00:00Z" }),
    payload({ schemaVersion: 2 }),
    accessor,
    new Proxy(payload(), { ownKeys() { throw new Error("ownKeys failed"); } }),
    new Proxy(payload(), { getOwnPropertyDescriptor() { throw new Error("descriptor failed"); } }),
  ]) {
    assertInputError(() => api.parseAttachCandidatePayload(malformed));
  }
  assert.equal(reads, 0);
});

implementedTest("emits fresh canonical JCS bytes and omits an absent optional address", async () => {
  const input = payload({ operationKind: "HEDERA_FUNDING" });
  delete input.candidateEvmAddress;
  const parsed = api.parseAttachCandidatePayload(input);
  const first = api.canonicalAttachCandidatePayloadBytes(parsed);
  const second = api.canonicalAttachCandidatePayloadBytes(parsed);

  assert.deepEqual(first, new TextEncoder().encode(canonicalizeRequirements(input)));
  assert.deepEqual(second, first);
  assert.notEqual(first, second);
  assert.doesNotMatch(new TextDecoder().decode(first), /candidateEvmAddress/u);

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
  assert.equal(publicApi.parseAttachCandidatePayload, api.parseAttachCandidatePayload);
  assert.equal(publicApi.canonicalAttachCandidatePayloadBytes, api.canonicalAttachCandidatePayloadBytes);
});
