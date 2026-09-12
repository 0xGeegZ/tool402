const transactionHashPattern = /^0x[0-9a-f]{64}$/u;
const evmAddressPattern = /^0x[0-9a-f]{40}$/u;
const testnetBase = "https://hashscan.io/testnet";

export function hashscanTransactionUrl(value: unknown): string | null {
  return typeof value === "string" && transactionHashPattern.test(value)
    ? testnetBase + "/transaction/" + encodeURIComponent(value)
    : null;
}

export function hashscanContractUrl(value: unknown): string | null {
  return typeof value === "string" && evmAddressPattern.test(value)
    ? testnetBase + "/contract/" + encodeURIComponent(value)
    : null;
}
