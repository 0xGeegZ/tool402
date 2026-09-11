import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import typescript from "typescript";

const modulePath = fileURLToPath(
  new URL("../src/lib/world/issuer-selfie-check.ts", import.meta.url),
);
const requestRouteUrl = new URL("../src/app/api/world/request/route.ts", import.meta.url);
const verifyRouteUrl = new URL("../src/app/api/world/verify/route.ts", import.meta.url);

const configuredEnvironment = Object.freeze({
  WORLD_APP_ID: "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  WORLD_RP_ID: "rp_aaaaaaaaaaaaaaaa",
  WORLD_RP_SIGNING_KEY: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  WORLD_ACTION: "issuer-publish",
  WORLD_ENVIRONMENT: "staging",
});
const configuredEnvironmentNames = Object.freeze(Object.keys(configuredEnvironment));

async function loadRoute(routeUrl) {
  const source = await readFile(routeUrl, "utf8");
  const world = await import("../src/lib/world/issuer-selfie-check.ts");
  const { outputText } = typescript.transpileModule(source, {
    fileName: routeUrl,
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
      if (specifier === "../../../../lib/world/issuer-selfie-check") return world;
      assert.fail(`unexpected route import: ${specifier}`);
    },
    Request,
    Response,
    AbortSignal,
    fetch: (...args) => globalThis.fetch(...args),
    process: { env: process.env },
  }, { filename: routeUrl });
  return module.exports;
}

async function withConfiguredEnvironment(callback) {
  const previous = Object.fromEntries(configuredEnvironmentNames.map((name) => [name, process.env[name]]));
  Object.assign(process.env, configuredEnvironment);
  try {
    return await callback();
  } finally {
    for (const name of configuredEnvironmentNames) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}

test("declares the server-only World issuer verification boundary", () => {
  assert.equal(
    existsSync(modulePath),
    true,
    `missing declared World boundary: ${modulePath}`,
  );
});

test("creates a short-lived staging request and binds a tamper-evident browser session to one canonical issuer", async () => {
  const world = await import("../src/lib/world/issuer-selfie-check.ts");
  const env = configuredEnvironment;
  const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
  const request = world.createWorldRequest(address, env);

  assert.equal(request.app_id, env.WORLD_APP_ID);
  assert.equal(request.action, "issuer-publish");
  assert.equal(request.environment, "staging");
  assert.equal(request.rp_context.rp_id, env.WORLD_RP_ID);
  assert.equal(typeof request.rp_context.signature, "string");
  assert.equal(typeof request.rp_context.nonce, "string");
  assert.equal(typeof request.rp_context.created_at, "number");
  assert.equal(typeof request.rp_context.expires_at, "number");
  const cookie = await world.createWorldIssuerCookie(address, env, 1_000);
  assert.equal(await world.hasWorldIssuerCookie(cookie, address, env, 1_001), true);
  assert.equal(await world.hasWorldIssuerCookie(cookie, "0x8ba1f109551bd432803012645ac136ddd64dba72", env, 1_001), false);
  assert.equal(await world.hasWorldIssuerCookie(`${cookie}x`, address, env, 1_001), false);
  assert.equal(await world.hasWorldIssuerCookie(cookie, address, env, 601_001), false);
});

test("fails closed when the fixed action is absent or the environment is not staging", async () => {
  const world = await import("../src/lib/world/issuer-selfie-check.ts");
  const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";

  assert.equal(world.createWorldRequest(address, { ...configuredEnvironment, WORLD_ACTION: undefined }), null);
  assert.equal(world.createWorldRequest(address, { ...configuredEnvironment, WORLD_ACTION: "another-action" }), null);
  assert.equal(world.createWorldRequest(address, { ...configuredEnvironment, WORLD_ENVIRONMENT: "production" }), null);
});

test("rejects a malformed request address before attempting World configuration", async () => {
  const route = await loadRoute(fileURLToPath(requestRouteUrl));
  const response = await withConfiguredEnvironment(() => route.POST(new Request("http://localhost/api/world/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: "0xNOT_AN_ADDRESS" }),
  })));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_request" });
});

test("forwards the opaque World result unchanged and emits only the scoped issuer session cookie", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const route = await loadRoute(fileURLToPath(verifyRouteUrl));
    const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
    const idkitResponse = Object.freeze({ proof: "opaque-proof", nested: Object.freeze({ nullifier_hash: "opaque-nullifier" }) });
    const response = await withConfiguredEnvironment(() => route.POST(new Request("http://localhost/api/world/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, idkitResponse }),
    })));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { verified: true });
    assert.deepEqual(calls.map((call) => call.url), ["https://developer.world.org/api/v4/verify/rp_aaaaaaaaaaaaaaaa"]);
    assert.equal(calls[0].init.body, JSON.stringify(idkitResponse));
    assert.equal(calls[0].init.headers["content-type"], "application/json");
    const cookie = response.headers.get("set-cookie");
    assert.ok(cookie);
    assert.match(cookie, /HttpOnly/iu);
    assert.match(cookie, /Secure/iu);
    assert.match(cookie, /SameSite=Lax/iu);
    assert.match(cookie, /Path=\/api\/commands/iu);
    assert.doesNotMatch(cookie, /opaque-proof|opaque-nullifier/iu);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
