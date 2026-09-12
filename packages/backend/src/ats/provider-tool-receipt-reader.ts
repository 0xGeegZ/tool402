import factoryArtifact from "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json" with { type: "json" };
import { decodeEventLog, isAddress, type Hex } from "viem";

const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1/";
const rpcNodeBaseUrl = "https://testnet.hashio.io/api";
const maximumResponseBytes = 1_048_576;
const timeoutMilliseconds = 5_000;
const transactionIdPattern = /^0\.0\.[0-9]+(?:@[0-9]+\.[0-9]+|-[0-9]+-[0-9]+)$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const bytesPattern = /^0x(?:[0-9a-f]{2})*$/u;
const factoryAddress = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";

type Fetch = (input: string, init: RequestInit) => Promise<Response>;
type ReaderResult =
  | Readonly<{ status: "DOCUMENTS"; transaction: unknown; receipt: unknown }>
  | Readonly<{ status: "UNKNOWN" }>;
type Dependencies = Readonly<{
  mirrorNodeBaseUrl: typeof mirrorNodeBaseUrl;
  rpcNodeBaseUrl: typeof rpcNodeBaseUrl;
  fetch: Fetch;
}>;

function record(input: unknown): Record<string, unknown> | null {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)
      || Object.getPrototypeOf(input) !== Object.prototype) return null;
    const copy: Record<string, unknown> = Object.create(null);
    for (const key of Reflect.ownKeys(input)) {
      if (typeof key !== "string") return null;
      const field = Reflect.getOwnPropertyDescriptor(input, key);
      if (field === undefined || field.enumerable !== true || !Object.hasOwn(field, "value")
        || Object.hasOwn(field, "get") || Object.hasOwn(field, "set")) return null;
      copy[key] = field.value;
    }
    return copy;
  } catch {
    return null;
  }
}

function hash(value: unknown): string | null {
  return typeof value === "string" && hashPattern.test(value) ? value : null;
}

function address(value: unknown): string | null {
  return typeof value === "string" && addressPattern.test(value) ? value : null;
}

function mirrorPath(value: string): string | null {
  if (!transactionIdPattern.test(value)) return null;
  const at = value.indexOf("@");
  return at === -1 ? value : `${value.slice(0, at)}-${value.slice(at + 1).replace(".", "-")}`;
}

async function json(fetcher: Fetch, url: string, init: RequestInit): Promise<unknown | null> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMilliseconds);
  try {
    const response = await fetcher(url, {
      ...init, cache: "no-store", credentials: "omit", redirect: "error", signal: abort.signal,
    });
    if (response.status !== 200 || !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      await response.body?.cancel();
      return null;
    }
    const length = response.headers.get("content-length");
    if (length !== null && /^[0-9]+$/u.test(length) && Number(length) > maximumResponseBytes) {
      await response.body?.cancel();
      return null;
    }
    const reader = response.body?.getReader();
    if (reader === undefined) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximumResponseBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function rpc(fetcher: Fetch, method: string, params: readonly string[]): Promise<unknown | null> {
  const response = record(await json(fetcher, rpcNodeBaseUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  }));
  return response?.jsonrpc === "2.0" && response.id === 1 && Object.hasOwn(response, "result")
    ? response.result
    : null;
}

function transaction(value: unknown, expectedHash: string): unknown | null {
  const input = record(value);
  const actualHash = hash(input?.hash);
  const from = address(input?.from);
  const to = address(input?.to);
  const chainId = input?.chainId;
  const data = input?.input;
  if (actualHash !== expectedHash || from === null || to === null || typeof chainId !== "string"
    || !/^0x[0-9a-f]+$/u.test(chainId) || typeof data !== "string" || !bytesPattern.test(data)) return null;
  const parsedChainId = Number.parseInt(chainId.slice(2), 16);
  if (!Number.isSafeInteger(parsedChainId)) return null;
  return Object.freeze({ hash: actualHash, chainId: parsedChainId, from, to, input: data });
}

function bondLog(value: unknown): unknown | null {
  const input = record(value);
  const emitter = address(input?.address);
  const data = input?.data;
  const topics = input?.topics;
  if (emitter !== factoryAddress || typeof data !== "string" || !bytesPattern.test(data)
    || !Array.isArray(topics) || topics.length === 0
    || topics.some((topic) => typeof topic !== "string" || !bytesPattern.test(topic))) return null;
  try {
    const decoded = decodeEventLog({
      abi: factoryArtifact.abi,
      eventName: "BondDeployed",
      data: data as Hex,
      topics: topics as [Hex, ...Hex[]],
    });
    const args = decoded.args as unknown;
    const asset = !Array.isArray(args) && args !== null && typeof args === "object"
      ? (args as { readonly bondAddress?: unknown }).bondAddress
      : undefined;
    if (typeof asset !== "string" || !isAddress(asset) || asset.toLowerCase() === "0x0000000000000000000000000000000000000000") return null;
    return Object.freeze({ address: emitter, eventName: "BondDeployed", asset: asset.toLowerCase() });
  } catch {
    return null;
  }
}

function receipt(value: unknown, expectedHash: string): unknown | null {
  const input = record(value);
  if (hash(input?.transactionHash) !== expectedHash || input?.status !== "0x1" || !Array.isArray(input.logs)) return null;
  const logs: unknown[] = [];
  for (const rawLog of input.logs) {
    const raw = record(rawLog);
    if (address(raw?.address) !== factoryAddress) continue;
    const decoded = bondLog(rawLog);
    if (decoded === null) return null;
    logs.push(decoded);
  }
  return Object.freeze({ transactionHash: expectedHash, status: "0x1", logs: Object.freeze(logs) });
}

function dependencies(input: Dependencies): Dependencies {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype
    || input.mirrorNodeBaseUrl !== mirrorNodeBaseUrl || input.rpcNodeBaseUrl !== rpcNodeBaseUrl || typeof input.fetch !== "function") {
    throw new TypeError("invalid provider-tool receipt reader dependencies");
  }
  return input;
}

/** Reads receipt evidence only from pinned Hedera testnet Mirror and JSON-RPC endpoints. */
export function createBoundedProviderToolReceiptReader(input: Dependencies): (candidateTransactionId: string) => Promise<ReaderResult> {
  const source = dependencies(input);
  return async (candidateTransactionId) => {
    const path = mirrorPath(candidateTransactionId);
    if (path === null) return Object.freeze({ status: "UNKNOWN" });
    const mirror = record(await json(source.fetch, `${mirrorNodeBaseUrl}contracts/results/${path}`, { method: "GET" }));
    const transactionHash = hash(mirror?.hash);
    if (transactionHash === null) return Object.freeze({ status: "UNKNOWN" });
    const observedTransaction = transaction(await rpc(source.fetch, "eth_getTransactionByHash", [transactionHash]), transactionHash);
    const observedReceipt = receipt(await rpc(source.fetch, "eth_getTransactionReceipt", [transactionHash]), transactionHash);
    return observedTransaction === null || observedReceipt === null
      ? Object.freeze({ status: "UNKNOWN" })
      : Object.freeze({ status: "DOCUMENTS", transaction: observedTransaction, receipt: observedReceipt });
  };
}
