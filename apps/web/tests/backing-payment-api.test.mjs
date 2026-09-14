import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const serverUrl = new URL("../src/lib/backing-payment-server.ts", import.meta.url);
const routeUrl = new URL("../src/app/api/backing/payment/route.ts", import.meta.url);

const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
const env = {
  TOOL402_DASHBOARD_AUTH_ORIGIN: "https://tool402.test",
  TOOL402_DASHBOARD_AUTH_SECRET: "a".repeat(64),
};
const payload = {
  attemptPublicId: "AbCdEfGhIjKlMnOpQrStUw",
  transactionHash: `0x${"ab".repeat(32)}`,
  parameters: { offeringPublicId: "riskscan_revenue_note_demo", units: "10", tinybars: "1000000000", purchaseIntentId: "ZyXwVuTsRqPoNmLkJiHgFw" },
};

function request(body = JSON.stringify(payload), origin = "https://tool402.test") {
  return new Request("https://tool402.test/api/backing/payment", { method: "POST", headers: { "content-type": "application/json", origin, cookie: "__Host-tool402-dashboard-session=session" }, body });
}

function intentRequest(body = JSON.stringify({ offeringPublicId: "riskscan_revenue_note_demo", units: "10" }), origin = "https://tool402.test") {
  return new Request("https://tool402.test/api/backing/intent", { method: "POST", headers: { "content-type": "application/json", origin, cookie: "__Host-tool402-dashboard-session=session" }, body });
}

test("requires a valid same-origin dashboard session and forwards only its signer", async () => {
  const { handleBackingPaymentRequest } = await import(serverUrl.href);
  const forwarded = [];
  const response = await handleBackingPaymentRequest(request(), env, {
    readSession: async () => ({ address: signer, issuedAt: "2026-09-13T00:00:00.000Z", expiresAt: "2026-09-13T08:00:00.000Z" }),
    forward: async (input) => { forwarded.push(input); return { status: "CONFIRMED", transactionHash: payload.transactionHash, tinybars: "1000000000" }; },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "CONFIRMED", transactionHash: payload.transactionHash, tinybars: "1000000000" });
  assert.equal(forwarded[0].canonicalSignerAddress, signer);
  assert.equal(forwarded[0].type, "backing");
});

test("freezes a backing intent server-side and never accepts a browser-supplied recipient or price", async () => {
  const { prepareBackingIntentRequest } = await import(serverUrl.href);
  const forwarded = [];
  const session = { address: signer, issuedAt: "2026-09-13T00:00:00.000Z", expiresAt: "2026-09-13T08:00:00.000Z" };
  const response = await prepareBackingIntentRequest(intentRequest(), env, {
    readSession: async () => session,
    forward: async (input) => {
      forwarded.push(input);
      return {
        outcome: "PREPARED",
        intent: {
          idempotencyKey: input.idempotencyKey, purchaseIntentId: input.purchaseIntentId,
          offeringPublicId: input.offeringPublicId, subjectPublicId: "riskscan_revenue_note_demo",
          recipient: "0xc89f87052c3e080b4a9b021d4930055031ef378e", units: input.units,
          tinybars: "1000000000", canonicalParametersHash: "a".repeat(64), expiresAt: input.expiresAt,
        },
      };
    },
  });
  assert.equal(response.status, 200);
  const value = await response.json();
  assert.equal(value.intent.tinybars, "1000000000");
  assert.deepEqual(Object.keys(forwarded[0]), ["type", "canonicalSignerAddress", "offeringPublicId", "units", "idempotencyKey", "purchaseIntentId", "expiresAt", "sessionExpiresAt"]);
  assert.equal(forwarded[0].canonicalSignerAddress, signer);
  assert.equal(forwarded[0].offeringPublicId, "riskscan_revenue_note_demo");
  assert.equal(forwarded[0].units, "10");
  assert.match(forwarded[0].idempotencyKey, /^[A-Za-z0-9_-]{21}[AQgw]$/);
  assert.match(forwarded[0].purchaseIntentId, /^[A-Za-z0-9_-]{21}[AQgw]$/);
  assert.notEqual(forwarded[0].idempotencyKey, forwarded[0].purchaseIntentId);
  const malformed = await prepareBackingIntentRequest(intentRequest(JSON.stringify({ offeringPublicId: "riskscan_revenue_note_demo", units: "10", recipient: signer })), env, { readSession: async () => session });
  assert.equal(malformed.status, 401);
});

