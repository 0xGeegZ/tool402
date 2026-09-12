export type DirectoryRecordLiteral = Readonly<{
  serviceId: string;
  serviceSlug: string;
  capabilities: readonly ["evm-contract-risk-signals"];
  paymentProtocol: "x402";
  paymentNetwork: "hedera-testnet";
  asset: "HBAR";
  advertisedTiers: readonly ["quick", "standard"];
  issuerRevenueAccount: string;
  status: "active";
  x402Endpoint?: string;
  clearingAccount?: string;
}>;

export type CompleteDirectoryRecordLiteral = DirectoryRecordLiteral &
  Readonly<{ x402Endpoint: string; clearingAccount: string }>;

export type MissingDirectoryRecordField = "x402Endpoint" | "clearingAccount";

export const directoryRecordLiteral: DirectoryRecordLiteral = Object.freeze({
  serviceId: "riskscan",
  serviceSlug: "riskscan",
  capabilities: Object.freeze(["evm-contract-risk-signals"] as const),
  paymentProtocol: "x402",
  paymentNetwork: "hedera-testnet",
  asset: "HBAR",
  advertisedTiers: Object.freeze(["quick", "standard"] as const),
  issuerRevenueAccount: "0.0.10430887",
  status: "active",
});

export function directoryRecordForProviderTool(toolPublicId?: string): DirectoryRecordLiteral {
  if (toolPublicId === undefined) return directoryRecordLiteral;
  if (!/^tool_[0-9a-f]{32}$/u.test(toolPublicId)) {
    throw new TypeError("invalid selected provider tool");
  }
  return Object.freeze({
    ...directoryRecordLiteral,
    serviceId: toolPublicId,
    serviceSlug: `tool-${toolPublicId.slice("tool_".length)}`,
  });
}

export function completeDirectoryRecordLiteral(
  record: DirectoryRecordLiteral,
  configuration: Readonly<{ x402Endpoint: string; clearingAccount: string }>,
): CompleteDirectoryRecordLiteral {
  return Object.freeze({ ...record, ...configuration });
}

export function missingDirectoryRecordFields(
  record: DirectoryRecordLiteral,
): readonly MissingDirectoryRecordField[] {
  const missing: MissingDirectoryRecordField[] = [];
  if (record.x402Endpoint === undefined) missing.push("x402Endpoint");
  if (record.clearingAccount === undefined) missing.push("clearingAccount");
  return Object.freeze(missing);
}

export function isDirectoryRecordComplete(
  record: DirectoryRecordLiteral,
): record is CompleteDirectoryRecordLiteral {
  return missingDirectoryRecordFields(record).length === 0;
}
