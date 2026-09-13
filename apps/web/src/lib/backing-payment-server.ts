import { readDashboardAuthOrigin, readDashboardSession, readDashboardSessionCookieName, type DashboardAuthEnvironment } from "./dashboard-auth/dashboard-auth.ts";
import { createCommandNonce, createCommandTimestamps } from "./wallet/tool402-command.ts";

const addressPattern = /^0x[0-9a-f]{40}$/u;
const attemptPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const integerPattern = /^(?:0|[1-9][0-9]*)$/u;
const maximumBytes = 4096;
type Parameters = Readonly<{ offeringPublicId: string; units: string; tinybars: string; purchaseIntentId: string }>;
export type FrozenBackingIntent = Readonly<{
  idempotencyKey: string;
  purchaseIntentId: string;
  offeringPublicId: string;
  subjectPublicId: string;
  recipient: `0x${string}`;
  units: string;
  tinybars: string;
  canonicalParametersHash: string;
  expiresAt: string;
}>;
export type BackingPaymentRecord = Readonly<{ status: "PREPARED" | "CONFIRMED" | "REJECTED" | "SUBMITTED" | "OUTCOME_UNKNOWN"; transactionHash: `0x${string}` | null; tinybars: string }>;
type Session = Readonly<{ address: string; issuedAt: string; expiresAt: string }>;
type Dependencies = Readonly<{
  readSession?: (value: string, env: DashboardAuthEnvironment) => Promise<Session | null>;
  forward?: (payload: Record<string, unknown>) => Promise<unknown | null>;
}>;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

function cookie(request: Request, name: string): string | null {
  const values = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim()).filter(Boolean);
  const matches = values.filter((value) => value.startsWith(`${name}=`));
  return matches.length === 1 ? matches[0]!.slice(name.length + 1) : null;
}

async function body(request: Request, requiresHash: boolean): Promise<{ attemptPublicId: string; transactionHash?: `0x${string}`; parameters: Parameters } | null> {
  try {
    const length = request.headers.get("content-length");
    if (length !== null && (!/^(?:0|[1-9][0-9]*)$/u.test(length) || Number(length) > maximumBytes)) return null;
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maximumBytes) return null;
    const value = JSON.parse(text) as Record<string, unknown>;
    if (value === null || typeof value !== "object" || Array.isArray(value) || JSON.stringify(Object.keys(value)) !== JSON.stringify(requiresHash ? ["attemptPublicId", "transactionHash", "parameters"] : ["attemptPublicId", "parameters"])) return null;
    const parameters = value.parameters;
    if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters) || JSON.stringify(Object.keys(parameters)) !== JSON.stringify(["offeringPublicId", "units", "tinybars", "purchaseIntentId"])) return null;
    const input = parameters as Record<string, unknown>;
    if (typeof value.attemptPublicId !== "string" || !attemptPattern.test(value.attemptPublicId) || (requiresHash && (typeof value.transactionHash !== "string" || !hashPattern.test(value.transactionHash)))
      || typeof input.offeringPublicId !== "string" || !/^[A-Za-z0-9_-]{1,96}$/u.test(input.offeringPublicId)
      || typeof input.units !== "string" || !integerPattern.test(input.units) || BigInt(input.units) < 1n
      || typeof input.tinybars !== "string" || !integerPattern.test(input.tinybars) || BigInt(input.tinybars) < 1n
      || typeof input.purchaseIntentId !== "string" || !attemptPattern.test(input.purchaseIntentId)) return null;
    return { attemptPublicId: value.attemptPublicId, ...(requiresHash ? { transactionHash: value.transactionHash as `0x${string}` } : {}), parameters: { offeringPublicId: input.offeringPublicId, units: input.units, tinybars: input.tinybars, purchaseIntentId: input.purchaseIntentId } };
  } catch { return null; }
}

