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
import { getFunctionName } from "convex/server";
import { keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const httpUrl = new URL("../convex/http.ts", import.meta.url);
const dispatchUrl = new URL("../convex/command_dispatch.ts", import.meta.url);
const replayUrl = new URL("../convex/wallet_command_replay.ts", import.meta.url);
const externalPrepareAdmissionUrl = new URL("../convex/external_prepare_command_admission.ts", import.meta.url);
const offeringsUrl = new URL("../convex/offerings.ts", import.meta.url);
const directoryVersionsUrl = new URL("../convex/directory_versions.ts", import.meta.url);
const sourcePaths = [httpUrl, dispatchUrl, replayUrl].map(fileURLToPath);
const sourcesExist = sourcePaths.every((path) => existsSync(path));
const implementedTest = sourcesExist ? test : test.skip;

const signingAccount = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f094538e2f7d9fca7ca9293b3ff0b8f9b5b0a5b9",
);
const canonicalSignerAddress = signingAccount.address.toLowerCase();
const serverNow = "2026-09-07T19:00:30.000Z";
const serverNowMilliseconds = Date.parse(serverNow);
const commandIssuedAt = "2026-09-07T19:00:00.000Z";
const commandExpiresAt = "2026-09-07T19:04:00.000Z";
const typedDataDomain = { name: "Tool402", version: "1", chainId: 296 };
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
    operationKind: "HEDERA_FUNDING",
    subjectPublicId: "subject_42",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: "0.0.123",
    canonicalParametersHash: "a".repeat(64),
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
    expiresAt: commandExpiresAt,
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
    expiresAt: commandExpiresAt,
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
    expiresAt: commandExpiresAt,
    ...overrides,
  };
}

function directoryPublishPayload(overrides = {}) {
  return {
    schemaVersion: 1,
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    directoryVersion: 1,
    record: directoryRecord(),
    idempotencyKey: "CCCCCCCCCCCCCCCCCCCCCg",
    expiresAt: commandExpiresAt,
    ...overrides,
  };
}

function directoryRecord(overrides = {}) {
  return {
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
    ...overrides,
  };
}

function canonicalPayloadText(type, payload) {
  if (type === "external.prepare") {
    const fields = [
      "canonicalParametersHash",
      "chainId",
      "expectedTarget",
      "expiresAt",
      "idempotencyKey",
      "network",
      "operationKind",
      "subjectPublicId",
    ];
    return JSON.stringify(Object.fromEntries(fields.map((field) => [field, payload[field]])));
  }
  const bytes = type === "offering.create"
    ? canonicalOfferingCreatePayloadBytes(parseOfferingCreatePayload(payload))
    : type === "directory.publish"
      ? canonicalDirectoryPublishPayloadBytes(parseDirectoryPublishPayload(payload))
      : canonicalAttachCandidatePayloadBytes(parseAttachCandidatePayload(payload));
  return new TextDecoder().decode(bytes);
}

async function signedTransport(type, payload, nonce = "AAAAAAAAAAAAAAAAAAAAAA") {
  const payloadHash = keccak256(stringToHex(canonicalPayloadText(type, payload)));
  const command = {
    version: 1,
    type,
    chainId: 296,
    signer: canonicalSignerAddress,
    nonce,
    issuedAt: commandIssuedAt,
    expiresAt: payload.expiresAt,
    payloadHash,
  };
  const signature = await signingAccount.signTypedData({
    domain: typedDataDomain,
    types: typedDataTypes,
    primaryType: "Tool402Command",
    message: command,
  });
  return {
    command: { ...command, signature: signature.toLowerCase() },
    payload,
    text: JSON.stringify({ command: { ...command, signature: signature.toLowerCase() }, payload }),
  };
}

