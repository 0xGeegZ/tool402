import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const routesUrl = new URL("../src/lib/dashboard-auth/dashboard-auth-routes.ts", import.meta.url);
const wrapperUrls = [
  new URL("../src/app/api/auth/metamask/challenge/route.ts", import.meta.url),
  new URL("../src/app/api/auth/metamask/verify/route.ts", import.meta.url),
  new URL("../src/app/api/auth/logout/route.ts", import.meta.url),
];
const routesTest = existsSync(fileURLToPath(routesUrl)) ? test : test.skip;
const wrapperTest = (url) => existsSync(fileURLToPath(url)) ? test : test.skip;
const origin = "https://app.tool402.example";
const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
const env = {
  TOOL402_DASHBOARD_AUTH_ORIGIN: origin,
  TOOL402_DASHBOARD_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
};
const previewOrigin = "https://tool402-ftxhxdvoh-indyweb.vercel.app";
const previewEnv = {
  TOOL402_DASHBOARD_AUTH_SECRET: env.TOOL402_DASHBOARD_AUTH_SECRET,
  VERCEL_ENV: "preview",
  VERCEL_URL: "tool402-ftxhxdvoh-indyweb.vercel.app",
};
const localOrigin = "http://localhost:4317";
const localEnv = {
  TOOL402_DASHBOARD_AUTH_ORIGIN: localOrigin,
  TOOL402_DASHBOARD_AUTH_SECRET: env.TOOL402_DASHBOARD_AUTH_SECRET,
  NODE_ENV: "development",
};

async function loadRoutes() {
  return import(routesUrl.href);
}

function post(path, body, options = {}) {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...options.headers },
    body: JSON.stringify(body),
  });
}

function rawPost(path, body, options = {}) {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...options.headers },
    body,
  });
}

function requestWithoutOrigin(path, body, options = {}) {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...options.headers },
    body,
  });
}

function cookieValues(response) {
  return response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
}

routesTest("fails closed before cookie or verifier work when configuration is invalid", async () => {
  const routes = await loadRoutes();
  let verifierCalls = 0;
  const response = await routes.handleChallengePost(post("/api/auth/metamask/challenge", { address }), {}, {
    createChallenge: async () => assert.fail("challenge work must not run without valid config"),
    verifyMessage: async () => { verifierCalls += 1; return true; },
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { outcome: "not_configured" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(cookieValues(response), []);
  assert.equal(verifierCalls, 0);
});

routesTest("issues a host-only sealed challenge with no-store", async () => {
  const routes = await loadRoutes();
  const response = await routes.handleChallengePost(post("/api/auth/metamask/challenge", { address }), env, {
    now: () => Date.parse("2026-09-11T12:00:00.000Z"),
    randomBytes: () => Uint8Array.from({ length: 16 }, (_, index) => index),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(await response.clone().json()).sort(), ["expiresAt", "message"]);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const [cookie] = cookieValues(response);
  assert.match(cookie, /^__Host-tool402-dashboard-challenge=/u);
  for (const attribute of ["Path=/", "Secure", "HttpOnly", "SameSite=Strict", "Max-Age=300"]) assert.match(cookie, new RegExp(attribute, "u"));
});

routesTest("uses development-only localhost cookies without Secure or __Host", async () => {
  const routes = await loadRoutes();
  const request = new Request(`${localOrigin}/api/auth/metamask/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: localOrigin },
    body: JSON.stringify({ address }),
  });
  const challenge = await routes.handleChallengePost(request, localEnv, {
    now: () => Date.parse("2026-09-11T12:00:00.000Z"),
    randomBytes: () => Uint8Array.from({ length: 16 }, (_, index) => index),
  });
  assert.equal(challenge.status, 200);
  const [challengeCookie] = cookieValues(challenge);
  assert.match(challengeCookie, /^tool402-local-dashboard-challenge=/u);
  assert.doesNotMatch(challengeCookie, /(?:Secure|__Host-)/u);

  const { message, challenge: challengeTicket } = await challenge.json();
  assert.equal(typeof challengeTicket, "string");
  const verification = await routes.handleVerifyPost(new Request(`${localOrigin}/api/auth/metamask/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: localOrigin,
    },
    body: JSON.stringify({ message, signature: `0x${"11".repeat(65)}`, challenge: challengeTicket }),
  }), localEnv, {
    now: () => Date.parse("2026-09-11T12:00:00.000Z"),
    verifyMessage: async () => true,
  });
  assert.equal(verification.status, 200);
  const cookies = cookieValues(verification).join("\n");
  assert.match(cookies, /tool402-local-dashboard-session=.*Path=\/.*HttpOnly.*SameSite=Strict.*Max-Age=28800/u);
  assert.doesNotMatch(cookies, /(?:Secure|__Host-)/u);
});

routesTest("does not expose or accept a body challenge outside localhost development", async () => {
  const routes = await loadRoutes();
  const challenge = await routes.handleChallengePost(post("/api/auth/metamask/challenge", { address }), env);
  assert.equal(challenge.status, 200);
  assert.deepEqual(Object.keys(await challenge.json()).sort(), ["expiresAt", "message"]);

  const verification = await routes.handleVerifyPost(post("/api/auth/metamask/verify", {
    message: "anything",
    signature: `0x${"11".repeat(65)}`,
    challenge: "not-accepted-over-https",
  }), env);
  assert.equal(verification.status, 401);
  assert.deepEqual(await verification.json(), { outcome: "rejected" });
});

routesTest("derives the exact Vercel Preview origin when no explicit origin is configured", async () => {
  const routes = await loadRoutes();
  const request = new Request(`${previewOrigin}/api/auth/metamask/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: previewOrigin },
    body: JSON.stringify({ address }),
  });

  const response = await routes.handleChallengePost(request, previewEnv, {
    now: () => Date.parse("2026-09-11T12:00:00.000Z"),
    randomBytes: () => Uint8Array.from({ length: 16 }, (_, index) => index),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.match(body.message, /URI: https:\/\/tool402-ftxhxdvoh-indyweb\.vercel\.app\/dashboard/u);
});

routesTest("fails closed for Vercel URLs outside Preview or outside canonical-origin grammar", async () => {
  const routes = await loadRoutes();
  for (const envOverride of [
    { VERCEL_ENV: "production" },
    { VERCEL_URL: "tool402-ftxhxdvoh-indyweb.vercel.app/not-a-host" },
  ]) {
    const response = await routes.handleChallengePost(new Request(`${previewOrigin}/api/auth/metamask/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: previewOrigin },
      body: JSON.stringify({ address }),
    }), { ...previewEnv, ...envOverride });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { outcome: "not_configured" });
  }
});