async function intentBody(request: Request): Promise<{ offeringPublicId: string; units: string } | null> {
  try {
    const length = request.headers.get("content-length");
    if (length !== null && (!/^(?:0|[1-9][0-9]*)$/u.test(length) || Number(length) > maximumBytes)) return null;
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maximumBytes) return null;
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value) || JSON.stringify(Object.keys(value)) !== JSON.stringify(["offeringPublicId", "units"])) return null;
    const input = value as Record<string, unknown>;
    return typeof input.offeringPublicId === "string" && /^[A-Za-z0-9_-]{1,96}$/u.test(input.offeringPublicId)
      && typeof input.units === "string" && integerPattern.test(input.units) && BigInt(input.units) >= 1n
      ? { offeringPublicId: input.offeringPublicId, units: input.units }
      : null;
  } catch { return null; }
}

function config(env: DashboardAuthEnvironment): { keyId: string; secret: Uint8Array; target: string } | null {
  const keyId = env.TOOL402_INGRESS_KEY_ID;
  const secret = env.TOOL402_INGRESS_SECRET;
  const site = env.TOOL402_CONVEX_SITE_URL;
  if (typeof keyId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(keyId) || typeof secret !== "string" || !/^[0-9a-f]{64}$/u.test(secret) || typeof site !== "string") return null;
  try {
    const url = new URL(site);
    return url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash
      ? { keyId, secret: Uint8Array.from(Buffer.from(secret, "hex")), target: `${url.origin}/internal/provider-tools` }
      : null;
  } catch { return null; }
}

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function forward(env: DashboardAuthEnvironment, payload: Record<string, unknown>): Promise<unknown | null> {
  const configuration = config(env);
  if (configuration === null) return null;
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const digest = Buffer.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).toString("hex");
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
    const key = await crypto.subtle.importKey("raw", arrayBuffer(configuration.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`tool402:provider-session:v1\nPOST\n/internal/provider-tools\n${timestamp}\n${nonce}\n${digest}`));
    const response = await fetch(configuration.target, { method: "POST", headers: { "content-type": "application/json", "x-tool402-key-id": configuration.keyId, "x-tool402-timestamp": timestamp, "x-tool402-nonce": nonce, "x-tool402-content-sha256": digest, "x-tool402-signature": Buffer.from(new Uint8Array(signed)).toString("base64url") }, body: bytes, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000) });
    if (!response.ok || !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
    return await response.json();
  } catch { return null; }
}

function record(value: unknown): BackingPaymentRecord | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  return (input.status === "PREPARED" || input.status === "CONFIRMED" || input.status === "REJECTED" || input.status === "SUBMITTED" || input.status === "OUTCOME_UNKNOWN")
    && (input.status === "PREPARED" ? input.transactionHash === null : typeof input.transactionHash === "string" && hashPattern.test(input.transactionHash))
    && typeof input.tinybars === "string" && integerPattern.test(input.tinybars)
    ? { status: input.status, transactionHash: input.transactionHash === null ? null : input.transactionHash as `0x${string}`, tinybars: input.tinybars }
    : null;
}

function frozenIntent(value: unknown): FrozenBackingIntent | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const outer = value as Record<string, unknown>;
  if (outer.outcome !== "PREPARED" || outer.intent === null || typeof outer.intent !== "object" || Array.isArray(outer.intent)) return null;
  const intent = outer.intent as Record<string, unknown>;
  if (JSON.stringify(Object.keys(intent)) !== JSON.stringify(["idempotencyKey", "purchaseIntentId", "offeringPublicId", "subjectPublicId", "recipient", "units", "tinybars", "canonicalParametersHash", "expiresAt"])
    || typeof intent.idempotencyKey !== "string" || !attemptPattern.test(intent.idempotencyKey)
    || typeof intent.purchaseIntentId !== "string" || !attemptPattern.test(intent.purchaseIntentId)
    || typeof intent.offeringPublicId !== "string" || !/^[A-Za-z0-9_-]{1,96}$/u.test(intent.offeringPublicId)
    || typeof intent.subjectPublicId !== "string" || !/^[A-Za-z0-9_-]{1,96}$/u.test(intent.subjectPublicId)
    || typeof intent.recipient !== "string" || !addressPattern.test(intent.recipient)
    || typeof intent.units !== "string" || !integerPattern.test(intent.units) || BigInt(intent.units) < 1n
    || typeof intent.tinybars !== "string" || !integerPattern.test(intent.tinybars) || BigInt(intent.tinybars) < 1n
    || typeof intent.canonicalParametersHash !== "string" || !/^[0-9a-f]{64}$/u.test(intent.canonicalParametersHash)
    || typeof intent.expiresAt !== "string" || new Date(Date.parse(intent.expiresAt)).toISOString() !== intent.expiresAt
  ) return null;
  return {
    idempotencyKey: intent.idempotencyKey, purchaseIntentId: intent.purchaseIntentId,
    offeringPublicId: intent.offeringPublicId, subjectPublicId: intent.subjectPublicId,
    recipient: intent.recipient as `0x${string}`, units: intent.units, tinybars: intent.tinybars,
    canonicalParametersHash: intent.canonicalParametersHash, expiresAt: intent.expiresAt,
  };
}

