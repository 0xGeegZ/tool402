const transactionHashPattern = /^0x[0-9a-f]{64}$/u;
const evmAddressPattern = /^0x[0-9a-f]{40}$/u;
const hederaSettlementPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)@([1-9][0-9]*)\.(0|[1-9][0-9]{0,8})$/u;
const testnetBase = "https://hashscan.io/testnet";

export function hashscanTransactionUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (transactionHashPattern.test(value)) return testnetBase + "/transaction/" + encodeURIComponent(value);
  const settlement = hederaSettlementPattern.exec(value);
  return settlement === null
    ? null
    : testnetBase + "/transaction/" + settlement[1] + "." + settlement[2] + "." + settlement[3] + "-" + settlement[4] + "-" + settlement[5];
}

export function hashscanContractUrl(value: unknown): string | null {
  return typeof value === "string" && evmAddressPattern.test(value)
    ? testnetBase + "/contract/" + encodeURIComponent(value)
    : null;
}