function toArrayBuffer(bytes) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function toLowercaseHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function signedIngressRequest(transport, overrides = {}) {
  const body = new TextEncoder().encode(transport.text);
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    Uint8Array.from({ length: 32 }, (_, index) => index),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const timestampUnixSeconds = String(Math.floor(serverNowMilliseconds / 1_000));
  const requestNonce = overrides.requestNonce ?? "AbCdEfGhIjKlMnOpQrStUw";
  const bodySha256 = toLowercaseHex(new Uint8Array(
    await globalThis.crypto.subtle.digest("SHA-256", toArrayBuffer(body)),
  ));
  const signingInput = ["POST", "/internal/commands", timestampUnixSeconds, requestNonce, bodySha256].join("\n");
  const signature = toBase64Url(new Uint8Array(await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(new TextEncoder().encode(signingInput)),
  )));
  const headers = new Headers({
    "content-type": "application/json",
    "x-tool402-key-id": "key-A",
    "x-tool402-timestamp": timestampUnixSeconds,
    "x-tool402-nonce": requestNonce,
    "x-tool402-content-sha256": bodySha256,
    "x-tool402-signature": signature,
    ...overrides.headers,
  });
  if (overrides.repeatedHeader !== undefined) {
    const current = headers.get(overrides.repeatedHeader);
    assert.notEqual(current, null, `cannot repeat an absent fixture header: ${overrides.repeatedHeader}`);
    headers.append(overrides.repeatedHeader, current);
  }
  return {
    key,
    request: new Request("https://tool402.test/internal/commands", {
      method: "POST",
      headers,
      body,
    }),
    replayIdentity: `key-A:${requestNonce}`,
  };
}

function requestWithUnreadableBody(request) {
  let bodyReads = 0;
  const body = new ReadableStream({
    pull(controller) {
      bodyReads += 1;
      controller.error(new Error("body must not be read before ingress headers are accepted"));
    },
  });
  return {
    bodyReads: () => bodyReads,
    request: new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body,
      duplex: "half",
    }),
  };
}

function authorityFor(type, payload) {
  return {
    principalPublicId: "principal_42",
    canonicalSignerAddress,
    chainId: 296,
    role: type === "external.prepare" && payload.operationKind === "HEDERA_FUNDING"
      ? "BACKER"
      : "ISSUER",
    ownedSubjectPublicIds: ["subject_42"],
    authorityVersion: "authority-v1",
    enabled: true,
  };
}

function commandContext({ mutationResult, mutationResults, mutationError, queryResult, queryError } = {}) {
  const mutations = [];
  const queries = [];
  const queuedMutationResults = mutationResults === undefined ? null : [...mutationResults];
  const forbidden = () => {
    throw new Error("unexpected external operation");
  };
  return {
    mutations,
    queries,
    ctx: {
      async runMutation(reference, args) {
        mutations.push({ name: getFunctionName(reference), args: structuredClone(args) });
        if (mutationError !== undefined) throw mutationError;
        return queuedMutationResults === null ? mutationResult : queuedMutationResults.shift();
      },
      async runQuery(reference, args) {
        queries.push({ name: getFunctionName(reference), args: structuredClone(args) });
        if (queryError !== undefined) throw queryError;
        return queryResult;
      },
      runAction: forbidden,
      scheduler: { runAfter: forbidden, runAt: forbidden },
      db: forbidden,
    },
  };
}

const ingressEnvironmentKeys = ["TOOL402_INGRESS_KEY_ID", "TOOL402_INGRESS_SECRET"];
const safeIngressSecret = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

