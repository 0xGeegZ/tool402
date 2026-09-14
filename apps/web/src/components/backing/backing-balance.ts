import type { Eip1193Provider } from "../../lib/wallet/metamask-provider.ts";
import type { TransferRequest } from "./backing-state.ts";

const hexadecimalQuantity = /^0x[0-9a-f]+$/u;

function quantity(value: unknown): bigint | null {
  if (typeof value !== "string" || !hexadecimalQuantity.test(value)) return null;
  try { return BigInt(value); } catch { return null; }
}

export type FundingBalance = "SUFFICIENT" | "INSUFFICIENT" | "UNAVAILABLE";

/** Reads wallet balance and an estimated gas allowance; it never requests accounts or sends a transaction. */
export async function assessFundingBalance(provider: Eip1193Provider, request: TransferRequest): Promise<FundingBalance> {
  const transaction = request.params[0];
  try {
    const [balance, gas, gasPrice] = await Promise.all([
      provider.request({ method: "eth_getBalance", params: [transaction.from, "latest"] }),
      provider.request({ method: "eth_estimateGas", params: [transaction] }),
      provider.request({ method: "eth_gasPrice" }),
    ]);
    const available = quantity(balance);
    const gasUnits = quantity(gas);
    const price = quantity(gasPrice);
    const value = quantity(transaction.value);
    if (available === null || gasUnits === null || price === null || value === null) return "UNAVAILABLE";
    return available >= value + gasUnits * price ? "SUFFICIENT" : "INSUFFICIENT";
  } catch {
    return "UNAVAILABLE";
  }
}
