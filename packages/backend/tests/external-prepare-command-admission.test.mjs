import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const admissionModuleUrl = new URL(
  "../src/ingress/external-prepare-command-admission.ts",
  import.meta.url,
);
const fixedTestKeyBytes = Uint8Array.from({ length: 32 }, (_, index) => index);
const ingressTimestamp = 1_735_689_600n;
const serverNow = "2026-09-07T19:00:30.000Z";
const signer = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const payloadHash =
  "0x80e6aa5c7d520c43c2ae746b2a9459ab8e298b384703618a464a30378619422a";
const signature =
  "0x9cbb4f71175c850caca53c93724944e2cc320443c15a793f0fd703accc14bf1d729baee430877eb548185b0b3b9b1635517d6bdb9b5149c9f06ddb08843bc9901c";
const expectedSnapshotKeys = [
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
];
const statuses = [
  "NEW",
  "COMMAND_REPLAYED",
  "IDEMPOTENCY_REPLAYED",
  "IDEMPOTENCY_CONFLICT",
];

function assertFrozenExactDataRecord(record, keys) {
  assert.equal(Object.getPrototypeOf(record), Object.prototype);
  assert.equal(Object.isFrozen(record), true);
  assert.deepEqual(Reflect.ownKeys(record), keys);

  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    assert.notEqual(descriptor, undefined);
    assert.equal(descriptor.enumerable, true);
    assert.equal(descriptor.configurable, false);
    assert.equal(descriptor.writable, false);
    assert.equal(Object.hasOwn(descriptor, "value"), true);
    assert.equal(Object.hasOwn(descriptor, "get"), false);
    assert.equal(Object.hasOwn(descriptor, "set"), false);
  }
}

function payload(overrides = {}) {
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

function command(overrides = {}) {
  return {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    signer,
    nonce: "AAAAAAAAAAAAAAAAAAAAAA",
    issuedAt: "2026-09-07T19:00:00.000Z",
    expiresAt: "2026-09-07T19:04:00.000Z",
    payloadHash,
    signature,
    ...overrides,
  };
}

function transportText(
  commandValue = command(),
  payloadValue = payload(),
) {
  return JSON.stringify({ command: commandValue, payload: payloadValue });
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
  const { claimProtectedBody } = await import(
    new URL("../src/ingress/claimed-protected-body.ts", import.meta.url),
  );
  const rawBody = new TextEncoder().encode(text);
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
  const hmac = new Uint8Array(
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
      signature: toBase64Url(hmac),
    },
    rawBody,
    ingressTimestamp,
    (keyId) => (keyId === "key-A" ? key : undefined),
    () => "claimed",
  );
  assert.notEqual(claimed, null);
  return claimed;
}

function authorityFor(overrides = {}) {
  return {
    principalPublicId: "principal_42",
    canonicalSignerAddress: signer,
    chainId: 296,
    role: "ISSUER",
    ownedSubjectPublicIds: ["subject_42"],
    authorityVersion: "authority-v1",
    enabled: true,
    ...overrides,
  };
}

function resolverFor(calls) {
  return async (chainId, canonicalSignerAddress) => {
    calls.push([chainId, canonicalSignerAddress]);
    return [authorityFor()];
  };
}

async function loadAdmission() {
  return import(admissionModuleUrl.href);
}

test("routes one M30-authenticated snapshot to one direct closed outcome", async () => {
  const { admitClaimedExternalPrepareCommand } = await loadAdmission();

  for (const status of statuses) {
    const resolverCalls = [];
    const boundaryCalls = [];
    const claimed = await claimText(transportText());
    const injectedResult = { status };
    const result = await admitClaimedExternalPrepareCommand(
      claimed,
      serverNow,
      resolverFor(resolverCalls),
      (snapshot) => {
        boundaryCalls.push(snapshot);
        return injectedResult;
      },
    );

    assert.deepEqual(resolverCalls, [[296, signer]]);
    assert.equal(boundaryCalls.length, 1);
    assertFrozenExactDataRecord(boundaryCalls[0], expectedSnapshotKeys);
    assert.equal(Object.isFrozen(boundaryCalls[0].payload), true);
    assert.equal(Object.hasOwn(boundaryCalls[0], "signature"), false);
    assert.equal(Object.hasOwn(boundaryCalls[0], "rawBody"), false);
    assert.deepEqual(boundaryCalls[0].payload, payload());
    assert.deepEqual(result, { status });
    assert.notEqual(result, injectedResult);
    assertFrozenExactDataRecord(result, ["status"]);
  }
});

test("rejects a non-callable boundary before M30 resolver work", async () => {
  const { admitClaimedExternalPrepareCommand } = await loadAdmission();

  for (const boundary of [undefined, null, "boundary", {}]) {
    const resolverCalls = [];
    const result = await admitClaimedExternalPrepareCommand(
      await claimText(transportText()),
      serverNow,
      resolverFor(resolverCalls),
      boundary,
    );

    assert.equal(result, null);
    assert.deepEqual(resolverCalls, []);
  }
});

