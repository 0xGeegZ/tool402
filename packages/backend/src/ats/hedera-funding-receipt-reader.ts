const rpcNodeBaseUrl = "https://testnet.hashio.io/api";
const maximumResponseBytes = 1_048_576;
const timeoutMilliseconds = 5_000;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const quantityPattern = /^0x(?:0|[1-9a-f][0-9a-f]*)$/u;

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export type HederaFundingReceipt = Readonly<{
  hash: `0x${string}`;
  chainId: 296;
  from: string;
  to: string;
  value: bigint;
  /** A mined EVM receipt is terminal, whether it succeeded or reverted. */
  status: "0x1" | "0x0";
}>;

type RpcResult = Readonly<{ status: "DOCUMENT"; value: unknown } | { status: "UNKNOWN" }>;

function record(input: unknown): Record<string, unknown> | null {
  return input !== null && typeof input === "object" && !Array.isArray(input)
    && Object.getPrototypeOf(input) === Object.prototype ? input as Record<string, unknown> : null;
}

async function json(fetcher: Fetcher, body: unknown): Promise<RpcResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMilliseconds);
  try {
    const response = await fetcher(rpcNodeBaseUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    const length = response.headers.get("content-length");
    if (response.status !== 200 || !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")
      || (length !== null && (!/^[0-9]+$/u.test(length) || Number(length) > maximumResponseBytes))) {
      await response.body?.cancel();
      return { status: "UNKNOWN" };
    }
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maximumResponseBytes) return { status: "UNKNOWN" };
    const value = record(JSON.parse(text));
    return value?.jsonrpc === "2.0" && value.id === 1 && Object.hasOwn(value, "result")
      ? { status: "DOCUMENT", value: value.result }
      : { status: "UNKNOWN" };
  } catch {
    return { status: "UNKNOWN" };
  } finally {
    clearTimeout(timer);
  }
}

function quantity(value: unknown): bigint | null {
  if (typeof value !== "string" || !quantityPattern.test(value)) return null;
  try { return BigInt(value); } catch { return null; }
}

function transaction(input: unknown, hash: string): Omit<HederaFundingReceipt, "status"> | null {
  const value = record(input);
  const chainId = quantity(value?.chainId);
  const transferValue = quantity(value?.value);
  if (value?.hash !== hash || chainId !== 296n || transferValue === null
    || typeof value?.from !== "string" || !addressPattern.test(value.from)
    || typeof value?.to !== "string" || !addressPattern.test(value.to)) return null;
  return Object.freeze({ hash: hash as `0x${string}`, chainId: 296, from: value.from, to: value.to, value: transferValue });
}

function receipt(input: unknown, hash: string): "0x1" | "0x0" | null {
  const value = record(input);
  return value?.transactionHash === hash && (value.status === "0x1" || value.status === "0x0") ? value.status : null;
}

/** Reads exactly one Hedera Testnet EVM transaction and its receipt. */
export function createHederaFundingReceiptReader(fetcher: Fetcher): (hash: `0x${string}`) => Promise<HederaFundingReceipt | null> {
  return async (hash) => {
    if (!hashPattern.test(hash)) return null;
    const transactionResult = await json(fetcher, { jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [hash] });
    if (transactionResult.status !== "DOCUMENT") return null;
    const observedTransaction = transaction(transactionResult.value, hash);
    if (observedTransaction === null) return null;
    const receiptResult = await json(fetcher, { jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] });
    const observedReceipt = receiptResult.status === "DOCUMENT" ? receipt(receiptResult.value, hash) : null;
    if (observedReceipt === null) return null;
    return Object.freeze({ ...observedTransaction, status: observedReceipt });
  };
}
