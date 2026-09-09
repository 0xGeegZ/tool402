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
import typescript from "typescript";
import { keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const sourceUrl = new URL(
  "../src/ingress/authenticated-wallet-command-normalizer.ts",
  import.meta.url,
);
const m30SourceUrl = new URL(
  "../src/ingress/authenticated-external-prepare-normalizer.ts",
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
const fundingSigner = "0x5fa74683fe13b2b7788c300c203f9cbd3521fc41";
const fundingPayloadHash =
  "0x7baf172181e6c5989341d590a5ade19417afbbfc475ea2543be314dd04c5c28d";
const fundingSignature =
  "0x442a6f2c19ddfcbd999fa21a3eeac1898fd7ffb912ac8d149c76da75a86f87155e5bec1a25e8708e7b1565c3124ffee03a89a8f02ccd3686b99fc39d676666a21c";
const recoveryZeroSigner = "0xe71ea0e05e3166b8ac164b3ffbd76a3c130f0498";
const recoveryZeroPayloadHash =
  "0x987860b96ee1959a1912a406644832d8146dd4224462344da80e5abead69d285";
const recoveryZeroSignature =
  "0x957e615b8f69d0e0cb8c4929c6be3fb4d9b1559d92499508f837197f1a59dc8e1dc3a36c1d783edd0212f22fdbc65bd0f0547ffe1178f5c02aa236093d62bde81b";
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

function fundingPayload(overrides = {}) {
  return {
    operationKind: "HEDERA_FUNDING",
    subjectPublicId: "subject_42",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: "0.0.123",
    canonicalParametersHash:
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    idempotencyKey: "QQQQQQQQQQQQQQQQQQQQQQ",
    expiresAt: commandExpiry,
    ...overrides,
  };
}

function fundingCommand(overrides = {}) {
  return {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    signer: fundingSigner,
    nonce: "QQQQQQQQQQQQQQQQQQQQQQ",
    issuedAt: commandIssuedAt,
    expiresAt: commandExpiry,
    payloadHash: fundingPayloadHash,
    signature: fundingSignature,
    ...overrides,
  };
}

function recoveryZeroPayload(overrides = {}) {
  return {
    operationKind: "ATS_ISSUE",
    subjectPublicId: "subject_42",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: "0xcccccccccccccccccccccccccccccccccccccccc",
    canonicalParametersHash:
      "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    idempotencyKey: "gggggggggggggggggggggg",
    expiresAt: commandExpiry,
    ...overrides,
  };
}

function recoveryZeroCommand(overrides = {}) {
  return {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    signer: recoveryZeroSigner,
    nonce: "gggggggggggggggggggggg",
    issuedAt: commandIssuedAt,
    expiresAt: commandExpiry,
    payloadHash: recoveryZeroPayloadHash,
    signature: recoveryZeroSignature,
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

async function signedCommand(
  type,
  payload,
  nonce,
  wireSigner = signingAddress,
  signedType = type,
  timing = {},
) {
  const {
    issuedAt = commandIssuedAt,
    expiresAt = commandExpiry,
    payloadHashOverride,
  } = timing;
  const payloadHash = payloadHashOverride ?? keccak256(
    stringToHex(new TextDecoder().decode(canonicalPayloadBytes(type, payload))),
  );
  const message = {
    version: 1,
    type: signedType,
    signer: wireSigner,
    nonce,
    issuedAt,
    expiresAt,
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

function canonicalExternalPreparePayloadText(payload) {
  return JSON.stringify({
    canonicalParametersHash: payload.canonicalParametersHash,
    chainId: payload.chainId,
    expectedTarget: payload.expectedTarget,
    expiresAt: payload.expiresAt,
    idempotencyKey: payload.idempotencyKey,
    network: payload.network,
    operationKind: payload.operationKind,
    subjectPublicId: payload.subjectPublicId,
  });
}

async function signedExternalPrepareCommand(payload, nonce) {
  const payloadHash = keccak256(
    stringToHex(canonicalExternalPreparePayloadText(payload)),
  );
  const message = {
    version: 1,
    type: "external.prepare",
    signer: signingAddress,
    nonce,
    issuedAt: commandIssuedAt,
    expiresAt: payload.expiresAt,
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

function cloneAuthorityRecords(records) {
  return records.map((record) => ({
    ...record,
    ownedSubjectPublicIds: [...record.ownedSubjectPublicIds],
  }));
}

async function assertRejectedBeforeResolver(command, payload) {
  let resolverCalls = 0;
  assert.equal(
    await api.normalizeClaimedWalletCommand(
      await claimText(transportText(command, payload)),
      serverNow,
      () => {
        resolverCalls += 1;
        return [authorityFor(signingAddress)];
      },
    ),
    null,
  );
  assert.equal(resolverCalls, 0);
}

async function assertRejectedAfterResolver(command, payload, authorityRecords) {
  let resolverCalls = 0;
  assert.equal(
    await api.normalizeClaimedWalletCommand(
      await claimText(transportText(command, payload)),
      serverNow,
      () => {
        resolverCalls += 1;
        return authorityRecords;
      },
    ),
    null,
  );
  assert.equal(resolverCalls, 1);
}

function claimedTextFactory(text) {
  return () => claimText(text);
}

function claimedBytesFactory(bytes) {
  return () => claimRawBody(new Uint8Array(bytes));
}

function defaultExternalPrepareAuthorityRecords() {
  return [authorityFor(firstSigner)];
}

function m30CompatibilityVectors() {
  const externalTransport = (command = externalPrepareCommand(), payload = externalPreparePayload()) =>
    transportText(command, payload);
  const rejected = (name, claimedBody, options = {}) => ({
    name,
    accepts: false,
    claimedBody,
    serverTime: options.serverTime ?? serverNow,
    authorityRecords:
      options.authorityRecords ?? defaultExternalPrepareAuthorityRecords,
    verify: options.verify,
  });
  const accepted = (name, claimedBody, options = {}) => ({
    name,
    accepts: true,
    claimedBody,
    serverTime: options.serverTime ?? serverNow,
    authorityRecords:
      options.authorityRecords ?? defaultExternalPrepareAuthorityRecords,
    verify: options.verify,
  });
  const withoutOwn = (value, key) => {
    const copy = { ...value };
    delete copy[key];
    return copy;
  };
  let accessorReads = 0;

  return [
    accepted("accepts the canonical M30 external.prepare vector", claimedTextFactory(externalTransport())),
    accepted(
      "accepts HEDERA_FUNDING for its backer",
      claimedTextFactory(externalTransport(fundingCommand(), fundingPayload())),
      { authorityRecords: () => [authorityFor(fundingSigner, "BACKER", [])] },
    ),
    accepted(
      "accepts recovery suffix 01",
      claimedTextFactory(
        externalTransport(
          externalPrepareCommand({ signature: `${firstSignature.slice(0, -2)}01` }),
        ),
      ),
    ),
    accepted(
      "accepts recovery suffix 00",
      claimedTextFactory(
        externalTransport(
          recoveryZeroCommand({
            signature: `${recoveryZeroSignature.slice(0, -2)}00`,
          }),
          recoveryZeroPayload(),
        ),
      ),
      { authorityRecords: () => [authorityFor(recoveryZeroSigner)] },
    ),
    accepted(
      "accepts the future-skew boundary",
      claimedTextFactory(externalTransport()),
      { serverTime: "2026-09-07T18:59:00.000Z" },
    ),
    accepted(
      "accepts the expiry boundary",
      claimedTextFactory(externalTransport()),
      { serverTime: commandExpiry },
    ),

    rejected(
      "rejects a raw byte body outside the M25 capability",
      () => new Uint8Array(new TextEncoder().encode(externalTransport())),
    ),
    rejected(
      "rejects a raw text body outside the M25 capability",
      () => externalTransport(),
    ),
    rejected(
      "rejects a forged structural body outside the M25 capability",
      () => ({ replayIdentity: "forged" }),
    ),
    rejected(
      "rejects a proxy outside the M25 capability",
      () => new Proxy({}, {}),
    ),
    rejected(
      "rejects a structural copy of an M30 normalized DTO",
      async (m30) => {
        const normalized = await m30.normalizeClaimedExternalPrepareCommand(
          await claimText(externalTransport()),
          serverNow,
          defaultExternalPrepareAuthorityRecords,
        );
        assert.notEqual(normalized, null);
        return { ...normalized };
      },
    ),
    rejected(
      "rejects invalid UTF-8 before the M30 decoder",
      claimedBytesFactory([0xff]),
    ),
    rejected(
      "rejects duplicate command keys",
      claimedTextFactory(
        externalTransport().replace('"version":1', '"version":1,"version":1'),
      ),
    ),
    rejected(
      "rejects escaped command strings",
      claimedTextFactory(
        externalTransport().replace('"external.prepare"', '"\\u0065xternal.prepare"'),
      ),
    ),
    rejected(
      "rejects an unexpected transport field",
      claimedTextFactory(externalTransport().replace("}", ',"unexpected":1}')),
    ),
    ...[
      ["leading-zero command numbers", '"version":01'],
      ["fractional command numbers", '"version":1.0'],
      ["exponent command numbers", '"version":1e0'],
    ].map(([name, replacement]) =>
      rejected(
        `rejects ${name}`,
        claimedTextFactory(externalTransport().replace('"version":1', replacement)),
      ),
    ),
    ...[
      ["an uppercase signer", { signer: firstSigner.toUpperCase() }],
      ["a noncanonical nonce", { nonce: "AAAAAAAAAAAAAAAAAAAAAB" }],
      ["a timestamp without milliseconds", { issuedAt: "2026-09-07T19:00:00.00Z" }],
      ["a non-UTC timestamp", { issuedAt: "2026-09-07T19:00:00.000+00:00" }],
      ["an impossible timestamp", { issuedAt: "2026-02-29T19:00:00.000Z" }],
      ["a command expiry drift", { expiresAt: "2026-09-07T19:04:00.001Z" }],
      ["an uppercase payload hash", { payloadHash: `0x${"A".repeat(64)}` }],
      ["an uppercase signature", { signature: firstSignature.toUpperCase() }],
      ["an unsupported recovery suffix", { signature: `${firstSignature.slice(0, -2)}02` }],
      ["a zero r signature", { signature: `0x${"0".repeat(64)}${firstSignature.slice(66)}` }],
      ["a zero s signature", { signature: `${firstSignature.slice(0, 66)}${"0".repeat(64)}1c` }],
      ["a high-s signature", { signature: `${firstSignature.slice(0, 66)}${"f".repeat(64)}1c` }],
      ["an unsupported command type", { type: "external.submit" }],
      ["an unsupported chain", { chainId: 295 }],
      ["an unsupported command version", { version: 2 }],
    ].map(([name, overrides]) =>
      rejected(
        `rejects ${name}`,
        claimedTextFactory(externalTransport(externalPrepareCommand(overrides))),
      ),
    ),
    ...[
      ["a payload expiry drift", externalPreparePayload({ expiresAt: "2026-09-07T19:04:00.001Z" })],
      ["an unsupported operation kind", externalPreparePayload({ operationKind: "ATS_UNKNOWN" })],
      ["an uppercase canonical parameters hash", externalPreparePayload({ canonicalParametersHash: "A".repeat(64) })],
    ].map(([name, payload]) =>
      rejected(
        `rejects ${name}`,
        claimedTextFactory(externalTransport(externalPrepareCommand(), payload)),
      ),
    ),
    rejected(
      "rejects a signed payload hash mismatch",
      claimedTextFactory(
        externalTransport(
          externalPrepareCommand({ payloadHash: `0x${"0".repeat(64)}` }),
        ),
      ),
    ),
    rejected(
      "rejects a valid-format recovered signer mismatch",
      claimedTextFactory(
        externalTransport(externalPrepareCommand({ signer: signingAddress })),
      ),
      { authorityRecords: () => [authorityFor(signingAddress)] },
    ),
    rejected(
      "rejects a truncated signature",
      claimedTextFactory(
        externalTransport(
          externalPrepareCommand({ signature: firstSignature.slice(0, -2) }),
        ),
      ),
    ),
    rejected(
      "rejects non-ASCII UTF-8 transport strings",
      claimedTextFactory(externalTransport().replace("subject_42", "subject_é")),
    ),
    ...[
      "2026-09-07T19:04:00.001Z",
      "2026-09-07T18:58:59.999Z",
      "2026-09-07T19:00:30Z",
      "2026-02-29T19:00:00.000Z",
    ].map((serverTime) =>
      rejected(
        `rejects server clock ${serverTime}`,
        claimedTextFactory(externalTransport()),
        { serverTime },
      ),
    ),
    ...[
      ["no authority record", () => []],
      ["multiple authority records", () => [authorityFor(firstSigner), authorityFor(firstSigner)]],
      ["a mismatched ownership record", () => [authorityFor(firstSigner, "ISSUER", ["other_subject"])]],
      ["a backer ATS_CREATE record", () => [authorityFor(firstSigner, "BACKER")]],
      ["a disabled authority record", () => [{ ...authorityFor(firstSigner), enabled: false }]],
      ["a mismatched signer record", () => [authorityFor("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]],
      ["an unsupported authority role", () => [authorityFor(firstSigner, "ADMIN")]],
    ].map(([name, authorityRecords]) =>
      rejected(
        `rejects ${name}`,
        claimedTextFactory(externalTransport()),
        { authorityRecords },
      ),
    ),
    rejected(
      "rejects HEDERA_FUNDING for an issuer",
      claimedTextFactory(externalTransport(fundingCommand(), fundingPayload())),
      { authorityRecords: () => [authorityFor(fundingSigner, "ISSUER")] },
    ),
    ...[
      ["a duplicated root command", `{"command":${JSON.stringify(externalPrepareCommand())},"command":${JSON.stringify(externalPrepareCommand())},"payload":${JSON.stringify(externalPreparePayload())}}`],
      ["a duplicated payload operation", externalTransport().replace('"operationKind":"ATS_CREATE"', '"operationKind":"ATS_CREATE","operationKind":"ATS_CREATE"')],
      ["a missing payload", JSON.stringify({ command: externalPrepareCommand() })],
      ["a missing command signature", JSON.stringify({ command: withoutOwn(externalPrepareCommand(), "signature"), payload: externalPreparePayload() })],
      ["a missing payload expiry", JSON.stringify({ command: externalPrepareCommand(), payload: withoutOwn(externalPreparePayload(), "expiresAt") })],
      ["an array root", "[]"],
      ["an array command", JSON.stringify({ command: [], payload: externalPreparePayload() })],
      ["an array payload", JSON.stringify({ command: externalPrepareCommand(), payload: [] })],
      ["a boolean command", JSON.stringify({ command: true, payload: externalPreparePayload() })],
      ["a boolean payload", JSON.stringify({ command: externalPrepareCommand(), payload: false })],
      ["a null root", "null"],
      ["a null payload", JSON.stringify({ command: externalPrepareCommand(), payload: null })],
      ["a proto-polluting root field", `{"command":${JSON.stringify(externalPrepareCommand())},"payload":${JSON.stringify(externalPreparePayload())},"__proto__":{}}`],
      ["a constructor command field", `{"command":{${JSON.stringify(externalPrepareCommand()).slice(1, -1)},"constructor":"Object"},"payload":${JSON.stringify(externalPreparePayload())}}`],
      ["a prototype payload field", `{"command":${JSON.stringify(externalPrepareCommand())},"payload":{${JSON.stringify(externalPreparePayload()).slice(1, -1)},"prototype":{}}}`],
    ].map(([name, text]) =>
      rejected(`rejects ${name}`, claimedTextFactory(text)),
    ),
    ...[
      ["a null authority record", () => [null]],
      ["an authority record missing its principal", () => [withoutOwn(authorityFor(firstSigner), "principalPublicId")]],
      ["an authority record with an extra field", () => [{ ...authorityFor(firstSigner), unexpected: true }]],
      ["an authority record with a custom prototype", () => [Object.assign(Object.create(null), authorityFor(firstSigner))]],
      ["an accessor-backed authority record", () => {
        const record = authorityFor(firstSigner);
        Object.defineProperty(record, "principalPublicId", {
          enumerable: true,
          configurable: true,
          get() {
            accessorReads += 1;
            return "principal_42";
          },
        });
        return [record];
      }],
    ].map(([name, authorityRecords]) =>
      rejected(
        `rejects ${name}`,
        claimedTextFactory(externalTransport()),
        {
          authorityRecords,
          verify: () => assert.equal(accessorReads, 0),
        },
      ),
    ),
  ];
}

async function assertM30CompatibilityVector(m30, vector) {
  const normalized = await api.normalizeClaimedWalletCommand(
    await vector.claimedBody(m30),
    vector.serverTime,
    () => vector.authorityRecords(),
  );
  const m30Normalized = await m30.normalizeClaimedExternalPrepareCommand(
    await vector.claimedBody(m30),
    vector.serverTime,
    () => vector.authorityRecords(),
  );

  assert.equal(normalized === null, !vector.accepts, vector.name);
  assert.equal(m30Normalized === null, !vector.accepts, `${vector.name} (M30)`);
  assert.deepEqual(normalized, m30Normalized, vector.name);
  vector.verify?.();
}

function assertPlainFrozenDataProperties(record) {
  assert.equal(Object.getPrototypeOf(record), Object.prototype);
  assert.equal(Object.isFrozen(record), true);
  for (const key of Reflect.ownKeys(record)) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    assert.notEqual(descriptor, undefined, String(key));
    assert.equal(Object.hasOwn(descriptor, "value"), true, String(key));
    assert.equal(Object.hasOwn(descriptor, "get"), false, String(key));
    assert.equal(Object.hasOwn(descriptor, "set"), false, String(key));
    assert.equal(descriptor.enumerable, true, String(key));
    assert.equal(descriptor.configurable, false, String(key));
    assert.equal(descriptor.writable, false, String(key));
  }
}

function staticStringValue(node) {
  if (
    typescript.isStringLiteral(node)
    || typescript.isNoSubstitutionTemplateLiteral(node)
  ) {
    return node.text;
  }
  if (
    typescript.isParenthesizedExpression(node)
    || typescript.isAsExpression(node)
    || typescript.isTypeAssertionExpression(node)
  ) {
    return staticStringValue(node.expression);
  }
  if (
    typescript.isBinaryExpression(node)
    && node.operatorToken.kind === typescript.SyntaxKind.PlusToken
  ) {
    const left = staticStringValue(node.left);
    const right = staticStringValue(node.right);
    return left === null || right === null ? null : left + right;
  }
  return null;
}

function staticPropertyName(node) {
  if (typescript.isPropertyAccessExpression(node)) {
    return node.name.text;
  }
  if (typescript.isElementAccessExpression(node) && node.argumentExpression !== undefined) {
    return staticStringValue(node.argumentExpression);
  }
  return null;
}

function hasForbiddenBindingProperty(node) {
  if (!typescript.isBindingElement(node) || node.propertyName === undefined) {
    return false;
  }
  if (typescript.isComputedPropertyName(node.propertyName)) {
    return true;
  }
  const propertyName = typescript.isIdentifier(node.propertyName)
    ? node.propertyName.text
    : staticStringValue(node.propertyName);
  return propertyName === "constructor";
}

function isExactClaimedBodyCall(node, name) {
  return (
    typescript.isCallExpression(node) &&
    typescript.isIdentifier(node.expression) &&
    node.expression.text === name &&
    node.arguments.length === 1 &&
    typescript.isIdentifier(node.arguments[0]) &&
    node.arguments[0].text === "claimedBody"
  );
}

function isExactClaimedBodyGuard(statement) {
  return (
    typescript.isIfStatement(statement) &&
    statement.elseStatement === undefined &&
    typescript.isPrefixUnaryExpression(statement.expression) &&
    statement.expression.operator === typescript.SyntaxKind.ExclamationToken &&
    isExactClaimedBodyCall(
      statement.expression.operand,
      "isClaimedProtectedBody",
    ) &&
    typescript.isReturnStatement(statement.thenStatement) &&
    statement.thenStatement.expression?.kind === typescript.SyntaxKind.NullKeyword
  );
}

function isExactClaimedBodyReaderStatement(statement) {
  if (
    !typescript.isVariableStatement(statement)
    || (statement.declarationList.flags & typescript.NodeFlags.Const) === 0
    || statement.declarationList.declarations.length !== 1
  ) {
    return false;
  }

  const [declaration] = statement.declarationList.declarations;
  return (
    typescript.isIdentifier(declaration.name)
    && declaration.initializer !== undefined
    && isExactClaimedBodyCall(
      declaration.initializer,
      "readClaimedProtectedBody",
    )
  );
}

function bindingNames(name) {
  if (typescript.isIdentifier(name)) {
    return [name.text];
  }
  if (typescript.isObjectBindingPattern(name) || typescript.isArrayBindingPattern(name)) {
    return name.elements.flatMap((element) =>
      typescript.isBindingElement(element) ? bindingNames(element.name) : [],
    );
  }
  return [];
}

function declaresM25Binding(node) {
  const m25Names = new Set([
    "isClaimedProtectedBody",
    "readClaimedProtectedBody",
  ]);
  const hasM25Name = (name) => bindingNames(name).some((value) => m25Names.has(value));

  if (
    (typescript.isVariableDeclaration(node)
      || typescript.isParameter(node)
      || typescript.isBindingElement(node))
    && hasM25Name(node.name)
  ) {
    return true;
  }
  if (
    (typescript.isFunctionDeclaration(node)
      || typescript.isFunctionExpression(node)
      || typescript.isClassDeclaration(node)
      || typescript.isClassExpression(node))
    && node.name !== undefined
    && m25Names.has(node.name.text)
  ) {
    return true;
  }
  if (
    typescript.isCatchClause(node)
    && node.variableDeclaration !== undefined
    && hasM25Name(node.variableDeclaration.name)
  ) {
    return true;
  }
  return false;
}

function isAllowedM25IdentifierReference(node) {
  if (typescript.isImportSpecifier(node.parent)) {
    return true;
  }
  return (
    typescript.isCallExpression(node.parent)
    && node.parent.expression === node
    && isExactClaimedBodyCall(node.parent, node.text)
  );
}

function assertClaimedBodyAndCapabilityBoundary(source) {
  const sourceFile = typescript.createSourceFile(
    "authenticated-wallet-command-normalizer.ts",
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TS,
  );
  assert.deepEqual(sourceFile.parseDiagnostics, []);

  const allowedModuleSpecifiers = new Set([
    "@tool402/core",
    "viem",
    "./authenticated-external-prepare-normalizer.ts",
    "./claimed-protected-body.ts",
  ]);
  const permittedViemRuntimeImports = new Set([
    "keccak256",
    "recoverTypedDataAddress",
    "stringToHex",
  ]);
  const permittedViemTypeImports = new Set(["Address", "Hex"]);
  const viemRuntimeImports = new Set();
  const m25RuntimeImports = [];
  const prohibited = [];
  const callableBindingNames = new Set();
  const collectCallableBindings = (node) => {
    if (
      (typescript.isFunctionDeclaration(node) || typescript.isClassDeclaration(node))
      && node.name !== undefined
    ) {
      callableBindingNames.add(node.name.text);
    }
    if (
      typescript.isVariableDeclaration(node)
      && typescript.isIdentifier(node.name)
      && node.initializer !== undefined
      && (
        typescript.isArrowFunction(node.initializer)
        || typescript.isFunctionExpression(node.initializer)
        || typescript.isClassExpression(node.initializer)
      )
    ) {
      callableBindingNames.add(node.name.text);
    }
    typescript.forEachChild(node, collectCallableBindings);
  };
  typescript.forEachChild(sourceFile, collectCallableBindings);
  let discoveredCallableAlias = true;
  while (discoveredCallableAlias) {
    discoveredCallableAlias = false;
    const collectCallableAliases = (node) => {
      if (
        typescript.isVariableDeclaration(node)
        && typescript.isIdentifier(node.name)
        && typescript.isIdentifier(node.initializer)
        && callableBindingNames.has(node.initializer.text)
        && !callableBindingNames.has(node.name.text)
      ) {
        callableBindingNames.add(node.name.text);
        discoveredCallableAlias = true;
      }
      typescript.forEachChild(node, collectCallableAliases);
    };
    typescript.forEachChild(sourceFile, collectCallableAliases);
  }

  for (const statement of sourceFile.statements) {
    assert.equal(typescript.isImportEqualsDeclaration(statement), false);
    assert.equal(typescript.isExportAssignment(statement), false);
    if (typescript.isExportDeclaration(statement)) {
      assert.equal(statement.moduleSpecifier, undefined);
      continue;
    }
    if (!typescript.isImportDeclaration(statement)) {
      continue;
    }
    assert.equal(typescript.isStringLiteral(statement.moduleSpecifier), true);
    const moduleSpecifier = statement.moduleSpecifier.text;
    assert.equal(allowedModuleSpecifiers.has(moduleSpecifier), true, moduleSpecifier);
    if (moduleSpecifier === "viem") {
      assert.equal(statement.importClause?.name, undefined);
      const namedBindings = statement.importClause?.namedBindings;
      assert.notEqual(namedBindings, undefined);
      assert.equal(
        typescript.isNamedImports(namedBindings),
        true,
      );
      if (!typescript.isNamedImports(namedBindings)) {
        continue;
      }
      for (const imported of namedBindings.elements) {
        const importedName = imported.propertyName?.text ?? imported.name.text;
        const typeOnly = statement.importClause.isTypeOnly || imported.isTypeOnly;
        assert.equal(imported.name.text, importedName);
        assert.equal(
          (typeOnly ? permittedViemTypeImports : permittedViemRuntimeImports).has(
            importedName,
          ),
          true,
          `unexpected viem ${typeOnly ? "type" : "runtime"} import: ${importedName}`,
        );
        if (!typeOnly) {
          viemRuntimeImports.add(importedName);
        }
      }
    }
    if (
      moduleSpecifier === "./claimed-protected-body.ts"
    ) {
      assert.equal(statement.importClause?.name, undefined);
      assert.equal(statement.importClause?.isTypeOnly, false);
      const namedBindings = statement.importClause?.namedBindings;
      assert.notEqual(namedBindings, undefined);
      assert.equal(typescript.isNamedImports(namedBindings), true);
      if (!typescript.isNamedImports(namedBindings)) {
        continue;
      }
      for (const imported of namedBindings.elements) {
        if (!statement.importClause.isTypeOnly && !imported.isTypeOnly) {
          assert.equal(imported.name.text, imported.propertyName?.text ?? imported.name.text);
          m25RuntimeImports.push(imported.name.text);
        }
      }
    }
  }
  assert.deepEqual(
    m25RuntimeImports.sort(),
    ["isClaimedProtectedBody", "readClaimedProtectedBody"],
  );

  const forbiddenIdentifiers = new Set([
    "Bun",
    "createRequire",
    "Deno",
    "Function",
    "JSON",
    "MetaMask",
    "WalletConnect",
    "WebSocket",
    "XMLHttpRequest",
    "document",
    "ethereum",
    "eval",
    "fetch",
    "global",
    "globalThis",
    "indexedDB",
    "localStorage",
    "navigator",
    "performance",
    "process",
    "module",
    "require",
    "sessionStorage",
    "setImmediate",
    "setInterval",
    "setTimeout",
    "String",
    "wagmi",
    "window",
  ]);
  const forbiddenProperties = new Set([
    "connect",
    "createRequire",
    "createPublicClient",
    "createTransport",
    "createWalletClient",
    "custom",
    "env",
    "fetch",
    "getItem",
    "http",
    "init",
    "open",
    "personal_sign",
    "request",
    "module",
    "require",
    "send",
    "sendAsync",
    "setItem",
    "signMessage",
    "signTypedData",
    "webSocket",
  ]);
  const forbiddenViemCalls = new Set([
    "createPublicClient",
    "createTransport",
    "createWalletClient",
    "custom",
    "fallback",
    "http",
    "webSocket",
  ]);
  let claimedPredicateCalls = 0;
  let claimedReaderCalls = 0;
  const claimedPredicateNodes = [];
  const claimedReaderNodes = [];
  const m25BindingNames = new Set([
    "isClaimedProtectedBody",
    "readClaimedProtectedBody",
  ]);
  const intrinsicGlobalNames = new Set([
    "Array",
    "Function",
    "Number",
    "Object",
    "Reflect",
    "String",
  ]);
  const unsafeReflectionReceiverNames = new Set([
    "Array",
    "Bun",
    "claimedBody",
    "Deno",
    "Function",
    "Number",
    "Object",
    "Reflect",
    "String",
    "document",
    "eval",
    "fetch",
    "global",
    "globalThis",
    "module",
    "process",
    "require",
    "resolveCommandAuthorities",
    "serverNow",
    "window",
  ]);

  const directStaticMemberCall = (identifier) => {
    const member = identifier.parent;
    if (
      !typescript.isPropertyAccessExpression(member)
      || member.expression !== identifier
      || !typescript.isCallExpression(member.parent)
      || member.parent.expression !== member
    ) {
      return null;
    }
    return member.parent;
  };
  const isSafeReflectionReceiver = (node) =>
    typescript.isIdentifier(node)
    && !unsafeReflectionReceiverNames.has(node.text)
    && !callableBindingNames.has(node.text);
  const isClosedReflectionField = (node) => {
    const field = staticStringValue(node);
    return field !== null && field !== "constructor";
  };
  const isAllowedIntrinsicReference = (identifier) => {
    const call = directStaticMemberCall(identifier);
    if (call === null) {
      return false;
    }
    const method = call.expression.name.text;
    if (identifier.text === "Object") {
      if (method === "freeze") {
        return call.arguments.length === 1;
      }
      if (
        method === "getPrototypeOf"
        || method === "getOwnPropertyDescriptors"
        || method === "keys"
      ) {
        return (
          call.arguments.length === 1
          && isSafeReflectionReceiver(call.arguments[0])
        );
      }
      if (method === "hasOwn") {
        return (
          call.arguments.length === 2
          && isSafeReflectionReceiver(call.arguments[0])
          && isClosedReflectionField(call.arguments[1])
        );
      }
      return false;
    }
    if (identifier.text === "Reflect") {
      if (method === "ownKeys") {
        return (
          call.arguments.length === 1
          && isSafeReflectionReceiver(call.arguments[0])
        );
      }
      return (
        method === "getOwnPropertyDescriptor"
        && call.arguments.length === 2
        && isSafeReflectionReceiver(call.arguments[0])
        && isClosedReflectionField(call.arguments[1])
      );
    }
    if (identifier.text === "Array") {
      return method === "isArray" && call.arguments.length === 1;
    }
    if (identifier.text === "Number") {
      return method === "isSafeInteger" && call.arguments.length === 1;
    }
    return false;
  };

  const inspectNode = (node) => {
    if (
      (typescript.isCallExpression(node)
        && node.expression.kind === typescript.SyntaxKind.ImportKeyword)
      || (typescript.isMetaProperty(node)
        && node.keywordToken === typescript.SyntaxKind.ImportKeyword)
      || (typescript.isIdentifier(node)
        && intrinsicGlobalNames.has(node.text)
        && !isAllowedIntrinsicReference(node))
      || (typescript.isIdentifier(node) && forbiddenIdentifiers.has(node.text))
    ) {
      prohibited.push(node.getText(sourceFile));
    }
    if (
      typescript.isElementAccessExpression(node)
      || staticPropertyName(node) === "constructor"
      || hasForbiddenBindingProperty(node)
    ) {
      prohibited.push(node.getText(sourceFile));
    }
    if (declaresM25Binding(node)) {
      prohibited.push(node.getText(sourceFile));
    }
    if (
      typescript.isIdentifier(node)
      && m25BindingNames.has(node.text)
      && !isAllowedM25IdentifierReference(node)
    ) {
      prohibited.push(node.getText(sourceFile));
    }
    if (typescript.isCallExpression(node) && typescript.isIdentifier(node.expression)) {
      if (node.expression.text === "isClaimedProtectedBody") {
        if (isExactClaimedBodyCall(node, "isClaimedProtectedBody")) {
          claimedPredicateCalls += 1;
          claimedPredicateNodes.push(node);
        } else {
          prohibited.push(node.getText(sourceFile));
        }
      }
      if (node.expression.text === "readClaimedProtectedBody") {
        if (isExactClaimedBodyCall(node, "readClaimedProtectedBody")) {
          claimedReaderCalls += 1;
          claimedReaderNodes.push(node);
        } else {
          prohibited.push(node.getText(sourceFile));
        }
      }
      if (
        node.expression.text === "require" ||
        forbiddenViemCalls.has(node.expression.text) ||
        (viemRuntimeImports.has(node.expression.text) &&
          !permittedViemRuntimeImports.has(node.expression.text))
      ) {
        prohibited.push(node.getText(sourceFile));
      }
    }
    const propertyName = staticPropertyName(node);
    if (propertyName !== null && forbiddenProperties.has(propertyName)) {
      prohibited.push(node.getText(sourceFile));
    }
    if (
      (typescript.isPropertyAccessExpression(node) ||
        typescript.isElementAccessExpression(node)) &&
      typescript.isIdentifier(node.expression) &&
      node.expression.text === "Date" &&
      staticPropertyName(node) === "now"
    ) {
      prohibited.push(node.getText(sourceFile));
    }
    if (
      typescript.isNewExpression(node) &&
      typescript.isIdentifier(node.expression) &&
      node.expression.text === "Date"
    ) {
      prohibited.push(node.getText(sourceFile));
    }
    typescript.forEachChild(node, inspectNode);
  };
  typescript.forEachChild(sourceFile, inspectNode);

  assert.deepEqual(prohibited, []);
  assert.equal(claimedPredicateCalls, 1);
  assert.equal(claimedReaderCalls, 1);

  const normalizers = sourceFile.statements.filter(
    (statement) =>
      typescript.isFunctionDeclaration(statement)
      && statement.name?.text === "normalizeClaimedWalletCommand"
      && statement.body !== undefined,
  );
  assert.equal(normalizers.length, 1);
  const [normalizer] = normalizers;
  assert.notEqual(normalizer, undefined);
  const expectedParameterNames = [
    "claimedBody",
    "serverNow",
    "resolveCommandAuthorities",
  ];
  assert.equal(normalizer.parameters.length, expectedParameterNames.length);
  for (const [index, expectedName] of expectedParameterNames.entries()) {
    const parameter = normalizer.parameters[index];
    assert.notEqual(parameter, undefined);
    assert.equal(typescript.isIdentifier(parameter.name), true);
    assert.equal(parameter.name.text, expectedName);
    assert.equal(parameter.dotDotDotToken, undefined);
    assert.equal(parameter.initializer, undefined);
  }
  const claimedGuardIndex = normalizer.body.statements.findIndex(isExactClaimedBodyGuard);
  assert.equal(claimedGuardIndex, 0);
  const claimedGuard = normalizer.body.statements[claimedGuardIndex];
  const readerStatement = normalizer.body.statements[claimedGuardIndex + 1];
  assert.equal(isExactClaimedBodyReaderStatement(readerStatement), true);
  const [readerDeclaration] = readerStatement.declarationList.declarations;
  const readerCall = readerDeclaration.initializer;
  assert.strictEqual(claimedPredicateNodes[0], claimedGuard.expression.operand);
  assert.strictEqual(claimedReaderNodes[0], readerCall);
  assert.strictEqual(readerCall.parent, readerDeclaration);
  assert.strictEqual(readerDeclaration.parent.parent, readerStatement);
}

function minimalM25BoundarySource(statements) {
  return `
import {
  isClaimedProtectedBody,
  readClaimedProtectedBody,
} from "./claimed-protected-body.ts";

export async function normalizeClaimedWalletCommand(
  claimedBody: unknown,
  serverNow: string,
  resolveCommandAuthorities: unknown,
) {
${statements}
}
`;
}

test("rejects helper, shadow, and static module capability escapes from the M25 boundary", () => {
  const directBoundary = minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const authorityRecord = {
    principalPublicId: "principal_42",
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
  };
  const prototype = Object.getPrototypeOf(authorityRecord);
  const keys = Object.keys(authorityRecord);
  const hasPrincipalPublicId = Object.hasOwn(authorityRecord, "principalPublicId");
  const principalPublicIdDescriptor = Reflect.getOwnPropertyDescriptor(
    authorityRecord,
    "principalPublicId",
  );
  const ownKeys = Reflect.ownKeys(authorityRecord);
  const descriptors = Object.getOwnPropertyDescriptors(authorityRecord);
  const keysAreAnArray = Array.isArray(keys);
  const oneIsSafe = Number.isSafeInteger(1);
  const dataOnlySnapshot = Object.freeze({
    constructor: "pure-data",
    byteLength: bodyBytes.byteLength,
  });
  void bodyBytes;
  void prototype;
  void hasPrincipalPublicId;
  void principalPublicIdDescriptor;
  void ownKeys;
  void descriptors;
  void keysAreAnArray;
  void oneIsSafe;
  void dataOnlySnapshot;
  return null;`);
  assert.doesNotThrow(() => assertClaimedBodyAndCapabilityBoundary(directBoundary));

  const rejectedBoundaries = [
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const readClaimedProtectedBody = () => new Uint8Array();
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  void bodyBytes;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const reader = readClaimedProtectedBody;
  const bodyBytes = reader(claimedBody);
  void bodyBytes;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = global.module.createRequire("node:module")("node:fs");
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = global["module"]["create" + "Require"]("node:module")("node:fs");
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = module.createRequire("node:module")("node:fs");
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = Object.constructor.constructor("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = ({}).constructor.constructor("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = ({}).toString.constructor("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = [].filter.constructor("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = Object.getPrototypeOf(() => {}).constructor("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const localArrow = () => null;
  const alias = localArrow;
  const prototype = Object.getPrototypeOf(alias);
  void bodyBytes;
  void prototype;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  class LocalClass {}
  const prototype = Object.getPrototypeOf(LocalClass);
  void bodyBytes;
  void prototype;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = Reflect.getPrototypeOf([].filter).constructor("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = Reflect.get(Object, "constructor")("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const executable = Object["constructor"]("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const objectAlias = Object;
  const prototype = objectAlias.getPrototypeOf(bodyBytes);
  void bodyBytes;
  void prototype;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const reflectAlias = Reflect;
  const descriptor = reflectAlias.getOwnPropertyDescriptor(bodyBytes, "constructor");
  void bodyBytes;
  void descriptor;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const descriptor = Object.getOwnPropertyDescriptor(bodyBytes, "principalPublicId");
  void bodyBytes;
  void descriptor;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const prototype = Object.getPrototypeOf(Object);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  const FunctionFactory = descriptor.value;
  const executable = FunctionFactory("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const { constructor: FunctionFactory } = Object;
  const executable = FunctionFactory("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const key = ["con", "structor"].join("");
  const FunctionFactory = Object[key];
  const executable = FunctionFactory("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const key = String.fromCharCode(99, 111, 110, 115, 116, 114, 117, 99, 116, 111, 114);
  const FunctionFactory = Object[key];
  const executable = FunctionFactory("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const record = { safe: "value" };
  const field = ["con", "structor"].join("");
  const descriptor = Reflect.getOwnPropertyDescriptor(record, field);
  const FunctionFactory = descriptor.value;
  const executable = FunctionFactory("return globalThis.fetch")();
  void bodyBytes;
  void executable;
  return null;`),
    minimalM25BoundarySource(`
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  const field = "safe";
  const localArrow = () => null;
  const alias = localArrow;
  const prototype = Object.getPrototypeOf(alias);
  function execute(field: string) {
    const descriptor = Reflect.getOwnPropertyDescriptor(prototype, field);
    const FunctionFactory = descriptor.value;
    return FunctionFactory("return 7")();
  }
  const executable = execute("constructor");
  void bodyBytes;
  void executable;
  return null;`),
    `
import m25Escape, {
  isClaimedProtectedBody,
  readClaimedProtectedBody,
} from "./claimed-protected-body.ts";

const readerKey = "readClaimedProtectedBody";

export async function normalizeClaimedWalletCommand(
  claimedBody: unknown,
  serverNow = m25Escape[readerKey](claimedBody),
  resolveCommandAuthorities: unknown,
) {
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = readClaimedProtectedBody(claimedBody);
  void bodyBytes;
  void serverNow;
  void resolveCommandAuthorities;
  return null;
}
`,
    `
import * as m25Escape from "./claimed-protected-body.ts";

const readerKey = "readClaimedProtectedBody";

export async function normalizeClaimedWalletCommand(
  claimedBody: unknown,
  serverNow = m25Escape[readerKey](claimedBody),
  resolveCommandAuthorities: unknown,
) {
  if (!m25Escape.isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = m25Escape[readerKey](claimedBody);
  void bodyBytes;
  void serverNow;
  void resolveCommandAuthorities;
  return null;
}
`,
    `
import {
  isClaimedProtectedBody,
  readClaimedProtectedBody,
} from "./claimed-protected-body.ts";

function snapshot(body: unknown) {
  return readClaimedProtectedBody(body);
}

export async function normalizeClaimedWalletCommand(claimedBody: unknown) {
  if (!isClaimedProtectedBody(claimedBody)) return null;
  const bodyBytes = snapshot(claimedBody);
  void bodyBytes;
  return null;
}
`,
  ];

  for (const source of rejectedBoundaries) {
    assert.throws(() => assertClaimedBodyAndCapabilityBoundary(source));
  }
});

test("requires the declared wallet-command normalizer source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("preserves M30 external.prepare normalization byte-for-byte", async () => {
  const m30 = await import(m30SourceUrl.href);
  const claimed = await claimText(
    transportText(externalPrepareCommand(), externalPreparePayload()),
  );
  const normalized = await api.normalizeClaimedWalletCommand(
    claimed,
    serverNow,
    () => [authorityFor(firstSigner)],
  );
  const m30Normalized = await m30.normalizeClaimedExternalPrepareCommand(
    claimed,
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
  assert.deepEqual(Reflect.ownKeys(normalized), [
    "version",
    "type",
    "chainId",
    "canonicalSignerAddress",
    "nonce",
    "issuedAt",
    "expiresAt",
    "payloadHash",
    "replayIdentity",
    "principalPublicId",
    "role",
    "authorityVersion",
    "payload",
  ]);
  assert.deepEqual(Reflect.ownKeys(normalized.payload), [
    "operationKind",
    "subjectPublicId",
    "network",
    "chainId",
    "expectedTarget",
    "canonicalParametersHash",
    "idempotencyKey",
    "expiresAt",
  ]);
  assert.deepEqual(normalized, m30Normalized);
  assert.notEqual(normalized, null);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.payload), true);
  assertPlainFrozenDataProperties(normalized);
  assertPlainFrozenDataProperties(normalized.payload);
  assert.throws(() => {
    normalized.principalPublicId = "mutated";
  }, TypeError);
  assert.throws(() => {
    normalized.payload.subjectPublicId = "mutated";
  }, TypeError);

  const second = await api.normalizeClaimedWalletCommand(
    claimed,
    serverNow,
    () => [authorityFor(firstSigner)],
  );
  assert.notEqual(second, null);
  assert.notStrictEqual(normalized, second);
  assert.notStrictEqual(normalized.payload, second.payload);

  const rejectedClaim = await claimText(
    transportText(
      externalPrepareCommand({ payloadHash: `0x${"0".repeat(64)}` }),
      externalPreparePayload(),
    ),
  );
  assert.equal(
    await api.normalizeClaimedWalletCommand(
      rejectedClaim,
      serverNow,
      () => [authorityFor(firstSigner)],
    ),
    await m30.normalizeClaimedExternalPrepareCommand(
      rejectedClaim,
      serverNow,
      () => [authorityFor(firstSigner)],
    ),
  );
});

implementedTest("matches every M30 external.prepare acceptance and rejection vector", async () => {
  const m30 = await import(m30SourceUrl.href);
  for (const vector of m30CompatibilityVectors()) {
    await assertM30CompatibilityVector(m30, vector);
  }
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
    assertPlainFrozenDataProperties(normalized);
    assertPlainFrozenDataProperties(normalized.payload);
    if (type !== "offering.create") {
      assertPlainFrozenDataProperties(normalized.deferredSubjectOwnership);
    }
    assert.equal(Object.hasOwn(normalized, "signature"), false);
    assert.equal(Object.hasOwn(normalized, "rawBody"), false);
    assert.deepEqual(
      [...Reflect.ownKeys(normalized)].sort(),
      [
        "authorityVersion",
        "canonicalSignerAddress",
        "chainId",
        "expiresAt",
        "nonce",
        "payload",
        "payloadHash",
        "principalPublicId",
        "replayIdentity",
        "role",
        "type",
        "version",
        ...(type === "offering.create" ? [] : ["deferredSubjectOwnership"]),
      ].sort(),
    );
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
  assertPlainFrozenDataProperties(directory);
  assertPlainFrozenDataProperties(directory.deferredSubjectOwnership);
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
  assertPlainFrozenDataProperties(candidate);
  assertPlainFrozenDataProperties(candidate.deferredSubjectOwnership);
  assert.deepEqual(candidate.deferredSubjectOwnership, {
    kind: "ATTEMPT",
    attemptPublicId: "DDDDDDDDDDDDDDDDDDDDDw",
  });
});

implementedTest("fails closed before authority resolution for payload expiry, digest drift, and cross-type signatures", async () => {
  const payload = offeringCreatePayload();
  const command = await signedCommand("offering.create", payload, "KKKKKKKKKKKKKKKKKKKKKw");
  await assertRejectedBeforeResolver(
    command,
    offeringCreatePayload({ expiresAt: "2026-09-07T19:03:59.999Z" }),
  );

  const directoryPayload = directoryPublishPayload();
  const signedAsOffering = await signedCommand(
    "directory.publish",
    directoryPayload,
    "LLLLLLLLLLLLLLLLLLLLLQ",
    signingAddress,
    "offering.create",
  );
  await assertRejectedBeforeResolver(
    { ...signedAsOffering, type: "directory.publish" },
    directoryPayload,
  );
});

implementedTest("rejects every non-claimed or noncanonical M25 transport before dispatch", async () => {
  const payload = offeringCreatePayload();
  const command = await signedCommand("offering.create", payload, "MMMMMMMMMMMMMMMMMMMMMw");
  for (const nonClaimed of [
    new TextEncoder().encode(transportText(command, payload)),
    transportText(command, payload),
    { replayIdentity: "forged" },
    Object.freeze({ replayIdentity: "still-forged" }),
    new Proxy({}, {}),
  ]) {
    let resolverCalls = 0;
    assert.equal(
      await api.normalizeClaimedWalletCommand(
        nonClaimed,
        serverNow,
        () => {
          resolverCalls += 1;
          return [authorityFor(signingAddress)];
        },
      ),
      null,
    );
    assert.equal(resolverCalls, 0);
  }

  const commandJson = JSON.stringify(command);
  const payloadJson = JSON.stringify(payload);
  const malformed = [
    `{"command":${commandJson},"command":${commandJson},"payload":${payloadJson}}`,
    transportText(command, payload).replace("offering.create", "offering\\u002ecreate"),
    `{"command":${commandJson},"payload":{"items":[1]}}`,
    `{"command":${commandJson},"payload":{"one":{"two":{"three":{}}}}}`,
    `{"command":${commandJson},"payload":{"padding":"${"x".repeat(16_385)}"}}`,
  ];
  for (const text of malformed) {
    let calls = 0;
    assert.equal(
      await api.normalizeClaimedWalletCommand(
        await claimText(text),
        serverNow,
        () => {
          calls += 1;
          return [authorityFor(signingAddress)];
        },
      ),
      null,
    );
    assert.equal(calls, 0);
  }
});

implementedTest("rejects malformed signatures and recovered-signer mismatches before authority resolution", async () => {
  const payload = offeringCreatePayload();
  const command = await signedCommand("offering.create", payload, "NNNNNNNNNNNNNNNNNNNNNg");
  await assertRejectedBeforeResolver(
    { ...command, signature: command.signature.slice(0, -2) },
    payload,
  );
  const signedForAnotherWireSigner = await signedCommand(
    "offering.create",
    payload,
    "OOOOOOOOOOOOOOOOOOOOOw",
    firstSigner,
  );
  await assertRejectedBeforeResolver(signedForAnotherWireSigner, payload);
});

implementedTest("enforces every command-specific authority predicate and generic authority rejection", async () => {
  const offeringPayload = offeringCreatePayload();
  const offeringCommand = await signedCommand(
    "offering.create",
    offeringPayload,
    "PPPPPPPPPPPPPPPPPPPPPQ",
  );
  const directoryPayload = directoryPublishPayload();
  const directoryCommand = await signedCommand(
    "directory.publish",
    directoryPayload,
    "QQQQQQQQQQQQQQQQQQQQQQ",
  );
  const candidatePayload = attachCandidatePayload();
  const candidateCommand = await signedCommand(
    "external.attachCandidate",
    candidatePayload,
    "RRRRRRRRRRRRRRRRRRRRRw",
  );
  const atsCases = await Promise.all(
    [
      ["ATS_CREATE", "SSSSSSSSSSSSSSSSSSSSSQ"],
      ["ATS_CONTROL_LIST", "TTTTTTTTTTTTTTTTTTTTTQ"],
      ["ATS_ISSUE", "UUUUUUUUUUUUUUUUUUUUUg"],
      ["ATS_TRANSFER", "VVVVVVVVVVVVVVVVVVVVVw"],
      ["ATS_COUPON", "WWWWWWWWWWWWWWWWWWWWWQ"],
    ].map(async ([operationKind, nonce]) => {
      const payload = externalPreparePayload({ operationKind });
      return {
        name: `${operationKind} requires an owning issuer`,
        command: await signedExternalPrepareCommand(payload, nonce),
        payload,
        allowedRecords: [authorityFor(signingAddress, "ISSUER", ["subject_42"])],
        rejectedRecords: [
          [authorityFor(signingAddress, "BACKER", ["subject_42"])],
          [authorityFor(signingAddress, "ISSUER", [])],
          [authorityFor(signingAddress, "ISSUER", ["other_subject"])],
        ],
      };
    }),
  );
  const cases = [
    ...atsCases,
    {
      name: "HEDERA_FUNDING requires a backer",
      command: fundingCommand(),
      payload: fundingPayload(),
      allowedRecords: [authorityFor(fundingSigner, "BACKER", [])],
      rejectedRecords: [[authorityFor(fundingSigner, "ISSUER", ["subject_42"])]],
    },
    {
      name: "offering.create requires an owning issuer",
      command: offeringCommand,
      payload: offeringPayload,
      allowedRecords: [authorityFor(signingAddress, "ISSUER", ["subject_42"])],
      rejectedRecords: [
        [authorityFor(signingAddress, "BACKER", [])],
        [authorityFor(signingAddress, "ISSUER", [])],
      ],
    },
    {
      name: "directory.publish requires an issuer and defers ownership",
      command: directoryCommand,
      payload: directoryPayload,
      allowedRecords: [authorityFor(signingAddress, "ISSUER", [])],
      rejectedRecords: [[authorityFor(signingAddress, "BACKER", [])]],
    },
    {
      name: "external.attachCandidate requires an issuer and defers ownership",
      command: candidateCommand,
      payload: candidatePayload,
      allowedRecords: [authorityFor(signingAddress, "ISSUER", [])],
      rejectedRecords: [[authorityFor(signingAddress, "BACKER", [])]],
    },
  ];

  for (const authorityCase of cases) {
    const accepted = await api.normalizeClaimedWalletCommand(
      await claimText(transportText(authorityCase.command, authorityCase.payload)),
      serverNow,
      () => cloneAuthorityRecords(authorityCase.allowedRecords),
    );
    assert.notEqual(accepted, null, authorityCase.name);

    for (const records of authorityCase.rejectedRecords) {
      await assertRejectedAfterResolver(
        authorityCase.command,
        authorityCase.payload,
        cloneAuthorityRecords(records),
      );
    }

    for (const records of [
      [],
      [...authorityCase.allowedRecords, ...authorityCase.allowedRecords],
      [{ ...authorityCase.allowedRecords[0], enabled: false }],
      [{ ...authorityCase.allowedRecords[0], role: "ADMIN" }],
      [authorityFor("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")],
    ]) {
      await assertRejectedAfterResolver(
        authorityCase.command,
        authorityCase.payload,
        cloneAuthorityRecords(records),
      );
    }
  }
});

implementedTest("enforces inherited M30 time boundaries for the test predicate and signed offering.create", async () => {
  const cases = [
    {
      name: "accepts the inclusive 300-second lifetime boundary",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-09-07T19:05:00.000Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: true,
    },
    {
      name: "rejects an expiry before issue",
      timestamps: [
        "2026-09-07T19:05:00.000Z",
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:04:00.000Z",
      ],
      accepted: false,
    },
    {
      name: "rejects an expiry equal to issue",
      timestamps: [
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:04:00.000Z",
      ],
      accepted: false,
    },
    {
      name: "rejects a 300-second-and-one-millisecond lifetime",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-09-07T19:05:00.001Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: false,
    },
    {
      name: "rejects an impossible issue timestamp",
      timestamps: [
        "2026-02-29T19:00:00.000Z",
        "2026-09-07T19:05:00.000Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: false,
    },
    {
      name: "rejects an impossible expiry timestamp",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-02-29T19:05:00.000Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: false,
    },
    {
      name: "rejects an impossible server timestamp",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-09-07T19:05:00.000Z",
        "2026-02-29T19:00:00.000Z",
      ],
      accepted: false,
    },
  ];

  for (const timeCase of cases) {
    assert.equal(
      api.isWalletCommandTimeWindowValidForTest(...timeCase.timestamps),
      timeCase.accepted,
      timeCase.name,
    );
  }

  const signedOfferingCases = [
    {
      name: "accepts signed offering.create at inclusive expiry and 300-second lifetime",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-09-07T19:05:00.000Z",
        "2026-09-07T19:05:00.000Z",
      ],
      accepted: true,
      nonce: "YYYYYYYYYYYYYYYYYYYYYQ",
    },
    {
      name: "rejects signed offering.create one millisecond after expiry",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:04:00.001Z",
      ],
      accepted: false,
      nonce: "ZZZZZZZZZZZZZZZZZZZZZg",
    },
    {
      name: "rejects signed offering.create beyond the 300-second lifetime",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-09-07T19:05:00.001Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: false,
      nonce: "aaaaaaaaaaaaaaaaaaaaaw",
    },
    {
      name: "rejects signed offering.create with an expiry before issue",
      timestamps: [
        "2026-09-07T19:05:00.000Z",
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:04:00.000Z",
      ],
      accepted: false,
      nonce: "dddddddddddddddddddddw",
    },
    {
      name: "rejects signed offering.create with expiry equal to issue",
      timestamps: [
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:04:00.000Z",
      ],
      accepted: false,
      nonce: "eeeeeeeeeeeeeeeeeeeeew",
    },
    {
      name: "accepts signed offering.create at the 60-second future-skew boundary",
      timestamps: [
        "2026-09-07T19:01:00.000Z",
        "2026-09-07T19:05:00.000Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: true,
      nonce: "bbbbbbbbbbbbbbbbbbbbbQ",
    },
    {
      name: "rejects signed offering.create one millisecond beyond future skew",
      timestamps: [
        "2026-09-07T19:01:00.001Z",
        "2026-09-07T19:05:00.000Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: false,
      nonce: "cccccccccccccccccccccg",
    },
    {
      name: "rejects signed offering.create with an impossible issuedAt before authority resolution",
      timestamps: [
        "2026-02-29T19:00:00.000Z",
        "2026-09-07T19:04:00.000Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: false,
      resolverCalls: 0,
      nonce: "fffffffffffffffffffffw",
    },
    {
      name: "rejects signed offering.create with an impossible payload expiry before authority resolution",
      timestamps: [
        "2026-09-07T19:00:00.000Z",
        "2026-02-29T19:04:00.000Z",
        "2026-09-07T19:00:00.000Z",
      ],
      accepted: false,
      resolverCalls: 0,
      payloadHashOverride: `0x${"0".repeat(64)}`,
      nonce: "gggggggggggggggggggggw",
    },
  ];

  for (const timeCase of signedOfferingCases) {
    const [issuedAt, expiresAt, timeServerNow] = timeCase.timestamps;
    const payload = offeringCreatePayload({ expiresAt });
    const command = await signedCommand(
      "offering.create",
      payload,
      timeCase.nonce,
      signingAddress,
      "offering.create",
      {
        issuedAt,
        expiresAt,
        payloadHashOverride: timeCase.payloadHashOverride,
      },
    );
    let resolverCalls = 0;
    const normalized = await api.normalizeClaimedWalletCommand(
      await claimText(transportText(command, payload)),
      timeServerNow,
      () => {
        resolverCalls += 1;
        return [authorityFor(signingAddress)];
      },
    );

    assert.equal(normalized === null, !timeCase.accepted, timeCase.name);
    assert.equal(resolverCalls, timeCase.resolverCalls ?? 1, timeCase.name);
    if (timeCase.accepted) {
      assert.notEqual(normalized, null, timeCase.name);
      assert.equal(normalized.issuedAt, issuedAt, timeCase.name);
      assert.equal(normalized.expiresAt, expiresAt, timeCase.name);
      assert.equal(normalized.payload.expiresAt, expiresAt, timeCase.name);
    }
  }
});

implementedTest("keeps the normalizer private and free of external capability", () => {
  const source = readFileSync(sourcePath, "utf8");
  const backendEntry = readFileSync(
    fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    "utf8",
  );
  assert.deepEqual(Object.keys(api).sort(), [
    "isWalletCommandTimeWindowValidForTest",
    "normalizeClaimedWalletCommand",
  ]);
  assertClaimedBodyAndCapabilityBoundary(source);
  assert.doesNotMatch(backendEntry, /authenticated-wallet-command-normalizer/u);
});
