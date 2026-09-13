import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { hashSignal } from "@worldcoin/idkit/hashing";
import typescript from "typescript";

import { PROTECTED_JSON_MAX_BYTES } from "../src/lib/bounded-request-json.ts";

const moduleUrl = new URL("../src/lib/world/human-check.ts", import.meta.url);
const requestRouteUrl = new URL("../src/app/api/world/request/route.ts", import.meta.url);
const verifyRouteUrl = new URL("../src/app/api/world/verify/route.ts", import.meta.url);
const clientComponentUrl = new URL("../src/components/dashboard/world-human-check.tsx", import.meta.url);
const identityCardUrl = new URL("../src/components/dashboard/dashboard-identity.tsx", import.meta.url);
const dashboardPageUrl = new URL("../src/app/dashboard/page.tsx", import.meta.url);

const declaredSourceUrls = [moduleUrl, requestRouteUrl, verifyRouteUrl, clientComponentUrl, identityCardUrl];
const implementedTest = declaredSourceUrls.every((url) => existsSync(url)) ? test : test.skip;

const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
const otherAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";

const authEnvironment = Object.freeze({
  TOOL402_DASHBOARD_AUTH_ORIGIN: "https://tool402.example",
  TOOL402_DASHBOARD_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
});

const configuredEnvironment = Object.freeze({
  WORLD_APP_ID: "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  WORLD_RP_ID: "rp_aaaaaaaaaaaaaaaa",
  WORLD_RP_SIGNING_KEY: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  WORLD_ACTION: "issuer-publish",
  WORLD_ENVIRONMENT: "sandbox",
  ...authEnvironment,
});
const configuredEnvironmentNames = Object.freeze(Object.keys(configuredEnvironment));

const dashboardAuth = await import(new URL("../src/lib/dashboard-auth/dashboard-auth.ts", import.meta.url).href);

async function sessionHeaderFor(sessionAddress) {
  const challenge = await dashboardAuth.createChallenge({ address: sessionAddress, env: authEnvironment });
  const verified = await dashboardAuth.verifyChallenge({
    challengeCookie: challenge.cookie,
    message: challenge.message,
    signature: `0x${"a".repeat(130)}`,
    origin: authEnvironment.TOOL402_DASHBOARD_AUTH_ORIGIN,
    env: authEnvironment,
  }, { verifyMessage: async () => true });
  assert.equal(verified.kind, "authenticated");
  return `__Host-tool402-dashboard-session=${verified.sessionCookie}`;
}

const sessionHeader = await sessionHeaderFor(address);
const otherSessionHeader = await sessionHeaderFor(otherAddress);

function boundResult(signalAddress) {
  return Object.freeze({
    protocol_version: "3.0",
    action: "issuer-publish",
    environment: "sandbox",
    nonce: "opaque-nonce",
    responses: Object.freeze([Object.freeze({
      identifier: "selfie",
      signal_hash: hashSignal(signalAddress),
      proof: "opaque-proof",
      merkle_root: "0x01",
      nullifier: "opaque-nullifier",
    })]),
  });
}

async function loadRoute(routeUrl) {
  const source = await readFile(routeUrl, "utf8");
  const world = await import(moduleUrl.href);
  const { outputText } = typescript.transpileModule(source, {
    fileName: fileURLToPath(routeUrl),
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  const nextResponse = {
    json(value, init = {}) {
      const response = new Response(JSON.stringify(value), init);
      response.cookies = {
        set(name, cookieValue, options) {
          const attributes = [
            `Path=${options.path}`,
            `Max-Age=${options.maxAge}`,
            options.httpOnly ? "HttpOnly" : "",
            options.secure ? "Secure" : "",
            `SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`,
          ].filter(Boolean);
          response.headers.append("set-cookie", `${name}=${cookieValue}; ${attributes.join("; ")}`);
        },
      };
      return response;
    },
  };
  runInNewContext(outputText, {
    exports: module.exports,
    require(specifier) {
      if (specifier === "next/server") return { NextResponse: nextResponse };
      if (specifier === "../../../../lib/world/human-check") return world;
      assert.fail(`unexpected route import: ${specifier}`);
    },
    Request,
    Response,
    AbortSignal,
    fetch: (...args) => globalThis.fetch(...args),
    process: { env: process.env },
  }, { filename: fileURLToPath(routeUrl) });
  return module.exports;
}

async function withEnvironment(values, callback) {
  const previous = Object.fromEntries(configuredEnvironmentNames.map((name) => [name, process.env[name]]));
  for (const name of configuredEnvironmentNames) {
    if (values[name] === undefined) delete process.env[name];
    else process.env[name] = values[name];
  }
  try {
    return await callback();
  } finally {
    for (const name of configuredEnvironmentNames) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}

async function withCountedFetch(callback) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    return await callback(calls);
  } finally {
    globalThis.fetch = original;
  }
}

async function withWorldFailure(status, body, callback) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(body, { status });
  try {
    return await callback();
  } finally {
    globalThis.fetch = original;
  }
}

