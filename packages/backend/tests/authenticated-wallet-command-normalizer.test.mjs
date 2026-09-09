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
) {
  const payloadHash = keccak256(
    stringToHex(new TextDecoder().decode(canonicalPayloadBytes(type, payload))),
  );
  const message = {
    version: 1,
    type: signedType,
    signer: wireSigner,
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

function staticPropertyName(node) {
  if (typescript.isPropertyAccessExpression(node)) {
    return node.name.text;
  }
  if (
    typescript.isElementAccessExpression(node)
    && node.argumentExpression !== undefined
    && (
      typescript.isStringLiteral(node.argumentExpression)
      || typescript.isNoSubstitutionTemplateLiteral(node.argumentExpression)
    )
  ) {
    return node.argumentExpression.text;
  }
  return null;
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
  const m25RuntimeImports = new Set();
  const prohibited = [];

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
    if (
      moduleSpecifier === "./claimed-protected-body.ts"
      && statement.importClause?.namedBindings !== undefined
      && typescript.isNamedImports(statement.importClause.namedBindings)
    ) {
      for (const imported of statement.importClause.namedBindings.elements) {
        if (!statement.importClause.isTypeOnly && !imported.isTypeOnly) {
          assert.equal(imported.name.text, imported.propertyName?.text ?? imported.name.text);
          m25RuntimeImports.add(imported.name.text);
        }
      }
    }
  }
  assert.deepEqual(
    [...m25RuntimeImports].sort(),
    ["isClaimedProtectedBody", "readClaimedProtectedBody"],
  );

  const forbiddenIdentifiers = new Set([
    "Bun",
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
    "globalThis",
    "indexedDB",
    "localStorage",
    "navigator",
    "performance",
    "process",
    "sessionStorage",
    "setImmediate",
    "setInterval",
    "setTimeout",
    "wagmi",
    "window",
  ]);
  const forbiddenProperties = new Set([
    "connect",
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
    "send",
    "sendAsync",
    "setItem",
    "signMessage",
    "signTypedData",
    "webSocket",
  ]);
  let claimedPredicateCalls = 0;
  let claimedReaderCalls = 0;

  const inspectNode = (node) => {
    if (
      (typescript.isCallExpression(node)
        && node.expression.kind === typescript.SyntaxKind.ImportKeyword)
      || (typescript.isMetaProperty(node)
        && node.keywordToken === typescript.SyntaxKind.ImportKeyword)
      || (typescript.isIdentifier(node) && forbiddenIdentifiers.has(node.text))
    ) {
      prohibited.push(node.getText(sourceFile));
    }
    if (typescript.isCallExpression(node) && typescript.isIdentifier(node.expression)) {
      if (node.expression.text === "isClaimedProtectedBody") {
        claimedPredicateCalls += 1;
      }
      if (node.expression.text === "readClaimedProtectedBody") {
        claimedReaderCalls += 1;
      }
      if (node.expression.text === "require") {
        prohibited.push(node.getText(sourceFile));
      }
    }
    const propertyName = staticPropertyName(node);
    if (propertyName !== null && forbiddenProperties.has(propertyName)) {
      prohibited.push(node.getText(sourceFile));
    }
    if (
      typescript.isPropertyAccessExpression(node)
      && typescript.isIdentifier(node.expression)
      && node.expression.text === "Date"
      && node.name.text === "now"
    ) {
      prohibited.push(node.getText(sourceFile));
    }
    typescript.forEachChild(node, inspectNode);
  };
  typescript.forEachChild(sourceFile, inspectNode);

  assert.deepEqual(prohibited, []);
  assert.equal(claimedPredicateCalls > 0, true);
  assert.equal(claimedReaderCalls > 0, true);
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
  assert.deepEqual(normalized, m30Normalized);
  assert.notEqual(normalized, null);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.payload), true);
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

