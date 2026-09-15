import type { TransferRequest } from "./backing-state.ts";

type FundingBalanceClient = Readonly<{
  getBalance: (parameters: Readonly<{ address: `0x${string}` }>) => Promise<bigint>;
  estimateGas: (parameters: Readonly<{ account: `0x${string}`; to: `0x${string}`; value: bigint }>) => Promise<bigint>;
  getGasPrice: () => Promise<bigint>;
}>;

export type FundingBalance = "SUFFICIENT" | "INSUFFICIENT" | "UNAVAILABLE";

/** Reads the configured public client; it never requests accounts or sends a transaction. */
export async function assessFundingBalance(client: FundingBalanceClient, request: TransferRequest & Readonly<{ account: `0x${string}` }>): Promise<FundingBalance> {
  try {
    const [balance, gas, gasPrice] = await Promise.all([
      client.getBalance({ address: request.account }),
      client.estimateGas(request),
      client.getGasPrice(),
    ]);
    return balance >= request.value + gas * gasPrice ? "SUFFICIENT" : "INSUFFICIENT";
  } catch {
    return "UNAVAILABLE";
  }
}