function requestOf(payload, options = {}) {
  const { path = "/api/world/verify", cookie = sessionHeader } = options;
  const headers = { "content-type": "application/json" };
  if (cookie !== null) headers.cookie = cookie;
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

test("requires the declared S47 World human check source paths before GREEN", () => {
  for (const url of declaredSourceUrls) {
    assert.equal(existsSync(url), true, `missing declared S47 source path: ${fileURLToPath(url)}`);
  }
});

implementedTest("declares the browser-scoped cookie contract as fixed constants", async () => {
  const world = await import(moduleUrl.href);

  assert.equal(world.WORLD_HUMAN_COOKIE, "tool402-world-human");
  assert.equal(world.WORLD_HUMAN_MAX_AGE_SECONDS, 2_592_000);
  assert.equal(world.WORLD_CONTEXT_SECONDS, 300);
});

implementedTest("accepts only a canonical lower-case address", async () => {
  const world = await import(moduleUrl.href);

  assert.equal(world.isCanonicalWorldAddress(address), true);
  for (const candidate of [
    "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    "0x7e5f4552091a69125d5dfcb7b8c2659029395bd",
    "7e5f4552091a69125d5dfcb7b8c2659029395bdf",
    "0xNOT_AN_ADDRESS",
    "",
    null,
    undefined,
    123,
    { address },
  ]) {
    assert.equal(world.isCanonicalWorldAddress(candidate), false, `accepted ${String(candidate)}`);
  }
});

implementedTest("fails closed on every missing or malformed configuration name", async () => {
  const world = await import(moduleUrl.href);

  assert.notEqual(world.createWorldRequest(address, configuredEnvironment), null);
  assert.equal(world.readWorldConfigured(configuredEnvironment), true);

  const rejected = [
    { WORLD_APP_ID: undefined },
    { WORLD_APP_ID: "app_short" },
    { WORLD_APP_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    { WORLD_RP_ID: undefined },
    { WORLD_RP_ID: "rp_tooshort" },
    { WORLD_RP_SIGNING_KEY: undefined },
    { WORLD_RP_SIGNING_KEY: "0xnothex" },
    { WORLD_RP_SIGNING_KEY: `0x${"a".repeat(63)}` },
    { WORLD_ACTION: undefined },
    { WORLD_ACTION: "Issuer-Publish" },
    { WORLD_ACTION: "issuer publish" },
    { WORLD_ACTION: "a".repeat(65) },
    { WORLD_ENVIRONMENT: undefined },
    { WORLD_ENVIRONMENT: "staging" },
    { WORLD_ENVIRONMENT: "Sandbox" },
  ];

  for (const override of rejected) {
    const env = { ...configuredEnvironment, ...override };
    const name = Object.keys(override)[0];
    assert.equal(world.createWorldRequest(address, env), null, `accepted ${name}`);
    assert.equal(world.worldVerificationUrl(env), null, `accepted ${name}`);
    assert.equal(await world.createHumanCookie(address, env), null, `accepted ${name}`);
    assert.equal(world.readWorldConfigured(env), false, `accepted ${name}`);
  }
});

implementedTest("keeps the portal action and accepts the signing key with or without its prefix", async () => {
  const world = await import(moduleUrl.href);
  const bare = { ...configuredEnvironment, WORLD_RP_SIGNING_KEY: "a".repeat(64) };
  const production = { ...configuredEnvironment, WORLD_ENVIRONMENT: "production" };

  const request = world.createWorldRequest(address, configuredEnvironment);
  assert.equal(request.app_id, configuredEnvironment.WORLD_APP_ID);
  assert.equal(request.action, "issuer-publish");
  assert.equal(request.environment, "sandbox");
  assert.equal(request.rp_context.rp_id, configuredEnvironment.WORLD_RP_ID);
  assert.equal(typeof request.rp_context.signature, "string");
  assert.equal(typeof request.rp_context.nonce, "string");
  assert.equal(typeof request.rp_context.created_at, "number");
  assert.equal(typeof request.rp_context.expires_at, "number");
  assert.equal(request.rp_context.expires_at - request.rp_context.created_at, world.WORLD_CONTEXT_SECONDS);

  assert.equal(world.createWorldRequest(address, bare).rp_context.rp_id, configuredEnvironment.WORLD_RP_ID);
  assert.equal(world.readWorldConfigured(bare), true);
  assert.equal(world.createWorldRequest(address, production).environment, "production");
  assert.equal(world.createWorldRequest("0xNOT_AN_ADDRESS", configuredEnvironment), null);
  assert.equal(world.worldVerificationUrl(configuredEnvironment), "https://developer.world.org/api/v4/verify/rp_aaaaaaaaaaaaaaaa");
});

implementedTest("binds the World signal to one canonical address and the legacy protocol", async () => {
  const world = await import(moduleUrl.href);

  assert.equal(world.hasExpectedHumanSignal(boundResult(address), address), true);
  assert.equal(world.hasExpectedHumanSignal(boundResult(otherAddress), address), false);
  assert.equal(world.hasExpectedHumanSignal(boundResult(address), otherAddress), false);
  assert.equal(world.hasExpectedHumanSignal(boundResult(address), "0xNOT_AN_ADDRESS"), false);

  const base = boundResult(address);
  for (const candidate of [
    null,
    undefined,
    "3.0",
    [],
    {},
    { ...base, protocol_version: "4.0" },
    { ...base, responses: [] },
    { ...base, responses: undefined },
    { ...base, responses: [{ ...base.responses[0], identifier: "orb" }] },
    { ...base, responses: [{ ...base.responses[0], signal_hash: undefined }] },
    { ...base, responses: [base.responses[0], { ...base.responses[0], identifier: "passport" }] },
  ]) {
    assert.equal(world.hasExpectedHumanSignal(candidate, address), false, `accepted ${JSON.stringify(candidate)}`);
  }
});

implementedTest("round trips a MACed cookie bound to one address and expiring after thirty days", async () => {
  const world = await import(moduleUrl.href);
  const now = 1_700_000_000_000;
  const cookie = await world.createHumanCookie(address, configuredEnvironment, now);

  assert.deepEqual(await world.readHumanVerification(cookie, address, configuredEnvironment, now + 1), { verifiedAt: now });
  assert.deepEqual(
    await world.readHumanVerification(cookie, address, configuredEnvironment, now + (world.WORLD_HUMAN_MAX_AGE_SECONDS * 1000) - 1),
    { verifiedAt: now },
  );
  assert.equal(await world.readHumanVerification(cookie, address, configuredEnvironment, now + (world.WORLD_HUMAN_MAX_AGE_SECONDS * 1000) + 1), null);
  assert.equal(await world.readHumanVerification(cookie, otherAddress, configuredEnvironment, now + 1), null);
  assert.equal(await world.readHumanVerification(`${cookie}x`, address, configuredEnvironment, now + 1), null);
  assert.equal(await world.readHumanVerification(cookie.replace(".", ".x"), address, configuredEnvironment, now + 1), null);
  assert.equal(await world.readHumanVerification(null, address, configuredEnvironment, now + 1), null);
  assert.equal(await world.readHumanVerification("not-a-cookie", address, configuredEnvironment, now + 1), null);
  assert.equal(
    await world.readHumanVerification(cookie, address, { ...configuredEnvironment, WORLD_RP_SIGNING_KEY: `0x${"b".repeat(64)}` }, now + 1),
    null,
  );
  assert.equal(await world.readHumanVerification(cookie, address, {}, now + 1), null);
  assert.doesNotMatch(cookie, /opaque-proof|opaque-nullifier/u);
});

implementedTest("answers the unconfigured host with a closed 503 and never reaches World", async () => {
  const requestRoute = await loadRoute(requestRouteUrl);
  const verifyRoute = await loadRoute(verifyRouteUrl);

  await withCountedFetch(async (calls) => {
    await withEnvironment(authEnvironment, async () => {
      const requestResponse = await requestRoute.POST(requestOf({ address }, { path: "/api/world/request" }));
      assert.equal(requestResponse.status, 503);
      assert.deepEqual(await requestResponse.json(), { error: "world_not_configured" });

      const verifyResponse = await verifyRoute.POST(requestOf({ address, idkitResponse: boundResult(address) }));
      assert.equal(verifyResponse.status, 503);
      assert.deepEqual(await verifyResponse.json(), { error: "world_not_configured" });
      assert.equal(verifyResponse.headers.get("set-cookie"), null);
    });
    assert.equal(calls.length, 0);
  });
});

implementedTest("rejects malformed request and verification payloads without forwarding", async () => {
  const requestRoute = await loadRoute(requestRouteUrl);
  const verifyRoute = await loadRoute(verifyRouteUrl);

  await withCountedFetch(async (calls) => {
    await withEnvironment(configuredEnvironment, async () => {
      const responses = [
        await requestRoute.POST(requestOf("null", { path: "/api/world/request" })),
        await requestRoute.POST(requestOf("not json", { path: "/api/world/request" })),
        await requestRoute.POST(requestOf(JSON.stringify({ address: "0xNOT_AN_ADDRESS" }), { path: "/api/world/request" })),
        await verifyRoute.POST(requestOf("null")),
        await verifyRoute.POST(requestOf({ address, idkitResponse: null })),
        await verifyRoute.POST(requestOf({ address: "0xNOT_AN_ADDRESS", idkitResponse: boundResult(address) })),
      ];

      for (const response of responses) {
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "invalid_request" });
      }
    });
    assert.equal(calls.length, 0);
  });
});