test("never forwards an unauthenticated or M30-invalid candidate", async () => {
  const { admitClaimedExternalPrepareCommand } = await loadAdmission();
  const forgedCandidates = [
    null,
    {},
    "not a claimed body",
    Object.freeze({
      version: 1,
      type: "external.prepare",
      chainId: 296,
      canonicalSignerAddress: signer,
      nonce: "AAAAAAAAAAAAAAAAAAAAAA",
      issuedAt: "2026-09-07T19:00:00.000Z",
      expiresAt: "2026-09-07T19:04:00.000Z",
      payloadHash,
      replayIdentity:
        "tool402:wallet-command:v1:296:" +
        signer +
        ":AAAAAAAAAAAAAAAAAAAAAA",
      principalPublicId: "principal_42",
      role: "ISSUER",
      authorityVersion: "authority-v1",
      payload: Object.freeze(payload()),
    }),
    await claimText('{"command":{},"payload":{}}'),
  ];

  for (const candidate of forgedCandidates) {
    let boundaryCalls = 0;
    const result = await admitClaimedExternalPrepareCommand(
      candidate,
      serverNow,
      () => [authorityFor()],
      () => {
        boundaryCalls += 1;
        return { status: "NEW" };
      },
    );

    assert.equal(result, null);
    assert.equal(boundaryCalls, 0);
  }
});

test("isolates a synchronous atomic-boundary throw without retry", async () => {
  const { admitClaimedExternalPrepareCommand } = await loadAdmission();
  let boundaryCalls = 0;
  const result = await admitClaimedExternalPrepareCommand(
    await claimText(transportText()),
    serverNow,
    () => [authorityFor()],
    () => {
      boundaryCalls += 1;
      throw new Error("expected boundary failure");
    },
  );

  assert.equal(result, null);
  assert.equal(boundaryCalls, 1);
});

test("fails closed for malformed direct outcomes and normally reflected async forms", async () => {
  const { admitClaimedExternalPrepareCommand } = await loadAdmission();
  let accessorReads = 0;
  let directThenCalls = 0;
  let proxyThenReads = 0;
  let speciesCalls = 0;
  let delayedThenCalls = 0;
  const accessorBacked = {};
  Object.defineProperty(accessorBacked, "status", {
    enumerable: true,
    get() {
      accessorReads += 1;
      return "NEW";
    },
  });
  const nonEnumerable = {};
  Object.defineProperty(nonEnumerable, "status", {
    value: "NEW",
  });
  const rejected = Promise.reject(new Error("expected rejection"));
  void rejected.catch(() => {});
  const directThenable = {
    status: "NEW",
    then() {
      directThenCalls += 1;
    },
  };
  const proxyPromise = new Proxy(Promise.resolve({ status: "NEW" }), {
    get(target, property, receiver) {
      if (property === "then") {
        proxyThenReads += 1;
      }
      return Reflect.get(target, property, receiver);
    },
  });
  function PoisonedSpecies(executor) {
    speciesCalls += 1;
    return new Promise(executor);
  }
  const speciesPoisoned = Promise.resolve({ status: "NEW" });
  Object.defineProperty(speciesPoisoned, "constructor", {
    value: {
      [Symbol.species]: PoisonedSpecies,
    },
  });
  const delayedThenable = {};
  const delayedPromise = Promise.resolve(delayedThenable);
  Object.defineProperty(delayedThenable, "then", {
    enumerable: true,
    value(resolve) {
      delayedThenCalls += 1;
      resolve({ status: "NEW" });
    },
  });
  const outcomes = [
    undefined,
    null,
    "NEW",
    true,
    [],
    Object.create(null),
    { status: "UNKNOWN" },
    { status: "NEW", extra: true },
    { status: "NEW", [Symbol("extra")]: true },
    nonEnumerable,
    accessorBacked,
    new Proxy({ status: "NEW" }, {
      ownKeys() {
        throw new Error("hostile reflection");
      },
    }),
    directThenable,
    Promise.resolve({ status: "NEW" }),
    rejected,
    proxyPromise,
    speciesPoisoned,
    (async () => ({ status: "NEW" }))(),
    delayedPromise,
  ];

  for (const outcome of outcomes) {
    let boundaryCalls = 0;
    const result = await admitClaimedExternalPrepareCommand(
      await claimText(transportText()),
      serverNow,
      () => [authorityFor()],
      () => {
        boundaryCalls += 1;
        return outcome;
      },
    );

    assert.equal(result, null);
    assert.equal(boundaryCalls, 1);
  }

  assert.equal(accessorReads, 0);
  assert.equal(directThenCalls, 0);
  assert.equal(proxyThenReads, 0);
  assert.equal(speciesCalls, 0);
  assert.equal(delayedThenCalls, 0);
});

test("keeps the handoff internal and out of durable or external behavior", async () => {
  await loadAdmission();
  const source = readFileSync(fileURLToPath(admissionModuleUrl), "utf8");
  const backendEntry = readFileSync(
    fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    "utf8",
  );

  for (const forbidden of [
    /process\.env/u,
    /from ["']convex/u,
    /\bfetch\b/u,
    /\bDate\.now\b/u,
    /\b(cache|storage)\b/iu,
    /\bwagmi\b/u,
    /\beth_sign/u,
    /\bwallet\b/iu,
    /\bATS\b/u,
    /\bpayment\b/iu,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
  assert.doesNotMatch(backendEntry, /external-prepare-command-admission/u);
});
