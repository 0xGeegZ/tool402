import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

import * as atsPrepareAuthority from "../convex/ats_prepare_authority.ts";

const { assertAtsPrepareAuthorityForTest } = atsPrepareAuthority;

const operationDescriptor = Object.freeze({ instrument: "equity", version: "1" });
const parameters = Object.freeze({ action: "create", class: "A" });
const rule = Object.freeze({
  schemaVersion: 1,
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "subject_42",
  offeringVersion: "offering_v1",
  registryRevision: "registry_v1",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  operationDescriptor,
  parameters,
  enabled: true,
});
const manifest = Object.freeze([rule]);

const preimage = {
  protocol: "tool402:ats-parameters:v1",
  network: rule.network,
  chainId: rule.chainId,
  subjectPublicId: rule.subjectPublicId,
  offeringVersion: rule.offeringVersion,
  registryRevision: rule.registryRevision,
  operationKind: rule.operationKind,
  targetKind: rule.targetKind,
  expectedTarget: rule.expectedTarget,
  operationDescriptor: rule.operationDescriptor,
  parameters: rule.parameters,
};
const canonicalParametersHash = keccak256(
  stringToHex(canonicalizeRequirements(preimage)),
).slice(2);
const atsPayload = Object.freeze({
  operationKind: "ATS_CREATE",
  subjectPublicId: "subject_42",
  network: "hedera:testnet",
  chainId: 296,
  expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  canonicalParametersHash,
  idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
  expiresAt: "2026-09-08T07:04:00.000Z",
});
const fundingPayload = Object.freeze({
  ...atsPayload,
  operationKind: "HEDERA_FUNDING",
});

test("exports only the current and direct-test ATS prepare authority assertions", () => {
  assert.deepEqual(
    Object.keys(atsPrepareAuthority).sort(),
    ["assertAtsPrepareAuthorityForTest", "assertCurrentAtsPrepareAuthority"],
  );
});

test("accepts only the exact enabled ATS authority record and bypasses funding", () => {
  assert.equal(
    canonicalParametersHash,
    "adad5f19a74b092c1dc915c79db5fa14bafb6957ef36270353080a053d434a9e",
  );
  assert.doesNotThrow(() => assertAtsPrepareAuthorityForTest(atsPayload, manifest));
  assert.doesNotThrow(() => assertAtsPrepareAuthorityForTest(fundingPayload, Object.freeze([])));
});

test("rejects missing, duplicate, disabled, and malformed ATS manifest candidates", () => {
  const malformed = { ...rule };
  delete malformed.registryRevision;

  for (const [name, candidateManifest] of [
    ["missing", []],
    ["duplicate", [rule, { ...rule }]],
    ["disabled", [{ ...rule, enabled: false }]],
    ["missing field", [malformed]],
    ["unknown field", [{ ...rule, extra: true }]],
    ["empty operation descriptor", [{ ...rule, operationDescriptor: {} }]],
    ["empty parameters", [{ ...rule, parameters: {} }]],
  ]) {
    assert.throws(
      () => assertAtsPrepareAuthorityForTest(atsPayload, candidateManifest),
      TypeError,
      name,
    );
  }
});

test("rejects proxy and accessor-backed manifest candidates without invoking accessors", () => {
  const proxy = new Proxy(
    { ...rule },
    {
      ownKeys() {
        throw new Error("manifest proxy reflection must not escape");
      },
    },
  );
  let accessorReads = 0;
  const accessorBacked = { ...rule };
  Object.defineProperty(accessorBacked, "parameters", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("manifest accessor must not run");
    },
  });

  assert.throws(() => assertAtsPrepareAuthorityForTest(atsPayload, [proxy]));
  assert.throws(() => assertAtsPrepareAuthorityForTest(atsPayload, [accessorBacked]), TypeError);
  assert.equal(accessorReads, 0);
});

test("rejects exact-lookup manifest candidates with the wrong target or derived hash", () => {
  assert.throws(
    () => assertAtsPrepareAuthorityForTest(
      atsPayload,
      [{ ...rule, expectedTarget: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }],
    ),
    TypeError,
  );
  assert.throws(
    () => assertAtsPrepareAuthorityForTest(
      atsPayload,
      [{ ...rule, parameters: { ...parameters, class: "B" } }],
    ),
    TypeError,
  );
});

test("keeps the ATS resolver private and free of external/configuration capabilities", () => {
  const moduleUrl = new URL("../convex/ats_prepare_authority.ts", import.meta.url);
  assert.match(moduleUrl.pathname.split("/").at(-1), /^[a-z0-9_]+\.ts$/u);
  const source = readFileSync(moduleUrl, "utf8");
  assert.doesNotMatch(
    source,
    /\b(?:queryGeneric|mutationGeneric|actionGeneric|internalActionGeneric|httpActionGeneric|fetch|runAction|runMutation|runQuery)\b|process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|viem\/accounts|viem\/actions|createWalletClient|createPublicClient|_generated|convex\/nextjs|from\s+["'](?:node:)?https?["']/u,
  );
});
