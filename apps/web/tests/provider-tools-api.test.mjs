import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const serverUrl = new URL("../src/lib/provider-tools-server.ts", import.meta.url);
const routeUrl = new URL("../src/app/api/provider/tools/route.ts", import.meta.url);
const sourceExists = [serverUrl, routeUrl].every((url) => existsSync(fileURLToPath(url)));
const implementedTest = sourceExists ? test : test.skip;
const origin = "http://localhost:3000";
const secret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const requestId = "013d5c4d-21d9-4f02-a62b-47f49f3b17ad";
const environment = {
  NODE_ENV: "development",
  TOOL402_DASHBOARD_AUTH_ORIGIN: origin,
  TOOL402_DASHBOARD_AUTH_SECRET: secret,
};

function post(body, headers = {}) {
  return new Request(`${origin}/api/provider/tools`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function get(search = "", headers = {}) {
  return new Request(`${origin}/api/provider/tools${search}`, {
    method: "GET",
    headers: { cookie: "tool402-local-dashboard-session=sealed-session", ...headers },
  });
}

test("requires the dashboard-session provider-tool API modules before GREEN", () => {
  for (const url of [serverUrl, routeUrl]) {
    assert.equal(existsSync(fileURLToPath(url)), true, `missing declared M55 Task 1 source: ${url.pathname}`);
  }
});

implementedTest("exposes only the Next route methods and a server-only handler seam", async () => {
  const [server, route] = await Promise.all([import(serverUrl.href), import(routeUrl.href)]);
  assert.deepEqual(Object.keys(route).sort(), ["GET", "POST"]);
  assert.equal(typeof server.handleProviderToolsRequest, "function");
  assert.equal(typeof server.handleProviderToolDeploymentRequest, "function");
});

implementedTest("forwards a selected-tool deployment read only after the dashboard session is accepted", async () => {
  const { handleProviderToolDeploymentRequest } = await import(serverUrl.href);
  const toolPublicId = `tool_${"ab".repeat(16)}`;
  const forwarded = [];
  const response = await handleProviderToolDeploymentRequest(
    get(),
    environment,
    toolPublicId,
    {
      readSession: async () => ({
        address: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
        issuedAt: "2026-09-12T10:00:00.000Z",
        expiresAt: "2026-09-12T18:00:00.000Z",
      }),
      forward: async (input) => {
        forwarded.push(input);
        return new Response(JSON.stringify({ tool: { toolPublicId }, atsCreateConfigurationJson: null, atsAttemptPublicId: null }), {
          status: 200, headers: { "content-type": "application/json" },
        });
      },
    },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(forwarded, [{
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
    deploymentToolPublicId: toolPublicId,
    sessionExpiresAt: "2026-09-12T18:00:00.000Z",
  }]);
});

implementedTest("rejects unauthenticated allocation before forwarding to the protected ingress", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  let forwarded = 0;
  const response = await handleProviderToolsRequest(
    new Request("http://localhost:3000/api/provider/tools", {
      method: "POST",
      headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      body: JSON.stringify({ requestId: "013d5c4d-21d9-4f02-a62b-47f49f3b17ad" }),
    }),
    environment,
    {
      readSession: async () => null,
      forward: async () => { forwarded += 1; throw new Error("must not forward"); },
    },
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { outcome: "rejected" });
  assert.equal(forwarded, 0);
});

implementedTest("rejects invalid origin and request shape before session or forwarding work", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  for (const request of [
    post({ requestId }, { origin: "http://other.localhost:3000" }),
    post({ requestId, extra: true }),
    post({ requestId: "not-a-uuid" }),
  ]) {
    let sessions = 0;
    let forwarded = 0;
    const response = await handleProviderToolsRequest(request, environment, {
      readSession: async () => { sessions += 1; return null; },
      forward: async () => { forwarded += 1; throw new Error("must not forward"); },
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { outcome: "rejected" });
    assert.equal(sessions, 0);
    assert.equal(forwarded, 0);
  }
});

implementedTest("rejects a chunked oversized allocation before session or forwarding work", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  const request = new Request(`${origin}/api/provider/tools`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(1025));
        controller.close();
      },
    }),
    duplex: "half",
  });
  let sessions = 0;
  let forwarded = 0;
  const response = await handleProviderToolsRequest(request, environment, {
    readSession: async () => { sessions += 1; return null; },
    forward: async () => { forwarded += 1; throw new Error("must not forward"); },
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { outcome: "rejected" });
  assert.equal(sessions, 0);
  assert.equal(forwarded, 0);
});

implementedTest("rejects duplicate dashboard cookies and invalid cursors before session or forwarding work", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  for (const request of [
    post({ requestId }, { cookie: "tool402-local-dashboard-session=first; tool402-local-dashboard-session=second" }),
    get("?cursor="),
  ]) {
    let sessions = 0;
    let forwarded = 0;
    const response = await handleProviderToolsRequest(request, environment, {
      readSession: async () => { sessions += 1; return null; },
      forward: async () => { forwarded += 1; throw new Error("must not forward"); },
    });
    assert.equal(response.status, 401);
    assert.equal(sessions, 0);
    assert.equal(forwarded, 0);
  }
});

