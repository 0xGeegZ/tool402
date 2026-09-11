import {
  CHALLENGE_MAX_AGE_SECONDS,
  createChallenge as createCoreChallenge,
  readDashboardAuthOrigin,
  SESSION_MAX_AGE_SECONDS,
  type DashboardAuthEnvironment,
  verifyChallenge as verifyCoreChallenge,
} from "./dashboard-auth.ts";

type CoreDependencies = NonNullable<Parameters<typeof createCoreChallenge>[1]>;

type RouteDependencies = CoreDependencies & Readonly<{
  createChallenge?: typeof createCoreChallenge;
  verifyChallenge?: typeof verifyCoreChallenge;
}>;

const CHALLENGE_COOKIE = "__Host-tool402-dashboard-challenge";
const SESSION_COOKIE = "__Host-tool402-dashboard-session";
const cookieValuePattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;

function configuredOrigin(env: DashboardAuthEnvironment): string | null {
  return readDashboardAuthOrigin(env);
}

function response(status: number, body: object, cookies: readonly string[] = []): Response {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function notConfigured(): Response {
  return response(503, { outcome: "not_configured" });
}

function rejected(clearChallenge = false): Response {
  return response(401, { outcome: "rejected" }, clearChallenge ? [clearCookie(CHALLENGE_COOKIE)] : []);
}

function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

function clearCookie(name: string): string {
  return cookie(name, "", 0);
}

function isBoundedCookieValue(value: unknown): value is string {
  return typeof value === "string" && value.length <= 2048 && cookieValuePattern.test(value);
}

async function exactJsonBody(request: Request, keys: readonly string[]): Promise<Record<string, string> | null> {
  if (request.headers.get("content-type") !== "application/json") return null;
  let value: unknown;
  try {
    const text = await request.text();
    if (text.length > 8192) return null;
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const record = value as Record<string, unknown>;
  if (Reflect.ownKeys(record).length !== keys.length) return null;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (descriptor === undefined || !("value" in descriptor) || typeof descriptor.value !== "string" || !descriptor.enumerable) return null;
  }
  return record as Record<string, string>;
}

function challengeCookieFrom(request: Request): string {
  const header = request.headers.get("cookie");
  if (header === null || header.length > 4096) return "";
  const prefix = `${CHALLENGE_COOKIE}=`;
  const matches = header.split(";").map((part) => part.trim()).filter((part) => part.startsWith(prefix));
  if (matches.length !== 1) return "";
  const value = matches[0]!.slice(prefix.length);
  return isBoundedCookieValue(value) ? value : "";
}

function coreDependencies(dependencies: RouteDependencies): CoreDependencies {
  const { createChallenge: _createChallenge, verifyChallenge: _verifyChallenge, ...core } = dependencies;
  return core;
}

export async function handleChallengePost(request: Request, env: DashboardAuthEnvironment, dependencies: RouteDependencies = {}): Promise<Response> {
  const origin = configuredOrigin(env);
  if (origin === null) return notConfigured();
  const body = await exactJsonBody(request, ["address"]);
  if (body === null || request.headers.get("origin") !== origin) return rejected();
  try {
    const createChallenge = dependencies.createChallenge ?? createCoreChallenge;
    const challenge = await createChallenge({ address: body.address, env }, coreDependencies(dependencies));
    if (!isBoundedCookieValue(challenge.cookie)) return rejected();
    return response(200, { message: challenge.message, expiresAt: challenge.expiresAt }, [cookie(CHALLENGE_COOKIE, challenge.cookie, CHALLENGE_MAX_AGE_SECONDS)]);
  } catch {
    return rejected();
  }
}

export async function handleVerifyPost(request: Request, env: DashboardAuthEnvironment, dependencies: RouteDependencies = {}): Promise<Response> {
  const origin = configuredOrigin(env);
  if (origin === null) return notConfigured();
  const body = await exactJsonBody(request, ["message", "signature"]);
  if (body === null || request.headers.get("origin") !== origin) return rejected(true);
  try {
    const verifyChallenge = dependencies.verifyChallenge ?? verifyCoreChallenge;
    const verification = await verifyChallenge({
      challengeCookie: challengeCookieFrom(request),
      message: body.message,
      signature: body.signature,
      origin,
      env,
    }, coreDependencies(dependencies));
    if (verification.kind !== "authenticated" || !isBoundedCookieValue(verification.sessionCookie)) return rejected(true);
    return response(200, { outcome: "authenticated" }, [
      clearCookie(CHALLENGE_COOKIE),
      cookie(SESSION_COOKIE, verification.sessionCookie, SESSION_MAX_AGE_SECONDS),
    ]);
  } catch {
    return rejected(true);
  }
}

export async function handleLogoutPost(request: Request, env: DashboardAuthEnvironment): Promise<Response> {
  const origin = configuredOrigin(env);
  if (origin === null) return notConfigured();
  if (request.headers.get("origin") !== origin) return rejected();
  const headers = new Headers({ "cache-control": "no-store" });
  headers.append("set-cookie", clearCookie(CHALLENGE_COOKIE));
  headers.append("set-cookie", clearCookie(SESSION_COOKIE));
  return new Response(null, { status: 204, headers });
}
