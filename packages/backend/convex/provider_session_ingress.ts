import { makeFunctionReference, type GenericActionCtx, type GenericDataModel } from "convex/server";

const path = "/internal/provider-tools";
const domain = "tool402:provider-session:v1";
const maximumBytes = 4096;
const maximumResponseBytes = 65_536;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const noncePattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const digestPattern = /^[0-9a-f]{64}$/u;
const keyIdPattern = /^[A-Za-z0-9_-]{1,64}$/u;
const timestampPattern = /^(?:0|[1-9][0-9]*)$/u;
const maximumInt64 = 9_223_372_036_854_775_807n;

type ActionContext = GenericActionCtx<GenericDataModel>;
type Allocation = { readonly outcome: string; readonly tool?: unknown };
type ToolPage = { readonly tools: unknown[]; readonly nextCursor: string | null };
type ToolRead = unknown | null;
type ProviderToolRequest =
  | Readonly<{ type: "allocate"; canonicalSignerAddress: string; requestId: string; sessionExpiresAt: string }>
  | Readonly<{ type: "list"; canonicalSignerAddress: string; cursor: string | null; sessionExpiresAt: string }>
  | Readonly<{ type: "read"; canonicalSignerAddress: string; toolPublicId: string; sessionExpiresAt: string }>;
type Seams = {
  readonly nowMilliseconds: () => number;
  readonly resolveIngressKey: (keyId: string) => CryptoKey | undefined;
  readonly claimReplay: (replayIdentity: string) => "claimed" | "already_claimed" | Promise<"claimed" | "already_claimed">;
  readonly allocate: (input: { canonicalSignerAddress: string; requestId: string }) => Promise<Allocation>;
  readonly list: (input: { canonicalSignerAddress: string; cursor: string | null }) => Promise<ToolPage>;
  readonly read: (input: { canonicalSignerAddress: string; toolPublicId: string }) => Promise<ToolRead>;
};

const allocateReference = makeFunctionReference<"mutation">("provider_tools:allocateForIssuer");
const listReference = makeFunctionReference<"query">("provider_tools:listOwnedTools");
const readReference = makeFunctionReference<"query">("provider_tools:readOwnedTool");
const claimReplayReference = makeFunctionReference<"mutation">("wallet_command_replay:claimIngressReplayIdentity");

function response(body: unknown, status: number): Response {
  try {
    const serialized = JSON.stringify(body);
    if (new TextEncoder().encode(serialized).byteLength > maximumResponseBytes) throw new RangeError("response too large");
    return new Response(serialized, { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch {
    return new Response('{"outcome":"rejected"}', { status: status === 200 ? 503 : status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
}

function rejected(): Response { return response({ outcome: "rejected" }, 401); }

async function readBytes(request: Request): Promise<Uint8Array | null> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^(?:0|[1-9][0-9]*)$/u.test(length) || Number(length) > maximumBytes)) return null;
  if (request.body === null) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maximumBytes) {
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
    return bytes;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function header(request: Request, name: string, pattern: RegExp): string | null {
  const value = request.headers.get(name);
  return value !== null && !value.includes(",") && pattern.test(value) ? value : null;
}

function lowercaseHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function decodeHex(value: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/u.test(value)) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.byteLength; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/=/gu, "").replace(/\+/gu, "-").replace(/\//gu, "_");
}

function decodeSignature(value: string): Uint8Array | null {
  try {
    const standard = value.replace(/-/gu, "+").replace(/_/gu, "/");
    const padding = "=".repeat((4 - (standard.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(`${standard}${padding}`), (character) => character.charCodeAt(0));
    return bytes.byteLength === 32 && encodeBase64Url(bytes) === value ? bytes : null;
  } catch { return null; }
}

function parseTimestamp(value: string): bigint | null {
  if (!timestampPattern.test(value)) return null;
  try {
    const parsed = BigInt(value);
    return parsed <= maximumInt64 ? parsed : null;
  } catch { return null; }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function exactBody(bytes: Uint8Array): ProviderToolRequest | null {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.type !== "string" || typeof record.canonicalSignerAddress !== "string"
      || !addressPattern.test(record.canonicalSignerAddress) || typeof record.sessionExpiresAt !== "string") return null;
    const expires = Date.parse(record.sessionExpiresAt);
    if (new Date(expires).toISOString() !== record.sessionExpiresAt) return null;
    if (record.type === "allocate" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "requestId", "sessionExpiresAt"])
      && typeof record.requestId === "string" && requestIdPattern.test(record.requestId)) {
      return { type: "allocate", canonicalSignerAddress: record.canonicalSignerAddress, requestId: record.requestId, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "list" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "cursor", "sessionExpiresAt"])
      && (record.cursor === null || (typeof record.cursor === "string" && record.cursor.length > 0 && record.cursor.length <= maximumBytes))) {
      return { type: "list", canonicalSignerAddress: record.canonicalSignerAddress, cursor: record.cursor, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "read" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "toolPublicId", "sessionExpiresAt"])
      && typeof record.toolPublicId === "string" && /^tool_[0-9a-f]{32}$/u.test(record.toolPublicId)) {
      return { type: "read", canonicalSignerAddress: record.canonicalSignerAddress, toolPublicId: record.toolPublicId, sessionExpiresAt: record.sessionExpiresAt };
    }
    return null;
  } catch { return null; }
}