implementedTest("matches the complete shared M30 external.prepare vector set", async () => {
  const m30 = await import(m30SourceUrl.href);
  const vectors = [
    {
      name: "accepts ATS_CREATE for its owning issuer",
      accepted: true,
      command: externalPrepareCommand(),
      payload: externalPreparePayload(),
      authorityRecords: [authorityFor(firstSigner)],
    },
    {
      name: "accepts HEDERA_FUNDING for a backer",
      accepted: true,
      command: fundingCommand(),
      payload: fundingPayload(),
      authorityRecords: [authorityFor(fundingSigner, "BACKER", [])],
    },
    {
      name: "accepts recovery suffix 01",
      accepted: true,
      command: externalPrepareCommand({ signature: `${firstSignature.slice(0, -2)}01` }),
      payload: externalPreparePayload(),
      authorityRecords: [authorityFor(firstSigner)],
    },
    {
      name: "accepts recovery suffix 00",
      accepted: true,
      command: recoveryZeroCommand({ signature: `${recoveryZeroSignature.slice(0, -2)}00` }),
      payload: recoveryZeroPayload(),
      authorityRecords: [authorityFor(recoveryZeroSigner)],
    },
    {
      name: "rejects payload-hash drift",
      accepted: false,
      command: externalPrepareCommand({ payloadHash: `0x${"0".repeat(64)}` }),
      payload: externalPreparePayload(),
      authorityRecords: [authorityFor(firstSigner)],
    },
    {
      name: "rejects a recovered signer mismatch",
      accepted: false,
      command: externalPrepareCommand({ signer: signingAddress }),
      payload: externalPreparePayload(),
      authorityRecords: [authorityFor(signingAddress)],
    },
    {
      name: "rejects a truncated signature",
      accepted: false,
      command: externalPrepareCommand({ signature: firstSignature.slice(0, -2) }),
      payload: externalPreparePayload(),
      authorityRecords: [authorityFor(firstSigner)],
    },
    {
      name: "rejects an unsupported command type",
      accepted: false,
      command: externalPrepareCommand({ type: "external.submit" }),
      payload: externalPreparePayload(),
      authorityRecords: [authorityFor(firstSigner)],
    },
    {
      name: "rejects command-to-payload expiry drift",
      accepted: false,
      command: externalPrepareCommand(),
      payload: externalPreparePayload({ expiresAt: "2026-09-07T19:03:59.999Z" }),
      authorityRecords: [authorityFor(firstSigner)],
    },
    {
      name: "rejects ATS_CREATE for a backer",
      accepted: false,
      command: externalPrepareCommand(),
      payload: externalPreparePayload(),
      authorityRecords: [authorityFor(firstSigner, "BACKER", [])],
    },
    {
      name: "rejects HEDERA_FUNDING for an issuer",
      accepted: false,
      command: fundingCommand(),
      payload: fundingPayload(),
      authorityRecords: [authorityFor(fundingSigner, "ISSUER")],
    },
  ];

  for (const vector of vectors) {
    const claimed = await claimText(transportText(vector.command, vector.payload));
    const normalized = await api.normalizeClaimedWalletCommand(
      claimed,
      serverNow,
      () => cloneAuthorityRecords(vector.authorityRecords),
    );
    const m30Normalized = await m30.normalizeClaimedExternalPrepareCommand(
      claimed,
      serverNow,
      () => cloneAuthorityRecords(vector.authorityRecords),
    );
    assert.equal(normalized === null, !vector.accepted, vector.name);
    assert.equal(m30Normalized === null, !vector.accepted, `${vector.name} (M30)`);
    assert.deepEqual(normalized, m30Normalized, vector.name);
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
  assert.deepEqual(directory.deferredSubjectOwnership, {
    kind: "OFFERING",
    offeringPublicId: "offering_42",
    offeringVersion: 1,
  });
  assert.equal(Object.isFrozen(directory.deferredSubjectOwnership), true);

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
  assert.equal(Object.isFrozen(candidate.deferredSubjectOwnership), true);
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
  const cases = [
    {
      name: "ATS_CREATE requires an owning issuer",
      command: externalPrepareCommand(),
      payload: externalPreparePayload(),
      allowedRecords: [authorityFor(firstSigner, "ISSUER", ["subject_42"])],
      rejectedRecords: [
        [authorityFor(firstSigner, "BACKER", [])],
        [authorityFor(firstSigner, "ISSUER", [])],
      ],
    },
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
  assert.deepEqual(Object.keys(api).sort(), [
    "isWalletCommandTimeWindowValidForTest",
    "normalizeClaimedWalletCommand",
  ]);
  assertClaimedBodyAndCapabilityBoundary(source);
  assert.doesNotMatch(backendEntry, /authenticated-wallet-command-normalizer/u);
});
