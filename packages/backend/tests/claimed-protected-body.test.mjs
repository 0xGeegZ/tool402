import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rawBody = new TextEncoder().encode('{"command":"test"}');
const bodySha256 = "ed2d201bcdca6714c531e7d26b7f47e72f88d631de70f4673129e64d3de0e12a";
const timestampUnixSeconds = 1_735_689_600n;
const fixedKeyBytes = Uint8Array.from({ length: 32 }, (_, index) => index);
const replayIdentity = "key-A:AbCdEfGhIjKlMnOpQrStUw";

const validEnvelope = {
  keyId: "key-A",
  timestampUnixSeconds: "1735689600",
  requestNonce: "AbCdEfGhIjKlMnOpQrStUw",
  bodySha256,
  signature: "-icXyWTEvQ2ALd6x8kr5VxxW7BeQdQ-peJd5dE58rzY",
};

async function loadClaimedProtectedBody() {
  return import(
    new URL("../src/ingress/claimed-protected-body.ts", import.meta.url),
  );
}

async function createVerificationKey() {
  return globalThis.crypto.subtle.importKey(
    "raw",
    fixedKeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

function resolveOnly(key) {
  return (keyId) => (keyId === "key-A" ? key : undefined);
}

function assertUnreadable(readClaimedProtectedBody, value) {
  assert.equal(readClaimedProtectedBody(value), null);
}

test("claims the authenticated original bytes into a frozen private capability", async () => {
  const {
    claimProtectedBody,
    isClaimedProtectedBody,
    readClaimedProtectedBody,
  } = await loadClaimedProtectedBody();
  const key = await createVerificationKey();
  const body = new Uint8Array(rawBody);
  const originalBody = new Uint8Array(body);
  const calls = [];

  const claimed = await claimProtectedBody(
    validEnvelope,
    body,
    timestampUnixSeconds,
    resolveOnly(key),
    (identity) => {
      calls.push(identity);
      return "claimed";
    },
  );

  assert.deepEqual(calls, [replayIdentity]);
  assert.deepEqual(claimed, { replayIdentity });
  assert.deepEqual(Object.keys(claimed), ["replayIdentity"]);
  assert.deepEqual(Reflect.ownKeys(claimed), ["replayIdentity"]);
  assert.equal(Object.isFrozen(claimed), true);
  assert.equal(isClaimedProtectedBody(claimed), true);
  assert.deepEqual(readClaimedProtectedBody(claimed), originalBody);

  body[0] = "[".charCodeAt(0);
  const firstRead = readClaimedProtectedBody(claimed);
  firstRead[1] = "[".charCodeAt(0);
  assert.deepEqual(readClaimedProtectedBody(claimed), originalBody);
});

test("copies caller bytes before M23 asynchronous digest work begins", async () => {
  const { claimProtectedBody, readClaimedProtectedBody } =
    await loadClaimedProtectedBody();
  const key = await createVerificationKey();
  const body = new Uint8Array(rawBody);
  const originalBody = new Uint8Array(body);
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const originalCrypto = globalThis.crypto;
  const originalSubtle = originalCrypto.subtle;
  const realDigest = originalSubtle.digest.bind(originalSubtle);
  const realVerify = originalSubtle.verify.bind(originalSubtle);
  let signalDigestStarted;
  const digestStarted = new Promise((resolve) => {
    signalDigestStarted = resolve;
  });
  let releaseDigest;
  const digestGate = new Promise((resolve) => {
    releaseDigest = resolve;
  });

  assert.equal(originalDescriptor?.configurable, true);
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    enumerable: originalDescriptor.enumerable,
    writable: true,
    value: {
      subtle: {
        digest: async (...arguments_) => {
          body[0] = "[".charCodeAt(0);
          signalDigestStarted();
          await digestGate;
          return realDigest(...arguments_);
        },
        verify: realVerify,
      },
    },
  });

  try {
    const claimPromise = claimProtectedBody(
      validEnvelope,
      body,
      timestampUnixSeconds,
      resolveOnly(key),
      () => "claimed",
    );
    await digestStarted;
    releaseDigest();
    const claimed = await claimPromise;
    assert.deepEqual(readClaimedProtectedBody(claimed), originalBody);
  } finally {
    Object.defineProperty(globalThis, "crypto", originalDescriptor);
  }
});

test("does not expose bytes when M23 rejects a body or its input type", async () => {
  const { claimProtectedBody, readClaimedProtectedBody } =
    await loadClaimedProtectedBody();
  const key = await createVerificationKey();

  for (const body of [
    new TextEncoder().encode('{"command":"altered"}'),
    "not raw bytes",
  ]) {
    const claimed = await claimProtectedBody(
      validEnvelope,
      body,
      timestampUnixSeconds,
      resolveOnly(key),
      () => "claimed",
    );

    assert.equal(claimed, null);
    assertUnreadable(readClaimedProtectedBody, claimed);
  }
});

test("does not expose bytes when M24 declines or fails the claim", async () => {
  const { claimProtectedBody, readClaimedProtectedBody } =
    await loadClaimedProtectedBody();
  const key = await createVerificationKey();

  for (const tryClaimReplay of [
    () => "already_claimed",
    () => {
      throw new Error("claim failed");
    },
    async () => Promise.reject(new Error("claim rejected")),
  ]) {
    const claimed = await claimProtectedBody(
      validEnvelope,
      new Uint8Array(rawBody),
      timestampUnixSeconds,
      resolveOnly(key),
      tryClaimReplay,
    );

    assert.equal(claimed, null);
    assertUnreadable(readClaimedProtectedBody, claimed);
  }
});

test("rejects forged, copied, accessor-backed, and proxied claimed-body lookalikes", async () => {
  const {
    claimProtectedBody,
    isClaimedProtectedBody,
    readClaimedProtectedBody,
  } = await loadClaimedProtectedBody();
  const key = await createVerificationKey();
  const claimed = await claimProtectedBody(
    validEnvelope,
    new Uint8Array(rawBody),
    timestampUnixSeconds,
    resolveOnly(key),
    () => "claimed",
  );
  const accessorLookalike = {};
  Object.defineProperty(accessorLookalike, "replayIdentity", {
    enumerable: true,
    get() {
      throw new Error("lookalike field read");
    },
  });
  const proxiedLookalike = new Proxy({}, {
    get() {
      throw new Error("lookalike field read");
    },
  });

  for (const lookalike of [
    { replayIdentity },
    { ...claimed },
    accessorLookalike,
    proxiedLookalike,
  ]) {
    assert.equal(isClaimedProtectedBody(lookalike), false);
    assertUnreadable(readClaimedProtectedBody, lookalike);
  }
});

test("keeps the claimed-body bridge internal and free of parsing, storage, configuration, and HTTP behavior", async () => {
  await loadClaimedProtectedBody();
  const source = readFileSync(
    fileURLToPath(
      new URL("../src/ingress/claimed-protected-body.ts", import.meta.url),
    ),
    "utf8",
  );
  const backendEntry = readFileSync(
    fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    "utf8",
  );

  for (const forbidden of [
    /JSON\.parse/u,
    /process\.env/u,
    /from ["']convex/u,
    /\bfetch\b/u,
    /\bMap\b/u,
    /\bsetTimeout\b/u,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
  assert.doesNotMatch(backendEntry, /claimed-protected-body/u);
});
