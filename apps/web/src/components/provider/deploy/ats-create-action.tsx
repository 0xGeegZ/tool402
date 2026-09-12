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
type ControllerContext = Readonly<{ selectedToolPublicId: string | undefined }>;

function isSameControllerContext(left: ControllerContext, right: ControllerContext): boolean {
  return left.selectedToolPublicId === right.selectedToolPublicId;
}

export function AtsCreateAction({
  session,
  configuration,
  selectedTool,
  selectedToolPublicId,
  stageTwoDone,
  hasCandidate,
  onCandidate,
}: {
  session: WalletSession | null;
  configuration?: unknown;
  selectedTool: boolean;
  selectedToolPublicId?: string;
  stageTwoDone: boolean;
  hasCandidate: boolean;
  onCandidate: (candidate: StageBCandidate) => void;
}) {
  const controller = useRef<StageBActionController | null>(null);
  const controllerContext = useRef<ControllerContext>({ selectedToolPublicId });
  const actionInFlight = useRef<ControllerContext | null>(null);
  const sessionChanged = useRef(false);
  const [terminalOutcome, setTerminalOutcome] = useState<ControllerContext | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<Readonly<{ context: ControllerContext; hash: string; pending: boolean }> | null>(null);
  const [, setInFlight] = useState<ControllerContext | null>(null);

  if (controllerContext.current.selectedToolPublicId !== selectedToolPublicId) {
    controller.current = null;
    actionInFlight.current = null;
    sessionChanged.current = false;
    controllerContext.current = { selectedToolPublicId };
  }

  if (controller.current === null && session !== null && (!selectedTool || configuration !== undefined)) {
    const bridge = createStageBBrowserProviderBridge({ provider: session.provider, fetch, configuration });
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

  const terminalForCurrentContext = terminalOutcome !== null && isSameControllerContext(terminalOutcome, controllerContext.current);
  const currentRecovery = recovery !== null && isSameControllerContext(recovery.context, controllerContext.current)
    ? recovery
    : null;
  const inFlightForCurrentContext = actionInFlight.current !== null
    && isSameControllerContext(actionInFlight.current, controllerContext.current);
  const candidateActionAvailable = stageTwoDone && session !== null && (!selectedTool || configuration !== undefined) && !hasCandidate && !sessionChanged.current && controller.current !== null;
  const enabled = candidateActionAvailable && !terminalForCurrentContext && !inFlightForCurrentContext;
  const recoveryEnabled = candidateActionAvailable && !inFlightForCurrentContext && currentRecovery?.pending !== true && isCanonicalStageBTransactionHash(currentRecovery?.hash ?? "");

  async function requestCandidate() {
    if (!enabled || controller.current === null || actionInFlight.current !== null) return;
    const actionContext = controllerContext.current;
    actionInFlight.current = actionContext;
    setInFlight(actionContext);
    try {
      const outcome = await controller.current.execute();
      if (controllerContext.current !== actionContext || sessionChanged.current) return;
      if (outcome.kind === "candidate") {
        setTerminalOutcome(controllerContext.current);
        onCandidate(outcome.candidate);
        setFeedback("A local candidate was observed for this session. Attach it with the separate signature step.");
        return;
      }
      if (outcome.kind === "submission_unknown") {
        setTerminalOutcome(controllerContext.current);
        if (outcome.transactionHash !== undefined) {
          setRecovery({ context: actionContext, hash: outcome.transactionHash, pending: false });
          setFeedback("The submitted transaction hash is ready for public recovery. No second transaction was made.");
          return;
        }
      }
      setFeedback(outcome.kind === "rejected"
        ? "The wallet did not approve this local request. Nothing was submitted."
        : "The local result is unknown. Reload before choosing any new action; nothing is attached automatically.");
    } finally {
      if (actionInFlight.current === actionContext) {
        actionInFlight.current = null;
        if (isSameControllerContext(controllerContext.current, actionContext)) setInFlight(null);
      }
    }
  }

  async function recoverCandidate() {
    if (!recoveryEnabled || controller.current === null || actionInFlight.current !== null) return;
    const actionContext = controllerContext.current;
    const recoveryHash = currentRecovery?.hash;
    if (recoveryHash === undefined) return;
    actionInFlight.current = actionContext;
    setInFlight(actionContext);
    setRecovery({ context: actionContext, hash: recoveryHash, pending: true });
    try {
      const outcome = await controller.current.recover(recoveryHash);
      if (controllerContext.current !== actionContext || sessionChanged.current) return;
      if (outcome.kind === "candidate") {
        setTerminalOutcome(controllerContext.current);
        onCandidate(outcome.candidate);
        setFeedback("The public transaction was corroborated. Attach the candidate with the separate signature step.");
        return;
      }
      setRecovery({ context: actionContext, hash: recoveryHash, pending: false });
      setFeedback("The public transaction could not be corroborated. No MetaMask request or new transaction was made.");
    } finally {
      if (actionInFlight.current === actionContext) {
        actionInFlight.current = null;
        if (isSameControllerContext(controllerContext.current, actionContext)) setInFlight(null);
      }
    }
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
              value={currentRecovery?.hash ?? ""}
              onChange={(event) => setRecovery({ context: controllerContext.current, hash: event.target.value, pending: false })}
              placeholder="0x… transaction hash"
              disabled={sessionChanged.current || currentRecovery?.pending === true}
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