async function withIngressEnvironment(values, operation) {
  const previous = Object.fromEntries(
    ingressEnvironmentKeys.map((key) => [key, process.env[key]]),
  );
  try {
    for (const key of ingressEnvironmentKeys) {
      if (values[key] === undefined) delete process.env[key];
      else process.env[key] = values[key];
    }
    return await operation();
  } finally {
    for (const key of ingressEnvironmentKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function testSeams({ key, type, payload, claim = "claimed" }) {
  const claims = [];
  const resolutions = [];
  let clockReads = 0;
  return {
    claims,
    resolutions,
    get clockReads() {
      return clockReads;
    },
    seams: {
      resolveIngressKey(keyId) {
        resolutions.push({ kind: "key", keyId });
        return keyId === "key-A" ? key : undefined;
      },
      tryClaimReplay(replayIdentity) {
        claims.push(replayIdentity);
        return claim;
      },
      resolveCommandAuthorities(chainId, signer) {
        resolutions.push({ kind: "authority", chainId, signer });
        return [authorityFor(type, payload)];
      },
      serverNowMilliseconds() {
        clockReads += 1;
        return serverNowMilliseconds;
      },
    },
  };
}

async function responseJson(response) {
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.equal(response.headers.get("cache-control"), "no-store");
  return response.json();
}

function assertNoSensitiveResponseFields(value) {
  const text = JSON.stringify(value);
  for (const forbidden of ["signature", "payloadHash", "replayIdentity", "attemptId", "_id", "_creationTime", "key-A"]) {
    assert.equal(text.includes(forbidden), false, `response must omit ${forbidden}`);
  }
}

test("requires the three declared M41 command-ingress source modules", () => {
  for (const path of sourcePaths) {
    assert.equal(existsSync(path), true, `missing declared M41 source module: ${path}`);
  }
});

implementedTest("exports the closed command-dispatch surface and keeps the direct-test entrypoint out of the HTTP router", async () => {
  const [dispatch, http] = await Promise.all([import(dispatchUrl), import(httpUrl)]);
  assert.deepEqual(Object.keys(dispatch).sort(), [
    "handleActiveDirectory",
    "handleCommandIngress",
    "handleCommandIngressForTest",
    "handleOfferingProjection",
  ]);
  assert.deepEqual(Object.keys(http), ["default"]);
  const httpSource = readFileSync(httpUrl, "utf8");
  assert.doesNotMatch(httpSource, /handleCommandIngressForTest/u);
  assert.doesNotMatch(httpSource, /process\s*\.\s*env/u);
});

implementedTest("imports every frozen dispatch sibling and requires the exact exported target names", async () => {
  const [admissions, offerings, directoryVersions] = await Promise.all([
    import(externalPrepareAdmissionUrl),
    import(offeringsUrl),
    import(directoryVersionsUrl),
  ]);
  for (const [module, exportedName] of [
    [admissions, "admitExternalPrepareCommand"],
    [admissions, "admitAtsCreateAndMarkAssetPending"],
    [offerings, "admitOfferingCreate"],
    [directoryVersions, "admitDirectoryPublish"],
  ]) {
    assert.equal(typeof module[exportedName], "function", `missing frozen dispatch target: ${exportedName}`);
  }
});

implementedTest("routes signed offering.create and directory.publish through their frozen M40 admissions with closed status and public-ID mapping", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const cases = [
    {
      type: "offering.create",
      payload: offeringCreatePayload(),
      mutation: "offerings:admitOfferingCreate",
      targetId: "offerings:private",
      state: "DRAFT",
    },
    {
      type: "directory.publish",
      payload: directoryPublishPayload(),
      mutation: "directory_versions:admitDirectoryPublish",
      targetId: "directoryVersions:private",
      state: "ACTIVE",
    },
  ];
  const statusCases = [
    ["NEW", (targetId, state) => ({ status: "NEW", targetId, state }), "ACCEPTED"],
    [
      "IDEMPOTENCY_REPLAYED",
      (targetId, state) => ({ status: "IDEMPOTENCY_REPLAYED", targetId, state }),
      "REPLAYED",
    ],
    ["COMMAND_REPLAYED", () => ({ status: "COMMAND_REPLAYED" }), "REPLAYED"],
    ["IDEMPOTENCY_CONFLICT", () => ({ status: "IDEMPOTENCY_CONFLICT" }), "CONFLICT"],
    ["PRECONDITION_UNMET", () => ({ status: "PRECONDITION_UNMET" }), "REJECTED"],
  ];

  for (const entry of cases) {
    for (const [statusName, result, outcome] of statusCases) {
      const transport = await signedTransport(entry.type, entry.payload);
      const ingress = await signedIngressRequest(transport);
      const state = commandContext({ mutationResult: result(entry.targetId, entry.state) });
      const seamState = testSeams({ key: ingress.key, type: entry.type, payload: entry.payload });

      const response = await handleCommandIngressForTest(state.ctx, ingress.request, seamState.seams);
      assert.equal(response.status, 200, `${entry.type} ${statusName}`);
      const body = await responseJson(response);
      const expected = outcome === "REJECTED"
        ? { outcome }
        : { outcome, publicId: entry.payload.offeringPublicId };
      assert.deepEqual(body, expected, `${entry.type} ${statusName}`);
      assertNoSensitiveResponseFields(body);
      assert.equal(state.mutations.length, 1, `${entry.type} ${statusName}`);
      assert.equal(state.mutations[0].name, entry.mutation, `${entry.type} ${statusName}`);
      assert.deepEqual(Object.keys(state.mutations[0].args).sort(), [
        "authorityVersion",
        "canonicalSignerAddress",
        "chainId",
        "expiresAt",
        "issuedAt",
        "nonce",
        "payload",
        "payloadHash",
        "principalPublicId",
        "replayIdentity",
        "role",
        "type",
        "version",
      ]);
      assert.equal(
        Object.hasOwn(state.mutations[0].args, "deferredSubjectOwnership"),
        false,
        `${entry.type} must not pass M39-only deferred ownership to M40`,
      );
      assert.deepEqual(state.queries, [], `${entry.type} ${statusName}`);
      assert.deepEqual(seamState.claims, [ingress.replayIdentity], `${entry.type} ${statusName}`);
      assert.equal(seamState.clockReads, 1, `${entry.type} ${statusName}`);
    }
  }
});

implementedTest("fails closed before replay, authority, or admission when required production ingress configuration is absent, malformed, or mismatched", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: serverNowMilliseconds });
  const { handleCommandIngress } = await import(dispatchUrl);
  const payload = externalPreparePayload();
  const transport = await signedTransport("external.prepare", payload);
  const configurations = [
    ["missing key identifier", { TOOL402_INGRESS_SECRET: safeIngressSecret }],
    ["missing secret", { TOOL402_INGRESS_KEY_ID: "key-A" }],
    ["empty key identifier", { TOOL402_INGRESS_KEY_ID: "", TOOL402_INGRESS_SECRET: safeIngressSecret }],
    ["short secret", { TOOL402_INGRESS_KEY_ID: "key-A", TOOL402_INGRESS_SECRET: "0".repeat(63) }],
    ["uppercase secret", { TOOL402_INGRESS_KEY_ID: "key-A", TOOL402_INGRESS_SECRET: "A".repeat(64) }],
    ["configured key identifier mismatch", { TOOL402_INGRESS_KEY_ID: "key-B", TOOL402_INGRESS_SECRET: safeIngressSecret }],
  ];

  for (const [name, environment] of configurations) {
    const ingress = await signedIngressRequest(transport);
    const state = commandContext();
    await withIngressEnvironment(environment, async () => {
      const response = await handleCommandIngress(state.ctx, ingress.request);
      assert.equal(response.status, 200, name);
      const body = await responseJson(response);
      assert.deepEqual(body, { outcome: "REJECTED" }, name);
      assertNoSensitiveResponseFields(body);
    });
    assert.deepEqual(state.mutations, [], name);
    assert.deepEqual(state.queries, [], name);
  }
});

