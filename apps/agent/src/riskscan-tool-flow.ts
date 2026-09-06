import { requestRiskScanQuickChallenge } from "./riskscan-tool-challenge.ts";
import { discoverRiskScanQuick } from "./riskscan-tool-directory.ts";
import type { RiskScanChallengeSender, RiskScanConsumerChallengeOutcome } from "./riskscan-tool-challenge.ts";
import type { RiskScanDirectoryFetcher } from "./riskscan-tool-directory.ts";

export type RiskScanToolFlowOutcome = RiskScanConsumerChallengeOutcome;

export async function runRiskScanQuickFlow(
  serviceBase: URL,
  input: unknown,
  directoryFetcher?: RiskScanDirectoryFetcher,
  challengeSender?: RiskScanChallengeSender,
): Promise<RiskScanToolFlowOutcome> {
  const discovery = await discoverRiskScanQuick(serviceBase, directoryFetcher);
  return requestRiskScanQuickChallenge(serviceBase, discovery, input, challengeSender);
}
