import { bytesToHex } from "viem";

import { isUserRejection, type Eip1193Provider } from "./metamask-provider.ts";
import {
  createCommandBody,
  createCommandNonce,
  createUnsignedCommand,
  encodeBase64Url,
  isTool402CommandType,
  signCommand,
  type RandomBytes,
} from "./tool402-command.ts";
import { readCurrentSession } from "./wallet-state.ts";

export const RELAY_OUTCOMES = Object.freeze([
  "ACCEPTED",
  "REPLAYED",
  "CONFLICT",
  "REJECTED",
  "UNSUPPORTED_TYPE",
  "not_configured",
  "transport_failure",
  "unexpected_response",
] as const);

export type RelayOutcome = (typeof RELAY_OUTCOMES)[number];

export const RELAY_TIMEOUT_MILLISECONDS = 10_000;
export const RELAY_ROUTE_GRACE_MILLISECONDS = 5_000;
export const RELAY_MAX_REQUEST_BYTES = 65_536;
export const RELAY_MAX_RESPONSE_BYTES = 4096;

export type RelayEnvironment = Readonly<Record<string, string | undefined>>;

export interface RelayDependencies {
  readonly fetch?: typeof fetch;
  readonly nowMilliseconds?: () => number;
  readonly randomBytes?: RandomBytes;
}

interface RelayConfiguration {
  readonly keyId: string;
  readonly secretBytes: Uint8Array<ArrayBuffer>;
  readonly target: string;
}

const backendOutcomes: readonly RelayOutcome[] = [
  "ACCEPTED",
  "REPLAYED",
  "CONFLICT",
  "REJECTED",
  "UNSUPPORTED_TYPE",
];
const ingressPath = "/internal/commands";
const keyIdPattern = /^[A-Za-z0-9_-]{1,64}$/u;
const secretPattern = /^[0-9a-f]{64}$/u;
const relayRoutePath = "/api/commands";

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function readConfiguration(env: RelayEnvironment): RelayConfiguration | null {
  const keyId = env.TOOL402_INGRESS_KEY_ID;
  const secret = env.TOOL402_INGRESS_SECRET;
  const site = env.TOOL402_CONVEX_SITE_URL;
  if (
    typeof keyId !== "string" ||
    !keyIdPattern.test(keyId) ||
    typeof secret !== "string" ||
    !secretPattern.test(secret) ||
    typeof site !== "string"
  ) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(site);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    return null;
  }
  return {
    keyId,
    secretBytes: hexToBytes(secret),
    target: `${url.origin}${ingressPath}`,
  };
}

function relayResponse(outcome: RelayOutcome, status: number): Response {
  return new Response(JSON.stringify({ outcome }), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

async function computeMac(
  secretBytes: Uint8Array<ArrayBuffer>,
  signingInput: string,
): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );
  return encodeBase64Url(new Uint8Array(mac));
}