implementedTest("uses only a safe injected production ingress environment to claim, resolve authority, and delegate a verified command", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: serverNowMilliseconds });
  const { handleCommandIngress } = await import(dispatchUrl);
  const payload = externalPreparePayload();
  const transport = await signedTransport("external.prepare", payload);
  const ingress = await signedIngressRequest(transport);
  const state = commandContext({
    mutationResults: [
      "claimed",
      {
        status: "NEW",
        attemptId: "externalPrepareCommandAttempts:private",
        state: "PREPARED",
      },
    ],
    queryResult: [authorityFor("external.prepare", payload)],
  });

  await withIngressEnvironment({
    TOOL402_INGRESS_KEY_ID: "key-A",
    TOOL402_INGRESS_SECRET: safeIngressSecret,
  }, async () => {
    const response = await handleCommandIngress(state.ctx, ingress.request);
    assert.equal(response.status, 200);
    const body = await responseJson(response);
    assert.deepEqual(body, { outcome: "ACCEPTED", publicId: payload.idempotencyKey });
    assertNoSensitiveResponseFields(body);
  });

  assert.deepEqual(state.queries, [{
    name: "wallet_command_replay:readCommandAuthorities",
    args: { chainId: 296, canonicalSignerAddress },
  }]);
  assert.equal(state.mutations.length, 2);
  assert.deepEqual(state.mutations[0], {
    name: "wallet_command_replay:claimIngressReplayIdentity",
    args: { replayIdentity: ingress.replayIdentity },
  });
  assert.equal(
    state.mutations[1].name,
    "external_prepare_command_admission:admitExternalPrepareCommand",
  );
  assert.deepEqual(Object.keys(state.mutations[1].args).sort(), [
    "authorityVersion",
    "canonicalSignerAddress",
    "chainId",
    "expiresAt",
    "issuedAt",
    "nonce",
    "payload",
    "payloadHash",
    "principalPublicId",
    "replayIdentity",
    "role",
    "type",
    "version",
  ]);
});

