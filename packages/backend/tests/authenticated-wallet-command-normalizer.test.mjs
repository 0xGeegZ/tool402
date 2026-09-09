import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  canonicalAttachCandidatePayloadBytes,
  canonicalDirectoryPublishPayloadBytes,
  canonicalOfferingCreatePayloadBytes,
  parseAttachCandidatePayload,
  parseDirectoryPublishPayload,
  parseOfferingCreatePayload,
} from "@tool402/core";
import { keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const sourceUrl = new URL(
  "../src/ingress/authenticated-wallet-command-normalizer.ts",
  import.meta.url,
);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const fixedTestKeyBytes = Uint8Array.from({ length: 32 }, (_, index) => index);
const ingressTimestamp = 1_735_689_600n;
const serverNow = "2026-09-07T19:00:30.000Z";
const commandExpiry = "2026-09-07T19:04:00.000Z";
const commandIssuedAt = "2026-09-07T19:00:00.000Z";
const firstSigner = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const firstPayloadHash =
  "0x80e6aa5c7d520c43c2ae746b2a9459ab8e298b384703618a464a30378619422a";
const firstSignature =
  "0x9cbb4f71175c850caca53c93724944e2cc320443c15a793f0fd703accc14bf1d729baee430877eb548185b0b3b9b1635517d6bdb9b5149c9f06ddb08843bc9901c";
const signingAccount = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f094538e2f7d9fca7ca9293b3ff0b8f9b5b0a5b9",
);
const signingAddress = signingAccount.address.toLowerCase();
const typedDataDomain = {
  name: "Tool402",
  version: "1",
  chainId: 296,
};
const typedDataTypes = {
  Tool402Command: [
    { name: "version", type: "uint8" },
    { name: "type", type: "string" },
    { name: "signer", type: "address" },
    { name: "nonce", type: "string" },
    { name: "issuedAt", type: "string" },
    { name: "expiresAt", type: "string" },
    { name: "payloadHash", type: "bytes32" },
  ],
};

function externalPreparePayload(overrides = {}) {
  return {
    operationKind: "ATS_CREATE",
    subjectPublicId: "subject_42",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    canonicalParametersHash:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
    expiresAt: commandExpiry,
    ...overrides,
  };
}

function externalPrepareCommand(overrides = {}) {
  return {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    signer: firstSigner,
    nonce: "AAAAAAAAAAAAAAAAAAAAAA",
    issuedAt: commandIssuedAt,
    expiresAt: commandExpiry,
    payloadHash: firstPayloadHash,
    signature: firstSignature,
    ...overrides,
  };
}

function offeringCreatePayload(overrides = {}) {
  return {
    schemaVersion: 1,
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    subjectPublicId: "subject_42",
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
      customerProblem: "Teams need a bounded signal before an EVM contract interaction.",
      customerUseCases: ["Inspect a contract before use"],
      useOfFunds: ["Maintain the RiskScan service"],
      risks: ["Testnet-only demonstration"],
    },
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBQ",
    expiresAt: commandExpiry,
    ...overrides,
  };
}

function directoryPublishPayload(overrides = {}) {
  return {
    schemaVersion: 1,
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    directoryVersion: 1,
    record: {
      schemaVersion: 1,
      serviceId: "riskscan_quick",
      serviceSlug: "riskscan",
      offeringPublicId: "offering_42",
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
      publishedAt: "2026-09-07T00:00:00.000Z",
    },
    idempotencyKey: "CCCCCCCCCCCCCCCCCCCCCg",
    expiresAt: commandExpiry,
    ...overrides,
  };
}

function attachCandidatePayload(overrides = {}) {
  return {
    schemaVersion: 1,
    attemptPublicId: "DDDDDDDDDDDDDDDDDDDDDw",
    operationKind: "ATS_CREATE",
    candidateTransactionId: "0.0.123@1735689600.123456789",
    candidateEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    idempotencyKey: "EEEEEEEEEEEEEEEEEEEEEA",
    expiresAt: commandExpiry,
    ...overrides,
  };
}

function toLowercaseHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toArrayBuffer(bytes) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function toBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function createIngressKey() {
  return globalThis.crypto.subtle.importKey(
    "raw",
    fixedTestKeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function claimText(text) {
  const rawBody = new TextEncoder().encode(text);
  const { claimProtectedBody } = await import(
    new URL("../src/ingress/claimed-protected-body.ts", import.meta.url),
  );
  const key = await createIngressKey();
  const bodySha256 = toLowercaseHex(
    new Uint8Array(
      await globalThis.crypto.subtle.digest("SHA-256", toArrayBuffer(rawBody)),
    ),
  );
  const signingInput =
    "POST\n/internal/commands\n" + ingressTimestamp +
    "\nAbCdEfGhIjKlMnOpQrStUw\n" + bodySha256;
  const signature = new Uint8Array(
    await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      toArrayBuffer(new TextEncoder().encode(signingInput)),
    ),
  );
  const claimed = await claimProtectedBody(
    {
      keyId: "key-A",
      timestampUnixSeconds: ingressTimestamp.toString(),
      requestNonce: "AbCdEfGhIjKlMnOpQrStUw",
      bodySha256,
      signature: toBase64Url(signature),
    },
    rawBody,
    ingressTimestamp,
    (keyId) => (keyId === "key-A" ? key : undefined),
    () => "claimed",
  );
  assert.notEqual(claimed, null);
  return claimed;
}

function canonicalPayloadBytes(type, payload) {
  if (type === "offering.create") {
    return canonicalOfferingCreatePayloadBytes(parseOfferingCreatePayload(payload));
  }
  if (type === "directory.publish") {
    return canonicalDirectoryPublishPayloadBytes(parseDirectoryPublishPayload(payload));
  }
  if (type === "external.attachCandidate") {
    return canonicalAttachCandidatePayloadBytes(parseAttachCandidatePayload(payload));
  }
  throw new TypeError("unsupported test command type");
}

async function signedCommand(type, payload, nonce) {
  const payloadHash = keccak256(
    stringToHex(new TextDecoder().decode(canonicalPayloadBytes(type, payload))),
  );
  const message = {
    version: 1,
    type,
    signer: signingAddress,
    nonce,
    issuedAt: commandIssuedAt,
    expiresAt: commandExpiry,
    payloadHash,
  };
  const signature = await signingAccount.signTypedData({
    domain: typedDataDomain,
    types: typedDataTypes,
    primaryType: "Tool402Command",
    message,
  });
  return {
    ...message,
    chainId: 296,
    signature: signature.toLowerCase(),
  };
}

function transportText(command, payload) {
  return JSON.stringify({ command, payload });
}

function authorityFor(signer, role = "ISSUER", ownedSubjectPublicIds = ["subject_42"]) {
  return {
    principalPublicId: "principal_42",
    canonicalSignerAddress: signer,
    chainId: 296,
    role,
    ownedSubjectPublicIds,
    authorityVersion: "authority-v1",
    enabled: true,
  };
}

test("requires the declared wallet-command normalizer source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("preserves M30 external.prepare normalization byte-for-byte", async () => {
  const normalized = await api.normalizeClaimedWalletCommand(
    await claimText(transportText(externalPrepareCommand(), externalPreparePayload())),
    serverNow,
    () => [authorityFor(firstSigner)],
  );

  assert.deepEqual(normalized, {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    canonicalSignerAddress: firstSigner,
    nonce: "AAAAAAAAAAAAAAAAAAAAAA",
    issuedAt: commandIssuedAt,
    expiresAt: commandExpiry,
    payloadHash: firstPayloadHash,
    replayIdentity:
      "tool402:wallet-command:v1:296:0xbfb8ea59964b307a79d4f0b98201db95e6dfa454:AAAAAAAAAAAAAAAAAAAAAA",
    principalPublicId: "principal_42",
    role: "ISSUER",
    authorityVersion: "authority-v1",
    payload: externalPreparePayload(),
  });
});

