import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const normalizerModuleUrl = new URL(
  "../src/ingress/authenticated-external-prepare-normalizer.ts",
  import.meta.url,
);
const fixedTestKeyBytes = Uint8Array.from({ length: 32 }, (_, index) => index);
const ingressTimestamp = 1_735_689_600n;
const serverNow = "2026-09-07T19:00:30.000Z";
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

function firstPayload(overrides = {}) {
  return {
    operationKind: "ATS_CREATE",
    subjectPublicId: "subject_42",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    canonicalParametersHash:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
    expiresAt: "2026-09-07T19:04:00.000Z",
    ...overrides,
  };
}

function firstCommand(overrides = {}) {
  return {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    signer: firstSigner,
    nonce: "AAAAAAAAAAAAAAAAAAAAAA",
    issuedAt: "2026-09-07T19:00:00.000Z",
    expiresAt: "2026-09-07T19:04:00.000Z",
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
    expiresAt: "2026-09-07T19:04:00.000Z",
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
    issuedAt: "2026-09-07T19:00:00.000Z",
    expiresAt: "2026-09-07T19:04:00.000Z",
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
    expiresAt: "2026-09-07T19:04:00.000Z",
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
    issuedAt: "2026-09-07T19:00:00.000Z",
    expiresAt: "2026-09-07T19:04:00.000Z",
    payloadHash: recoveryZeroPayloadHash,
    signature: recoveryZeroSignature,
    ...overrides,
  };
}

