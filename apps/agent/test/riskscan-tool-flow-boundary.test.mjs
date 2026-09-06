import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = new URL("../src/riskscan-tool-flow.ts", import.meta.url);

test("keeps the flow to the two accepted Agent boundaries", async () => {
  const text = await readFile(source, "utf8");
  assert.equal(text, `import { requestRiskScanQuickChallenge } from "./riskscan-tool-challenge.ts";
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
`);
});
