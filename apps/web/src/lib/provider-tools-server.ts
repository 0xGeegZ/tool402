import {
  readDashboardAuthOrigin,
  readDashboardSession,
  readDashboardSessionCookieName,
  type DashboardAuthEnvironment,
} from "./dashboard-auth/dashboard-auth.ts";

type Session = Readonly<{ address: string; issuedAt: string; expiresAt: string }>;
type ForwardInput = Readonly<{
  canonicalSignerAddress: string;
  requestId?: string;
  cursor?: string | null;
  toolPublicId?: string;
  sessionExpiresAt: string;
}>;
type Dependencies = Readonly<{
  readSession?: (cookie: string | null) => Promise<Session | null>;
  forward?: (input: ForwardInput) => Promise<Response>;
}>;

const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const toolIdPattern = /^tool_[0-9a-f]{32}$/u;
const maximumRequestBytes = 1024;
const maximumResponseBytes = 65_536;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function cookieValue(request: Request, name: string): string | null {
  const values = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim()).filter(Boolean);
  const matches = values.filter((value) => value.startsWith(`${name}=`));
  return matches.length === 1 ? matches[0]!.slice(name.length + 1) : null;
}

async function boundedResponse(source: Response): Promise<Response> {
  const length = source.headers.get("content-length");
  if (length !== null && (!/^(?:0|[1-9][0-9]*)$/u.test(length) || Number(length) > maximumResponseBytes)) return json({ outcome: "unavailable" }, 503);
  if (!source.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ outcome: "unavailable" }, 503);
  if (source.body === null) return new Response(null, { status: source.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const reader = source.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maximumResponseBytes) {
        await reader.cancel();
        return json({ outcome: "unavailable" }, 503);
      }
      chunks.push(new Uint8Array(next.value));
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new Response(bytes, { status: source.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch {
    return json({ outcome: "unavailable" }, 503);
  } finally {
    reader.releaseLock();
  }
}

async function body(request: Request): Promise<{ requestId: string } | null> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^(?:0|[1-9][0-9]*)$/u.test(length) || Number(length) > maximumRequestBytes)) return null;
  if (request.body === null) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maximumRequestBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(new Uint8Array(next.value));
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    return JSON.stringify(Object.keys(record)) === JSON.stringify(["requestId"]) && typeof record.requestId === "string" && requestIdPattern.test(record.requestId)
      ? { requestId: record.requestId }
      : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function sessionInput(request: Request, env: DashboardAuthEnvironment): { cookie: string | null; origin: string } | null {
  const origin = readDashboardAuthOrigin(env);
  const cookieName = readDashboardSessionCookieName(env);
  const requestOrigin = request.headers.get("origin");
  if (origin === null || cookieName === null
    || (request.method === "POST" && requestOrigin !== origin)
    || (request.method === "GET" && requestOrigin !== null && requestOrigin !== origin)) return null;
  const cookie = cookieValue(request, cookieName);
  return cookie === null || cookie.length === 0 ? null : { cookie, origin };
}

function getInput(request: Request): Pick<ForwardInput, "cursor" | "toolPublicId"> | null {
  let parameters: URLSearchParams;
  try {
    parameters = new URL(request.url).searchParams;
  } catch {
    return null;
  }
  const keys = [...parameters.keys()];
  if (keys.length === 0) return { cursor: null };
  if (keys.length !== 1) return null;
  if (keys[0] === "cursor") {
    const cursor = parameters.get("cursor");
    return cursor !== null && cursor.length > 0 && cursor.length <= maximumRequestBytes ? { cursor } : null;
  }
  if (keys[0] === "tool") {
    const toolPublicId = parameters.get("tool");
    return toolPublicId !== null && toolIdPattern.test(toolPublicId) ? { toolPublicId } : null;
  }
  return null;
}

function ingressConfiguration(env: DashboardAuthEnvironment): { keyId: string; secret: Uint8Array; target: string } | null {
  const keyId = env.TOOL402_INGRESS_KEY_ID;
  const secret = env.TOOL402_INGRESS_SECRET;
  const site = env.TOOL402_CONVEX_SITE_URL;
  if (typeof keyId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(keyId) || typeof secret !== "string" || !/^[0-9a-f]{64}$/u.test(secret) || typeof site !== "string") return null;
  try {
    const url = new URL(site);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return { keyId, secret: new Uint8Array(Buffer.from(secret, "hex")), target: `${url.origin}/internal/provider-tools` };
  } catch { return null; }
}

async function forwardAssertion(input: ForwardInput, env: DashboardAuthEnvironment): Promise<Response> {
  try {
    const configuration = ingressConfiguration(env);
    if (configuration === null) return json({ outcome: "not_configured" }, 503);
    const payload = input.requestId === undefined
      ? input.toolPublicId === undefined
        ? { type: "list", canonicalSignerAddress: input.canonicalSignerAddress, cursor: input.cursor ?? null, sessionExpiresAt: input.sessionExpiresAt }
        : { type: "read", canonicalSignerAddress: input.canonicalSignerAddress, toolPublicId: input.toolPublicId, sessionExpiresAt: input.sessionExpiresAt }
      : { type: "allocate", canonicalSignerAddress: input.canonicalSignerAddress, requestId: input.requestId, sessionExpiresAt: input.sessionExpiresAt };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const digest = Buffer.from(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", toArrayBuffer(bytes)))).toString("hex");
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
    const signingInput = `tool402:provider-session:v1\nPOST\n/internal/provider-tools\n${timestamp}\n${nonce}\n${digest}`;
    const key = await globalThis.crypto.subtle.importKey("raw", toArrayBuffer(configuration.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = Buffer.from(new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, toArrayBuffer(new TextEncoder().encode(signingInput))))).toString("base64url");
    return await fetch(configuration.target, {
      method: "POST",
      headers: { "content-type": "application/json", "x-tool402-key-id": configuration.keyId, "x-tool402-timestamp": timestamp, "x-tool402-nonce": nonce, "x-tool402-content-sha256": digest, "x-tool402-signature": signature },
      body: bytes,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch { return json({ outcome: "unavailable" }, 503); }
}

export async function handleProviderToolsRequest(request: Request, env: DashboardAuthEnvironment, dependencies: Dependencies = {}): Promise<Response> {
  const readInput = request.method === "GET" ? getInput(request) : undefined;
  if (request.method === "GET" && readInput === null) return json({ outcome: "rejected" }, 401);
  const sessionRequest = sessionInput(request, env);
  if (sessionRequest === null) return json({ outcome: "rejected" }, 401);
  let parsedBody: { requestId: string } | null = null;
  if (request.method === "POST") {
    parsedBody = await body(request);
    if (parsedBody === null) return json({ outcome: "rejected" }, 401);
  } else if (readInput === undefined) {
    return json({ outcome: "rejected" }, 401);
  }
  const readSession = dependencies.readSession ?? ((cookie) => readDashboardSession(cookie, env));
  let session: Session | null;
  try { session = await readSession(sessionRequest.cookie); } catch { session = null; }
  if (session === null) return json({ outcome: "rejected" }, 401);
  const forward = dependencies.forward ?? ((input) => forwardAssertion(input, env));
  try {
    const upstream = request.method === "POST"
      ? await forward({ canonicalSignerAddress: session.address, requestId: parsedBody!.requestId, sessionExpiresAt: session.expiresAt })
      : await forward({ canonicalSignerAddress: session.address, ...readInput!, sessionExpiresAt: session.expiresAt });
    return boundedResponse(upstream);
  } catch {
    return json({ outcome: "unavailable" }, 503);
  }
}