implementedTest("maps one verified HEDERA_FUNDING request to the generic admission without exposing durable identifiers", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const payload = externalPreparePayload();
  const transport = await signedTransport("external.prepare", payload);
  const ingress = await signedIngressRequest(transport);
  const state = commandContext({
    mutationResult: {
      status: "NEW",
      attemptId: "externalPrepareCommandAttempts:private",
      state: "PREPARED",
    },
  });
  const seamState = testSeams({ key: ingress.key, type: "external.prepare", payload });

  const response = await handleCommandIngressForTest(state.ctx, ingress.request, seamState.seams);
  assert.equal(response.status, 200);
  const body = await responseJson(response);
  assert.deepEqual(body, { outcome: "ACCEPTED", publicId: payload.idempotencyKey });
  assertNoSensitiveResponseFields(body);
  assert.equal(seamState.clockReads, 1, "M23 and M39 must share one server-clock read");
  assert.deepEqual(seamState.claims, [ingress.replayIdentity]);
  assert.deepEqual(seamState.resolutions, [
    { kind: "key", keyId: "key-A" },
    { kind: "authority", chainId: 296, signer: canonicalSignerAddress },
  ]);
  assert.equal(state.mutations.length, 1);
  assert.equal(
    state.mutations[0].name,
    "external_prepare_command_admission:admitExternalPrepareCommand",
  );
  assert.deepEqual(Object.keys(state.mutations[0].args).sort(), [
    "authorityVersion",
    "canonicalSignerAddress",
    "chainId",
    "expiresAt",
    "issuedAt",
    "nonce",
    "payload",
    "payloadHash",
    "principalPublicId",
    "replayIdentity",
    "role",
    "type",
    "version",
  ]);
  assert.equal(Object.hasOwn(state.mutations[0].args, "offeringId"), false);
});

implementedTest("maps every M32 durable result to the closed write response with only the caller public ID", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const payload = externalPreparePayload();
  const cases = [
    [
      "NEW",
      { status: "NEW", attemptId: "externalPrepareCommandAttempts:private", state: "PREPARED" },
      undefined,
      { outcome: "ACCEPTED", publicId: payload.idempotencyKey },
    ],
    [
      "COMMAND_REPLAYED",
      { status: "COMMAND_REPLAYED" },
      undefined,
      { outcome: "REPLAYED", publicId: payload.idempotencyKey },
    ],
    [
      "IDEMPOTENCY_REPLAYED",
      { status: "IDEMPOTENCY_REPLAYED", attemptId: "externalPrepareCommandAttempts:private", state: "PREPARED" },
      undefined,
      { outcome: "REPLAYED", publicId: payload.idempotencyKey },
    ],
    [
      "IDEMPOTENCY_CONFLICT",
      { status: "IDEMPOTENCY_CONFLICT" },
      undefined,
      { outcome: "CONFLICT", publicId: payload.idempotencyKey },
    ],
    [
      "thrown M32 rejection",
      undefined,
      new Error("M33 authority rejection remains reason-free at HTTP"),
      { outcome: "REJECTED" },
    ],
  ];

  for (const [name, mutationResult, mutationError, expected] of cases) {
    const transport = await signedTransport("external.prepare", payload);
    const ingress = await signedIngressRequest(transport);
    const state = commandContext({ mutationResult, mutationError });
    const seamState = testSeams({ key: ingress.key, type: "external.prepare", payload });

    const response = await handleCommandIngressForTest(state.ctx, ingress.request, seamState.seams);
    assert.equal(response.status, 200, name);
    const body = await responseJson(response);
    assert.deepEqual(body, expected, name);
    assertNoSensitiveResponseFields(body);
    assert.equal(state.mutations.length, 1, name);
    assert.equal(
      state.mutations[0].name,
      "external_prepare_command_admission:admitExternalPrepareCommand",
      name,
    );
    assert.equal(Object.hasOwn(body, "publicId"), expected.outcome !== "REJECTED", name);
  }
});

