import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalizeRequirements } from "@tool402/core";
import { keccak256, stringToHex } from "viem";

import * as atsPrepareAuthority from "../convex/ats_prepare_authority.ts";

const {
  assertAtsPrepareAuthorityForTest,
  assertCurrentAtsPrepareAuthority,
} = atsPrepareAuthority;

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
const m48OperationDescriptor = Object.freeze({
  sdkPackage: "@hashgraph/asset-tokenization-sdk",
  sdkVersion: "8.0.0",
  creationFamily: "BOND_STANDARD",
  requestExport: "CreateBondRequest",
  requestConstructor: "new CreateBondRequest",
  methodExport: "Bond",
  method: "create",
  targetContractRole: "FACTORY_PROXY",
  factoryHederaId: "0.0.9213391",
  resolverHederaId: "0.0.9212226",
  mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
  rpcNodeBaseUrl: "https://testnet.hashio.io/api",
  configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
  configVersion: 1,
  omittedOptionalFields: Object.freeze(["complianceId", "identityRegistryId"]),
});
const m48Parameters = Object.freeze({
  name: "Tool402 RiskScan Revenue Note Demo",
  symbol: "T402RN",
  isin: "XS402RISKN02",
  decimals: 0,
  isWhiteList: true,
  erc20VotesActivated: false,
  isControllable: false,
  arePartitionsProtected: false,
  isMultiPartition: false,
  clearingActive: false,
  internalKycActivated: false,
  externalPausesIds: Object.freeze([]),
  externalControlListsIds: Object.freeze([]),
  externalKycListsIds: Object.freeze([]),
  diamondOwnerAccount: "0xc89f87052c3e080b4a9b021d4930055031ef378e",
  currency: "0x555344",
  numberOfUnits: "1000",
  nominalValue: "1",
  nominalValueDecimals: 0,
  startingDate: "1789430400",
  maturityDate: "1798675200",
  regulationType: 1,
  regulationSubType: 0,
  isCountryControlListWhiteList: false,
  countries: "",
  info: "Tool402 testnet demo revenue note; no real-world investment or return claim.",
  configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
  configVersion: 1,
  proceedRecipientsIds: Object.freeze([]),
  proceedRecipientsData: Object.freeze([]),
});
const m48Preimage = Object.freeze({
  protocol: "tool402:ats-parameters:v1",
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  offeringVersion: "ats_demo_v1",
  registryRevision: "ats_sdk_8_0_0_testnet_v2",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  operationDescriptor: m48OperationDescriptor,
  parameters: m48Parameters,
});
const m48CanonicalParametersHash =
  "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const m48AtsCreatePayload = Object.freeze({
  operationKind: "ATS_CREATE",
  subjectPublicId: m48Preimage.subjectPublicId,
  network: m48Preimage.network,
  chainId: m48Preimage.chainId,
  expectedTarget: m48Preimage.expectedTarget,
  canonicalParametersHash: m48CanonicalParametersHash,
  idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
  expiresAt: "2026-09-08T07:04:00.000Z",
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

  const revokedManifest = Proxy.revocable([], {});
  revokedManifest.revoke();
  assert.doesNotThrow(
    () => assertAtsPrepareAuthorityForTest(fundingPayload, revokedManifest.proxy),
  );
});

test("requires the current M33 gate to admit the approved M42/M47 ATS_CREATE configuration", () => {
  assert.equal(
    keccak256(stringToHex(canonicalizeRequirements(m48Preimage))).slice(2),
    m48CanonicalParametersHash,
  );
  assert.doesNotThrow(
    () => assertCurrentAtsPrepareAuthority(m48AtsCreatePayload),
    "the current M33 manifest must admit the exact approved ATS_CREATE payload",
  );
});

test("rejects current M33 ATS kinds and approved M42/M47 tuple, target, and hash drift", () => {
  const drifts = [
    ["ATS control-list operation", { operationKind: "ATS_CONTROL_LIST" }],
    ["ATS issue operation", { operationKind: "ATS_ISSUE" }],
    ["ATS transfer operation", { operationKind: "ATS_TRANSFER" }],
    ["ATS coupon operation", { operationKind: "ATS_COUPON" }],
    ["network", { network: "hedera:mainnet" }],
    ["chain", { chainId: 295 }],
    ["subject", { subjectPublicId: "riskscan_revenue_note_other" }],
    ["target", { expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }],
    ["canonical hash", { canonicalParametersHash: "0".repeat(64) }],
  ];

  for (const [name, changes] of drifts) {
    assert.throws(
      () => assertCurrentAtsPrepareAuthority({ ...m48AtsCreatePayload, ...changes }),
      TypeError,
      name,
    );
  }
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

test("rejects reflection-hostile proxy and accessor-backed manifest candidates without invoking accessors", () => {
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

test("requires every dimension of the exact ATS manifest lookup tuple", () => {
  for (const [field, value] of [
    ["network", "hedera:mainnet"],
    ["chainId", 295],
    ["subjectPublicId", "subject_other"],
    ["operationKind", "ATS_ISSUE"],
  ]) {
    const mismatchedRule = { ...rule, [field]: value };
    const mismatchedPreimage = { ...preimage, [field]: value };
    const candidateParametersHash = keccak256(
      stringToHex(canonicalizeRequirements(mismatchedPreimage)),
    ).slice(2);

    assert.throws(
      () => assertAtsPrepareAuthorityForTest(
        { ...atsPayload, canonicalParametersHash: candidateParametersHash },
        [mismatchedRule],
      ),
      TypeError,
      field,
    );
  }
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
    /\b(?:queryGeneric|mutationGeneric|actionGeneric|internalActionGeneric|httpActionGeneric|fetch|runAction|runMutation|runQuery)\b|process\s*\.\s*env|import\.meta\.env|(?:from\s+["']@hashgraph|import\s+["']@hashgraph|import\s*\(\s*["']@hashgraph|require\s*\(\s*["']@hashgraph)|\bNetwork\s*\.\s*(?:init|connect)\s*\(|wagmi|viem\/accounts|viem\/actions|createWalletClient|createPublicClient|_generated|convex\/nextjs|from\s+["'](?:node:)?https?["']/u,
  );
});
