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
  | Readonly<{ type: "read"; canonicalSignerAddress: string; toolPublicId: string; sessionExpiresAt: string }>
  | Readonly<{ type: "deployment"; canonicalSignerAddress: string; toolPublicId: string; sessionExpiresAt: string }>
  | Readonly<{ type: "self_service_ensure"; canonicalSignerAddress: string; sessionExpiresAt: string }>
  | Readonly<{ type: "backing_intent"; canonicalSignerAddress: string; offeringPublicId: string; units: string; idempotencyKey: string; purchaseIntentId: string; expiresAt: string; sessionExpiresAt: string }>
  | Readonly<{ type: "backing"; canonicalSignerAddress: string; attemptPublicId: string; transactionHash: string; parameters: { offeringPublicId: string; units: string; tinybars: string; purchaseIntentId: string }; sessionExpiresAt: string }>
  | Readonly<{ type: "backing_reserve"; canonicalSignerAddress: string; attemptPublicId: string; parameters: { offeringPublicId: string; units: string; tinybars: string; purchaseIntentId: string }; sessionExpiresAt: string }>
  | Readonly<{ type: "backing_read"; canonicalSignerAddress: string; sessionExpiresAt: string }>
  | Readonly<{ type: "backing_read_legacy"; canonicalSignerAddress: string; sessionExpiresAt: string }>
  | Readonly<{ type: "backing_list"; canonicalSignerAddress: string; sessionExpiresAt: string }>
  | Readonly<{ type: "backing_read_offering"; canonicalSignerAddress: string; offeringPublicId: string; sessionExpiresAt: string }>;
type Seams = {
  readonly nowMilliseconds: () => number;
  readonly resolveIngressKey: (keyId: string) => CryptoKey | undefined;
  readonly claimReplay: (replayIdentity: string) => "claimed" | "already_claimed" | Promise<"claimed" | "already_claimed">;
  readonly allocate: (input: { canonicalSignerAddress: string; requestId: string }) => Promise<Allocation>;
  readonly list: (input: { canonicalSignerAddress: string; cursor: string | null }) => Promise<ToolPage>;
  readonly read: (input: { canonicalSignerAddress: string; toolPublicId: string }) => Promise<ToolRead>;
  readonly deployment: (input: { canonicalSignerAddress: string; toolPublicId: string }) => Promise<ToolRead>;
  readonly ensureSelfService: (input: { canonicalSignerAddress: string }) => Promise<unknown>;
  readonly freezeBackingIntent: (input: { canonicalSignerAddress: string; offeringPublicId: string; units: string; idempotencyKey: string; purchaseIntentId: string; expiresAt: string }) => Promise<unknown>;
  readonly backing: (input: { canonicalSignerAddress: string; attemptPublicId: string; transactionHash: string; parameters: { offeringPublicId: string; units: string; tinybars: string; purchaseIntentId: string } }) => Promise<unknown>;
  readonly backingReserve: (input: { canonicalSignerAddress: string; attemptPublicId: string; parameters: { offeringPublicId: string; units: string; tinybars: string; purchaseIntentId: string } }) => Promise<unknown>;
  readonly backingRead: (input: { canonicalSignerAddress: string }) => Promise<unknown>;
  readonly backingReadLegacy: (input: { canonicalSignerAddress: string }) => Promise<unknown>;
  readonly backingList: (input: { canonicalSignerAddress: string }) => Promise<unknown>;
  readonly backingReadOffering: (input: { canonicalSignerAddress: string; offeringPublicId: string }) => Promise<unknown>;
};

