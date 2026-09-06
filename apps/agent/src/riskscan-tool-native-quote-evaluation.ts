import { evaluateRiskScanNativeQuote } from "@tool402/core";
import type { RiskScanNativeQuoteEligibility } from "@tool402/core";
import { discoverRiskScanQuick } from "./riskscan-tool-directory.ts";
import type { RiskScanDirectoryFetcher } from "./riskscan-tool-directory.ts";

export type RiskScanNativeQuoteAgentOutcome =
  | { readonly kind: "directory_unavailable" }
  | { readonly kind: "directory_invalid" }
  | { readonly kind: "native_summary_unavailable" }
  | RiskScanNativeQuoteEligibility;

export async function evaluateDiscoveredRiskScanNativeQuote(
  serviceBase: URL,
  policy: unknown,
  directoryFetcher: RiskScanDirectoryFetcher,
): Promise<RiskScanNativeQuoteAgentOutcome> {
  if (typeof directoryFetcher !== "function") return { kind: "directory_invalid" };
  const discovery = await discoverRiskScanQuick(serviceBase, directoryFetcher);
  if (discovery.kind !== "tool_selected") return discovery;
  const summary = discovery.tool.payment;
  if (summary.state !== "locally_configured" || summary.network !== "hedera:testnet") {
    return { kind: "native_summary_unavailable" };
  }
  return evaluateRiskScanNativeQuote(policy, {
    network: summary.network,
    asset: summary.asset,
    amount: summary.amount,
  });
}