function transportText(command = firstCommand(), payload = firstPayload()) {
  return JSON.stringify({ command, payload });
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

async function claimRawBody(rawBody) {
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
    "POST\n/internal/commands\n" +
    ingressTimestamp +
    "\nAbCdEfGhIjKlMnOpQrStUw\n" +
    bodySha256;
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

async function claimText(text) {
  return claimRawBody(new TextEncoder().encode(text));
}

function authorityFor(
  signer = firstSigner,
  role = "ISSUER",
  ownedSubjectPublicIds = ["subject_42"],
  overrides = {},
) {
  return {
    principalPublicId: "principal_42",
    canonicalSignerAddress: signer,
    chainId: 296,
    role,
    ownedSubjectPublicIds,
    authorityVersion: "authority-v1",
    enabled: true,
    ...overrides,
  };
}

async function loadNormalizer() {
  return import(normalizerModuleUrl.href);
}

async function assertRejectedBeforeResolver(
  normalizeClaimedExternalPrepareCommand,
  claimedBody,
) {
  let resolverCalls = 0;
  const normalized = await normalizeClaimedExternalPrepareCommand(
    claimedBody,
    serverNow,
    () => {
      resolverCalls += 1;
      return [authorityFor()];
    },
  );

  assert.equal(normalized, null);
  assert.equal(resolverCalls, 0);
}

test("normalizes only a canonical M25-claimed external.prepare command", async () => {
  const { normalizeClaimedExternalPrepareCommand } = await loadNormalizer();
  const calls = [];
  const resolver = async (chainId, signer) => {
    calls.push([chainId, signer]);
    return [authorityFor()];
  };
  const originalPayload = firstPayload();
  const normalized = await normalizeClaimedExternalPrepareCommand(
    await claimText(transportText()),
    serverNow,
    resolver,
  );

  assert.deepEqual(normalized, {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    canonicalSignerAddress: firstSigner,
    nonce: "AAAAAAAAAAAAAAAAAAAAAA",
    issuedAt: "2026-09-07T19:00:00.000Z",
    expiresAt: "2026-09-07T19:04:00.000Z",
    payloadHash: firstPayloadHash,
    replayIdentity:
      "tool402:wallet-command:v1:296:0xbfb8ea59964b307a79d4f0b98201db95e6dfa454:AAAAAAAAAAAAAAAAAAAAAA",
    principalPublicId: "principal_42",
    role: "ISSUER",
    authorityVersion: "authority-v1",
    payload: originalPayload,
  });
  assert.deepEqual(calls, [[296, firstSigner]]);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.payload), true);
  assert.deepEqual(
    Reflect.ownKeys(normalized),
    [
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
    ],
  );
  assert.equal(Object.hasOwn(normalized, "signature"), false);
  assert.equal(Object.hasOwn(normalized, "rawBody"), false);
  assert.throws(() => {
    normalized.payload.expiresAt = "2030-01-01T00:00:00.000Z";
  }, TypeError);

  for (const forged of [
    new Uint8Array(new TextEncoder().encode(transportText())),
    transportText(),
    { replayIdentity: "forged" },
    { ...normalized },
    new Proxy({}, {}),
  ]) {
    let resolverCalls = 0;
    assert.equal(
      await normalizeClaimedExternalPrepareCommand(
        forged,
        serverNow,
        () => {
          resolverCalls += 1;
          return [authorityFor()];
        },
      ),
      null,
    );
    assert.equal(resolverCalls, 0);
  }

  const malformedBodies = [
    new Uint8Array([0xff]),
    new TextEncoder().encode(
      transportText().replace(
        '"version":1',
        '"version":1,"version":1',
      ),
    ),
    new TextEncoder().encode(
      transportText().replace(
        '"external.prepare"',
        '"\\u0065xternal.prepare"',
      ),
    ),
    new TextEncoder().encode(transportText().replace(
      "}",
      ',"unexpected":1}',
    )),
    new TextEncoder().encode(
      transportText().replace('"version":1', '"version":01'),
    ),
    new TextEncoder().encode(
      transportText().replace('"version":1', '"version":1.0'),
    ),
    new TextEncoder().encode(
      transportText().replace('"version":1', '"version":1e0'),
    ),
  ];
  for (const malformedBody of malformedBodies) {
    let resolverCalls = 0;
    assert.equal(
      await normalizeClaimedExternalPrepareCommand(
        await claimRawBody(malformedBody),
        serverNow,
        () => {
          resolverCalls += 1;
          return [authorityFor()];
        },
      ),
      null,
    );
    assert.equal(resolverCalls, 0);
  }

  const invalidCommands = [
    firstCommand({ signer: firstSigner.toUpperCase() }),
    firstCommand({ nonce: "AAAAAAAAAAAAAAAAAAAAAB" }),
    firstCommand({ issuedAt: "2026-09-07T19:00:00.00Z" }),
    firstCommand({ issuedAt: "2026-09-07T19:00:00.000+00:00" }),
    firstCommand({ issuedAt: "2026-02-29T19:00:00.000Z" }),
    firstCommand({ expiresAt: "2026-09-07T19:04:00.001Z" }),
    firstCommand({ payloadHash: "0x" + "A".repeat(64) }),
    firstCommand({ signature: firstSignature.toUpperCase() }),
    firstCommand({ signature: firstSignature.slice(0, -2) + "02" }),
    firstCommand({ signature: "0x" + "0".repeat(64) + firstSignature.slice(66) }),
    firstCommand({ signature: firstSignature.slice(0, 66) + "0".repeat(64) + "1c" }),
    firstCommand({ signature: firstSignature.slice(0, 66) + "f".repeat(64) + "1c" }),
    firstCommand({ type: "external.submit" }),
    firstCommand({ chainId: 295 }),
    firstCommand({ version: 2 }),
  ];
  for (const command of invalidCommands) {
    let resolverCalls = 0;
    assert.equal(
      await normalizeClaimedExternalPrepareCommand(
        await claimText(transportText(command)),
        serverNow,
        () => {
          resolverCalls += 1;
          return [authorityFor()];
        },
      ),
      null,
    );
    assert.equal(resolverCalls, 0);
  }

  for (const payload of [
    firstPayload({ expiresAt: "2026-09-07T19:04:00.001Z" }),
    firstPayload({ operationKind: "ATS_UNKNOWN" }),
    firstPayload({ canonicalParametersHash: "A".repeat(64) }),
  ]) {
    let resolverCalls = 0;
    assert.equal(
      await normalizeClaimedExternalPrepareCommand(
        await claimText(transportText(firstCommand(), payload)),
        serverNow,
        () => {
          resolverCalls += 1;
          return [authorityFor()];
        },
      ),
      null,
    );
    assert.equal(resolverCalls, 0);
  }

  for (const now of [
    "2026-09-07T19:04:00.001Z",
    "2026-09-07T18:58:59.999Z",
    "2026-09-07T19:00:30Z",
    "2026-02-29T19:00:00.000Z",
  ]) {
    assert.equal(
      await normalizeClaimedExternalPrepareCommand(
        await claimText(transportText()),
        now,
        () => [authorityFor()],
      ),
      null,
    );
  }

  for (const authorityRecords of [
    [],
    [authorityFor(), authorityFor()],
    [authorityFor(firstSigner, "ISSUER", ["other_subject"])],
    [authorityFor(firstSigner, "BACKER")],
    [authorityFor(firstSigner, "ISSUER", ["subject_42"], { enabled: false })],
    [authorityFor("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")],
  ]) {
    assert.equal(
      await normalizeClaimedExternalPrepareCommand(
        await claimText(transportText()),
        serverNow,
        () => authorityRecords,
      ),
      null,
    );
  }

  const fundingNormalized = await normalizeClaimedExternalPrepareCommand(
    await claimText(transportText(fundingCommand(), fundingPayload())),
    serverNow,
    () => [authorityFor(fundingSigner, "BACKER", [])],
  );
  assert.equal(fundingNormalized.role, "BACKER");
  assert.equal(fundingNormalized.payload.operationKind, "HEDERA_FUNDING");
  assert.equal(
    await normalizeClaimedExternalPrepareCommand(
      await claimText(transportText(fundingCommand(), fundingPayload())),
      serverNow,
      () => [authorityFor(fundingSigner, "ISSUER")],
    ),
    null,
  );

  const normalizedRecoveryOne = await normalizeClaimedExternalPrepareCommand(
    await claimText(
      transportText(firstCommand({ signature: firstSignature.slice(0, -2) + "01" })),
    ),
    serverNow,
    () => [authorityFor()],
  );
  assert.equal(normalizedRecoveryOne.canonicalSignerAddress, firstSigner);

  const normalizedRecoveryZero = await normalizeClaimedExternalPrepareCommand(
    await claimText(
      transportText(
        recoveryZeroCommand({
          signature: recoveryZeroSignature.slice(0, -2) + "00",
        }),
        recoveryZeroPayload(),
      ),
    ),
    serverNow,
    () => [authorityFor(recoveryZeroSigner)],
  );
  assert.equal(
    normalizedRecoveryZero.canonicalSignerAddress,
    recoveryZeroSigner,
  );

  const source = readFileSync(fileURLToPath(normalizerModuleUrl), "utf8");
  const backendEntry = readFileSync(
    fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    "utf8",
  );
  const manifest = JSON.parse(
    readFileSync(
      fileURLToPath(new URL("../package.json", import.meta.url)),
      "utf8",
    ),
  );
  for (const forbidden of [
    /JSON\.parse/u,
    /process\.env/u,
    /Date\.now/u,
    /\bfetch\b/u,
    /from ["']convex/u,
    /from ["'][^"']*(?:wallet|provider|wagmi)/iu,
    /\bsetTimeout\b/u,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
  assert.doesNotMatch(backendEntry, /authenticated-external-prepare-normalizer/u);
  assert.doesNotMatch(backendEntry, /isExternalPrepareTimeWindowValidForTest/u);
  assert.equal(manifest.dependencies.viem, "2.56.1");
});

test("rejects canonical payload-hash and valid-format signer mismatches before authority resolution", async () => {
  const { normalizeClaimedExternalPrepareCommand } = await loadNormalizer();

  await assertRejectedBeforeResolver(
    normalizeClaimedExternalPrepareCommand,
    await claimText(
      transportText(
        firstCommand(),
        firstPayload({ subjectPublicId: "subject_43" }),
      ),
    ),
  );
  await assertRejectedBeforeResolver(
    normalizeClaimedExternalPrepareCommand,
    await claimText(
      transportText(firstCommand({ signer: fundingSigner })),
    ),
  );
});

test("rejects duplicate, missing, unsupported, and prototype-related transport fields before authority resolution", async () => {
  const { normalizeClaimedExternalPrepareCommand } = await loadNormalizer();
  const commandJson = JSON.stringify(firstCommand());
  const payloadJson = JSON.stringify(firstPayload());
  const commandWithoutSignature = firstCommand();
  const payloadWithoutExpiry = firstPayload();
  delete commandWithoutSignature.signature;
  delete payloadWithoutExpiry.expiresAt;

  const malformedTransports = [
    `{"command":${commandJson},"command":${commandJson},"payload":${payloadJson}}`,
    transportText().replace(
      '"operationKind":"ATS_CREATE"',
      '"operationKind":"ATS_CREATE","operationKind":"ATS_CREATE"',
    ),
    JSON.stringify({ command: firstCommand() }),
    JSON.stringify({ command: commandWithoutSignature, payload: firstPayload() }),
    JSON.stringify({ command: firstCommand(), payload: payloadWithoutExpiry }),
    "[]",
    JSON.stringify({ command: [], payload: firstPayload() }),
    JSON.stringify({ command: firstCommand(), payload: [] }),
    JSON.stringify({ command: true, payload: firstPayload() }),
    JSON.stringify({ command: firstCommand(), payload: false }),
    "null",
    JSON.stringify({ command: firstCommand(), payload: null }),
    `{"command":${commandJson},"payload":${payloadJson},"__proto__":{}}`,
    `{"command":{${commandJson.slice(1, -1)},"constructor":"Object"},"payload":${payloadJson}}`,
    `{"command":${commandJson},"payload":{${payloadJson.slice(1, -1)},"prototype":{}}}`,
  ];

  for (const malformedTransport of malformedTransports) {
    await assertRejectedBeforeResolver(
      normalizeClaimedExternalPrepareCommand,
      await claimText(malformedTransport),
    );
  }
});

test("rejects malformed and accessor-backed authority records without reading accessors", async () => {
  const { normalizeClaimedExternalPrepareCommand } = await loadNormalizer();
  const missingPrincipal = authorityFor();
  const customPrototype = Object.assign(Object.create(null), authorityFor());
  let accessorReads = 0;
  const accessorBacked = authorityFor();
  delete missingPrincipal.principalPublicId;
  Object.defineProperty(accessorBacked, "principalPublicId", {
    enumerable: true,
    configurable: true,
    get() {
      accessorReads += 1;
      return "principal_42";
    },
  });

  for (const authorityRecord of [
    null,
    missingPrincipal,
    { ...authorityFor(), unexpected: true },
    customPrototype,
    accessorBacked,
  ]) {
    assert.equal(
      await normalizeClaimedExternalPrepareCommand(
        await claimText(transportText()),
        serverNow,
        () => [authorityRecord],
      ),
      null,
    );
  }
  assert.equal(accessorReads, 0);
});

test("isolates normalization from caller-owned body and authority inputs", async () => {
  const { normalizeClaimedExternalPrepareCommand } = await loadNormalizer();
  const rawBody = new TextEncoder().encode(transportText());
  const claimedBody = await claimRawBody(rawBody);
  const authorityRecord = authorityFor();
  rawBody.fill(0);

  const normalized = await normalizeClaimedExternalPrepareCommand(
    claimedBody,
    serverNow,
    () => [authorityRecord],
  );
  authorityRecord.principalPublicId = "mutated_principal";
  authorityRecord.ownedSubjectPublicIds[0] = "mutated_subject";

  assert.equal(normalized.principalPublicId, "principal_42");
  assert.equal(normalized.payload.subjectPublicId, "subject_42");
});

test("applies server-clock boundaries to a validly authenticated command", async () => {
  const { normalizeClaimedExternalPrepareCommand } = await loadNormalizer();
  const claimedBody = await claimText(transportText());

  assert.equal(
    await normalizeClaimedExternalPrepareCommand(
      claimedBody,
      "2026-09-07T18:58:59.999Z",
      () => [authorityFor()],
    ),
    null,
  );
  assert.equal(
    await normalizeClaimedExternalPrepareCommand(
      claimedBody,
      "2026-09-07T19:04:00.001Z",
      () => [authorityFor()],
    ),
    null,
  );

  const atFutureSkewBoundary = await normalizeClaimedExternalPrepareCommand(
    claimedBody,
    "2026-09-07T18:59:00.000Z",
    () => [authorityFor()],
  );
  const atExpiryBoundary = await normalizeClaimedExternalPrepareCommand(
    claimedBody,
    "2026-09-07T19:04:00.000Z",
    () => [authorityFor()],
  );
  assert.equal(atFutureSkewBoundary.canonicalSignerAddress, firstSigner);
  assert.equal(atExpiryBoundary.canonicalSignerAddress, firstSigner);
});

test("validates exact external.prepare time-window boundaries without signing fixtures", async () => {
  const { isExternalPrepareTimeWindowValidForTest } = await loadNormalizer();

  assert.equal(
    isExternalPrepareTimeWindowValidForTest(
      "2026-09-07T19:05:00.000Z",
      "2026-09-07T19:04:00.000Z",
      "2026-09-07T19:04:00.000Z",
    ),
    false,
  );
  assert.equal(
    isExternalPrepareTimeWindowValidForTest(
      "2026-09-07T19:04:00.000Z",
      "2026-09-07T19:04:00.000Z",
      "2026-09-07T19:04:00.000Z",
    ),
    false,
  );
  assert.equal(
    isExternalPrepareTimeWindowValidForTest(
      "2026-09-07T19:00:00.000Z",
      "2026-09-07T19:05:00.000Z",
      "2026-09-07T19:00:00.000Z",
    ),
    true,
  );
  assert.equal(
    isExternalPrepareTimeWindowValidForTest(
      "2026-09-07T19:00:00.000Z",
      "2026-09-07T19:05:00.001Z",
      "2026-09-07T19:00:00.000Z",
    ),
    false,
  );

  for (const timestamps of [
    ["invalid", "2026-09-07T19:05:00.000Z", "2026-09-07T19:00:00.000Z"],
    ["2026-09-07T19:00:00.000Z", "invalid", "2026-09-07T19:00:00.000Z"],
    ["2026-09-07T19:00:00.000Z", "2026-09-07T19:05:00.000Z", "invalid"],
  ]) {
    assert.equal(isExternalPrepareTimeWindowValidForTest(...timestamps), false);
  }
});