const allocateReference = makeFunctionReference<"mutation">("provider_tools:allocateForIssuer");
const listReference = makeFunctionReference<"query">("provider_tools:listOwnedTools");
const readReference = makeFunctionReference<"query">("provider_tools:readOwnedTool");
const deploymentReference = makeFunctionReference<"query">("provider_tools:readOwnedToolDeployment");
const ensureSelfServiceReference = makeFunctionReference<"mutation">("self_service_accounts:ensureSelfServiceAccount");
const freezeBackingIntentReference = makeFunctionReference<"mutation">("backing_intents:freezeBackingIntent");
const claimReplayReference = makeFunctionReference<"mutation">("wallet_command_replay:claimIngressReplayIdentity");
const backingReference = makeFunctionReference<"action">("backing_payment_records:confirmBackingPayment");
const backingReserveReference = makeFunctionReference<"action">("backing_payment_records:reserveBackingPayment");
const backingReadReference = makeFunctionReference<"action">("backing_payment_records:reverifyBackerPayment");
const backingReadLegacyReference = makeFunctionReference<"action">("backing_payment_records:readLegacyRiskScanPayment");
const backingListReference = makeFunctionReference<"action">("backing_payment_records:listBackerPayments");
const backingReadOfferingReference = makeFunctionReference<"action">("backing_payment_records:readBackerPaymentForOffering");

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
    if (record.type === "deployment" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "toolPublicId", "sessionExpiresAt"])
      && typeof record.toolPublicId === "string" && /^tool_[0-9a-f]{32}$/u.test(record.toolPublicId)) {
      return { type: "deployment", canonicalSignerAddress: record.canonicalSignerAddress, toolPublicId: record.toolPublicId, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "self_service_ensure" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "sessionExpiresAt"])) {
      return { type: "self_service_ensure", canonicalSignerAddress: record.canonicalSignerAddress, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "backing_intent" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "offeringPublicId", "units", "idempotencyKey", "purchaseIntentId", "expiresAt", "sessionExpiresAt"])
      && typeof record.offeringPublicId === "string" && /^[A-Za-z0-9_-]{1,96}$/u.test(record.offeringPublicId)
      && typeof record.units === "string" && /^(?:0|[1-9][0-9]*)$/u.test(record.units)
      && typeof record.idempotencyKey === "string" && noncePattern.test(record.idempotencyKey)
      && typeof record.purchaseIntentId === "string" && noncePattern.test(record.purchaseIntentId)
      && typeof record.expiresAt === "string" && new Date(Date.parse(record.expiresAt)).toISOString() === record.expiresAt) {
      return {
        type: "backing_intent", canonicalSignerAddress: record.canonicalSignerAddress,
        offeringPublicId: record.offeringPublicId, units: record.units, idempotencyKey: record.idempotencyKey,
        purchaseIntentId: record.purchaseIntentId, expiresAt: record.expiresAt, sessionExpiresAt: record.sessionExpiresAt,
      };
    }
    if (record.type === "backing" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "attemptPublicId", "transactionHash", "parameters", "sessionExpiresAt"])
      && typeof record.attemptPublicId === "string" && noncePattern.test(record.attemptPublicId)
      && typeof record.transactionHash === "string" && /^0x[0-9a-f]{64}$/u.test(record.transactionHash)
      && record.parameters !== null && typeof record.parameters === "object" && !Array.isArray(record.parameters)) {
      const parameters = record.parameters as Record<string, unknown>;
      if (JSON.stringify(Object.keys(parameters)) !== JSON.stringify(["offeringPublicId", "units", "tinybars", "purchaseIntentId"])
        || typeof parameters.offeringPublicId !== "string" || typeof parameters.units !== "string" || typeof parameters.tinybars !== "string" || typeof parameters.purchaseIntentId !== "string") return null;
      return { type: "backing", canonicalSignerAddress: record.canonicalSignerAddress, attemptPublicId: record.attemptPublicId, transactionHash: record.transactionHash, parameters: { offeringPublicId: parameters.offeringPublicId, units: parameters.units, tinybars: parameters.tinybars, purchaseIntentId: parameters.purchaseIntentId }, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "backing_reserve" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "attemptPublicId", "parameters", "sessionExpiresAt"])
      && typeof record.attemptPublicId === "string" && noncePattern.test(record.attemptPublicId)
      && record.parameters !== null && typeof record.parameters === "object" && !Array.isArray(record.parameters)) {
      const parameters = record.parameters as Record<string, unknown>;
      if (JSON.stringify(Object.keys(parameters)) !== JSON.stringify(["offeringPublicId", "units", "tinybars", "purchaseIntentId"])
        || typeof parameters.offeringPublicId !== "string" || typeof parameters.units !== "string" || typeof parameters.tinybars !== "string" || typeof parameters.purchaseIntentId !== "string") return null;
      return { type: "backing_reserve", canonicalSignerAddress: record.canonicalSignerAddress, attemptPublicId: record.attemptPublicId, parameters: { offeringPublicId: parameters.offeringPublicId, units: parameters.units, tinybars: parameters.tinybars, purchaseIntentId: parameters.purchaseIntentId }, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "backing_read" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "sessionExpiresAt"])) {
      return { type: "backing_read", canonicalSignerAddress: record.canonicalSignerAddress, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "backing_read_legacy" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "sessionExpiresAt"])) {
      return { type: "backing_read_legacy", canonicalSignerAddress: record.canonicalSignerAddress, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "backing_list" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "sessionExpiresAt"])) {
      return { type: "backing_list", canonicalSignerAddress: record.canonicalSignerAddress, sessionExpiresAt: record.sessionExpiresAt };
    }
    if (record.type === "backing_read_offering" && JSON.stringify(Object.keys(record)) === JSON.stringify(["type", "canonicalSignerAddress", "offeringPublicId", "sessionExpiresAt"])
      && typeof record.offeringPublicId === "string" && /^[A-Za-z0-9_-]{1,96}$/u.test(record.offeringPublicId)) {
      return { type: "backing_read_offering", canonicalSignerAddress: record.canonicalSignerAddress, offeringPublicId: record.offeringPublicId, sessionExpiresAt: record.sessionExpiresAt };
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
    if (body.type === "deployment") {
      return response(await seams.deployment({ canonicalSignerAddress: body.canonicalSignerAddress, toolPublicId: body.toolPublicId }), 200);
    }
    if (body.type === "self_service_ensure") {
      return response(await seams.ensureSelfService({ canonicalSignerAddress: body.canonicalSignerAddress }), 200);
    }
    if (body.type === "backing_intent") {
      // A direct backing route has the same authenticated provisioning path as
      // the dashboard. `ensure` is idempotent and never revives a revoked row;
      // freezeBackingIntent remains the sole legacy/public admission gate.
      await seams.ensureSelfService({ canonicalSignerAddress: body.canonicalSignerAddress });
      return response(await seams.freezeBackingIntent({
        canonicalSignerAddress: body.canonicalSignerAddress, offeringPublicId: body.offeringPublicId,
        units: body.units, idempotencyKey: body.idempotencyKey, purchaseIntentId: body.purchaseIntentId,
        expiresAt: body.expiresAt,
      }), 200);
    }
    if (body.type === "backing") {
      return response(await seams.backing({ canonicalSignerAddress: body.canonicalSignerAddress, attemptPublicId: body.attemptPublicId, transactionHash: body.transactionHash, parameters: body.parameters }), 200);
    }
    if (body.type === "backing_reserve") {
      return response(await seams.backingReserve({ canonicalSignerAddress: body.canonicalSignerAddress, attemptPublicId: body.attemptPublicId, parameters: body.parameters }), 200);
    }
    if (body.type === "backing_read") {
      return response(await seams.backingRead({ canonicalSignerAddress: body.canonicalSignerAddress }), 200);
    }
    if (body.type === "backing_read_legacy") {
      return response(await seams.backingReadLegacy({ canonicalSignerAddress: body.canonicalSignerAddress }), 200);
    }
    if (body.type === "backing_list") {
      return response(await seams.backingList({ canonicalSignerAddress: body.canonicalSignerAddress }), 200);
    }
    if (body.type === "backing_read_offering") {
      return response(await seams.backingReadOffering({ canonicalSignerAddress: body.canonicalSignerAddress, offeringPublicId: body.offeringPublicId }), 200);
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
    deployment: (input) => ctx.runQuery(deploymentReference, input) as Promise<ToolRead>,
    ensureSelfService: (input) => ctx.runMutation(ensureSelfServiceReference, input),
    freezeBackingIntent: (input) => ctx.runMutation(freezeBackingIntentReference, input),
    backing: (input) => ctx.runAction(backingReference, input),
    backingReserve: (input) => ctx.runAction(backingReserveReference, input),
    backingRead: (input) => ctx.runAction(backingReadReference, input),
    backingReadLegacy: (input) => ctx.runAction(backingReadLegacyReference, input),
    backingList: (input) => ctx.runAction(backingListReference, input),
    backingReadOffering: (input) => ctx.runAction(backingReadOfferingReference, input),
  });
}

export function handleProviderSessionIngressForTest(ctx: ActionContext, request: Request, seams: Seams): Promise<Response> {
  return handle(ctx, request, seams);
}
