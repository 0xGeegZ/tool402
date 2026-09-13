import { parseHederaTransactionId } from "@tool402/core";

const transactionHashPattern = /^0x[0-9a-f]{64}$/u;
const evmAddressPattern = /^0x[0-9a-f]{40}$/u;
const testnetBase = "https://hashscan.io/testnet";

export function hashscanTransactionUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (transactionHashPattern.test(value)) return testnetBase + "/transaction/" + encodeURIComponent(value);
  if (parseHederaTransactionId(value) === undefined) return null;
  const [account, consensusTimestamp] = value.split("@");
  const [seconds, nanoseconds] = consensusTimestamp.split(".");
  return testnetBase + "/transaction/" + account + "-" + seconds + "-" + nanoseconds;
}

export function hashscanContractUrl(value: unknown): string | null {
  return typeof value === "string" && evmAddressPattern.test(value)
    ? testnetBase + "/contract/" + encodeURIComponent(value)
    : null;
}
