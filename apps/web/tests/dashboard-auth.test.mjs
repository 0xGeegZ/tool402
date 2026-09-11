import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const coreUrl = new URL("../src/lib/dashboard-auth/dashboard-auth.ts", import.meta.url);
const clientUrl = new URL("../src/components/auth/metamask-dashboard-sign-in.tsx", import.meta.url);
const signInUrl = new URL("../src/app/sign-in/page.tsx", import.meta.url);
const dashboardLayoutUrl = new URL("../src/app/dashboard/layout.tsx", import.meta.url);
const allS38Sources = [
  coreUrl,
  new URL("../src/lib/dashboard-auth/dashboard-auth-routes.ts", import.meta.url),
  new URL("../src/app/api/auth/metamask/challenge/route.ts", import.meta.url),
  new URL("../src/app/api/auth/metamask/verify/route.ts", import.meta.url),
  new URL("../src/app/api/auth/logout/route.ts", import.meta.url),
  clientUrl,
  signInUrl,
  dashboardLayoutUrl,
];
const coreTest = existsSync(fileURLToPath(coreUrl)) ? test : test.skip;
const clientTest = existsSync(fileURLToPath(clientUrl)) ? test : test.skip;
const signInTest = existsSync(fileURLToPath(signInUrl)) ? test : test.skip;
const dashboardLayoutTest = existsSync(fileURLToPath(dashboardLayoutUrl)) ? test : test.skip;
const allS38AbsentTest = allS38Sources.every((url) => !existsSync(fileURLToPath(url))) ? test : test.skip;
const origin = "https://app.tool402.example";
const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
const nowMilliseconds = Date.parse("2026-09-11T12:00:00.000Z");
const secret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

allS38AbsentTest("reports every declared S38 source path that remains absent", () => {
  const missing = allS38Sources.map(fileURLToPath).filter((path) => !existsSync(path));
  assert.deepEqual(missing, [], `missing declared source modules: ${missing.join(", ")}`);
});

async function loadApi() {
  return import(coreUrl.href);
}

function fixedDependencies(overrides = {}) {
  let verifyMessageCalls = 0;
  return {
    now: () => nowMilliseconds,
    randomBytes: () => Uint8Array.from({ length: 16 }, (_, index) => index),
    hmacSha256: async (_key, value) => {
      return new Uint8Array(await crypto.subtle.digest("SHA-256", value));
    },
    verifyMessage: async () => {
      verifyMessageCalls += 1;
      return true;
    },
    get verifyMessageCalls() {
      return verifyMessageCalls;
    },
    ...overrides,
  };
}

function countingHmac(byte) {
  let calls = 0;
  return {
    hmacSha256: async () => {
      calls += 1;
      return Uint8Array.from({ length: 32 }, () => byte);
    },
    get calls() {
      return calls;
    },
  };
}

function challengeInput(overrides = {}) {
  return { address, env: { TOOL402_DASHBOARD_AUTH_ORIGIN: origin, TOOL402_DASHBOARD_AUTH_SECRET: secret }, ...overrides };
}

function tamper(cookie) {
  const replacement = cookie.at(-1) === "a" ? "b" : "a";
  return `${cookie.slice(0, -1)}${replacement}`;
}

async function sealFixture(text) {
  const encoded = Buffer.from(text).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    Buffer.from(secret, "hex"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded)));
  return `${encoded}.${Buffer.from(mac).toString("base64url")}`;
}

coreTest("exports the fixed Hedera challenge and session lifetimes", async () => {
  const api = await loadApi();
  assert.deepEqual(Object.keys(api).sort(), [
    "CHALLENGE_MAX_AGE_SECONDS",
    "DASHBOARD_AUTH_CHAIN_ID",
    "SESSION_MAX_AGE_SECONDS",
    "createChallenge",
    "readDashboardSession",
    "verifyChallenge",
  ]);
  assert.equal(api.DASHBOARD_AUTH_CHAIN_ID, 296);
  assert.equal(api.CHALLENGE_MAX_AGE_SECONDS, 300);
  assert.equal(api.SESSION_MAX_AGE_SECONDS, 28_800);
  for (const name of ["createChallenge", "verifyChallenge", "readDashboardSession"]) {
    assert.equal(typeof api[name], "function");
  }
});

