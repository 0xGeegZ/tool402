import assert from "node:assert/strict";
import test from "node:test";

const rawBody = new TextEncoder().encode('{"command":"test"}');
const bodySha256 = "ed2d201bcdca6714c531e7d26b7f47e72f88d631de70f4673129e64d3de0e12a";
const timestampUnixSeconds = 1_735_689_600n;
const fixedKeyBytes = Uint8Array.from({ length: 32 }, (_, index) => index);

const validEnvelope = {
  keyId: "key-A",
  timestampUnixSeconds: "1735689600",
  requestNonce: "AbCdEfGhIjKlMnOpQrStUw",
  bodySha256,
  signature: "-icXyWTEvQ2ALd6x8kr5VxxW7BeQdQ-peJd5dE58rzY",
};

const zeroTimestampEnvelope = {
  ...validEnvelope,
  timestampUnixSeconds: "0",
  signature: "-Yc5ch3l9n869owryo_-EwSj77xEyj_L4Gub9dFjfU0",
};

async function loadVerifier() {
  return import(
    new URL("../src/ingress/protected-ingress-verifier.ts", import.meta.url),
  );
}

async function createVerificationKey(options = {}) {
  return globalThis.crypto.subtle.importKey(
    "raw",
    fixedKeyBytes,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    options.extractable ?? false,
    options.usages ?? ["verify"],
  );
}

function resolveOnly(key) {
  return (keyId) => (keyId === "key-A" ? key : undefined);
}

test("verifies the fixed canonical ingress vector into a sealed minimal capability", async () => {
  const { isVerifiedProtectedIngress, verifyProtectedIngress } = await loadVerifier();
  const key = await createVerificationKey();

  const verified = await verifyProtectedIngress(
    validEnvelope,
    rawBody,
    timestampUnixSeconds,
    resolveOnly(key),
  );

  assert.deepEqual(verified, {
    keyId: "key-A",
    requestNonce: "AbCdEfGhIjKlMnOpQrStUw",
    replayIdentity: "key-A:AbCdEfGhIjKlMnOpQrStUw",
    verifiedAtUnixSeconds: timestampUnixSeconds,
  });
  assert.deepEqual(Object.keys(verified), [
    "keyId",
    "requestNonce",
    "replayIdentity",
    "verifiedAtUnixSeconds",
  ]);
  assert.deepEqual(Reflect.ownKeys(verified), [
    "keyId",
    "requestNonce",
    "replayIdentity",
    "verifiedAtUnixSeconds",
  ]);
  assert.equal(Object.isFrozen(verified), true);
  assert.equal(isVerifiedProtectedIngress(verified), true);
  assert.equal(isVerifiedProtectedIngress({ ...verified }), false);
  assert.equal(
    isVerifiedProtectedIngress({
      keyId: "key-A",
      requestNonce: "AbCdEfGhIjKlMnOpQrStUw",
      replayIdentity: "key-A:AbCdEfGhIjKlMnOpQrStUw",
      verifiedAtUnixSeconds: timestampUnixSeconds,
    }),
    false,
  );
  assert.equal(isVerifiedProtectedIngress({}), false);
});

test("rejects body mismatch before resolving a key", async () => {
  const { verifyProtectedIngress } = await loadVerifier();
  let resolverCalls = 0;

  const verified = await verifyProtectedIngress(
    validEnvelope,
    new TextEncoder().encode('{"command":"altered"}'),
    timestampUnixSeconds,
    () => {
      resolverCalls += 1;
      return undefined;
    },
  );

  assert.equal(verified, null);
  assert.equal(resolverCalls, 0);
});

test("rejects unknown, unusable, and unavailable verification keys", async () => {
  const { verifyProtectedIngress } = await loadVerifier();
  const extractableKey = await createVerificationKey({ extractable: true });
  const signOnlyKey = await createVerificationKey({ usages: ["sign"] });
  const wrongAlgorithmKey = await globalThis.crypto.subtle.importKey(
    "raw",
    new Uint8Array(16),
    "AES-GCM",
    false,
    ["encrypt"],
  );

  for (const { name, resolveKey } of [
    { name: "unknown key", resolveKey: () => undefined },
    { name: "extractable key", resolveKey: () => extractableKey },
    { name: "sign-only key", resolveKey: () => signOnlyKey },
    { name: "wrong algorithm key", resolveKey: () => wrongAlgorithmKey },
    {
      name: "resolver failure",
      resolveKey: () => {
        throw new Error("resolver failed");
      },
    },
  ]) {
    const verified = await verifyProtectedIngress(
      validEnvelope,
      rawBody,
      timestampUnixSeconds,
      resolveKey,
    );

    assert.equal(verified, null, `expected ${name} to be rejected`);
  }
});

