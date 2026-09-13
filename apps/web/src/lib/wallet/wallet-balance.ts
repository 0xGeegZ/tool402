import { formatHbar as formatTinybarHbar } from "../hbar-format.ts";
import type { Eip1193Provider } from "./metamask-provider.ts";

const weibarPerTinybar = 10n ** 10n;

export async function readHbarBalance(provider: Eip1193Provider, address: string): Promise<string> {
  const answer = await provider.request({ method: "eth_getBalance", params: [address, "latest"] });
  if (typeof answer !== "string" || !/^0x[0-9a-fA-F]+$/u.test(answer)) {
    throw new Error("eth_getBalance did not answer with a hex quantity");
  }
  return answer;
}

export function formatHbar(weibarHex: string): string {
  return formatTinybarHbar(BigInt(weibarHex) / weibarPerTinybar);
}
