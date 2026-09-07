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

async function loadVerifier() {
  return import(
    new URL("../src/ingress/protected-ingress-verifier.ts", import.meta.url),
  );
}

async function loadClaim() {
  return import(
    new URL("../src/ingress/protected-replay-claim.ts", import.meta.url),
  );
}

async function createVerifiedIngress() {
  const { verifyProtectedIngress } = await loadVerifier();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    fixedKeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await verifyProtectedIngress(
    validEnvelope,
    rawBody,
    timestampUnixSeconds,
    (keyId) => (keyId === "key-A" ? key : undefined),
  );

  assert.notEqual(verified, null);
  return verified;
}

test("claims one real verified replay identity into a sealed minimal capability", async () => {
  const { claimProtectedReplay, isClaimedProtectedReplay } = await loadClaim();
  const verified = await createVerifiedIngress();
  const calls = [];

  const claimed = await claimProtectedReplay(verified, async (identity) => {
    calls.push(identity);
    return "claimed";
  });

  assert.deepEqual(calls, [replayIdentity]);
  assert.deepEqual(claimed, { replayIdentity });
  assert.deepEqual(Object.keys(claimed), ["replayIdentity"]);
  assert.deepEqual(Reflect.ownKeys(claimed), ["replayIdentity"]);
  assert.equal(Object.isFrozen(claimed), true);
  assert.equal(isClaimedProtectedReplay(claimed), true);
  assert.equal(isClaimedProtectedReplay({ ...claimed }), false);
  assert.equal(isClaimedProtectedReplay({ replayIdentity }), false);
});

test("rejects every unregistered verified lookalike before a claim callback", async () => {
  const { claimProtectedReplay } = await loadClaim();
  const hostileProxy = new Proxy({}, {
    get() {
      throw new Error("forged field read");
    },
  });
  const accessorLookalike = {};
  Object.defineProperty(accessorLookalike, "replayIdentity", {
    enumerable: true,
    get() {
      throw new Error("forged accessor read");
    },
  });

  for (const forged of [
    null,
    undefined,
    "not a capability",
    { replayIdentity },
    hostileProxy,
    accessorLookalike,
  ]) {
    let calls = 0;
    const claimed = await claimProtectedReplay(forged, () => {
      calls += 1;
      return "claimed";
    });

    assert.equal(claimed, null);
    assert.equal(calls, 0);
  }

  const verified = await createVerifiedIngress();
  let copiedCalls = 0;
  const copiedClaim = await claimProtectedReplay({ ...verified }, () => {
    copiedCalls += 1;
    return "claimed";
  });

  assert.equal(copiedClaim, null);
  assert.equal(copiedCalls, 0);
});

test("fails closed for replayed, malformed, throwing, and rejected claim outcomes", async () => {
  const { claimProtectedReplay } = await loadClaim();
  const verified = await createVerifiedIngress();
  const outcomes = [
    () => "already_claimed",
    () => undefined,
    () => true,
    () => "claimed ",
    () => {
      throw new Error("claim failed");
    },
    async () => Promise.reject(new Error("claim rejected")),
  ];

  for (const claim of outcomes) {
    const claimed = await claimProtectedReplay(verified, claim);
    assert.equal(claimed, null);
  }

  assert.equal(await claimProtectedReplay(verified, null), null);
});

test("keeps the adapter internal and free of storage, command, configuration, and HTTP behavior", async () => {
  await loadClaim();
  const source = readFileSync(
    fileURLToPath(
      new URL("../src/ingress/protected-replay-claim.ts", import.meta.url),
    ),
    "utf8",
  );
  const backendEntry = readFileSync(
    fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    "utf8",
  );

  for (const forbidden of [
    /process\.env/u,
    /from ["']convex/u,
    /\bfetch\b/u,
    /\bJSON\.parse\b/u,
    /\bMap\b/u,
    /\bsetTimeout\b/u,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
  assert.doesNotMatch(backendEntry, /protected-replay-claim/u);
});
