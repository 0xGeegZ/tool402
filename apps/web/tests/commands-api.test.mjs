import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseIngressEnvelope } from "@tool402/core";

const sourceUrl = new URL("../src/app/api/commands/route.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const relaySourcePath = fileURLToPath(new URL("../src/lib/wallet/command-relay.ts", import.meta.url));
const implementedTest = sourceExists ? test : test.skip;
let api;

test("requires the declared command relay source modules", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
  assert.equal(existsSync(relaySourcePath), true, `missing declared source module: ${relaySourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("refuses an unconfigured relay before reading or forwarding a command body", async () => {
  const response = await api.POST(new Request("http://localhost/api/commands", {
    method: "POST",
    body: '{"command":{},"payload":{}}',
  }));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { outcome: "not_configured" });
});

implementedTest("keeps the closed server relay outcome vocabulary in the relay module", async () => {
  const { RELAY_OUTCOMES } = await import("../src/lib/wallet/command-relay.ts");
  assert.deepEqual(RELAY_OUTCOMES, [
    "ACCEPTED",
    "REPLAYED",
    "CONFLICT",
    "REJECTED",
    "UNSUPPORTED_TYPE",
    "WORLD_VERIFICATION_REQUIRED",
    "not_configured",
    "transport_failure",
    "unexpected_response",
  ]);
});

// Lane contracts (work/s15), block-scoped beside the root's contracts above.
{
const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadRelayModule() {
  return import("../src/lib/wallet/command-relay.ts");
}

const siteUrl = "https://campaign-demo.convex.site";
const secretHex = Array.from({ length: 32 }, (_, index) =>
  index.toString(16).padStart(2, "0"),
).join("");
const bodyText =
  '{"command":{"version":1},"payload":{"expiresAt":"2026-09-07T19:04:00.000Z"}}';
const bodyBytes = new TextEncoder().encode(bodyText);
const nowMilliseconds = 1_735_689_600_123;

function configuredEnvironment(overrides = {}) {
  return {
    TOOL402_INGRESS_KEY_ID: "key-A",
    TOOL402_INGRESS_SECRET: secretHex,
    TOOL402_CONVEX_SITE_URL: siteUrl,
    ...overrides,
  };
}

function createRequest(body = bodyBytes) {
  return new Request("https://web.test/api/commands", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function jsonResponse(body, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createFetch(respond) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return respond(calls.length, { url: String(url), init });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

function countingRandomBytes() {
  let counter = 0;
  return (length) => {
    counter += 1;
    const bytes = new Uint8Array(length);
    bytes[length - 1] = counter;
    return bytes;
  };
}

function dependencies(fetchImpl, overrides = {}) {
  return {
    fetch: fetchImpl,
    nowMilliseconds: () => nowMilliseconds,
    randomBytes: countingRandomBytes(),
    ...overrides,
  };
}

async function sha256Hex(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function fromBase64Url(text) {
  return new Uint8Array(Buffer.from(text, "base64url"));
}

function hexToBytes(hex) {
  return Uint8Array.from(hex.match(/.{2}/gu), (pair) =>
    Number.parseInt(pair, 16),
  );
}

function forwardedHeaders(init) {
  const headers = new Headers(init.headers);
  return {
    keyId: headers.get("x-tool402-key-id"),
    timestampUnixSeconds: headers.get("x-tool402-timestamp"),
    requestNonce: headers.get("x-tool402-nonce"),
    bodySha256: headers.get("x-tool402-content-sha256"),
    signature: headers.get("x-tool402-signature"),
    contentType: headers.get("content-type"),
  };
}

function forwardedBytes(init) {
  if (init.body instanceof Uint8Array) {
    return init.body;
  }
  if (init.body instanceof ArrayBuffer) {
    return new Uint8Array(init.body);
  }
  throw new Error("forwarded body is not bytes");
}

test("fixes the closed eight-outcome relay union", async () => {
  const { RELAY_OUTCOMES } = await loadRelayModule();

  assert.deepEqual(RELAY_OUTCOMES, [
    "ACCEPTED",
    "REPLAYED",
    "CONFLICT",
    "REJECTED",
    "UNSUPPORTED_TYPE",
    "WORLD_VERIFICATION_REQUIRED",
    "not_configured",
    "transport_failure",
    "unexpected_response",
  ]);
  assert.equal(Object.isFrozen(RELAY_OUTCOMES), true);
});

test("answers 503 not_configured and sends nothing when any environment name is absent or malformed", async () => {
  const { handleCommandRelayPost } = await loadRelayModule();
  const variants = [
    {},
    { TOOL402_INGRESS_KEY_ID: undefined },
    { TOOL402_INGRESS_SECRET: undefined },
    { TOOL402_CONVEX_SITE_URL: undefined },
    { TOOL402_INGRESS_KEY_ID: "" },
    { TOOL402_INGRESS_KEY_ID: "key:A" },
    { TOOL402_INGRESS_KEY_ID: "k".repeat(65) },
    { TOOL402_INGRESS_SECRET: secretHex.slice(0, 62) },
    { TOOL402_INGRESS_SECRET: secretHex.toUpperCase() },
    { TOOL402_INGRESS_SECRET: `${secretHex}00` },
    {
      TOOL402_INGRESS_SECRET: Buffer.from(hexToBytes(secretHex)).toString(
        "base64url",
      ),
    },
    { TOOL402_CONVEX_SITE_URL: "http://campaign-demo.convex.site" },
    { TOOL402_CONVEX_SITE_URL: "https://campaign-demo.convex.site/prefix" },
    { TOOL402_CONVEX_SITE_URL: "https://campaign-demo.convex.site/?x=1" },
    { TOOL402_CONVEX_SITE_URL: "https://user:pw@campaign-demo.convex.site" },
    { TOOL402_CONVEX_SITE_URL: "not a url" },
  ];

  for (const [index, variant] of variants.entries()) {
    const fetchImpl = createFetch(() => jsonResponse({ outcome: "ACCEPTED" }));
    const environment = index === 0 ? {} : configuredEnvironment(variant);
    const response = await handleCommandRelayPost(
      createRequest(),
      environment,
      dependencies(fetchImpl),
    );

    assert.equal(response.status, 503, JSON.stringify(variant));
    assert.deepEqual(await response.json(), { outcome: "not_configured" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(fetchImpl.calls.length, 0, JSON.stringify(variant));
  }
});

test("forwards the exact received bytes under a verifiable M22 envelope to the fixed ingress path", async () => {
  const { handleCommandRelayPost } = await loadRelayModule();
  const fetchImpl = createFetch(() =>
    jsonResponse({ outcome: "ACCEPTED", publicId: "offering_1" }),
  );

  const response = await handleCommandRelayPost(
    createRequest(),
    configuredEnvironment(),
    dependencies(fetchImpl),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { outcome: "ACCEPTED" });

  assert.equal(fetchImpl.calls.length, 1);
  const [{ url, init }] = fetchImpl.calls;
  assert.equal(url, `${siteUrl}/internal/commands`);
  assert.equal(init.method, "POST");
  assert.equal(init.redirect, "error");
  assert.equal(init.cache, "no-store");
  assert.ok(init.signal instanceof AbortSignal);
  assert.deepEqual(forwardedBytes(init), bodyBytes);

  const { contentType, ...envelopeFields } = forwardedHeaders(init);
  assert.equal(contentType, "application/json");
  const envelope = parseIngressEnvelope(envelopeFields);
  assert.equal(envelope.keyId, "key-A");
  assert.equal(envelope.timestampUnixSeconds, 1_735_689_600n);
  assert.equal(envelope.requestNonce, "AAAAAAAAAAAAAAAAAAAAAQ");
  assert.equal(envelope.bodySha256, await sha256Hex(bodyBytes));
  assert.equal(
    envelope.signingInput,
    `POST\n/internal/commands\n1735689600\nAAAAAAAAAAAAAAAAAAAAAQ\n${envelope.bodySha256}`,
  );

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    hexToBytes(secretHex),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await globalThis.crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(envelope.signature),
    new TextEncoder().encode(envelope.signingInput),
  );
  assert.equal(verified, true);
});

test("draws a fresh transport nonce for every forwarded request", async () => {
  const { handleCommandRelayPost } = await loadRelayModule();
  const fetchImpl = createFetch(() => jsonResponse({ outcome: "ACCEPTED" }));
  const shared = dependencies(fetchImpl);

  await handleCommandRelayPost(
    createRequest(),
    configuredEnvironment(),
    shared,
  );
  await handleCommandRelayPost(
    createRequest(),
    configuredEnvironment(),
    shared,
  );

  const [first, second] = fetchImpl.calls.map(({ init }) =>
    forwardedHeaders(init),
  );
  assert.equal(first.requestNonce, "AAAAAAAAAAAAAAAAAAAAAQ");
  assert.equal(second.requestNonce, "AAAAAAAAAAAAAAAAAAAAAg");
  assert.notEqual(first.signature, second.signature);
  assert.equal(first.bodySha256, second.bodySha256);

  const live = createFetch(() => jsonResponse({ outcome: "ACCEPTED" }));
  await handleCommandRelayPost(createRequest(), configuredEnvironment(), {
    fetch: live,
  });
  await handleCommandRelayPost(createRequest(), configuredEnvironment(), {
    fetch: live,
  });
  const [liveFirst, liveSecond] = live.calls.map(({ init }) =>
    forwardedHeaders(init),
  );
  assert.match(liveFirst.requestNonce, /^[A-Za-z0-9_-]{21}[AQgw]$/u);
  assert.notEqual(liveFirst.requestNonce, liveSecond.requestNonce);
  const nowSeconds = Math.floor(Date.now() / 1000);
  assert.ok(Math.abs(Number(liveFirst.timestampUnixSeconds) - nowSeconds) <= 5);
});

test("maps only the five documented backend outcomes and reports everything else as unexpected", async () => {
  const { handleCommandRelayPost } = await loadRelayModule();

  for (const outcome of [
    "ACCEPTED",
    "REPLAYED",
    "CONFLICT",
    "REJECTED",
    "UNSUPPORTED_TYPE",
  ]) {
    const fetchImpl = createFetch(() =>
      jsonResponse({ outcome, publicId: "echo" }),
    );
    const response = await handleCommandRelayPost(
      createRequest(),
      configuredEnvironment(),
      dependencies(fetchImpl),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { outcome });
  }

  const unexpected = [
    () => jsonResponse({ outcome: "NOT_AUTHORIZED" }),
    () => jsonResponse({ outcome: "accepted" }),
    () => jsonResponse({ result: "ACCEPTED" }),
    () => jsonResponse({ outcome: "ACCEPTED" }, 500),
    () => jsonResponse({ outcome: "ACCEPTED" }, 201),
    () => jsonResponse("not json"),
    () => jsonResponse("[]"),
    () => jsonResponse("null"),
    () => new Response("", { status: 200 }),
  ];
  for (const respond of unexpected) {
    const fetchImpl = createFetch(respond);
    const response = await handleCommandRelayPost(
      createRequest(),
      configuredEnvironment(),
      dependencies(fetchImpl),
    );
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { outcome: "unexpected_response" });
    assert.equal(fetchImpl.calls.length, 1);
  }
});

test("reports a thrown fetch, a timeout, or an oversized response as transport_failure without a resend", async () => {
  const {
    RELAY_MAX_RESPONSE_BYTES,
    RELAY_TIMEOUT_MILLISECONDS,
    handleCommandRelayPost,
  } = await loadRelayModule();

  assert.equal(RELAY_TIMEOUT_MILLISECONDS, 10_000);
  assert.equal(RELAY_MAX_RESPONSE_BYTES, 4096);

  const failures = [
    () => {
      throw new TypeError("fetch failed");
    },
    () => {
      throw new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      );
    },
    () =>
      jsonResponse(
        `{"outcome":"ACCEPTED","padding":"${"x".repeat(RELAY_MAX_RESPONSE_BYTES)}"}`,
      ),
    () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('{"outcome":"ACCEPTED"'),
            );
            controller.error(new Error("connection reset"));
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  ];
  for (const respond of failures) {
    const fetchImpl = createFetch(respond);
    const response = await handleCommandRelayPost(
      createRequest(),
      configuredEnvironment(),
      dependencies(fetchImpl),
    );
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { outcome: "transport_failure" });
    assert.equal(fetchImpl.calls.length, 1);
  }
});

test("refuses an oversized request body before hashing and forwards one at the cap", async () => {
  const { RELAY_MAX_REQUEST_BYTES, handleCommandRelayPost } = await loadRelayModule();

  assert.equal(RELAY_MAX_REQUEST_BYTES, 65_536);

  const oversized = createFetch(() => jsonResponse({ outcome: "ACCEPTED" }));
  const tooLarge = await handleCommandRelayPost(
    createRequest(new Uint8Array(RELAY_MAX_REQUEST_BYTES + 1).fill(0x7b)),
    configuredEnvironment(),
    dependencies(oversized),
  );
  assert.equal(tooLarge.status, 413);
  assert.deepEqual(await tooLarge.json(), { outcome: "REJECTED" });
  assert.equal(oversized.calls.length, 0);

  const atCap = createFetch(() => jsonResponse({ outcome: "ACCEPTED" }));
  const exact = new Uint8Array(RELAY_MAX_REQUEST_BYTES).fill(0x7b);
  const accepted = await handleCommandRelayPost(createRequest(exact), configuredEnvironment(), dependencies(atCap));
  assert.equal(accepted.status, 200);
  assert.equal(atCap.calls.length, 1);
  assert.deepEqual(forwardedBytes(atCap.calls[0].init), exact);
  assert.equal(forwardedHeaders(atCap.calls[0].init).bodySha256, await sha256Hex(exact));

  const empty = createFetch(() => jsonResponse({ outcome: "REJECTED" }));
  const noBody = await handleCommandRelayPost(
    new Request("https://web.test/api/commands", { method: "POST" }),
    configuredEnvironment(),
    dependencies(empty),
  );
  assert.equal(noBody.status, 200);
  assert.deepEqual(await noBody.json(), { outcome: "REJECTED" });
  assert.equal(forwardedBytes(empty.calls[0].init).byteLength, 0);
});

test("discloses no body, header, key, signature, or backend text in any relay response", async () => {
  const { handleCommandRelayPost } = await loadRelayModule();
  const backendText = '{"outcome":"REJECTED","detail":"secret-backend-detail"}';
  const responders = [
    () => jsonResponse(backendText),
    () => jsonResponse({ outcome: "WEIRD", detail: "secret-backend-detail" }),
    () => jsonResponse({ error: "secret-backend-detail" }, 500),
    () => {
      throw new Error("secret-network-detail");
    },
  ];

  for (const respond of responders) {
    const fetchImpl = createFetch(respond);
    const response = await handleCommandRelayPost(
      createRequest(),
      configuredEnvironment(),
      dependencies(fetchImpl),
    );
    const text = await response.text();
    const forwarded = fetchImpl.calls[0]
      ? forwardedHeaders(fetchImpl.calls[0].init)
      : null;

    assert.doesNotMatch(text, /secret-/u);
    assert.equal(text.includes(bodyText), false);
    assert.equal(text.includes(secretHex), false);
    assert.equal(text.includes("key-A"), false);
    if (forwarded) {
      assert.equal(text.includes(forwarded.signature), false);
      assert.equal(text.includes(forwarded.bodySha256), false);
      assert.equal(text.includes(forwarded.requestNonce), false);
    }
  }

  const relaySource = await readAppFile("src/lib/wallet/command-relay.ts");
  assert.doesNotMatch(relaySource, /\bconsole\b/u);
  assert.doesNotMatch(relaySource, /\bfrom\s+["']node:/u);
  assert.doesNotMatch(relaySource, /\bprocess\.env\b/u);
  assert.doesNotMatch(
    relaySource,
    /localStorage|sessionStorage|document\.cookie/u,
  );
  assert.equal([...relaySource.matchAll(/\bfetch\b/gu)].length > 0, true);
});

test("exposes the handler through a POST-only route that passes process.env", async () => {
  const routeSource = await readAppFile("src/app/api/commands/route.ts");
  const exports = [
    ...routeSource.matchAll(
      /^export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z_$][\w$]*)/gmu,
    ),
  ].map(([, name]) => name);

  assert.deepEqual(exports, ["POST"]);
  assert.match(
    routeSource,
    /from\s+["']\.\.\/\.\.\/\.\.\/lib\/wallet\/command-relay(?:\.ts)?["']/u,
  );
  assert.match(
    routeSource,
    /handleCommandRelayPost\(\s*request\s*,\s*process\.env\s*\)/u,
  );
  assert.doesNotMatch(routeSource, /\bconsole\b/u);
});

test("relays a signed body from the browser to the route once and maps the answer to the closed union", async () => {
  const { parseRelayOutcome, relayCommandBody } = await loadRelayModule();

  for (const outcome of [
    "ACCEPTED",
    "REPLAYED",
    "CONFLICT",
    "REJECTED",
    "UNSUPPORTED_TYPE",
    "not_configured",
    "transport_failure",
    "unexpected_response",
  ]) {
    assert.equal(parseRelayOutcome({ outcome }), outcome);
  }
  assert.equal(parseRelayOutcome({ outcome: "NOT_AUTHORIZED" }), null);
  assert.equal(parseRelayOutcome({ outcome: "accepted" }), null);
  assert.equal(parseRelayOutcome("ACCEPTED"), null);
  assert.equal(parseRelayOutcome(null), null);
  assert.equal(parseRelayOutcome({}), null);

  const accepted = createFetch(() => jsonResponse({ outcome: "ACCEPTED" }));
  assert.equal(await relayCommandBody(bodyText, accepted), "ACCEPTED");
  assert.equal(accepted.calls.length, 1);
  assert.equal(accepted.calls[0].url, "/api/commands");
  assert.equal(accepted.calls[0].init.method, "POST");
  assert.equal(accepted.calls[0].init.body, bodyText);
  assert.equal(
    new Headers(accepted.calls[0].init.headers).get("content-type"),
    "application/json",
  );

  const notConfigured = createFetch(() =>
    jsonResponse({ outcome: "not_configured" }, 503),
  );
  assert.equal(
    await relayCommandBody(bodyText, notConfigured),
    "not_configured",
  );

  const weird = createFetch(() => jsonResponse({ outcome: "WEIRD" }));
  assert.equal(await relayCommandBody(bodyText, weird), "unexpected_response");
  const notJson = createFetch(() => jsonResponse("<html>"));
  assert.equal(
    await relayCommandBody(bodyText, notJson),
    "unexpected_response",
  );
  const thrown = createFetch(() => {
    throw new TypeError("fetch failed");
  });
  assert.equal(await relayCommandBody(bodyText, thrown), "transport_failure");
  assert.equal(thrown.calls.length, 1);
});

test("signs and relays through one flow that re-reads the session, draws a fresh nonce, and never relays without a signature", async () => {
  const { signAndRelayCommand } = await loadRelayModule();
  const signerAddress = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
  const payloadText = '{"expiresAt":"2026-09-07T19:04:00.000Z","operationKind":"ATS_CREATE"}';
  const request = {
    type: "external.prepare",
    canonicalPayloadBytes: new TextEncoder().encode(payloadText),
    issuedAt: "2026-09-07T19:00:00.000Z",
    expiresAt: "2026-09-07T19:04:00.000Z",
  };
  const beforeExpiry = () => Date.parse("2026-09-07T19:01:00.000Z");
  const dummySignature = `0x${"01".repeat(64)}1b`;

  function stubProvider({ chainId = "0x128", accounts = [signerAddress], signError } = {}) {
    const calls = [];
    return {
      isMetaMask: true,
      calls,
      async request({ method, params }) {
        calls.push({ method, params });
        switch (method) {
          case "eth_chainId":
            return chainId;
          case "eth_accounts":
            return accounts;
          case "eth_signTypedData_v4":
            if (signError) {
              throw signError;
            }
            return dummySignature;
          default:
            throw new Error(`unexpected method ${method}`);
        }
      },
    };
  }

  function stubRelay(outcome = "ACCEPTED") {
    const bodies = [];
    const relay = async (body) => {
      bodies.push(body);
      return outcome;
    };
    relay.bodies = bodies;
    return relay;
  }

  const provider = stubProvider();
  const relay = stubRelay();
  const events = [];
  const result = await signAndRelayCommand(provider, request, {
    relay,
    onSigned: () => events.push("signed"),
    nowMilliseconds: beforeExpiry,
  });
  assert.deepEqual(result, { kind: "relayed", outcome: "ACCEPTED" });
  assert.deepEqual(
    provider.calls.map((call) => call.method),
    ["eth_chainId", "eth_accounts", "eth_signTypedData_v4"],
  );
  assert.deepEqual(events, ["signed"]);
  assert.equal(relay.bodies.length, 1);
  const firstBody = JSON.parse(relay.bodies[0]);
  assert.deepEqual(Object.keys(firstBody), ["command", "payload"]);
  assert.equal(firstBody.command.signer, signerAddress);
  assert.equal(firstBody.command.signature, dummySignature);
  assert.match(firstBody.command.nonce, /^[A-Za-z0-9_-]{21}[AQgw]$/u);
  assert.deepEqual(firstBody.payload, JSON.parse(payloadText));

  await signAndRelayCommand(provider, request, { relay, nowMilliseconds: beforeExpiry });
  const secondBody = JSON.parse(relay.bodies[1]);
  assert.notEqual(secondBody.command.nonce, firstBody.command.nonce);
  assert.deepEqual(
    provider.calls.slice(3).map((call) => call.method),
    ["eth_chainId", "eth_accounts", "eth_signTypedData_v4"],
  );

  const declined = stubProvider({ signError: { code: 4001, message: "User rejected the request." } });
  const declinedRelay = stubRelay();
  assert.deepEqual(
    await signAndRelayCommand(declined, request, { relay: declinedRelay, nowMilliseconds: beforeExpiry }),
    { kind: "declined" },
  );
  assert.equal(declinedRelay.bodies.length, 0);

  const broken = stubProvider({ signError: new Error("internal") });
  const brokenRelay = stubRelay();
  assert.deepEqual(
    await signAndRelayCommand(broken, request, { relay: brokenRelay, nowMilliseconds: beforeExpiry }),
    { kind: "signing_failed" },
  );
  assert.equal(brokenRelay.bodies.length, 0);

  const wrongChain = stubProvider({ chainId: "0x1" });
  const wrongChainRelay = stubRelay();
  assert.deepEqual(
    await signAndRelayCommand(wrongChain, request, { relay: wrongChainRelay, nowMilliseconds: beforeExpiry }),
    { kind: "wrong_chain" },
  );
  assert.deepEqual(wrongChain.calls.map((call) => call.method), ["eth_chainId"]);
  assert.equal(wrongChainRelay.bodies.length, 0);

  const noAccount = stubProvider({ accounts: [] });
  assert.deepEqual(
    await signAndRelayCommand(noAccount, request, { relay: stubRelay(), nowMilliseconds: beforeExpiry }),
    { kind: "no_account" },
  );

  const expiredProvider = stubProvider();
  const expiredRelay = stubRelay();
  assert.deepEqual(
    await signAndRelayCommand(expiredProvider, request, {
      relay: expiredRelay,
      nowMilliseconds: () => Date.parse("2026-09-07T19:04:00.000Z"),
    }),
    { kind: "expired" },
  );
  assert.equal(expiredProvider.calls.length, 0);
  assert.equal(expiredRelay.bodies.length, 0);

  const unknownRelay = stubRelay("transport_failure");
  assert.deepEqual(
    await signAndRelayCommand(stubProvider(), request, { relay: unknownRelay, nowMilliseconds: beforeExpiry }),
    { kind: "relayed", outcome: "transport_failure" },
  );
  assert.equal(unknownRelay.bodies.length, 1);

  const invalidTypeProvider = stubProvider();
  const invalidTypeRelay = stubRelay();
  let nonceDraws = 0;
  assert.deepEqual(
    await signAndRelayCommand(
      invalidTypeProvider,
      { ...request, type: "offering.delete" },
      {
        relay: invalidTypeRelay,
        nowMilliseconds: beforeExpiry,
        randomBytes: () => {
          nonceDraws += 1;
          return new Uint8Array(16);
        },
      },
    ),
    { kind: "signing_failed" },
  );
  assert.equal(nonceDraws, 0);
  assert.deepEqual(invalidTypeProvider.calls, []);
  assert.equal(invalidTypeRelay.bodies.length, 0);
});
}