async function handle(ctx: ActionContext, request: Request, seams: Seams): Promise<Response> {
  if (request.method !== "POST") return rejected();
  try {
    const url = new URL(request.url);
    if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.pathname !== path || url.search !== "" || url.hash !== "") return rejected();
  } catch {
    return rejected();
  }
  const keyId = header(request, "x-tool402-key-id", keyIdPattern);
  const timestamp = header(request, "x-tool402-timestamp", timestampPattern);
  const nonce = header(request, "x-tool402-nonce", noncePattern);
  const bodySha256 = header(request, "x-tool402-content-sha256", digestPattern);
  const signatureText = request.headers.get("x-tool402-signature");
  if (keyId === null || timestamp === null || nonce === null || bodySha256 === null || signatureText === null || signatureText.includes(",")) return rejected();
  const bytes = await readBytes(request);
  const body = bytes === null ? null : exactBody(bytes);
  const now = seams.nowMilliseconds();
  if (body === null || !Number.isSafeInteger(now) || now < 0 || Date.parse(body.sessionExpiresAt) <= now) return rejected();
  const stamp = parseTimestamp(timestamp);
  if (stamp === null) return rejected();
  if (stamp > BigInt(Math.floor(now / 1000)) + 60n || stamp + 60n < BigInt(Math.floor(now / 1000))) return rejected();
  try {
    const digest = lowercaseHex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", toArrayBuffer(bytes!))));
    const signature = decodeSignature(signatureText);
    const key = seams.resolveIngressKey(keyId);
    if (digest !== bodySha256 || signature === null || key === undefined) return rejected();
    const input = `${domain}\nPOST\n${path}\n${timestamp}\n${nonce}\n${bodySha256}`;
    const valid = await globalThis.crypto.subtle.verify("HMAC", key, toArrayBuffer(signature), toArrayBuffer(new TextEncoder().encode(input)));
    if (!valid || await seams.claimReplay(`${domain}:${keyId}:${nonce}`) !== "claimed") return rejected();
    if (body.type === "allocate") {
      return response(await seams.allocate({ canonicalSignerAddress: body.canonicalSignerAddress, requestId: body.requestId }), 200);
    }
    if (body.type === "list") {
      return response(await seams.list({ canonicalSignerAddress: body.canonicalSignerAddress, cursor: body.cursor }), 200);
    }
    return response(await seams.read({ canonicalSignerAddress: body.canonicalSignerAddress, toolPublicId: body.toolPublicId }), 200);
  } catch {
    return rejected();
  }
}

async function configuredKey(): Promise<{ keyId: string; key: CryptoKey } | null> {
  const keyId = process.env.TOOL402_INGRESS_KEY_ID;
  const secret = process.env.TOOL402_INGRESS_SECRET;
  if (typeof keyId !== "string" || !keyIdPattern.test(keyId) || typeof secret !== "string" || !/^[0-9a-f]{64}$/u.test(secret)) return null;
  try {
    const bytes = decodeHex(secret);
    if (bytes === null) return null;
    return { keyId, key: await globalThis.crypto.subtle.importKey("raw", toArrayBuffer(bytes), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]) };
  } catch { return null; }
}

export async function handleProviderSessionIngress(ctx: ActionContext, request: Request): Promise<Response> {
  const configured = await configuredKey();
  return handle(ctx, request, {
    nowMilliseconds: Date.now,
    resolveIngressKey: (keyId) => configured?.keyId === keyId ? configured.key : undefined,
    claimReplay: (replayIdentity) => ctx.runMutation(claimReplayReference, { replayIdentity }) as Promise<"claimed" | "already_claimed">,
    allocate: (input) => ctx.runMutation(allocateReference, input) as Promise<Allocation>,
    list: (input) => ctx.runQuery(listReference, input) as Promise<ToolPage>,
    read: (input) => ctx.runQuery(readReference, input) as Promise<ToolRead>,
  });
}

export function handleProviderSessionIngressForTest(ctx: ActionContext, request: Request, seams: Seams): Promise<Response> {
  return handle(ctx, request, seams);
}
