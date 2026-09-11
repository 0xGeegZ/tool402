import { verifyMessage as verifyViemMessage } from "viem";

export const DASHBOARD_AUTH_CHAIN_ID = 296;
export const CHALLENGE_MAX_AGE_SECONDS = 300;
export const SESSION_MAX_AGE_SECONDS = 28_800;

type DashboardAuthEnvironment = Readonly<{
  TOOL402_DASHBOARD_AUTH_ORIGIN?: string;
  TOOL402_DASHBOARD_AUTH_SECRET?: string;
}>;

type AuthDependencies = Readonly<{
  now?: () => number;
  randomBytes?: () => Uint8Array;
  hmacSha256?: (key: Uint8Array, value: Uint8Array) => Promise<Uint8Array>;
  verifyMessage?: (input: { address: `0x${string}`; message: string; signature: `0x${string}` }) => Promise<boolean>;
}>;

type ChallengePayload = Readonly<{
  v: 1;
  address: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  origin: string;
}>;

type SessionPayload = Readonly<{
  v: 1;
  address: string;
  issuedAt: string;
  expiresAt: string;
}>;

type Configuration = Readonly<{ origin: string; secret: Uint8Array }>;

const addressPattern = /^0x[0-9a-f]{40}$/u;
const noncePattern = /^[A-Za-z0-9_-]{22}$/u;
const signaturePattern = /^0x[0-9a-fA-F]{130}$/u;
const base64UrlPattern = /^[A-Za-z0-9_-]+$/u;
const secretPattern = /^[0-9a-f]{64}$/u;

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!base64UrlPattern.test(value)) return null;
  try {
    const bytes = new Uint8Array(Buffer.from(value, "base64url"));
    return encodeBase64Url(bytes) === value ? bytes : null;
  } catch {
    return null;
  }
}

function readConfiguration(env: DashboardAuthEnvironment): Configuration | null {
  const { TOOL402_DASHBOARD_AUTH_ORIGIN: origin, TOOL402_DASHBOARD_AUTH_SECRET: secret } = env;
  if (typeof origin !== "string" || typeof secret !== "string" || !secretPattern.test(secret)) return null;
  try {
    const url = new URL(origin);
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== "" ||
      url.origin !== origin
    ) return null;
    return { origin, secret: new Uint8Array(Buffer.from(secret, "hex")) };
  } catch {
    return null;
  }
}

function timestamp(milliseconds: number): string | null {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) return null;
  const value = new Date(milliseconds).toISOString();
  return Date.parse(value) === milliseconds ? value : null;
}

function messageFor(payload: ChallengePayload): string {
  return `${new URL(payload.origin).host} wants you to sign in with your Ethereum account:\n${payload.address}\n\nSign in to the Tool402 dashboard.\n\nURI: ${payload.origin}/dashboard\nVersion: 1\nChain ID: ${DASHBOARD_AUTH_CHAIN_ID}\nNonce: ${payload.nonce}\nIssued At: ${payload.issuedAt}\nExpiration Time: ${payload.expiresAt}`;
}

async function defaultHmacSha256(key: Uint8Array, value: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await globalThis.crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", cryptoKey, value));
}

async function seal(payload: ChallengePayload | SessionPayload, configuration: Configuration, dependencies: AuthDependencies): Promise<string> {
  const encoded = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const mac = await (dependencies.hmacSha256 ?? defaultHmacSha256)(configuration.secret, new TextEncoder().encode(encoded));
  return `${encoded}.${encodeBase64Url(mac)}`;
}

function equalMac(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) difference |= left[index]! ^ right[index]!;
  return difference === 0;
}

async function unseal<T extends ChallengePayload | SessionPayload>(cookie: string, configuration: Configuration, dependencies: AuthDependencies): Promise<T | null> {
  const parts = cookie.split(".");
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) return null;
  const payloadBytes = decodeBase64Url(parts[0]);
  const receivedMac = decodeBase64Url(parts[1]);
  if (payloadBytes === null || receivedMac === null || receivedMac.byteLength !== 32) return null;
  const expectedMac = await (dependencies.hmacSha256 ?? defaultHmacSha256)(configuration.secret, new TextEncoder().encode(parts[0]));
  if (!equalMac(receivedMac, expectedMac)) return null;
  try {
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(payloadBytes);
    const payload: unknown = JSON.parse(text);
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
    return JSON.stringify(payload) === text ? payload as T : null;
  } catch {
    return null;
  }
}

