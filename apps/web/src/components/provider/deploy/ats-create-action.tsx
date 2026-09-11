"use client";

import { useRef, useState } from "react";

import {
  createStageBBrowserProviderBridge,
  type StageBCandidate,
  type StageBBridgeOutcome,
  type StageBEip1193Provider,
} from "../../../lib/ats/stage-b-browser-provider-bridge.ts";
import { Button } from "../../ui/button";
import { StatusRegion } from "../../ui/status";

type WalletSession = Readonly<{
  provider: StageBEip1193Provider;
  address: string;
}>;

type StageBActionController = Readonly<{
  provider: StageBEip1193Provider;
  address: string;
  execute: () => Promise<StageBBridgeOutcome>;
}>;

export function AtsCreateAction({
  session,
  stageTwoDone,
  hasCandidate,
  onCandidate,
}: {
  session: WalletSession | null;
  stageTwoDone: boolean;
  hasCandidate: boolean;
  onCandidate: (candidate: StageBCandidate) => void;
}) {
  const controller = useRef<StageBActionController | null>(null);
  const sessionChanged = useRef(false);
  const [terminalOutcome, setTerminalOutcome] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (controller.current === null && session !== null) {
    controller.current = Object.freeze({
      provider: session.provider,
      address: session.address,
      execute: createStageBBrowserProviderBridge({ provider: session.provider, fetch }).execute,
    });
  } else if (
    controller.current !== null &&
    (session === null || controller.current.provider !== session.provider || controller.current.address !== session.address)
  ) {
    sessionChanged.current = true;
  }

  const enabled = stageTwoDone && session !== null && !hasCandidate && !terminalOutcome && !sessionChanged.current && controller.current !== null;

  async function requestCandidate() {
    if (!enabled || controller.current === null) return;
    const outcome = await controller.current.execute();
    if (outcome.kind === "candidate") {
      setTerminalOutcome(true);
      onCandidate(outcome.candidate);
      setFeedback("A local candidate was observed for this session. Attach it with the separate signature step.");
      return;
    }
    if (outcome.kind === "submission_unknown") setTerminalOutcome(true);
    setFeedback(outcome.kind === "rejected"
      ? "The wallet did not approve this local request. Nothing was submitted."
      : "The local result is unknown. Reload before choosing any new action; nothing is attached automatically.");
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={!enabled}
        data-ats-contracts-bundle="loaded"
        onClick={requestCandidate}
        size="sm"
        className="w-full sm:w-auto"
      >
        Create the note in MetaMask
      </Button>
      <StatusRegion className="mt-2 text-sm text-muted-foreground">{feedback ?? (sessionChanged.current ? "The wallet session changed. Reload before choosing any new action." : null)}</StatusRegion>
    </div>
  );
}