implementedTest("selects the atomic ATS_CREATE mutation and never dispatches an offering transition", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const payload = externalPreparePayload({
    operationKind: "ATS_CREATE",
    expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    idempotencyKey: "QQQQQQQQQQQQQQQQQQQQQQ",
  });
  const transport = await signedTransport("external.prepare", payload, "QQQQQQQQQQQQQQQQQQQQQQ");
  const ingress = await signedIngressRequest(transport);
  const state = commandContext({
    mutationResult: {
      status: "NEW",
      attemptId: "externalPrepareCommandAttempts:private",
      state: "PREPARED",
    },
  });
  const seamState = testSeams({ key: ingress.key, type: "external.prepare", payload });

  const response = await handleCommandIngressForTest(state.ctx, ingress.request, seamState.seams);
  assert.deepEqual(await responseJson(response), { outcome: "ACCEPTED", publicId: payload.idempotencyKey });
  assert.equal(state.mutations.length, 1);
  assert.equal(
    state.mutations[0].name,
    "external_prepare_command_admission:admitAtsCreateAndMarkAssetPending",
  );
  assert.equal(state.mutations.some(({ name }) => name === "offerings:markAssetPending"), false);
  assert.equal(Object.hasOwn(state.mutations[0].args, "offeringId"), false);
});

implementedTest("rejects every missing or repeated ingress header before body, key, authority, replay, or durable access", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const payload = externalPreparePayload();
  const transport = await signedTransport("external.prepare", payload);
  const headers = [
    "x-tool402-key-id",
    "x-tool402-timestamp",
    "x-tool402-nonce",
    "x-tool402-content-sha256",
    "x-tool402-signature",
  ];

  for (const header of headers) {
    for (const [kind, overrides] of [
      ["missing", { headers: { [header]: "" } }],
      ["repeated", { repeatedHeader: header }],
    ]) {
      const ingress = await signedIngressRequest(transport, overrides);
      const guarded = requestWithUnreadableBody(ingress.request);
      const state = commandContext();
      const seamState = testSeams({ key: ingress.key, type: "external.prepare", payload });

      const response = await handleCommandIngressForTest(state.ctx, guarded.request, seamState.seams);
      assert.equal(response.status, 200, `${kind} ${header}`);
      assert.deepEqual(await responseJson(response), { outcome: "REJECTED" }, `${kind} ${header}`);
      assert.equal(guarded.bodyReads(), 0, `${kind} ${header} must reject before a byte read`);
      assert.equal(seamState.clockReads, 0, `${kind} ${header}`);
      assert.deepEqual(seamState.claims, [], `${kind} ${header}`);
      assert.deepEqual(seamState.resolutions, [], `${kind} ${header}`);
      assert.deepEqual(state.mutations, [], `${kind} ${header}`);
      assert.deepEqual(state.queries, [], `${kind} ${header}`);
    }
  }
});

implementedTest("rejects a body over 65536 bytes before ingress cryptography or transport replay", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const payload = externalPreparePayload();
  const transport = await signedTransport("external.prepare", payload);
  const ingress = await signedIngressRequest(transport);
  const oversized = new Request(ingress.request.url, {
    method: "POST",
    headers: new Headers(ingress.request.headers),
    body: new Uint8Array(65_537),
  });
  const state = commandContext();
  const seamState = testSeams({ key: ingress.key, type: "external.prepare", payload });

  const response = await handleCommandIngressForTest(state.ctx, oversized, seamState.seams);
  assert.equal(response.status, 200);
  assert.deepEqual(await responseJson(response), { outcome: "REJECTED" });
  assert.equal(seamState.clockReads, 0, "the cap must reject before the shared clock/crypto chain");
  assert.deepEqual(seamState.claims, []);
  assert.deepEqual(seamState.resolutions, []);
  assert.deepEqual(state.mutations, []);
  assert.deepEqual(state.queries, []);
});