function isChallengePayload(payload: ChallengePayload | null, configuration: Configuration): payload is ChallengePayload {
  if (payload === null) return false;
  const { v, address, nonce, issuedAt, expiresAt, origin } = payload;
  return v === 1 && addressPattern.test(address) && noncePattern.test(nonce) && typeof origin === "string" && origin === configuration.origin && isLifetime(issuedAt, expiresAt, CHALLENGE_MAX_AGE_SECONDS);
}

function isSessionPayload(payload: SessionPayload | null): payload is SessionPayload {
  if (payload === null) return false;
  const { v, address, issuedAt, expiresAt } = payload;
  return v === 1 && addressPattern.test(address) && isLifetime(issuedAt, expiresAt, SESSION_MAX_AGE_SECONDS);
}

function isLifetime(issuedAt: unknown, expiresAt: unknown, seconds: number): boolean {
  if (typeof issuedAt !== "string" || typeof expiresAt !== "string") return false;
  const issued = Date.parse(issuedAt);
  const expires = Date.parse(expiresAt);
  return timestamp(issued) === issuedAt && timestamp(expires) === expiresAt && expires - issued === seconds * 1000;
}

export async function createChallenge(
  input: Readonly<{ address: string; env: DashboardAuthEnvironment }>,
  dependencies: AuthDependencies = {},
): Promise<Readonly<{ cookie: string; message: string; expiresAt: string }>> {
  const configuration = readConfiguration(input.env);
  if (configuration === null || !addressPattern.test(input.address)) throw new TypeError("invalid dashboard authentication challenge");
  const now = dependencies.now?.() ?? Date.now();
  const issuedAt = timestamp(now);
  const expiresAt = timestamp(now + CHALLENGE_MAX_AGE_SECONDS * 1000);
  const random = dependencies.randomBytes?.() ?? globalThis.crypto.getRandomValues(new Uint8Array(16));
  if (issuedAt === null || expiresAt === null || !(random instanceof Uint8Array) || random.byteLength !== 16) throw new TypeError("invalid dashboard authentication challenge");
  const payload: ChallengePayload = { v: 1, address: input.address, nonce: encodeBase64Url(random), issuedAt, expiresAt, origin: configuration.origin };
  return { cookie: await seal(payload, configuration, dependencies), message: messageFor(payload), expiresAt };
}

export async function verifyChallenge(
  input: Readonly<{ challengeCookie: string; message: string; signature: string; origin: string; env: DashboardAuthEnvironment }>,
  dependencies: AuthDependencies = {},
): Promise<Readonly<{ kind: "rejected" }> | Readonly<{ kind: "authenticated"; sessionCookie: string }>> {
  const configuration = readConfiguration(input.env);
  if (configuration === null || input.origin !== configuration.origin || typeof input.challengeCookie !== "string" || typeof input.message !== "string" || !signaturePattern.test(input.signature)) return { kind: "rejected" };
  const payload = await unseal<ChallengePayload>(input.challengeCookie, configuration, dependencies);
  const now = dependencies.now?.() ?? Date.now();
  if (!isChallengePayload(payload, configuration) || !Number.isSafeInteger(now) || now > Date.parse(payload.expiresAt) || input.message !== messageFor(payload)) return { kind: "rejected" };
  const verified = await (dependencies.verifyMessage ?? verifyViemMessage)({ address: payload.address as `0x${string}`, message: input.message, signature: input.signature as `0x${string}` });
  if (!verified) return { kind: "rejected" };
  const issuedAt = timestamp(now);
  const expiresAt = timestamp(now + SESSION_MAX_AGE_SECONDS * 1000);
  if (issuedAt === null || expiresAt === null) return { kind: "rejected" };
  const session: SessionPayload = { v: 1, address: payload.address, issuedAt, expiresAt };
  return { kind: "authenticated", sessionCookie: await seal(session, configuration, dependencies) };
}

export async function readDashboardSession(cookie: string | undefined, env: DashboardAuthEnvironment, now: number = Date.now()): Promise<Readonly<{ address: string; issuedAt: string; expiresAt: string }> | null> {
  const configuration = readConfiguration(env);
  if (configuration === null || typeof cookie !== "string" || !Number.isSafeInteger(now)) return null;
  const payload = await unseal<SessionPayload>(cookie, configuration, {});
  if (!isSessionPayload(payload) || now > Date.parse(payload.expiresAt)) return null;
  return { address: payload.address, issuedAt: payload.issuedAt, expiresAt: payload.expiresAt };
}
