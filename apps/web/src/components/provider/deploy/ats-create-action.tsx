"use client";

import { useEffect, useRef, useState } from "react";
import { usePublicClient, useSendTransaction } from "wagmi";

import {
  createStageBBrowserProviderBridge,
  isCanonicalStageBTransactionHash,
  type StageBCandidate,
  type StageBBridgeOutcome,
  type StageBWalletContext,
} from "../../../lib/ats/stage-b-browser-provider-bridge.ts";
import { Button } from "../../ui/button";
import { StatusRegion } from "../../ui/status";
import { connectedTool402Wallet, useTool402Wallet } from "../../wallet/use-tool402-wallet";
import {
  beginStageBRecovery,
  createStageBRecoveryScope,
  hasStageBRecovery,
  persistStageBRecovery,
  readStageBRecovery,
  type StageBRecoveryScope,
} from "./stage-b-recovery";

type StageBActionController = Readonly<{
  wallet: StageBWalletContext;
  execute: () => Promise<StageBBridgeOutcome>;
  recover: (transactionHash: string) => Promise<StageBBridgeOutcome>;
}>;
type ControllerContext = Readonly<{
  preparedAttemptPublicId: string | undefined;
  selectedToolPublicId: string | undefined;
  wallet: StageBWalletContext | null;
}>;

function stageBWalletContext(wallet: ReturnType<typeof useTool402Wallet>): StageBWalletContext | null {
  const connection = connectedTool402Wallet(wallet.connection, wallet.resolved);
  if (connection === null) return null;
  return {
    address: connection.account,
    chainId: 296,
    connectorId: connection.connector.id,
    generation: connection.generation,
  };
}

function isSameControllerContext(left: ControllerContext, right: ControllerContext): boolean {
  return left.preparedAttemptPublicId === right.preparedAttemptPublicId
    && left.selectedToolPublicId === right.selectedToolPublicId
    && left.wallet?.address === right.wallet?.address
    && left.wallet?.chainId === right.wallet?.chainId
    && left.wallet?.connectorId === right.wallet?.connectorId
    && left.wallet?.generation === right.wallet?.generation;
}

function recoveryScope(context: ControllerContext): StageBRecoveryScope | null {
  return context.wallet === null ? null : createStageBRecoveryScope({
    address: context.wallet.address,
    preparedAttemptPublicId: context.preparedAttemptPublicId,
    selectedToolPublicId: context.selectedToolPublicId,
  });
}