implementedTest("maps a claimed transport replay to the reason-free rejected response before normalization or dispatch", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const payload = externalPreparePayload();
  const transport = await signedTransport("external.prepare", payload);
  const ingress = await signedIngressRequest(transport);
  const state = commandContext();
  const seamState = testSeams({
    key: ingress.key,
    type: "external.prepare",
    payload,
    claim: "already_claimed",
  });

  const response = await handleCommandIngressForTest(state.ctx, ingress.request, seamState.seams);
  assert.equal(response.status, 200);
  const body = await responseJson(response);
  assert.deepEqual(body, { outcome: "REJECTED" });
  assertNoSensitiveResponseFields(body);
  assert.equal(seamState.clockReads, 1);
  assert.deepEqual(seamState.claims, [ingress.replayIdentity]);
  assert.deepEqual(seamState.resolutions, [{ kind: "key", keyId: "key-A" }]);
  assert.deepEqual(state.mutations, []);
  assert.deepEqual(state.queries, []);
});

implementedTest("reports a valid disabled attach-candidate command as unsupported without durable dispatch", async () => {
  const { handleCommandIngressForTest } = await import(dispatchUrl);
  const payload = attachCandidatePayload();
  const transport = await signedTransport("external.attachCandidate", payload);
  const ingress = await signedIngressRequest(transport);
  const state = commandContext();
  const seamState = testSeams({ key: ingress.key, type: "external.attachCandidate", payload });

  const response = await handleCommandIngressForTest(state.ctx, ingress.request, seamState.seams);
  assert.equal(response.status, 200);
  assert.deepEqual(await responseJson(response), { outcome: "UNSUPPORTED_TYPE" });
  assert.deepEqual(state.mutations, []);
  assert.deepEqual(state.queries, []);
  assert.equal(seamState.clockReads, 1);
  assert.deepEqual(seamState.claims, [ingress.replayIdentity]);
});

implementedTest("serves only closed offering and active-directory read projections", async () => {
  const { handleActiveDirectory, handleOfferingProjection } = await import(dispatchUrl);
  const offering = {
    offeringPublicId: "offering_42",
    version: 1,
    subjectPublicId: "subject_42",
    state: "DRAFT",
    definition: offeringCreatePayload().definition,
    narrative: offeringCreatePayload().narrative,
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    canonicalSignerAddress,
    acceptedAt: 1n,
    updatedAt: 1n,
  };
  const directory = {
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    directoryVersion: 1,
    serviceSlug: "riskscan",
    record: directoryRecord(),
    state: "ACTIVE",
    acceptedAt: 1n,
  };

  const offeringState = commandContext({ queryResult: offering });
  const offeringResponse = await handleOfferingProjection(
    offeringState.ctx,
    new Request("https://tool402.test/public/offerings/offering_42"),
  );
  assert.equal(offeringResponse.status, 200);
  const offeringBody = await responseJson(offeringResponse);
  assert.equal(offeringBody.outcome, "FOUND");
  const { acceptedAt, updatedAt, ...expectedOffering } = offering;
  const {
    acceptedAt: serializedAcceptedAt,
    updatedAt: serializedUpdatedAt,
    ...serializedOffering
  } = offeringBody.record;
  assert.deepEqual(serializedOffering, expectedOffering);
  assert.equal(String(serializedAcceptedAt), String(acceptedAt));
  assert.equal(String(serializedUpdatedAt), String(updatedAt));
  assertNoSensitiveResponseFields(offeringBody);
  assert.deepEqual(offeringState.queries, [{
    name: "offerings:getPublicProjection",
    args: { offeringPublicId: "offering_42" },
  }]);

  const directoryState = commandContext({ queryResult: directory });
  const directoryResponse = await handleActiveDirectory(
    directoryState.ctx,
    new Request("https://tool402.test/public/directory/riskscan/active"),
  );
  assert.equal(directoryResponse.status, 200);
  assert.deepEqual(await responseJson(directoryResponse), {
    outcome: "FOUND",
    record: directory.record,
    directoryVersion: 1,
  });
  assert.deepEqual(directoryState.queries, [{
    name: "directory_versions:getActive",
    args: { serviceSlug: "riskscan" },
  }]);

  const invalidState = commandContext();
  const invalidResponse = await handleOfferingProjection(
    invalidState.ctx,
    new Request("https://tool402.test/public/offerings/not%20valid"),
  );
  assert.equal(invalidResponse.status, 404);
  assert.deepEqual(await responseJson(invalidResponse), { outcome: "NOT_FOUND" });
  assert.deepEqual(invalidState.queries, []);

  const unavailableState = commandContext({ queryError: new Error("unavailable") });
  const unavailableResponse = await handleActiveDirectory(
    unavailableState.ctx,
    new Request("https://tool402.test/public/directory/riskscan/active"),
  );
  assert.equal(unavailableResponse.status, 503);
  assert.deepEqual(await responseJson(unavailableResponse), { outcome: "UNAVAILABLE" });
});

