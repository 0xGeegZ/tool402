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
const requiredSources = [routesUrl, ...wrapperUrls];
const sourcesExist = requiredSources.every((url) => existsSync(fileURLToPath(url)));
const implementedTest = sourcesExist ? test : test.skip;
const origin = "https://app.tool402.example";
const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
const env = {
  TOOL402_DASHBOARD_AUTH_ORIGIN: origin,
  TOOL402_DASHBOARD_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
};

test("requires the declared dashboard auth route modules and POST wrappers", () => {
  const missing = requiredSources.map(fileURLToPath).filter((path) => !existsSync(path));
  assert.deepEqual(missing, [], `missing declared source modules: ${missing.join(", ")}`);
});

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

function cookieValues(response) {
  return response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
}

implementedTest("fails closed before cookie or verifier work when configuration is invalid", async () => {
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

implementedTest("issues a host-only sealed challenge with no-store", async () => {
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

implementedTest("clears the challenge and returns only generic rejection after verification fails", async () => {
  const routes = await loadRoutes();
  const response = await routes.handleVerifyPost(post("/api/auth/metamask/verify", { message: "wrong", signature: `0x${"11".repeat(65)}` }, {
    headers: { cookie: "__Host-tool402-dashboard-challenge=altered" },
  }), env, { verifyMessage: async () => assert.fail("invalid challenge must not verify") });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { outcome: "rejected" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(cookieValues(response).join("\n"), /__Host-tool402-dashboard-challenge=.*Max-Age=0/u);
});

implementedTest("clears both host-only cookies with an empty no-store logout response", async () => {
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

implementedTest("keeps each app route a thin POST-only auth wrapper", async () => {
  for (const url of wrapperUrls) {
    const source = await readFile(url, "utf8");
    assert.match(source, /export\s+async\s+function\s+POST\s*\(\s*request\s*:\s*Request\s*\)/u);
    assert.doesNotMatch(source, /export\s+(?:async\s+)?function\s+GET\b/u);
    assert.doesNotMatch(source, /(?:wallet|command|relay|convex|viem|fetch)\b/iu);
  }
});
