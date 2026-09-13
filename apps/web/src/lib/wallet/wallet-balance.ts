import type { Eip1193Provider } from "./metamask-provider.ts";

const WEIBAR_PER_HBAR = 10n ** 18n;

export async function readHbarBalance(provider: Eip1193Provider, address: string): Promise<string> {
  const answer = await provider.request({ method: "eth_getBalance", params: [address, "latest"] });
  if (typeof answer !== "string" || !/^0x[0-9a-fA-F]+$/u.test(answer)) {
    throw new Error("eth_getBalance did not answer with a hex quantity");
  }
  return answer;
}

export function formatHbar(weibarHex: string): string {
  const weibar = BigInt(weibarHex);
  const whole = weibar / WEIBAR_PER_HBAR;
  const fraction = ((weibar % WEIBAR_PER_HBAR) * 100n) / WEIBAR_PER_HBAR;
  return `${whole}.${String(fraction).padStart(2, "0")} HBAR`;
}
