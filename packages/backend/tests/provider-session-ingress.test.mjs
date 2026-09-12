import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ingressUrl = new URL("../convex/provider_session_ingress.ts", import.meta.url);
const httpUrl = new URL("../convex/http.ts", import.meta.url);
const ingressExists = existsSync(fileURLToPath(ingressUrl));
const implementedTest = ingressExists ? test : test.skip;
const secretBytes = Uint8Array.from({ length: 32 }, (_, index) => index);
const canonicalSignerAddress = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const requestId = "013d5c4d-21d9-4f02-a62b-47f49f3b17ad";
const timestamp = "1735689600";
const nonce = "AbCdEfGhIjKlMnOpQrStUw";

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function signedRequest(body = JSON.stringify({
  type: "allocate",
  canonicalSignerAddress,
  requestId,
  sessionExpiresAt: "2025-01-01T08:00:00.000Z",
}), path = "/internal/provider-tools", timestampValue = timestamp) {
  const bytes = new TextEncoder().encode(body);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  const bodySha256 = Buffer.from(digest).toString("hex");
  const key = await globalThis.crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const input = `tool402:provider-session:v1\nPOST\n${path}\n${timestampValue}\n${nonce}\n${bodySha256}`;
  const signature = new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input)));
  return {
    body,
    request: new Request(`https://backend.test${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tool402-key-id": "key-A",
        "x-tool402-timestamp": timestampValue,
        "x-tool402-nonce": nonce,
        "x-tool402-content-sha256": bodySha256,
        "x-tool402-signature": base64Url(signature),
      },
      body: bytes,
    }),
    key,
  };
}

test("requires a separate provider-session ingress module before GREEN", () => {
  assert.equal(
    ingressExists,
    true,
    `missing declared M55 Task 1 source module: ${fileURLToPath(ingressUrl)}`,
  );
});

implementedTest("registers the fixed provider-tool ingress separately from wallet commands", async () => {
  const [ingress, http] = await Promise.all([import(ingressUrl.href), import(httpUrl.href)]);
  assert.equal(typeof ingress.handleProviderSessionIngress, "function");
  assert.equal(typeof ingress.handleProviderSessionIngressForTest, "function");

  const route = http.default.lookup("/internal/provider-tools", "POST");
  assert.notEqual(route, null);
  assert.equal(route[0]._handler, ingress.handleProviderSessionIngress);
  assert.notEqual(route[0]._handler, ingress.handleProviderSessionIngressForTest);
  assert.equal(http.default.lookup("/internal/provider-tools", "GET"), null);
});

implementedTest("accepts one valid provider-session assertion and binds its request to the server owner", async () => {
  const { handleProviderSessionIngressForTest } = await import(ingressUrl.href);
  const { request, key } = await signedRequest();
  const allocations = [];
  const response = await handleProviderSessionIngressForTest({}, request, {
    nowMilliseconds: () => 1_735_689_600_000,
    resolveIngressKey: (keyId) => keyId === "key-A" ? key : undefined,
    claimReplay: () => "claimed",
    allocate: async (input) => { allocations.push(input); return { outcome: "allocated", tool: { toolPublicId: "tool_" + "ab".repeat(16) } }; },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { outcome: "allocated", tool: { toolPublicId: "tool_" + "ab".repeat(16) } });
  assert.deepEqual(allocations, [{ canonicalSignerAddress, requestId }]);
});

implementedTest("rejects a command-domain MAC and replay before allocation", async () => {
  const { handleProviderSessionIngressForTest } = await import(ingressUrl.href);
  for (const [name, path, claimReplay] of [
    ["command-domain signature", "/internal/commands", () => "claimed"],
    ["replayed assertion", "/internal/provider-tools", () => "already_claimed"],
  ]) {
    const { request, key } = await signedRequest(undefined, path);
    let allocations = 0;
    const response = await handleProviderSessionIngressForTest({}, request, {
      nowMilliseconds: () => 1_735_689_600_000,
      resolveIngressKey: () => key,
      claimReplay,
      allocate: async () => { allocations += 1; return { outcome: "allocated" }; },
    });
    assert.equal(response.status, 401, name);
    assert.deepEqual(await response.json(), { outcome: "rejected" }, name);
    assert.equal(allocations, 0, name);
  }
});

implementedTest("rejects stale, forged, changed, and expired assertions before allocation", async () => {
  const { handleProviderSessionIngressForTest } = await import(ingressUrl.href);
  const cases = [
    ["stale", await signedRequest(undefined, "/internal/provider-tools", "1735689000")],
    ["expired", await signedRequest(JSON.stringify({
      type: "allocate", canonicalSignerAddress, requestId, sessionExpiresAt: "2025-01-01T00:00:00.000Z",
    }))],
    ["changed body", await signedRequest()],
    ["forged MAC", await signedRequest()],
  ];
  cases[2][1].request = new Request("https://backend.test/internal/provider-tools", {
    method: "POST",
    headers: cases[2][1].request.headers,
    body: JSON.stringify({ type: "allocate", canonicalSignerAddress, requestId: "f3a098ca-a4b1-4a67-91a7-76137dce5dbd", sessionExpiresAt: "2025-01-01T08:00:00.000Z" }),
  });
  cases[3][1].request = new Request("https://backend.test/internal/provider-tools", {
    method: "POST",
    headers: { ...Object.fromEntries(cases[3][1].request.headers), "x-tool402-signature": base64Url(new Uint8Array(32).fill(7)) },
    body: cases[3][1].body,
  });
  for (const [name, signed] of cases) {
    let allocations = 0;
    const response = await handleProviderSessionIngressForTest({}, signed.request, {
      nowMilliseconds: () => 1_735_689_600_000,
      resolveIngressKey: () => signed.key,
      claimReplay: () => "claimed",
      allocate: async () => { allocations += 1; return { outcome: "allocated" }; },
    });
    assert.equal(response.status, 401, name);
    assert.equal(allocations, 0, name);
  }
});

implementedTest("rejects a wrong transport target and streamed oversized body before allocation", async () => {
  const { handleProviderSessionIngressForTest } = await import(ingressUrl.href);
  const { request, key } = await signedRequest();
  const oversized = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(4097));
      controller.close();
    },
  });
  const cases = [
    new Request("http://backend.test/internal/provider-tools", {
      method: "POST", headers: request.headers, body: request.body, duplex: "half",
    }),
    new Request("https://backend.test/internal/provider-tools", {
      method: "POST", headers: request.headers, body: oversized, duplex: "half",
    }),
  ];
  for (const candidate of cases) {
    let allocations = 0;
    const response = await handleProviderSessionIngressForTest({}, candidate, {
      nowMilliseconds: () => 1_735_689_600_000,
      resolveIngressKey: () => key,
      claimReplay: () => "claimed",
      allocate: async () => { allocations += 1; return { outcome: "allocated" }; },
    });
    assert.equal(response.status, 401);
    assert.equal(allocations, 0);
  }
});

implementedTest("rejects overflowing timestamps and invalid keys before allocation", async () => {
  const { handleProviderSessionIngressForTest } = await import(ingressUrl.href);
  const tooLargeTimestamp = await signedRequest(undefined, "/internal/provider-tools", "9223372036854775808");
  const valid = await signedRequest();
  for (const [signed, resolveIngressKey] of [
    [tooLargeTimestamp, () => tooLargeTimestamp.key],
    [valid, () => ({})],
  ]) {
    let allocations = 0;
    const response = await handleProviderSessionIngressForTest({}, signed.request, {
      nowMilliseconds: () => 1_735_689_600_000,
      resolveIngressKey,
      claimReplay: () => "claimed",
      allocate: async () => { allocations += 1; return { outcome: "allocated" }; },
    });
    assert.equal(response.status, 401);
    assert.equal(allocations, 0);
  }
});

implementedTest("rejects a provider-tool response larger than the internal 64 KiB bound", async () => {
  const { handleProviderSessionIngressForTest } = await import(ingressUrl.href);
  const { request, key } = await signedRequest();
  const response = await handleProviderSessionIngressForTest({}, request, {
    nowMilliseconds: () => 1_735_689_600_000,
    resolveIngressKey: () => key,
    claimReplay: () => "claimed",
    allocate: async () => ({ outcome: "allocated", tool: { oversized: "x".repeat(65_537) } }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { outcome: "rejected" });
});

implementedTest("forwards a signed selected-tool deployment read only to the protected deployment query", async () => {
  const { handleProviderSessionIngressForTest } = await import(ingressUrl.href);
  const toolPublicId = `tool_${"ab".repeat(16)}`;
  const { request, key } = await signedRequest(JSON.stringify({
    type: "deployment", canonicalSignerAddress, toolPublicId, sessionExpiresAt: "2026-01-01T08:00:00.000Z",
  }));
  const reads = [];
  const response = await handleProviderSessionIngressForTest({}, request, {
    nowMilliseconds: () => 1_735_689_600_000,
    resolveIngressKey: () => key,
    claimReplay: () => "claimed",
    allocate: async () => { throw new Error("must not allocate"); },
    list: async () => { throw new Error("must not list"); },
    read: async () => { throw new Error("must not use summary read"); },
    deployment: async (input) => { reads.push(input); return { tool: { toolPublicId }, atsCreateConfigurationJson: null }; },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(reads, [{ canonicalSignerAddress, toolPublicId }]);
});