implementedTest("refuses a World result that is not bound to the requesting address before any forward", async () => {
  const verifyRoute = await loadRoute(verifyRouteUrl);

  await withCountedFetch(async (calls) => {
    await withEnvironment(configuredEnvironment, async () => {
      const response = await verifyRoute.POST(requestOf({ address, idkitResponse: boundResult(otherAddress) }));
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { error: "world_verification_failed" });
      assert.equal(response.headers.get("set-cookie"), null);
    });
    await withEnvironment(authEnvironment, async () => {
      const response = await verifyRoute.POST(requestOf({ address, idkitResponse: { protocol_version: "4.0" } }));
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { error: "world_verification_failed" });
    });
    assert.equal(calls.length, 0);
  });
});

implementedTest("forwards the unmodified result to World v4 and emits only the browser-scoped cookie", async () => {
  const verifyRoute = await loadRoute(verifyRouteUrl);
  const world = await import(moduleUrl.href);
  const idkitResponse = boundResult(address);

  await withCountedFetch(async (calls) => {
    await withEnvironment(configuredEnvironment, async () => {
      const response = await verifyRoute.POST(requestOf({ address, idkitResponse }));

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { verified: true });
      assert.deepEqual(calls.map((call) => call.url), ["https://developer.world.org/api/v4/verify/rp_aaaaaaaaaaaaaaaa"]);
      assert.equal(calls[0].init.method, "POST");
      assert.equal(calls[0].init.body, JSON.stringify(idkitResponse));
      assert.equal(calls[0].init.headers["content-type"], "application/json");

      const cookie = response.headers.get("set-cookie");
      assert.ok(cookie);
      assert.match(cookie, /^tool402-world-human=/u);
      assert.match(cookie, /HttpOnly/iu);
      assert.match(cookie, /Secure/iu);
      assert.match(cookie, /SameSite=Strict/iu);
      assert.match(cookie, /Path=\/;/u);
      assert.match(cookie, new RegExp(`Max-Age=${world.WORLD_HUMAN_MAX_AGE_SECONDS}`, "u"));
      assert.doesNotMatch(cookie, /opaque-proof|opaque-nullifier|opaque-nonce/u);
    });
  });
});