coreTest("creates the exact lower-case five-minute personal-sign message", async () => {
  const api = await loadApi();
  const challenge = await api.createChallenge(challengeInput(), fixedDependencies());

  const issuedAt = "2026-09-11T12:00:00.000Z";
  const expiresAt = "2026-09-11T12:05:00.000Z";
  const nonce = "AAECAwQFBgcICQoLDA0ODw";
  assert.match(challenge.cookie, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u);
  assert.equal(challenge.message, `app.tool402.example wants you to sign in with your Ethereum account:\n${address}\n\nSign in to the Tool402 dashboard.\n\nURI: ${origin}/dashboard\nVersion: 1\nChain ID: 296\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expiresAt}`);
  assert.equal(challenge.expiresAt, expiresAt);
  assert.match(nonce, /^[A-Za-z0-9_-]{22}$/u);
});

coreTest("rejects invalid addresses and creates only canonical lower-case challenges", async () => {
  const api = await loadApi();
  for (const invalidAddress of ["0x7E5F4552091A69125D5DFCB7B8C2659029395BDF", "0x1234", "not-an-address"]) {
    await assert.rejects(api.createChallenge(challengeInput({ address: invalidAddress }), fixedDependencies()));
  }
});

coreTest("uses the injected HMAC seam to seal and validate challenges", async () => {
  const api = await loadApi();
  const sealingHmac = countingHmac(7);
  const sealingDependencies = fixedDependencies({ hmacSha256: sealingHmac.hmacSha256 });
  const created = await api.createChallenge(challengeInput(), sealingDependencies);
  assert.equal(sealingHmac.calls, 1, "challenge sealing must use the injected HMAC seam");

  const matchingHmac = countingHmac(7);
  const matchingDependencies = fixedDependencies({ hmacSha256: matchingHmac.hmacSha256 });
  const accepted = await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: `0x${"11".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, matchingDependencies);
  assert.equal(accepted.kind, "authenticated");
  assert.ok(matchingHmac.calls >= 2, "verification must validate the challenge and seal the session");

  const rejected = await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: `0x${"11".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, fixedDependencies({ hmacSha256: countingHmac(8).hmacSha256 }));
  assert.deepEqual(rejected, { kind: "rejected" });
});