routesTest("rejects invalid challenge and verification requests before side effects", async () => {
  const routes = await loadRoutes();
  const challengeRequests = [
    requestWithoutOrigin("/api/auth/metamask/challenge", JSON.stringify({ address })),
    post("/api/auth/metamask/challenge", { address }, { headers: { origin: "https://other.tool402.example" } }),
    post("/api/auth/metamask/challenge", { address }, { headers: { "content-type": "text/plain" } }),
    post("/api/auth/metamask/challenge", { address }, { headers: { "content-type": "application/json; charset=utf-8" } }),
    post("/api/auth/metamask/challenge", { address, extra: true }),
    rawPost("/api/auth/metamask/challenge", JSON.stringify({ address: 42 })),
    rawPost("/api/auth/metamask/challenge", "[\"not an object\"]"),
    rawPost("/api/auth/metamask/challenge", "{not-json}"),
  ];
  let challengeCalls = 0;
  for (const request of challengeRequests) {
    const response = await routes.handleChallengePost(request, env, {
      createChallenge: async () => { challengeCalls += 1; assert.fail("invalid request must not create a challenge"); },
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { outcome: "rejected" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(cookieValues(response), []);
  }
  assert.equal(challengeCalls, 0);

  const challenge = await routes.handleChallengePost(post("/api/auth/metamask/challenge", { address }), env);
  const { message } = await challenge.json();
  const challengeCookie = cookieValues(challenge)[0].match(/^__Host-tool402-dashboard-challenge=([^;]+)/u)[1];
  const verificationRequests = [
    requestWithoutOrigin("/api/auth/metamask/verify", JSON.stringify({ message, signature: `0x${"11".repeat(65)}` }), { headers: { cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
    post("/api/auth/metamask/verify", { message, signature: `0x${"11".repeat(65)}` }, { headers: { origin: "https://other.tool402.example", cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
    post("/api/auth/metamask/verify", { message, signature: `0x${"11".repeat(65)}` }, { headers: { "content-type": "text/plain", cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
    post("/api/auth/metamask/verify", { message, signature: `0x${"11".repeat(65)}` }, { headers: { "content-type": "application/json; charset=utf-8", cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
    post("/api/auth/metamask/verify", { message, signature: `0x${"11".repeat(65)}`, extra: true }, { headers: { cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
    rawPost("/api/auth/metamask/verify", JSON.stringify({ message, signature: 42 }), { headers: { cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
    rawPost("/api/auth/metamask/verify", "[\"not an object\"]", { headers: { cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
    rawPost("/api/auth/metamask/verify", "{not-json}", { headers: { cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` } }),
  ];
  let verifierCalls = 0;
  for (const request of verificationRequests) {
    const response = await routes.handleVerifyPost(request, env, {
      verifyMessage: async () => { verifierCalls += 1; assert.fail("invalid request must not verify a signature"); },
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { outcome: "rejected" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(cookieValues(response).join("\n"), /__Host-tool402-dashboard-challenge=.*Max-Age=0/u);
    assert.doesNotMatch(cookieValues(response).join("\n"), /__Host-tool402-dashboard-session=/u);
  }
  assert.equal(verifierCalls, 0);
});

routesTest("returns not configured without cookies for every auth route", async () => {
  const routes = await loadRoutes();
  const requests = [
    routes.handleVerifyPost(post("/api/auth/metamask/verify", { message: "anything", signature: `0x${"11".repeat(65)}` }), {}),
    routes.handleLogoutPost(post("/api/auth/logout", {}), {}),
  ];
  for (const response of await Promise.all(requests)) {
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { outcome: "not_configured" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(cookieValues(response), []);
  }
});

routesTest("clears the challenge and returns only generic rejection after verification fails", async () => {
  const routes = await loadRoutes();
  const response = await routes.handleVerifyPost(post("/api/auth/metamask/verify", { message: "wrong", signature: `0x${"11".repeat(65)}` }, {
    headers: { cookie: "__Host-tool402-dashboard-challenge=altered" },
  }), env, { verifyMessage: async () => assert.fail("invalid challenge must not verify") });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { outcome: "rejected" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(cookieValues(response).join("\n"), /__Host-tool402-dashboard-challenge=.*Max-Age=0/u);
});

routesTest("authenticates once and sets only the declared eight-hour session cookie", async () => {
  const routes = await loadRoutes();
  const challenge = await routes.handleChallengePost(post("/api/auth/metamask/challenge", { address }), env);
  const { message } = await challenge.json();
  const challengeCookie = cookieValues(challenge)[0].match(/^__Host-tool402-dashboard-challenge=([^;]+)/u)[1];
  let verifierCalls = 0;
  const response = await routes.handleVerifyPost(post("/api/auth/metamask/verify", { message, signature: `0x${"11".repeat(65)}` }, {
    headers: { cookie: `__Host-tool402-dashboard-challenge=${challengeCookie}` },
  }), env, { verifyMessage: async () => { verifierCalls += 1; return true; } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { outcome: "authenticated" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(verifierCalls, 1);
  const cookies = cookieValues(response).join("\n");
  assert.match(cookies, /__Host-tool402-dashboard-challenge=.*Max-Age=0/u);
  assert.match(cookies, /__Host-tool402-dashboard-session=.*Path=\/.*Secure.*HttpOnly.*SameSite=Strict.*Max-Age=28800/u);
});

routesTest("clears both host-only cookies with an empty no-store logout response", async () => {
  const routes = await loadRoutes();
  const response = await routes.handleLogoutPost(post("/api/auth/logout", {}), env);
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const cookies = cookieValues(response).join("\n");
  for (const name of ["__Host-tool402-dashboard-challenge", "__Host-tool402-dashboard-session"]) {
    assert.match(cookies, new RegExp(`${name}=.*Path=/.*Secure.*HttpOnly.*SameSite=Strict.*Max-Age=0`, "u"));
  }
});

for (const url of wrapperUrls) {
  wrapperTest(url)(`keeps ${fileURLToPath(url)} a thin POST-only auth wrapper`, async () => {
    const source = await readFile(url, "utf8");
    assert.match(source, /export\s+async\s+function\s+POST\s*\(\s*request\s*:\s*Request\s*\)/u);
    assert.doesNotMatch(source, /export\s+(?:async\s+)?function\s+GET\b/u);
    assert.doesNotMatch(source, /(?:wallet|command|relay|convex|viem|fetch)\b/iu);
  });
}