implementedTest("surfaces the World error code in a closed 403 and never the upstream detail", async () => {
  const verifyRoute = await loadRoute(verifyRouteUrl);
  const cases = [
    [JSON.stringify({ success: false, code: "all_verifications_failed", detail: "All proof verifications failed.", results: [{ identifier: "selfie", code: "invalid_merkle_root", detail: "User appears to be unverified." }] }), "invalid_merkle_root", "User appears to be unverified."],
    [JSON.stringify({ success: false, code: "app_not_migrated", detail: "This app has not been migrated." }), "app_not_migrated", "This app has not been migrated."],
    [JSON.stringify({ success: false, detail: "no code at all" }), "unknown", "no code at all"],
    ["<html>upstream gateway detail</html>", "unknown", "upstream gateway detail"],
  ];

  for (const [body, code, leak] of cases) {
    await withWorldFailure(400, body, async () => {
      await withEnvironment(configuredEnvironment, async () => {
        const response = await verifyRoute.POST(requestOf({ address, idkitResponse: boundResult(address) }));

        assert.equal(response.status, 403);
        assert.equal(response.headers.get("set-cookie"), null);
        const text = await response.text();
        const parsed = JSON.parse(text);
        assert.deepEqual(parsed, { error: "world_verification_failed", code });
        assert.deepEqual(Object.keys(parsed).sort(), ["code", "error"]);
        assert.equal(typeof parsed.code, "string");
        assert.equal(text.includes(leak), false, `leaked upstream detail: ${leak}`);
        assert.doesNotMatch(text, /\bdetail\b/iu);
      });
    });
  }
});

