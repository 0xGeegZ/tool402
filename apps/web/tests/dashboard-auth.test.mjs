import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const coreUrl = new URL("../src/lib/dashboard-auth/dashboard-auth.ts", import.meta.url);
const clientUrl = new URL("../src/components/auth/metamask-dashboard-sign-in.tsx", import.meta.url);
const dashboardLayoutUrl = new URL("../src/app/dashboard/layout.tsx", import.meta.url);
const requiredSources = [coreUrl, clientUrl, dashboardLayoutUrl];
const sourcesExist = requiredSources.every((url) => existsSync(fileURLToPath(url)));
const implementedTest = sourcesExist ? test : test.skip;
const origin = "https://app.tool402.example";
const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
const nowMilliseconds = Date.parse("2026-09-11T12:00:00.000Z");
const secret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

test("requires the declared dashboard auth core, client, and layout modules", () => {
  const missing = requiredSources.map(fileURLToPath).filter((path) => !existsSync(path));
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
    hmacSha256: async (_key, value) => new Uint8Array(await crypto.subtle.digest("SHA-256", value)),
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

function challengeInput(overrides = {}) {
  return { address, env: { TOOL402_DASHBOARD_AUTH_ORIGIN: origin, TOOL402_DASHBOARD_AUTH_SECRET: secret }, ...overrides };
}

function tamper(cookie) {
  const replacement = cookie.at(-1) === "a" ? "b" : "a";
  return `${cookie.slice(0, -1)}${replacement}`;
}

implementedTest("exports the fixed Hedera challenge and session lifetimes", async () => {
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

implementedTest("creates the exact lower-case five-minute personal-sign message", async () => {
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

implementedTest("rejects invalid addresses and creates only canonical lower-case challenges", async () => {
  const api = await loadApi();
  for (const invalidAddress of ["0x7E5F4552091A69125D5DFCB7B8C2659029395BDF", "0x1234", "not-an-address"]) {
    await assert.rejects(api.createChallenge(challengeInput({ address: invalidAddress }), fixedDependencies()));
  }
});

implementedTest("rejects an altered challenge before signature verification", async () => {
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

implementedTest("rejects an expired or cross-origin challenge without revealing why", async () => {
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

implementedTest("rejects malformed signatures and failed verification generically", async () => {
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

implementedTest("issues sessions for verified challenges and rejects them after eight hours", async () => {
  const api = await loadApi();
  const created = await api.createChallenge(challengeInput(), fixedDependencies());
  const verified = await api.verifyChallenge({
    challengeCookie: created.cookie,
    message: created.message,
    signature: `0x${"11".repeat(65)}`,
    origin,
    env: challengeInput().env,
  }, fixedDependencies());

  assert.equal(verified.kind, "authenticated");
  assert.deepEqual(await api.readDashboardSession(verified.sessionCookie, challengeInput().env, nowMilliseconds), {
    address,
    issuedAt: "2026-09-11T12:00:00.000Z",
    expiresAt: "2026-09-11T20:00:00.000Z",
  });
  assert.equal(await api.readDashboardSession(verified.sessionCookie, challengeInput().env, nowMilliseconds + 28_800_001), null);
});

implementedTest("keeps sign-in limited to the accepted local authentication boundary", async () => {
  const client = await readFile(clientUrl, "utf8");
  assert.match(client, /\breadCurrentSession\b/u);
  assert.match(client, /\bpersonal_sign\b/u);
  assert.match(client, /\/api\/auth\/metamask\/challenge/u);
  assert.match(client, /\/api\/auth\/metamask\/verify/u);
  assert.match(client, /window\.location\.assign\(\s*["']\/dashboard["']\s*\)/u);
  assert.doesNotMatch(client, /\b(?:eth_send(?:Raw)?Transaction|send(?:Raw)?Transaction|transaction|relay|localStorage|sessionStorage|indexedDB|setTimeout|setInterval|discover(?:y)?|requestProvider)\b/u);
});

implementedTest("guards dashboard descendants on the server before rendering them", async () => {
  const layout = await readFile(dashboardLayoutUrl, "utf8");
  assert.match(layout, /\breadDashboardSession\b/u);
  assert.match(layout, /\bcookies\(\)/u);
  assert.match(layout, /redirect\(\s*["']\/sign-in["']\s*\)/u);
  assert.doesNotMatch(layout, /["']use client["']/u);
});
