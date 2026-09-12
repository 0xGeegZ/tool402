import { hashSignal } from "@worldcoin/idkit/hashing";
import { signRequest } from "@worldcoin/idkit/signing";

export const WORLD_HUMAN_COOKIE = "tool402-world-human";
export const WORLD_HUMAN_MAX_AGE_SECONDS = 2_592_000;
export const WORLD_CONTEXT_SECONDS = 300;

export type WorldEnvironment = Readonly<Record<string, string | undefined>>;

type WorldConfiguration = Readonly<{
  appId: string;
  rpId: string;
  signingKey: string;
  action: string;
  environment: "sandbox" | "production";
}>;

const addressPattern = /^0x[0-9a-f]{40}$/u;
const appIdPattern = /^app_[a-z0-9]{32}$/u;
const rpIdPattern = /^rp_[a-z0-9]{16}$/u;
const keyPattern = /^(?:0x)?[0-9a-fA-F]{64}$/u;
const actionPattern = /^[a-z0-9-]{1,64}$/u;
const cookiePayloadPattern = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/u;

export function isCanonicalWorldAddress(value: unknown): value is string {
  return typeof value === "string" && addressPattern.test(value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasExpectedHumanSignal(result: unknown, address: unknown): boolean {
  if (!isRecord(result) || !isCanonicalWorldAddress(address) || result.protocol_version !== "3.0" || !Array.isArray(result.responses) || result.responses.length === 0) return false;
  const expectedSignalHash = hashSignal(address);
  return result.responses.every((response) => isRecord(response) && response.identifier === "selfie" && response.signal_hash === expectedSignalHash);
}

function configuration(env: WorldEnvironment): WorldConfiguration | null {
  const appId = env.WORLD_APP_ID;
  const rpId = env.WORLD_RP_ID;
  const signingKey = env.WORLD_RP_SIGNING_KEY;
  const action = env.WORLD_ACTION;
  const environment = env.WORLD_ENVIRONMENT;
  if (
    typeof appId !== "string" || !appIdPattern.test(appId) ||
    typeof rpId !== "string" || !rpIdPattern.test(rpId) ||
    typeof signingKey !== "string" || !keyPattern.test(signingKey) ||
    typeof action !== "string" || !actionPattern.test(action) ||
    (environment !== "sandbox" && environment !== "production")
  ) return null;
  return { appId, rpId, signingKey: signingKey.startsWith("0x") ? signingKey : `0x${signingKey}`, action, environment };
}

export function readWorldConfigured(env: WorldEnvironment): boolean {
  return configuration(env) !== null;
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode(value: string): unknown {
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); } catch { return null; }
}

async function cookieMac(signingKey: string, payload: string): Promise<string> {
  const material = new TextEncoder().encode(`tool402-world-human-v1:${signingKey}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", material);
  const key = await globalThis.crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const mac = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(mac).toString("base64url");
}

export function createWorldRequest(address: unknown, env: WorldEnvironment) {
  const config = configuration(env);
  if (config === null || !isCanonicalWorldAddress(address)) return null;
  const signature = signRequest({ signingKeyHex: config.signingKey, action: config.action, ttl: WORLD_CONTEXT_SECONDS });
  return {
    app_id: config.appId,
    action: config.action,
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
  const config = configuration(env);
  return config === null ? null : `https://developer.world.org/api/v4/verify/${config.rpId}`;
}

export async function createHumanCookie(address: unknown, env: WorldEnvironment, nowMilliseconds = Date.now()): Promise<string | null> {
  const config = configuration(env);
  if (config === null || !isCanonicalWorldAddress(address)) return null;
  const payload = encode({ v: 1, address, verifiedAt: nowMilliseconds, expiresAt: nowMilliseconds + WORLD_HUMAN_MAX_AGE_SECONDS * 1000 });
  return `${payload}.${await cookieMac(config.signingKey, payload)}`;
}

export async function readHumanVerification(
  cookie: string | null,
  address: unknown,
  env: WorldEnvironment,
  nowMilliseconds = Date.now(),
): Promise<Readonly<{ verifiedAt: number }> | null> {
  const config = configuration(env);
  if (config === null || !isCanonicalWorldAddress(address) || typeof cookie !== "string") return null;
  const match = cookie.match(cookiePayloadPattern);
  if (match === null) return null;
  const [, payload, mac] = match;
  if (mac !== await cookieMac(config.signingKey, payload)) return null;
  const record = decode(payload);
  if (!isRecord(record)) return null;
  const { v, address: bound, verifiedAt, expiresAt } = record;
  if (v !== 1 || bound !== address || typeof verifiedAt !== "number" || !Number.isSafeInteger(verifiedAt)) return null;
  if (typeof expiresAt !== "number" || !Number.isSafeInteger(expiresAt) || expiresAt <= nowMilliseconds) return null;
  return { verifiedAt };
}