implementedTest("forwards a valid dashboard-session allocation with its canonical signer only", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  const forwarded = [];
  let sessionCookie = null;
  const response = await handleProviderToolsRequest(post({ requestId }, {
    cookie: "tool402-local-dashboard-session=sealed-session",
  }), environment, {
    readSession: async (cookie) => {
      sessionCookie = cookie;
      return ({
      address: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
      issuedAt: "2026-09-12T10:00:00.000Z",
      expiresAt: "2026-09-12T18:00:00.000Z",
      });
    },
    forward: async (input) => {
      forwarded.push(input);
      return new Response(JSON.stringify({ outcome: "allocated", tool: { toolPublicId: "tool_" + "ab".repeat(16) } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(response.status, 200);
  assert.equal(sessionCookie, "sealed-session");
  assert.deepEqual(await response.json(), { outcome: "allocated", tool: { toolPublicId: "tool_" + "ab".repeat(16) } });
  assert.deepEqual(forwarded, [{
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
    requestId,
    sessionExpiresAt: "2026-09-12T18:00:00.000Z",
  }]);
});

implementedTest("handles GET as an owner-scoped read without allocating", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  const forwarded = [];
  const response = await handleProviderToolsRequest(get("?cursor=tool_" + "ab".repeat(16)), environment, {
    readSession: async () => ({
      address: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
      issuedAt: "2026-09-12T10:00:00.000Z",
      expiresAt: "2026-09-12T18:00:00.000Z",
    }),
    forward: async (input) => {
      forwarded.push(input);
      return new Response(JSON.stringify({ tools: [], nextCursor: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { tools: [], nextCursor: null });
  assert.deepEqual(forwarded, [{
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
    cursor: "tool_" + "ab".repeat(16),
    sessionExpiresAt: "2026-09-12T18:00:00.000Z",
  }]);
});

implementedTest("forwards an unparameterized GET as the first owner-scoped page", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  const forwarded = [];
  const response = await handleProviderToolsRequest(get(), environment, {
    readSession: async () => ({
      address: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
      issuedAt: "2026-09-12T10:00:00.000Z",
      expiresAt: "2026-09-12T18:00:00.000Z",
    }),
    forward: async (input) => {
      forwarded.push(input);
      return new Response(JSON.stringify({ tools: [], nextCursor: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(forwarded, [{
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
    cursor: null,
    sessionExpiresAt: "2026-09-12T18:00:00.000Z",
  }]);
});

implementedTest("rejects every non-closed GET query shape before session or forwarding work", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  const toolPublicId = "tool_" + "ab".repeat(16);
  const cases = [
    "?unknown=value",
    "?cursor=first&cursor=second",
    `?tool=${toolPublicId}&tool=${toolPublicId}`,
    `?cursor=first&tool=${toolPublicId}`,
    "?cursor=",
    "?tool=",
    "?tool=not-a-tool",
    `?cursor=${"x".repeat(1025)}`,
  ];
  for (const search of cases) {
    let sessions = 0;
    let forwarded = 0;
    const response = await handleProviderToolsRequest(get(search), environment, {
      readSession: async () => { sessions += 1; return null; },
      forward: async () => { forwarded += 1; throw new Error("must not forward"); },
    });
    assert.equal(response.status, 401, search);
    assert.deepEqual(await response.json(), { outcome: "rejected" }, search);
    assert.equal(sessions, 0, search);
    assert.equal(forwarded, 0, search);
  }
});

implementedTest("rejects a cross-origin GET before reading the dashboard session", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  let sessions = 0;
  let forwarded = 0;
  const response = await handleProviderToolsRequest(get("", { origin: "https://other.example" }), environment, {
    readSession: async () => { sessions += 1; return null; },
    forward: async () => { forwarded += 1; throw new Error("must not forward"); },
  });
  assert.equal(response.status, 401);
  assert.equal(sessions, 0);
  assert.equal(forwarded, 0);
});

implementedTest("uses the protected GET tool selector without allocating", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  const toolPublicId = "tool_" + "ab".repeat(16);
  const forwarded = [];
  const response = await handleProviderToolsRequest(get(`?tool=${toolPublicId}`), environment, {
    readSession: async () => ({
      address: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
      issuedAt: "2026-09-12T10:00:00.000Z",
      expiresAt: "2026-09-12T18:00:00.000Z",
    }),
    forward: async (input) => {
      forwarded.push(input);
      return new Response(JSON.stringify({ tool: { toolPublicId } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { tool: { toolPublicId } });
  assert.deepEqual(forwarded, [{
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
    toolPublicId,
    sessionExpiresAt: "2026-09-12T18:00:00.000Z",
  }]);
});

implementedTest("bounds the relayed provider-tool response before returning it to the dashboard", async () => {
  const { handleProviderToolsRequest } = await import(serverUrl.href);
  const response = await handleProviderToolsRequest(post({ requestId }, {
    cookie: "tool402-local-dashboard-session=sealed-session",
  }), environment, {
    readSession: async () => ({
      address: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
      issuedAt: "2026-09-12T10:00:00.000Z",
      expiresAt: "2026-09-12T18:00:00.000Z",
    }),
    forward: async () => new Response(JSON.stringify({ tool: { oversized: "x".repeat(65_537) } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { outcome: "unavailable" });
});