async function readBoundedBytes(
  stream: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<Uint8Array<ArrayBuffer> | null> {
  if (stream === null) {
    return new Uint8Array(0);
  }
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function parseOutcome(
  candidates: readonly RelayOutcome[],
  value: unknown,
): RelayOutcome | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const { outcome } = value as { outcome?: unknown };
  return candidates.find((candidate) => candidate === outcome) ?? null;
}

export async function handleCommandRelayPost(
  request: Request,
  env: RelayEnvironment,
  dependencies: RelayDependencies = {},
): Promise<Response> {
  const configuration = readConfiguration(env);
  if (configuration === null) {
    return relayResponse("not_configured", 503);
  }
  const fetchImplementation = dependencies.fetch ?? globalThis.fetch;
  const nowMilliseconds = dependencies.nowMilliseconds ?? Date.now;

  const bytes = await readBoundedBytes(request.body, RELAY_MAX_REQUEST_BYTES);
  if (bytes === null) {
    return relayResponse("REJECTED", 413);
  }
  const bodySha256 = bytesToHex(
    new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)),
  ).slice(2);
  const timestampUnixSeconds = String(Math.floor(nowMilliseconds() / 1000));
  const requestNonce = createCommandNonce(dependencies.randomBytes);
  const signingInput = `POST\n${ingressPath}\n${timestampUnixSeconds}\n${requestNonce}\n${bodySha256}`;
  const signature = await computeMac(configuration.secretBytes, signingInput);

  let response: Response;
  try {
    response = await fetchImplementation(configuration.target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tool402-key-id": configuration.keyId,
        "x-tool402-timestamp": timestampUnixSeconds,
        "x-tool402-nonce": requestNonce,
        "x-tool402-content-sha256": bodySha256,
        "x-tool402-signature": signature,
      },
      body: bytes,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(RELAY_TIMEOUT_MILLISECONDS),
    });
  } catch {
    return relayResponse("transport_failure", 502);
  }

  if (response.status !== 200) {
    return relayResponse("unexpected_response", 502);
  }
  const body = await readBoundedBytes(response.body, RELAY_MAX_RESPONSE_BYTES);
  if (body === null) {
    return relayResponse("transport_failure", 502);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return relayResponse("unexpected_response", 502);
  }
  const outcome = parseOutcome(backendOutcomes, parsed);
  return outcome === null
    ? relayResponse("unexpected_response", 502)
    : relayResponse(outcome, 200);
}

export function parseRelayOutcome(value: unknown): RelayOutcome | null {
  return parseOutcome(RELAY_OUTCOMES, value);
}

export async function relayCommandBody(
  body: string,
  fetchImplementation: typeof fetch = globalThis.fetch,
): Promise<RelayOutcome> {
  let response: Response;
  try {
    response = await fetchImplementation(relayRoutePath, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(RELAY_TIMEOUT_MILLISECONDS + RELAY_ROUTE_GRACE_MILLISECONDS),
    });
  } catch {
    return "transport_failure";
  }
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return "unexpected_response";
  }
  return parseRelayOutcome(parsed) ?? "unexpected_response";
}

export interface SignatureRequest {
  readonly type: string;
  readonly canonicalPayloadBytes: Uint8Array;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export type SignatureFlowResult =
  | { readonly kind: "expired" }
  | { readonly kind: "wrong_chain" }
  | { readonly kind: "no_account" }
  | { readonly kind: "declined" }
  | { readonly kind: "signing_failed" }
  | { readonly kind: "relayed"; readonly outcome: RelayOutcome };

export interface SignatureFlowDependencies {
  readonly relay?: (body: string) => Promise<RelayOutcome>;
  readonly onSigned?: () => void;
  readonly nowMilliseconds?: () => number;
  readonly randomBytes?: RandomBytes;
}

export async function signAndRelayCommand(
  provider: Eip1193Provider,
  request: SignatureRequest,
  dependencies: SignatureFlowDependencies = {},
): Promise<SignatureFlowResult> {
  if (!isTool402CommandType(request.type)) {
    return { kind: "signing_failed" };
  }
  const now = (dependencies.nowMilliseconds ?? Date.now)();
  if (!(now < Date.parse(request.expiresAt))) {
    return { kind: "expired" };
  }
  const session = await readCurrentSession(provider);
  if (session.state.kind === "wrong_chain") {
    return { kind: "wrong_chain" };
  }
  if (session.state.kind !== "connected") {
    return { kind: "no_account" };
  }
  let body: string;
  try {
    const command = createUnsignedCommand({
      type: request.type,
      signer: session.state.address,
      nonce: createCommandNonce(dependencies.randomBytes),
      issuedAt: request.issuedAt,
      expiresAt: request.expiresAt,
      canonicalPayloadBytes: request.canonicalPayloadBytes,
    });
    const signed = await signCommand(provider, command);
    body = createCommandBody(signed, request.canonicalPayloadBytes);
  } catch (error) {
    return { kind: isUserRejection(error) ? "declined" : "signing_failed" };
  }
  dependencies.onSigned?.();
  const outcome = await (dependencies.relay ?? relayCommandBody)(body);
  return { kind: "relayed", outcome };
}
