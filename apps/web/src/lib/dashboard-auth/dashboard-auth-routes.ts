import {
  CHALLENGE_MAX_AGE_SECONDS,
  readDashboardAuthCookieNames,
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

const cookieValuePattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;

type AuthSettings = Readonly<{
  origin: string;
  cookieNames: NonNullable<ReturnType<typeof readDashboardAuthCookieNames>>;
}>;

function configuredAuth(env: DashboardAuthEnvironment): AuthSettings | null {
  const origin = readDashboardAuthOrigin(env);
  const cookieNames = readDashboardAuthCookieNames(env);
  return origin === null || cookieNames === null ? null : { origin, cookieNames };
}

function response(status: number, body: object, cookies: readonly string[] = []): Response {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function notConfigured(): Response {
  return response(503, { outcome: "not_configured" });
}

function rejected(settings: AuthSettings | null, clearChallenge = false): Response {
  return response(401, { outcome: "rejected" }, clearChallenge && settings !== null ? [clearCookie(settings.cookieNames.challenge, settings.cookieNames.secure)] : []);
}

function cookie(name: string, value: string, maxAge: number, secure: boolean): string {
  return `${name}=${value}; Path=/;${secure ? " Secure;" : ""} HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

function clearCookie(name: string, secure: boolean): string {
  return cookie(name, "", 0, secure);
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

function challengeCookieFrom(request: Request, name: string): string {
  const header = request.headers.get("cookie");
  if (header === null || header.length > 4096) return "";
  const prefix = `${name}=`;
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
  const settings = configuredAuth(env);
  if (settings === null) return notConfigured();
  const body = await exactJsonBody(request, ["address"]);
  if (body === null || request.headers.get("origin") !== settings.origin) return rejected(settings);
  try {
    const createChallenge = dependencies.createChallenge ?? createCoreChallenge;
    const challenge = await createChallenge({ address: body.address, env }, coreDependencies(dependencies));
    if (!isBoundedCookieValue(challenge.cookie)) return rejected(settings);
    const responseBody = settings.cookieNames.secure
      ? { message: challenge.message, expiresAt: challenge.expiresAt }
      : { message: challenge.message, expiresAt: challenge.expiresAt, challenge: challenge.cookie };
    return response(200, responseBody, [cookie(settings.cookieNames.challenge, challenge.cookie, CHALLENGE_MAX_AGE_SECONDS, settings.cookieNames.secure)]);
  } catch {
    return rejected(settings);
  }
}

export async function handleVerifyPost(request: Request, env: DashboardAuthEnvironment, dependencies: RouteDependencies = {}): Promise<Response> {
  const settings = configuredAuth(env);
  if (settings === null) return notConfigured();
  const body = await exactJsonBody(request, settings.cookieNames.secure ? ["message", "signature"] : ["message", "signature", "challenge"]);
  if (body === null || request.headers.get("origin") !== settings.origin) return rejected(settings, true);
  try {
    const verifyChallenge = dependencies.verifyChallenge ?? verifyCoreChallenge;
    const verification = await verifyChallenge({
      challengeCookie: challengeCookieFrom(request, settings.cookieNames.challenge) || body.challenge,
      message: body.message,
      signature: body.signature,
      origin: settings.origin,
      env,
    }, coreDependencies(dependencies));
    if (verification.kind !== "authenticated" || !isBoundedCookieValue(verification.sessionCookie)) return rejected(settings, true);
    return response(200, { outcome: "authenticated" }, [
      clearCookie(settings.cookieNames.challenge, settings.cookieNames.secure),
      cookie(settings.cookieNames.session, verification.sessionCookie, SESSION_MAX_AGE_SECONDS, settings.cookieNames.secure),
    ]);
  } catch {
    return rejected(settings, true);
  }
}

export async function handleLogoutPost(request: Request, env: DashboardAuthEnvironment): Promise<Response> {
  const settings = configuredAuth(env);
  if (settings === null) return notConfigured();
  if (request.headers.get("origin") !== settings.origin) return rejected(settings);
  const headers = new Headers({ "cache-control": "no-store" });
  headers.append("set-cookie", clearCookie(settings.cookieNames.challenge, settings.cookieNames.secure));
  headers.append("set-cookie", clearCookie(settings.cookieNames.session, settings.cookieNames.secure));
  return new Response(null, { status: 204, headers });
}