implementedTest("asks World for the Selfie Check bound to the signed address without keeping the result", async () => {
  const source = await readFile(clientComponentUrl, "utf8");

  assert.match(source, /^["']use client["'];/u);
  assert.match(source, /import\s*\{[^}]*\bIDKitRequestWidget\b[^}]*\}\s*from\s*["']@worldcoin\/idkit["']/su);
  assert.match(source, /import\s*\{[^}]*\bselfieCheckLegacy\b[^}]*\}\s*from\s*["']@worldcoin\/idkit["']/su);
  assert.match(source, /import\s*\{[^}]*\buseRouter\b[^}]*\}\s*from\s*["']next\/navigation["']/u);
  assert.match(source, /allow_legacy_proofs=\{true\}/u);
  assert.match(source, /selfieCheckLegacy\(\{\s*signal:\s*address\s*\}\)/u);
  assert.match(source, /router\.refresh\(\)/u);
  assert.match(source, /["']\/api\/world\/request["']/u);
  assert.match(source, /["']\/api\/world\/verify["']/u);
  assert.match(source, /<Status\b/u);

  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/u);
  assert.doesNotMatch(source, /\b(?:proof|nullifier|merkle_root|signal_hash)\b/u);
  assert.doesNotMatch(source, /unique human/iu);
  assert.doesNotMatch(source, /\bidentity verified\b/iu);
  assert.doesNotMatch(source, /kyc/iu);
  assert.doesNotMatch(source, /\bcredential\b/iu);
  assert.doesNotMatch(source, /\bonboarding\b/iu);
});

implementedTest("states one fixed sentence for every World outcome", async () => {
  const source = await readFile(clientComponentUrl, "utf8");

  for (const sentence of [
    "Preparing the World request.",
    "Waiting for the World App. Scan the code, then take the selfie check on your phone.",
    "Verified. Refreshing your identity card.",
    "Verification did not complete. Try again when you are ready.",
    "World could not verify this selfie check. Nothing was stored.",
    "World verification is not available on this host.",
    "Selfie Check is not enabled for this World app yet.",
  ]) {
    assert.ok(source.includes(sentence), `missing fixed status copy: ${sentence}`);
  }

  assert.match(source, /World returned \$\{[^}]+\}\. Nothing was stored\./u);
  assert.equal((source.match(/setAnnouncement\(verified\)/gu) ?? []).length, 2, "the success state must be set when the verify route answers, not only when the widget closes");
  assert.match(source, /current\.tone === "working" \? abandoned/u);
  assert.match(source, /credential_unavailable/u);
  assert.match(source, /feature_unavailable/u);
  for (const tone of ["working", "success", "warning", "error"]) {
    assert.match(source, new RegExp(`tone:\\s*"${tone}"`, "u"), `missing ${tone} status tone`);
  }
});

implementedTest("renders the identity card in exactly three states and offers the check only when unverified", async () => {
  const source = await readFile(identityCardUrl, "utf8");

  assert.doesNotMatch(source, /["']use client["']/u);
  assert.match(source, /\breadDashboardSessionCookieName\b/u);
  assert.match(source, /\breadDashboardSession\b/u);
  assert.match(source, /\breadWorldConfigured\b/u);
  assert.match(source, /\breadHumanVerification\b/u);
  assert.match(source, /\bWORLD_HUMAN_COOKIE\b/u);

  assert.ok(source.includes("Your identity"));
  assert.ok(source.includes("Signed in as"));
  assert.ok(source.includes("MetaMask proves control of the account on Hedera Testnet. World proves a human holds it."));
  assert.ok(source.includes("Hedera Testnet (0x128) · session valid for 8 hours"));
  assert.ok(source.includes("Signed in"));
  assert.ok(source.includes("Not verified"));
  assert.ok(source.includes("Prove a human holds this account with a Selfie Check in the World App. It confirms a live person, not your identity, and it is not KYC."));
  assert.ok(source.includes("Verified human"));
  assert.ok(source.includes("Selfie Check passed in the World App on"));
  assert.ok(source.includes("It stays on this browser for 30 days and is bound to"));
  assert.ok(source.includes("Not identity · not KYC"));
  assert.ok(source.includes("Unavailable"));
  assert.ok(source.includes("World verification is not configured on this host. Nothing was requested."));

  assert.match(source, /slice\(0,\s*6\)/u);
  assert.match(source, /slice\(-4\)/u);
  assert.doesNotMatch(source, /unique human/iu);
  assert.doesNotMatch(source, /\bidentity verified\b/iu);
  assert.doesNotMatch(source, /\bonboarding\b/iu);
  assert.doesNotMatch(source, /\bcredential\b/iu);
  const kycMatches = [...source.matchAll(/(.{4})KYC/gu)].map(([, prefix]) => prefix);
  assert.equal(kycMatches.length > 0, true);
  for (const prefix of kycMatches) assert.equal(prefix, "not ");

  const unverifiedStart = source.indexOf('state === "unverified"');
  const verifiedStart = source.indexOf('state === "verified"');
  assert.equal(unverifiedStart > 0 && verifiedStart > unverifiedStart, true);
  const unverifiedBranch = source.slice(unverifiedStart, verifiedStart);
  assert.equal((source.match(/<WorldHumanCheck\b/gu) ?? []).length, 1);
  assert.match(unverifiedBranch, /<WorldHumanCheck\b/u);
  assert.doesNotMatch(source.slice(verifiedStart), /<WorldHumanCheck\b/u);
});

implementedTest("mounts the identity card once on the dashboard before the campaign", async () => {
  const page = await readFile(dashboardPageUrl, "utf8");

  assert.equal((page.match(/<DashboardIdentity\s*\/>/gu) ?? []).length, 1);
  assert.match(page, /import\s*\{\s*DashboardIdentity\s*\}\s*from/u);
  assert.equal(page.indexOf("<PageHeader") < page.indexOf("<DashboardIdentity"), true);
  assert.equal(page.indexOf("<DashboardIdentity") < page.indexOf("<DashboardCampaign"), true);
  assert.match(page, /title="Your campaign"/u);
  assert.match(page, /<DashboardCampaign\s*\/>/u);
});

implementedTest("serves only the signed-in browser and never an unauthenticated caller", async () => {
  const requestRoute = await loadRoute(requestRouteUrl);
  const verifyRoute = await loadRoute(verifyRouteUrl);
  const idkitResponse = boundResult(address);

  await withCountedFetch(async (calls) => {
    await withEnvironment(configuredEnvironment, async () => {
      const responses = [
        await requestRoute.POST(requestOf({ address }, { path: "/api/world/request", cookie: null })),
        await requestRoute.POST(requestOf({ address }, { path: "/api/world/request", cookie: otherSessionHeader })),
        await requestRoute.POST(requestOf({ address }, { path: "/api/world/request", cookie: "__Host-tool402-dashboard-session=forged.value" })),
        await verifyRoute.POST(requestOf({ address, idkitResponse }, { cookie: null })),
        await verifyRoute.POST(requestOf({ address, idkitResponse }, { cookie: otherSessionHeader })),
        await verifyRoute.POST(requestOf({ address, idkitResponse }, { cookie: "__Host-tool402-dashboard-session=forged.value" })),
      ];

      for (const response of responses) {
        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), { error: "unauthorized" });
        assert.equal(response.headers.get("set-cookie"), null);
      }
    });
    assert.equal(calls.length, 0);
  });
});

implementedTest("accepts a signed dashboard session among unrelated cookies larger than four KiB", async () => {
  const requestRoute = await loadRoute(requestRouteUrl);
  const unrelatedCookies = `theme=${"a".repeat(4_200)}`;

  await withEnvironment(configuredEnvironment, async () => {
    const response = await requestRoute.POST(requestOf(
      { address },
      { path: "/api/world/request", cookie: `${unrelatedCookies}; ${sessionHeader}` },
    ));

    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).app_id, configuredEnvironment.WORLD_APP_ID);
  });
});

implementedTest("rejects duplicate or oversized dashboard cookies before either World route", async () => {
  const source = await readFile(moduleUrl, "utf8");
  const requestRoute = await loadRoute(requestRouteUrl);
  const verifyRoute = await loadRoute(verifyRouteUrl);
  const idkitResponse = boundResult(address);
  const rejectedCookies = [
    `${sessionHeader}; ${sessionHeader}`,
    `__Host-tool402-dashboard-session=${"a".repeat(4_097)}`,
    `theme=${"a".repeat(16_384)}; ${sessionHeader}`,
  ];

  assert.match(source, /const COOKIE_HEADER_MAX_BYTES = 16_384/u);
  assert.match(source, /const SESSION_COOKIE_MAX_BYTES = 4_096/u);

  await withCountedFetch(async (calls) => {
    await withEnvironment(configuredEnvironment, async () => {
      for (const cookie of rejectedCookies) {
        const responses = [
          await requestRoute.POST(requestOf({ address }, { path: "/api/world/request", cookie })),
          await verifyRoute.POST(requestOf({ address, idkitResponse }, { cookie })),
        ];
        for (const response of responses) {
          assert.equal(response.status, 401);
          assert.deepEqual(await response.json(), { error: "unauthorized" });
          assert.equal(response.headers.get("set-cookie"), null);
        }
      }
    });
    assert.equal(calls.length, 0);
  });
});

implementedTest("refuses a verification body larger than the shared bound before forwarding", async () => {
  const verifyRoute = await loadRoute(verifyRouteUrl);
  const oversized = JSON.stringify({ address, idkitResponse: boundResult(address), padding: "a".repeat(PROTECTED_JSON_MAX_BYTES) });

  await withCountedFetch(async (calls) => {
    await withEnvironment(configuredEnvironment, async () => {
      const response = await verifyRoute.POST(requestOf(oversized));

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "invalid_request" });
      assert.equal(response.headers.get("set-cookie"), null);
    });
    assert.equal(calls.length, 0);
  });
});

implementedTest("mints the verified-human cookie only when World itself reports success", async () => {
  const verifyRoute = await loadRoute(verifyRouteUrl);
  const cases = [
    ["{}", "unknown"],
    [JSON.stringify({ success: false, code: "all_verifications_failed", results: [{ identifier: "selfie", code: "invalid_merkle_root" }] }), "invalid_merkle_root"],
    [JSON.stringify({ success: "true" }), "unknown"],
    ["not json at all", "unknown"],
  ];

  for (const [body, code] of cases) {
    await withWorldFailure(200, body, async () => {
      await withEnvironment(configuredEnvironment, async () => {
        const response = await verifyRoute.POST(requestOf({ address, idkitResponse: boundResult(address) }));

        assert.equal(response.status, 403, `accepted a World answer of ${body}`);
        assert.deepEqual(await response.json(), { error: "world_verification_failed", code });
        assert.equal(response.headers.get("set-cookie"), null);
      });
    });
  }
});