test("rejects malformed input, invalid raw bytes, and invalid signatures", async () => {
  const { verifyProtectedIngress } = await loadVerifier();
  const key = await createVerificationKey();
  const cases = [
    {
      name: "wrong canonical-length signature",
      envelope: { ...validEnvelope, signature: `${validEnvelope.signature.slice(0, -1)}A` },
      body: rawBody,
    },
    {
      name: "malformed signature",
      envelope: { ...validEnvelope, signature: "not-a-signature" },
      body: rawBody,
    },
    {
      name: "unexpected envelope key",
      envelope: { ...validEnvelope, unexpected: true },
      body: rawBody,
    },
    { name: "null envelope", envelope: null, body: rawBody },
    { name: "non-byte body", envelope: validEnvelope, body: "not raw bytes" },
  ];

  for (const { name, envelope, body } of cases) {
    const verified = await verifyProtectedIngress(
      envelope,
      body,
      timestampUnixSeconds,
      resolveOnly(key),
    );

    assert.equal(verified, null, `expected ${name} to be rejected`);
  }
});

test("accepts only the inclusive sixty-second skew boundary after a valid MAC", async () => {
  const { verifyProtectedIngress } = await loadVerifier();
  const key = await createVerificationKey();

  for (const nowUnixSeconds of [
    timestampUnixSeconds - 60n,
    timestampUnixSeconds + 60n,
  ]) {
    const verified = await verifyProtectedIngress(
      validEnvelope,
      rawBody,
      nowUnixSeconds,
      resolveOnly(key),
    );

    assert.notEqual(verified, null);
    assert.equal(verified.verifiedAtUnixSeconds, nowUnixSeconds);
  }

  for (const nowUnixSeconds of [
    timestampUnixSeconds - 61n,
    timestampUnixSeconds + 61n,
  ]) {
    const verified = await verifyProtectedIngress(
      validEnvelope,
      rawBody,
      nowUnixSeconds,
      resolveOnly(key),
    );

    assert.equal(verified, null);
  }
});

test("rejects a non-bigint or negative clock even with a valid authenticated envelope", async () => {
  const { verifyProtectedIngress } = await loadVerifier();
  const key = await createVerificationKey();

  const nonBigintClock = await verifyProtectedIngress(
    validEnvelope,
    rawBody,
    Number(timestampUnixSeconds),
    resolveOnly(key),
  );
  const negativeClock = await verifyProtectedIngress(
    zeroTimestampEnvelope,
    rawBody,
    -1n,
    resolveOnly(key),
  );

  assert.equal(nonBigintClock, null);
  assert.equal(negativeClock, null);
});

test("performs native MAC verification before rejecting a valid but stale envelope", async () => {
  const { verifyProtectedIngress } = await loadVerifier();
  const key = await createVerificationKey();
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const originalCrypto = globalThis.crypto;
  const originalSubtle = originalCrypto.subtle;
  let verifyCalls = 0;

  assert.equal(originalDescriptor?.configurable, true);
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    enumerable: originalDescriptor.enumerable,
    writable: true,
    value: {
      subtle: {
        digest: originalSubtle.digest.bind(originalSubtle),
        verify: async (...arguments_) => {
          verifyCalls += 1;
          return originalSubtle.verify(...arguments_);
        },
      },
    },
  });

  try {
    const verified = await verifyProtectedIngress(
      validEnvelope,
      rawBody,
      timestampUnixSeconds + 61n,
      resolveOnly(key),
    );

    assert.equal(verified, null);
  } finally {
    Object.defineProperty(globalThis, "crypto", originalDescriptor);
  }

  assert.equal(verifyCalls, 1);
});