export function AtsCreateAction({
  configuration,
  preparedAttemptPublicId,
  selectedTool,
  selectedToolPublicId,
  stageTwoDone,
  hasCandidate,
  onCandidate,
}: {
  configuration?: unknown;
  preparedAttemptPublicId?: string;
  selectedTool: boolean;
  selectedToolPublicId?: string;
  stageTwoDone: boolean;
  hasCandidate: boolean;
  onCandidate: (candidate: StageBCandidate) => void;
}) {
  const wallet = useTool402Wallet();
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const currentWallet = stageBWalletContext(wallet);
  const publicClient = usePublicClient({ chainId: 296 });
  const { mutateAsync: sendTransaction } = useSendTransaction({ mutation: { retry: false } });
  const controller = useRef<StageBActionController | null>(null);
  const controllerContext = useRef<ControllerContext>({ preparedAttemptPublicId, selectedToolPublicId, wallet: currentWallet });
  const actionInFlight = useRef<ControllerContext | null>(null);
  const sessionChanged = useRef(false);
  const [terminalOutcome, setTerminalOutcome] = useState<ControllerContext | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<Readonly<{ context: ControllerContext; hash: string; pending: boolean; persisted: boolean }> | null>(null);
  const [recoveryResolvedFor, setRecoveryResolvedFor] = useState<ControllerContext | null>(null);
  const [submittedFor, setSubmittedFor] = useState<ControllerContext | null>(null);
  const [, setInFlight] = useState<ControllerContext | null>(null);

  const nextControllerContext = { preparedAttemptPublicId, selectedToolPublicId, wallet: currentWallet };
  if (
    controllerContext.current.selectedToolPublicId !== selectedToolPublicId
    || controllerContext.current.preparedAttemptPublicId !== preparedAttemptPublicId
  ) {
    controller.current = null;
    actionInFlight.current = null;
    sessionChanged.current = false;
    controllerContext.current = nextControllerContext;
  } else if (controller.current === null) {
    controllerContext.current = nextControllerContext;
  } else if (!isSameControllerContext(controllerContext.current, nextControllerContext)) {
    sessionChanged.current = true;
  }

  const currentRecoveryScope = recoveryScope(controllerContext.current);
  useEffect(() => {
    if (currentRecoveryScope !== null) {
      const hash = readStageBRecovery(currentRecoveryScope);
      if (hash !== null) setRecovery({ context: controllerContext.current, hash, pending: false, persisted: true });
      if (hasStageBRecovery(currentRecoveryScope)) setSubmittedFor(controllerContext.current);
    }
    setRecoveryResolvedFor(controllerContext.current);
  }, [currentRecoveryScope?.address, currentRecoveryScope?.preparedAttemptPublicId, currentRecoveryScope?.toolPublicId]);

  if (controller.current === null && currentWallet !== null && publicClient !== undefined && (!selectedTool || configuration !== undefined)) {
    const bridgeRecoveryScope = recoveryScope(controllerContext.current);
    const bridge = createStageBBrowserProviderBridge({
      wallet: currentWallet,
      readCurrentWallet: () => stageBWalletContext(walletRef.current),
      sendTransaction: (request) => sendTransaction(request),
      onTransactionHash: (hash) => {
        if (bridgeRecoveryScope !== null) persistStageBRecovery(bridgeRecoveryScope, hash);
      },
      getTransactionReceipt: ({ hash }) => publicClient.getTransactionReceipt({ hash }),
      fetch,
      configuration,
    });
    controller.current = Object.freeze({
      wallet: currentWallet,
      execute: bridge.execute,
      recover: bridge.recover,
    });
  }

  const terminalForCurrentContext = terminalOutcome !== null && isSameControllerContext(terminalOutcome, controllerContext.current);
  const currentRecovery = recovery !== null && isSameControllerContext(recovery.context, controllerContext.current)
    ? recovery
    : null;
  const inFlightForCurrentContext = actionInFlight.current !== null
    && isSameControllerContext(actionInFlight.current, controllerContext.current);
  const publicAtsExecutionBlocked = selectedTool;
  const recoveryAvailable = stageTwoDone && currentWallet !== null && (!selectedTool || configuration !== undefined) && !hasCandidate && !sessionChanged.current && controller.current !== null;
  const candidateActionAvailable = recoveryAvailable && !publicAtsExecutionBlocked;
  const recoveryResolved = recoveryResolvedFor !== null && isSameControllerContext(recoveryResolvedFor, controllerContext.current);
  const submitted = submittedFor !== null && isSameControllerContext(submittedFor, controllerContext.current);
  const enabled = candidateActionAvailable && recoveryResolved && !submitted && !terminalForCurrentContext && !inFlightForCurrentContext && currentRecoveryScope !== null;
  const recoveryEnabled = recoveryAvailable && !inFlightForCurrentContext && currentRecovery?.pending !== true && isCanonicalStageBTransactionHash(currentRecovery?.hash ?? "");

  async function requestCandidate() {
    const actionContext = controllerContext.current;
    const actionRecoveryScope = recoveryScope(actionContext);
    if (!enabled || !recoveryResolved || submitted || actionRecoveryScope === null || actionContext.preparedAttemptPublicId === undefined || controller.current === null || actionInFlight.current !== null) return;
    actionInFlight.current = actionContext;
    setInFlight(actionContext);
    const claim = await beginStageBRecovery(actionRecoveryScope);
    if (claim !== "claimed") {
      actionInFlight.current = null;
      setInFlight(null);
      setSubmittedFor(actionContext);
      setFeedback(claim === "existing"
        ? "This prepared attempt already has a submitted transaction to reconcile. Creation remains blocked."
        : "This browser cannot safely retain a submitted transaction for recovery. Creation remains blocked.");
      return;
    }
    setSubmittedFor(actionContext);
    try {
      const outcome = await controller.current.execute();
      if (outcome.kind === "submission_unknown" && outcome.transactionHash !== undefined && actionRecoveryScope !== null) {
        persistStageBRecovery(actionRecoveryScope, outcome.transactionHash);
      }
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
          setRecovery({ context: actionContext, hash: outcome.transactionHash, pending: false, persisted: true });
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
    setRecovery({ context: actionContext, hash: recoveryHash, pending: true, persisted: currentRecovery?.persisted === true });
    try {
      const outcome = await controller.current.recover(recoveryHash);
      if (controllerContext.current !== actionContext || sessionChanged.current) return;
      if (outcome.kind === "candidate") {
        setTerminalOutcome(controllerContext.current);
        onCandidate(outcome.candidate);
        setFeedback("The public transaction was corroborated. Attach the candidate with the separate signature step.");
        return;
      }
      setRecovery({ context: actionContext, hash: recoveryHash, pending: false, persisted: currentRecovery?.persisted === true });
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
              onChange={(event) => setRecovery({ context: controllerContext.current, hash: event.target.value, pending: false, persisted: false })}
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
      <StatusRegion className="mt-2 text-sm text-muted-foreground">{feedback ?? (publicAtsExecutionBlocked
        ? "Public ATS deployment is unavailable until a durable pre-wallet dispatch record prevents reload or multi-tab redeployment. Existing transaction recovery remains read-only."
        : sessionChanged.current ? "The wallet session changed. Reload before choosing any new action." : null)}</StatusRegion>
    </div>
  );
}