test("rejects missing session, wrong origin, malformed body, and unavailable upstream without exposing secrets", async () => {
  const { handleBackingPaymentRequest } = await import(serverUrl.href);
  const unavailable = await handleBackingPaymentRequest(request(), env, { readSession: async () => null });
  assert.equal(unavailable.status, 401);
  const wrongOrigin = await handleBackingPaymentRequest(request(JSON.stringify(payload), "https://evil.test"), env, { readSession: async () => ({ address: signer, issuedAt: "2026-09-13T00:00:00.000Z", expiresAt: "2026-09-13T08:00:00.000Z" }) });
  assert.equal(wrongOrigin.status, 401);
  const malformed = await handleBackingPaymentRequest(request("{}"), env, { readSession: async () => ({ address: signer, issuedAt: "2026-09-13T00:00:00.000Z", expiresAt: "2026-09-13T08:00:00.000Z" }) });
  assert.equal(malformed.status, 401);
  const upstream = await handleBackingPaymentRequest(request(), env, { readSession: async () => ({ address: signer, issuedAt: "2026-09-13T00:00:00.000Z", expiresAt: "2026-09-13T08:00:00.000Z" }), forward: async () => null });
  assert.deepEqual(await upstream.json(), { outcome: "unavailable" });
  const source = await readFile(routeUrl, "utf8");
  assert.doesNotMatch(source, /TOOL402_INGRESS_SECRET|TOOL402_DASHBOARD_AUTH_SECRET/);
});

test("keeps a valid bounded 21-record backing history instead of relabeling it as empty", async () => {
  const { loadBackerPayments } = await import(serverUrl.href);
  const records = Array.from({ length: 21 }, (_, index) => ({ offeringPublicId: `offering_${index}`, status: "CONFIRMED", transactionHash: `0x${index.toString(16).padStart(2, "0").repeat(32)}`, tinybars: "7" }));
  const result = await loadBackerPayments(env, "session", { readSession: async () => ({ address: signer, issuedAt: "2026-09-10T00:00:00.000Z", expiresAt: "2026-09-11T00:00:00.000Z" }), forward: async () => records });
  assert.equal(result.length, 21);
});

test("fails closed for forged or expired sessions, oversized bodies, missing ingress configuration, and untrusted results", async () => {
  const { handleBackingPaymentRequest } = await import(serverUrl.href);
  const session = { address: signer, issuedAt: "2026-09-13T00:00:00.000Z", expiresAt: "2026-09-13T08:00:00.000Z" };
  const forged = await handleBackingPaymentRequest(request(), env, { readSession: async () => null });
  assert.equal(forged.status, 401);
  const oversized = new Request("https://tool402.test/api/backing/payment", { method: "POST", headers: { "content-type": "application/json", origin: "https://tool402.test", cookie: "__Host-tool402-dashboard-session=session", "content-length": "4097" }, body: JSON.stringify(payload) });
  assert.equal((await handleBackingPaymentRequest(oversized, env, { readSession: async () => session })).status, 401);
  const missingConfig = await handleBackingPaymentRequest(request(), env, { readSession: async () => session, forward: async () => ({ unexpected: "result" }) });
  assert.equal(missingConfig.status, 503);
  const unconfigured = await handleBackingPaymentRequest(request(), { ...env, TOOL402_INGRESS_KEY_ID: undefined, TOOL402_INGRESS_SECRET: undefined, TOOL402_CONVEX_SITE_URL: undefined }, { readSession: async () => session });
  assert.equal(unconfigured.status, 503);
  assert.ok((await missingConfig.text()).length < 100, "the public error response is bounded");
});
