import { signRequest } from "@worldcoin/idkit/signing";

export const WORLD_ISSUER_COOKIE = "tool402_world_issuer";
export const WORLD_ISSUER_ACTION = "issuer-publish";
export const WORLD_ISSUER_SESSION_SECONDS = 600;
export const WORLD_ISSUER_CONTEXT_SECONDS = 300;

export type WorldEnvironment = Readonly<Record<string, string | undefined>>;

type WorldConfiguration = Readonly<{
  appId: string;
  rpId: string;
  signingKey: string;
  environment: "staging" | "production";
}>;

const addressPattern = /^0x[0-9a-f]{40}$/u;
const appIdPattern = /^app_[a-z0-9]{32}$/u;
const rpIdPattern = /^rp_[a-z0-9]{16}$/u;
const keyPattern = /^0x[0-9a-fA-F]{64}$/u;
const cookiePayloadPattern = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/u;

export function isCanonicalWorldAddress(value: unknown): value is string {
  return typeof value === "string" && addressPattern.test(value);
}

function configuration(env: WorldEnvironment): WorldConfiguration | null {
  const appId = env.WORLD_APP_ID;
  const rpId = env.WORLD_RP_ID;
  const signingKey = env.WORLD_RP_SIGNING_KEY;
  const environment = env.WORLD_ENVIRONMENT;
  if (
    typeof appId !== "string" || !appIdPattern.test(appId) ||
    typeof rpId !== "string" || !rpIdPattern.test(rpId) ||
    typeof signingKey !== "string" || !keyPattern.test(signingKey) ||
    (environment !== "staging" && environment !== "production")
  ) return null;
  return { appId, rpId, signingKey, environment };
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode(value: string): unknown | null {
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); } catch { return null; }
}

async function cookieMac(signingKey: string, payload: string): Promise<string> {
  const material = new TextEncoder().encode(`tool402-world-session-v1:${signingKey}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", material);
  const key = await globalThis.crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const mac = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(mac).toString("base64url");
}

export function createWorldRequest(address: unknown, env: WorldEnvironment) {
  const config = configuration(env);
  if (!config || !isCanonicalWorldAddress(address)) return null;
  const signature = signRequest({ signingKeyHex: config.signingKey, action: WORLD_ISSUER_ACTION, ttl: WORLD_ISSUER_CONTEXT_SECONDS });
  return {
    app_id: config.appId,
    action: WORLD_ISSUER_ACTION,
    environment: config.environment,
    rp_context: {
      rp_id: config.rpId,
      nonce: signature.nonce,
      created_at: signature.createdAt,
      expires_at: signature.expiresAt,
      signature: signature.sig,
    },
  };
}

export function worldVerificationUrl(env: WorldEnvironment): string | null {
  return configuration(env) ? `https://developer.world.org/api/v4/verify/${configuration(env)?.rpId}` : null;
}

export async function createWorldIssuerCookie(address: string, env: WorldEnvironment, nowMilliseconds = Date.now()): Promise<string | null> {
  const config = configuration(env);
  if (!config || !isCanonicalWorldAddress(address)) return null;
  const payload = encode({ v: 1, address, expiresAt: nowMilliseconds + WORLD_ISSUER_SESSION_SECONDS * 1000 });
  return `${payload}.${await cookieMac(config.signingKey, payload)}`;
}

export async function hasWorldIssuerCookie(cookie: string | null, address: unknown, env: WorldEnvironment, nowMilliseconds = Date.now()): Promise<boolean> {
  const config = configuration(env);
  if (!config || !isCanonicalWorldAddress(address) || typeof cookie !== "string") return false;
  const match = cookie.match(cookiePayloadPattern);
  if (!match) return false;
  const [, payload, mac] = match;
  if (mac !== await cookieMac(config.signingKey, payload)) return false;
  const parsed = decode(payload);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return false;
  const record = parsed as { v?: unknown; address?: unknown; expiresAt?: unknown };
  return record.v === 1 && record.address === address && typeof record.expiresAt === "number" && Number.isSafeInteger(record.expiresAt) && record.expiresAt > nowMilliseconds;
}