implementedTest("maps null and malformed public projections to only NOT_FOUND or UNAVAILABLE", async () => {
  const { handleActiveDirectory, handleOfferingProjection } = await import(dispatchUrl);
  const offering = {
    offeringPublicId: "offering_42",
    version: 1,
    subjectPublicId: "subject_42",
    state: "DRAFT",
    definition: offeringCreatePayload().definition,
    narrative: offeringCreatePayload().narrative,
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    canonicalSignerAddress,
    acceptedAt: 1n,
    updatedAt: 1n,
  };
  const directory = {
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    directoryVersion: 1,
    serviceSlug: "riskscan",
    record: directoryRecord(),
    state: "ACTIVE",
    acceptedAt: 1n,
  };
  const cases = [
    [
      "null offering",
      handleOfferingProjection,
      "https://tool402.test/public/offerings/offering_42",
      null,
      404,
      { outcome: "NOT_FOUND" },
      "offerings:getPublicProjection",
      { offeringPublicId: "offering_42" },
    ],
    [
      "malformed offering",
      handleOfferingProjection,
      "https://tool402.test/public/offerings/offering_42",
      { ...offering, unexpected: true },
      503,
      { outcome: "UNAVAILABLE" },
      "offerings:getPublicProjection",
      { offeringPublicId: "offering_42" },
    ],
    [
      "null directory",
      handleActiveDirectory,
      "https://tool402.test/public/directory/riskscan/active",
      null,
      404,
      { outcome: "NOT_FOUND" },
      "directory_versions:getActive",
      { serviceSlug: "riskscan" },
    ],
    [
      "malformed directory record",
      handleActiveDirectory,
      "https://tool402.test/public/directory/riskscan/active",
      { ...directory, record: { ...directory.record, unexpected: true } },
      503,
      { outcome: "UNAVAILABLE" },
      "directory_versions:getActive",
      { serviceSlug: "riskscan" },
    ],
  ];

  for (const [name, handler, url, queryResult, status, expected, queryName, queryArgs] of cases) {
    const state = commandContext({ queryResult });
    const response = await handler(state.ctx, new Request(url));
    assert.equal(response.status, status, name);
    assert.deepEqual(await responseJson(response), expected, name);
    assert.deepEqual(state.mutations, [], name);
    assert.deepEqual(state.queries, [{ name: queryName, args: queryArgs }], name);
  }
});

implementedTest("rejects bad, missing, or extra active-directory path segments before any query", async () => {
  const { handleActiveDirectory } = await import(dispatchUrl);
  for (const [name, url] of [
    ["bad slug", "https://tool402.test/public/directory/risk%20scan/active"],
    ["missing active suffix", "https://tool402.test/public/directory/riskscan"],
    ["extra suffix", "https://tool402.test/public/directory/riskscan/active/extra"],
  ]) {
    const state = commandContext();
    const response = await handleActiveDirectory(state.ctx, new Request(url));
    assert.equal(response.status, 404, name);
    assert.deepEqual(await responseJson(response), { outcome: "NOT_FOUND" }, name);
    assert.deepEqual(state.mutations, [], name);
    assert.deepEqual(state.queries, [], name);
  }
});