implementedTest("dispatches each signed M38 payload to exactly one closed command member", async () => {
  const cases = [
    ["offering.create", offeringCreatePayload(), "FFFFFFFFFFFFFFFFFFFFFQ"],
    ["directory.publish", directoryPublishPayload(), "GGGGGGGGGGGGGGGGGGGGGg"],
    ["external.attachCandidate", attachCandidatePayload(), "HHHHHHHHHHHHHHHHHHHHHw"],
  ];

  for (const [type, payload, nonce] of cases) {
    const command = await signedCommand(type, payload, nonce);
    const normalized = await api.normalizeClaimedWalletCommand(
      await claimText(transportText(command, payload)),
      serverNow,
      () => [authorityFor(signingAddress)],
    );
    assert.equal(normalized.type, type);
    assert.equal(normalized.payload.expiresAt, commandExpiry);
    assert.equal(normalized.payloadHash, command.payloadHash);
    assert.equal(Object.isFrozen(normalized), true);
    assert.equal(Object.isFrozen(normalized.payload), true);
    assert.equal(Object.hasOwn(normalized, "signature"), false);
    assert.equal(Object.hasOwn(normalized, "rawBody"), false);
  }
});

implementedTest("returns only the required deferred ownership references for subjectless commands", async () => {
  const directoryPayload = directoryPublishPayload();
  const directoryCommand = await signedCommand(
    "directory.publish",
    directoryPayload,
    "IIIIIIIIIIIIIIIIIIIIIQ",
  );
  const directory = await api.normalizeClaimedWalletCommand(
    await claimText(transportText(directoryCommand, directoryPayload)),
    serverNow,
    () => [authorityFor(signingAddress, "ISSUER", [])],
  );
  assert.deepEqual(directory.deferredSubjectOwnership, {
    kind: "OFFERING",
    offeringPublicId: "offering_42",
    offeringVersion: 1,
  });

  const candidatePayload = attachCandidatePayload();
  const candidateCommand = await signedCommand(
    "external.attachCandidate",
    candidatePayload,
    "JJJJJJJJJJJJJJJJJJJJJg",
  );
  const candidate = await api.normalizeClaimedWalletCommand(
    await claimText(transportText(candidateCommand, candidatePayload)),
    serverNow,
    () => [authorityFor(signingAddress, "ISSUER", [])],
  );
  assert.deepEqual(candidate.deferredSubjectOwnership, {
    kind: "ATTEMPT",
    attemptPublicId: "DDDDDDDDDDDDDDDDDDDDDw",
  });
});

implementedTest("fails closed before authority resolution for payload expiry or type-bound digest drift", async () => {
  const payload = offeringCreatePayload();
  const command = await signedCommand("offering.create", payload, "KKKKKKKKKKKKKKKKKKKKKw");
  let resolverCalls = 0;
  assert.equal(
    await api.normalizeClaimedWalletCommand(
      await claimText(transportText(command, offeringCreatePayload({ expiresAt: "2026-09-07T19:03:59.999Z" }))),
      serverNow,
      () => {
        resolverCalls += 1;
        return [authorityFor(signingAddress)];
      },
    ),
    null,
  );
  assert.equal(resolverCalls, 0);

  const crossType = { ...command, type: "directory.publish" };
  assert.equal(
    await api.normalizeClaimedWalletCommand(
      await claimText(transportText(crossType, payload)),
      serverNow,
      () => [authorityFor(signingAddress)],
    ),
    null,
  );
});

implementedTest("enforces the inherited clock boundary through the M39 test-only predicate", () => {
  assert.equal(
    api.isWalletCommandTimeWindowValidForTest(
      commandIssuedAt,
      commandExpiry,
      serverNow,
    ),
    true,
  );
  assert.equal(
    api.isWalletCommandTimeWindowValidForTest(
      commandIssuedAt,
      "2026-09-07T19:04:00.001Z",
      commandIssuedAt,
    ),
    false,
  );
});

implementedTest("keeps the normalizer private and free of external capability", () => {
  const source = readFileSync(sourcePath, "utf8");
  const backendEntry = readFileSync(
    fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    "utf8",
  );
  for (const forbidden of [
    /JSON\.parse/u,
    /process\.env/u,
    /Date\.now/u,
    /\bfetch\b/u,
    /from ["']convex/u,
    /from ["'][^"']*(?:wallet|provider|wagmi|asset-tokenization-sdk)/iu,
    /\b(?:eval|Function)\b/u,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
  assert.doesNotMatch(backendEntry, /authenticated-wallet-command-normalizer/u);
});