coreTest("rejects an altered challenge before signature verification", async () => {
  const api = await loadApi();
  const created = await api.createChallenge(challengeInput(), fixedDependencies());
  const dependencies = fixedDependencies();

  const result = await api.verifyChallenge({
    challengeCookie: tamper(created.cookie),
    message: created.message,
    signature: `0x${"11".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, dependencies);

  assert.deepEqual(result, { kind: "rejected" });
  assert.equal(dependencies.verifyMessageCalls, 0);
});

coreTest("rejects an expired or cross-origin challenge without revealing why", async () => {
  const api = await loadApi();
  const created = await api.createChallenge(challengeInput(), fixedDependencies());
  for (const input of [
    { origin: "https://other.tool402.example" },
    { nowMilliseconds: nowMilliseconds + 300_001 },
  ]) {
    const dependencies = fixedDependencies(input.nowMilliseconds ? { now: () => input.nowMilliseconds } : {});
    const result = await api.verifyChallenge({
      challengeCookie: created.cookie,
      message: created.message,
      signature: `0x${"11".repeat(65)}`,
      origin: input.origin ?? origin,
      env: challengeInput().env,
    }, dependencies);
    assert.deepEqual(result, { kind: "rejected" });
    assert.equal(dependencies.verifyMessageCalls, 0);
  }
});

coreTest("rejects malformed signatures and failed verification generically", async () => {
  const api = await loadApi();
  const created = await api.createChallenge(challengeInput(), fixedDependencies());
  const malformedDependencies = fixedDependencies();
  assert.deepEqual(await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: "0x1234",
    origin,
    env: challengeInput().env,
  }, malformedDependencies), { kind: "rejected" });
  assert.equal(malformedDependencies.verifyMessageCalls, 0);

  assert.deepEqual(await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: `0x${"11".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, fixedDependencies({ verifyMessage: async () => false })), { kind: "rejected" });
});

coreTest("fails closed when a grammar-valid signature makes the verifier throw", async () => {
  const api = await loadApi();
  const dependencies = { now: () => nowMilliseconds, randomBytes: () => Uint8Array.from({ length: 16 }, (_, index) => index) };
  const created = await api.createChallenge(challengeInput(), dependencies);
  assert.deepEqual(await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: `0x${"00".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, { now: () => nowMilliseconds }), { kind: "rejected" });

  assert.deepEqual(await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: `0x${"11".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, { now: () => nowMilliseconds, verifyMessage: async () => { throw new Error("verifier failure"); } }), { kind: "rejected" });
});

coreTest("rejects noncanonical challenge envelopes before signature verification", async () => {
  const api = await loadApi();
  const created = await api.createChallenge(challengeInput(), fixedDependencies());
  const issuedAt = "2026-09-11T12:00:00.000Z";
  const expiresAt = "2026-09-11T12:05:00.000Z";
  const nonce = "AAECAwQFBgcICQoLDA0ODw";
  const payloads = [
    `{"v":1,"address":"${address}","nonce":"${nonce}","issuedAt":"${issuedAt}","expiresAt":"${expiresAt}","origin":"${origin}","extra":true}`,
    `{"v":1,"address":"${address}","nonce":"${nonce}","issuedAt":"${issuedAt}","expiresAt":"${expiresAt}"}`,
    `{"address":"${address}","v":1,"nonce":"${nonce}","issuedAt":"${issuedAt}","expiresAt":"${expiresAt}","origin":"${origin}"}`,
    `{"v":1,"address":["${address}"],"nonce":"${nonce}","issuedAt":"${issuedAt}","expiresAt":"${expiresAt}","origin":"${origin}"}`,
    `{"v":1,"address":"${address}","nonce":"AAECAwQFBgcICQoLDA0ODx","issuedAt":"${issuedAt}","expiresAt":"${expiresAt}","origin":"${origin}"}`,
  ];
  for (const payload of payloads) {
    let verifierCalls = 0;
    const dependencies = {
      now: () => nowMilliseconds,
      verifyMessage: async () => {
        verifierCalls += 1;
        return true;
      },
    };
    assert.deepEqual(await api.verifyChallenge({
      challengeCookie: await sealFixture(payload),
      message: created.message,
      signature: `0x${"11".repeat(65)}`,
      origin,
      env: challengeInput().env,
    }, dependencies), { kind: "rejected" });
    assert.equal(verifierCalls, 0);
  }
});

coreTest("requires challenge and session times to satisfy issuedAt <= now < expiresAt", async () => {
  const api = await loadApi();
  const created = await api.createChallenge(challengeInput(), fixedDependencies());
  for (const current of [nowMilliseconds - 1, nowMilliseconds + 300_000, -1, 1.5]) {
    const dependencies = fixedDependencies({ now: () => current });
    assert.deepEqual(await api.verifyChallenge({
      challengeCookie: created.cookie,
      message: created.message,
      signature: `0x${"11".repeat(65)}`,
      origin,
      env: challengeInput().env,
    }, dependencies), { kind: "rejected" });
    assert.equal(dependencies.verifyMessageCalls, 0);
  }

  const sessionPayloads = [
    `{"v":1,"address":"${address}","issuedAt":"2026-09-11T12:00:00.000Z","expiresAt":"2026-09-11T20:00:00.000Z","extra":true}`,
    `{"v":1,"address":"${address}","issuedAt":"2026-09-11T12:00:00.000Z"}`,
    `{"v":1,"address":["${address}"],"issuedAt":"2026-09-11T12:00:00.000Z","expiresAt":"2026-09-11T20:00:00.000Z"}`,
    `{"address":"${address}","v":1,"issuedAt":"2026-09-11T12:00:00.000Z","expiresAt":"2026-09-11T20:00:00.000Z"}`,
  ];
  for (const payload of sessionPayloads) assert.equal(await api.readDashboardSession(await sealFixture(payload), challengeInput().env, nowMilliseconds), null);

  const validSession = await sealFixture(`{"v":1,"address":"${address}","issuedAt":"2026-09-11T12:00:00.000Z","expiresAt":"2026-09-11T20:00:00.000Z"}`);
  assert.equal(await api.readDashboardSession(validSession, challengeInput().env, nowMilliseconds - 1), null);
  assert.equal(await api.readDashboardSession(validSession, challengeInput().env, nowMilliseconds + 28_800_000), null);
  assert.equal(await api.readDashboardSession(validSession, challengeInput().env, -1), null);
  assert.equal(await api.readDashboardSession(validSession, challengeInput().env, 1.5), null);
});

coreTest("issues sessions for verified challenges and rejects them after eight hours", async () => {
  const api = await loadApi();
  const created = await api.createChallenge(challengeInput(), {
    now: () => nowMilliseconds,
    randomBytes: () => Uint8Array.from({ length: 16 }, (_, index) => index),
  });
  const verified = await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: `0x${"11".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, {
    now: () => nowMilliseconds,
    verifyMessage: async () => true,
  });

  assert.equal(verified.kind, "authenticated");
  assert.deepEqual(await api.readDashboardSession(verified.sessionCookie, challengeInput().env, nowMilliseconds), {
    address,
    issuedAt: "2026-09-11T12:00:00.000Z",
    expiresAt: "2026-09-11T20:00:00.000Z",
  });
  assert.equal(await api.readDashboardSession(verified.sessionCookie, challengeInput().env, nowMilliseconds + 28_800_001), null);
});

clientTest("keeps sign-in limited to the accepted local authentication boundary", async () => {
  const client = await readFile(clientUrl, "utf8");
  assert.match(client, /\breadCurrentSession\b/u);
  assert.match(client, /\bpersonal_sign\b/u);
  assert.match(client, /\/api\/auth\/metamask\/challenge/u);
  assert.match(client, /\/api\/auth\/metamask\/verify/u);
  assert.match(client, /window\.location\.assign\(\s*["']\/dashboard["']\s*\)/u);
  assert.doesNotMatch(client, /\b(?:eth_send(?:Raw)?Transaction|send(?:Raw)?Transaction|transaction|relay|localStorage|sessionStorage|indexedDB|setTimeout|setInterval|discover(?:y)?|requestProvider)\b/u);
});

signInTest("redirects valid sessions and otherwise renders the public sign-in boundary", async () => {
  const signIn = await readFile(signInUrl, "utf8");
  assert.match(signIn, /\breadDashboardSession\b/u);
  assert.match(signIn, /redirect\(\s*["']\/dashboard["']\s*\)/u);
  assert.match(signIn, /\bWalletIsland\b/u);
  assert.match(signIn, /heading\s*=\s*["']Sign in with MetaMask["']/u);
});

dashboardLayoutTest("guards dashboard descendants on the server before rendering them", async () => {
  const layout = await readFile(dashboardLayoutUrl, "utf8");
  assert.match(layout, /\breadDashboardSession\b/u);
  assert.match(layout, /\bcookies\(\)/u);
  assert.match(layout, /redirect\(\s*["']\/sign-in["']\s*\)/u);
  assert.doesNotMatch(layout, /["']use client["']/u);
});
