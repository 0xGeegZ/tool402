"use client";

import { useRef, useState } from "react";

import {
  createStageBBrowserProviderBridge,
  isCanonicalStageBTransactionHash,
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
  recover: (transactionHash: string) => Promise<StageBBridgeOutcome>;
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
  const [recoveryHash, setRecoveryHash] = useState("");
  const [recoveryPending, setRecoveryPending] = useState(false);

  if (controller.current === null && session !== null) {
    const bridge = createStageBBrowserProviderBridge({ provider: session.provider, fetch });
    controller.current = Object.freeze({
      provider: session.provider,
      address: session.address,
      execute: bridge.execute,
      recover: bridge.recover,
    });
  } else if (
    controller.current !== null &&
    (session === null || controller.current.provider !== session.provider || controller.current.address !== session.address)
  ) {
    sessionChanged.current = true;
  }

  const enabled = stageTwoDone && session !== null && !hasCandidate && !terminalOutcome && !sessionChanged.current && controller.current !== null;
  const recoveryEnabled = stageTwoDone && session !== null && !hasCandidate && !recoveryPending && !sessionChanged.current && controller.current !== null && isCanonicalStageBTransactionHash(recoveryHash);

  async function requestCandidate() {
    if (!enabled || controller.current === null) return;
    const outcome = await controller.current.execute();
    if (outcome.kind === "candidate") {
      setTerminalOutcome(true);
      onCandidate(outcome.candidate);
      setFeedback("A local candidate was observed for this session. Attach it with the separate signature step.");
      return;
    }
    if (outcome.kind === "submission_unknown") {
      setTerminalOutcome(true);
      if (outcome.transactionHash !== undefined) {
        setRecoveryHash(outcome.transactionHash);
        setFeedback("The submitted transaction hash is ready for public recovery. No second transaction was made.");
        return;
      }
    }
    setFeedback(outcome.kind === "rejected"
      ? "The wallet did not approve this local request. Nothing was submitted."
      : "The local result is unknown. Reload before choosing any new action; nothing is attached automatically.");
  }

  async function recoverCandidate() {
    if (!recoveryEnabled || controller.current === null) return;
    setRecoveryPending(true);
    const outcome = await controller.current.recover(recoveryHash);
    setRecoveryPending(false);
    if (outcome.kind === "candidate") {
      setTerminalOutcome(true);
      onCandidate(outcome.candidate);
      setFeedback("The public transaction was corroborated. Attach the candidate with the separate signature step.");
      return;
    }
    setFeedback("The public transaction could not be corroborated. No MetaMask request or new transaction was made.");
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
      {!hasCandidate ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground" htmlFor="stage-b-recovery-hash">
            Recover an existing transaction
            <input
              id="stage-b-recovery-hash"
              data-stage-b-recovery-hash="true"
              value={recoveryHash}
              onChange={(event) => setRecoveryHash(event.target.value)}
              placeholder="0x… transaction hash"
              disabled={sessionChanged.current || recoveryPending}
              className="h-9 rounded-control border border-input bg-background px-3 font-mono text-xs text-foreground"
            />
          </label>
          <Button type="button" size="sm" disabled={!recoveryEnabled} onClick={recoverCandidate}>
            Recover candidate from transaction hash
          </Button>
        </div>
      ) : null}
      <StatusRegion className="mt-2 text-sm text-muted-foreground">{feedback ?? (sessionChanged.current ? "The wallet session changed. Reload before choosing any new action." : null)}</StatusRegion>
    </div>
  );
}
