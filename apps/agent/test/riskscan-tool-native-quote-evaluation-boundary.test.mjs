import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = new URL("../src/riskscan-tool-native-quote-evaluation.ts", import.meta.url);

test("keeps native quote evaluation to the required fetcher guard and accepted pure boundaries", async () => {
  const text = await readFile(source, "utf8");
  assert.equal(text, `import { evaluateRiskScanNativeQuote } from "@tool402/core";
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
`);

  for (const forbidden of [
    /\bfetch\s*\(/u,
    /\bPOST\b/u,
    /\b(?:body|headers?)\b/iu,
    /\b(?:response|result|settlement)\b/iu,
    /\b(?:wallet|account|signer|private.?key)\b/iu,
    /\b(?:process\.env|environment|backend|store)\b/iu,
    /\b(?:setTimeout|setInterval|retry|import\s*\()/u,
    /\b(?:paymentClient|paymentExecution|paymentRequest|paymentSender)\b/iu,
  ]) assert.doesNotMatch(text, forbidden);
});