async function sessionFor(request: Request, env: DashboardAuthEnvironment, readSession: Dependencies["readSession"] = readDashboardSession): Promise<Session | null> {
  const origin = readDashboardAuthOrigin(env);
  const name = readDashboardSessionCookieName(env);
  if (origin === null || name === null || request.headers.get("origin") !== origin) return null;
  const value = cookie(request, name);
  return value === null ? null : readSession(value, env);
}

async function handle(request: Request, env: DashboardAuthEnvironment, dependencies: Dependencies, reserve: boolean): Promise<Response> {
  if (request.method !== "POST") return json({ outcome: "rejected" }, 401);
  const [session, input] = await Promise.all([sessionFor(request, env, dependencies.readSession), body(request, !reserve)]);
  if (session === null || input === null) return json({ outcome: "rejected" }, 401);
  const payload = reserve
    ? { type: "backing_reserve", canonicalSignerAddress: session.address, attemptPublicId: input.attemptPublicId, parameters: input.parameters, sessionExpiresAt: session.expiresAt }
    : { type: "backing", canonicalSignerAddress: session.address, attemptPublicId: input.attemptPublicId, transactionHash: input.transactionHash!, parameters: input.parameters, sessionExpiresAt: session.expiresAt };
  const result = record(await (dependencies.forward === undefined ? forward(env, payload) : dependencies.forward(payload)));
  return result === null ? json({ outcome: "unavailable" }, 503) : json(result, 200);
}

export function handleBackingPaymentRequest(request: Request, env: DashboardAuthEnvironment, dependencies: Dependencies = {}): Promise<Response> {
  return handle(request, env, dependencies, false);
}

export function reserveBackingPaymentRequest(request: Request, env: DashboardAuthEnvironment, dependencies: Dependencies = {}): Promise<Response> {
  return handle(request, env, dependencies, true);
}

export async function prepareBackingIntentRequest(request: Request, env: DashboardAuthEnvironment, dependencies: Dependencies = {}): Promise<Response> {
  if (request.method !== "POST") return json({ outcome: "rejected" }, 401);
  const [session, input] = await Promise.all([sessionFor(request, env, dependencies.readSession), intentBody(request)]);
  if (session === null || input === null) return json({ outcome: "rejected" }, 401);
  try {
    const { expiresAt } = createCommandTimestamps(Date.now());
    const result = frozenIntent(await (dependencies.forward === undefined ? forward(env, {
      type: "backing_intent", canonicalSignerAddress: session.address, offeringPublicId: input.offeringPublicId,
      units: input.units, idempotencyKey: createCommandNonce(), purchaseIntentId: createCommandNonce(),
      expiresAt, sessionExpiresAt: session.expiresAt,
    }) : dependencies.forward({
      type: "backing_intent", canonicalSignerAddress: session.address, offeringPublicId: input.offeringPublicId,
      units: input.units, idempotencyKey: createCommandNonce(), purchaseIntentId: createCommandNonce(),
      expiresAt, sessionExpiresAt: session.expiresAt,
    })));
    return result === null ? json({ outcome: "unavailable" }, 503) : json({ intent: result }, 200);
  } catch { return json({ outcome: "unavailable" }, 503); }
}

export async function loadBackerPayment(env: DashboardAuthEnvironment, sessionCookie: string | null): Promise<BackingPaymentRecord | null> {
  const session = await readDashboardSession(sessionCookie, env);
  if (session === null || !addressPattern.test(session.address)) return null;
  return record(await forward(env, { type: "backing_read", canonicalSignerAddress: session.address, sessionExpiresAt: session.expiresAt }));
}
