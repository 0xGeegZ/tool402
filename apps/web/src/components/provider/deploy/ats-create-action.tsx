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
  reconcileStageBRecovery,
  readStageBRecovery,
  releaseStageBRecoveryReservation,
  stageBRecoveryStatus,
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
  const [, setControllerVersion] = useState(0);

  const nextControllerContext = { preparedAttemptPublicId, selectedToolPublicId, wallet: currentWallet };
  const contextMatchesRender = isSameControllerContext(controllerContext.current, nextControllerContext);
  const currentRecoveryScope = recoveryScope(nextControllerContext);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  useEffect(() => {
    let changed = false;
    if (
      controllerContext.current.selectedToolPublicId !== selectedToolPublicId
      || controllerContext.current.preparedAttemptPublicId !== preparedAttemptPublicId
    ) {
      controller.current = null;
      actionInFlight.current = null;
      sessionChanged.current = false;
      controllerContext.current = nextControllerContext;
      changed = true;
    } else if (controller.current === null) {
      controllerContext.current = nextControllerContext;
      changed = true;
    } else if (!isSameControllerContext(controllerContext.current, nextControllerContext)) {
      sessionChanged.current = true;
      changed = true;
    }

    if (controller.current === null && currentWallet !== null && publicClient !== undefined && (!selectedTool || configuration !== undefined)) {
      const bridge = createStageBBrowserProviderBridge({
        wallet: currentWallet,
        readCurrentWallet: () => stageBWalletContext(walletRef.current),
        sendTransaction: (request) => sendTransaction(request),
        getTransactionReceipt: ({ hash }) => publicClient.getTransactionReceipt({ hash }),
        fetch,
        configuration,
      });
      controller.current = Object.freeze({
        wallet: currentWallet,
        execute: bridge.execute,
        recover: bridge.recover,
      });
      changed = true;
    }
    if (changed) setControllerVersion((version) => version + 1);
  }, [configuration, currentWallet?.address, currentWallet?.connectorId, currentWallet?.generation, preparedAttemptPublicId, publicClient, selectedTool, selectedToolPublicId, sendTransaction]);

  useEffect(() => {
    if (currentRecoveryScope !== null) {
      const hash = readStageBRecovery(currentRecoveryScope);
      if (hash !== null) setRecovery({ context: controllerContext.current, hash, pending: false, persisted: true });
      if (hasStageBRecovery(currentRecoveryScope)) setSubmittedFor(controllerContext.current);
    }
    setRecoveryResolvedFor(controllerContext.current);
  }, [currentRecoveryScope?.address, currentRecoveryScope?.preparedAttemptPublicId, currentRecoveryScope?.toolPublicId]);

  const terminalForCurrentContext = terminalOutcome !== null && isSameControllerContext(terminalOutcome, controllerContext.current);
  const currentRecovery = recovery !== null && isSameControllerContext(recovery.context, controllerContext.current)
    ? recovery
    : null;
  const inFlightForCurrentContext = actionInFlight.current !== null
    && isSameControllerContext(actionInFlight.current, controllerContext.current);
  const publicAtsExecutionBlocked = selectedTool;
  const recoveryAvailable = stageTwoDone && currentWallet !== null && (!selectedTool || configuration !== undefined) && !hasCandidate && !sessionChanged.current && controller.current !== null;
  const recoveryStorageStatus = currentRecoveryScope === null ? "unavailable" : stageBRecoveryStatus(currentRecoveryScope);
  const candidateActionAvailable = contextMatchesRender && recoveryAvailable && !publicAtsExecutionBlocked && recoveryStorageStatus !== "unavailable";
  const recoveryResolved = recoveryResolvedFor !== null && isSameControllerContext(recoveryResolvedFor, controllerContext.current);
  const submitted = submittedFor !== null && isSameControllerContext(submittedFor, controllerContext.current);
  const enabled = candidateActionAvailable && recoveryResolved && !submitted && !terminalForCurrentContext && !inFlightForCurrentContext && currentRecoveryScope !== null;
  const recoveryEnabled = recoveryAvailable && !inFlightForCurrentContext && currentRecovery?.pending !== true && isCanonicalStageBTransactionHash(currentRecovery?.hash ?? "");

  async function requestCandidate() {
    const actionContext = controllerContext.current;
    const actionRecoveryScope = recoveryScope(actionContext);
    if (!enabled || !recoveryResolved || submitted || actionRecoveryScope === null || actionContext.preparedAttemptPublicId === undefined || controller.current === null || actionInFlight.current !== null || stageBRecoveryStatus(actionRecoveryScope) !== "clear") return;
    actionInFlight.current = actionContext;
    setInFlight(actionContext);
    const claim = await beginStageBRecovery(actionRecoveryScope);
    if (claim.kind !== "claimed") {
      actionInFlight.current = null;
      setInFlight(null);
      setSubmittedFor(actionContext);
      setFeedback(claim.kind === "existing"
        ? "This prepared attempt already has a submitted transaction to reconcile. Creation remains blocked."
        : "This browser cannot safely retain a submitted transaction for recovery. Creation remains blocked.");
      return;
    }
    setSubmittedFor(actionContext);
    try {
      const claimId = claim.claimId;
      const actionController = controller.current;
      if (actionController === null) return;
      const bridge = createStageBBrowserProviderBridge({
        wallet: actionController.wallet,
        readCurrentWallet: () => stageBWalletContext(walletRef.current),
        sendTransaction: (request) => sendTransaction(request),
        onTransactionHash: async (hash) => {
          if (!await persistStageBRecovery(actionRecoveryScope, claimId, hash)) throw new Error("Unable to retain the submitted transaction for recovery.");
        },
        getTransactionReceipt: ({ hash }) => publicClient?.getTransactionReceipt({ hash }) ?? Promise.resolve(null),
        fetch,
        configuration,
      });
      const outcome = await bridge.execute();
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
      if (outcome.kind === "rejected") {
        await releaseStageBRecoveryReservation(actionRecoveryScope, claimId);
        setSubmittedFor(null);
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
    const actionRecoveryScope = recoveryScope(actionContext);
    const recoveryHash = currentRecovery?.hash;
    if (recoveryHash === undefined || actionRecoveryScope === null) return;
    actionInFlight.current = actionContext;
    setInFlight(actionContext);
    setRecovery({ context: actionContext, hash: recoveryHash, pending: true, persisted: currentRecovery?.persisted === true });
    const claim = await beginStageBRecovery(actionRecoveryScope);
    if (claim.kind === "unavailable") {
      actionInFlight.current = null;
      setInFlight(null);
      setRecovery({ context: actionContext, hash: recoveryHash, pending: false, persisted: currentRecovery?.persisted === true });
      setFeedback("This browser cannot safely retain transaction recovery evidence. Creation remains blocked.");
      return;
    }
    if (claim.kind === "existing") {
      const existingHash = readStageBRecovery(actionRecoveryScope);
      if (existingHash !== null && existingHash !== recoveryHash) {
        actionInFlight.current = null;
        setInFlight(null);
        setRecovery({ context: actionContext, hash: existingHash, pending: false, persisted: true });
        setSubmittedFor(actionContext);
        setFeedback("A different transaction is already retained for this prepared attempt. Creation remains blocked.");
        return;
      }
      if (existingHash === null) setFeedback("The retained submission has no transaction hash. Verifying the supplied public hash; creation remains blocked.");
    }
    try {
      const outcome = await controller.current.recover(recoveryHash);
      if (controllerContext.current !== actionContext || sessionChanged.current) return;
      if (outcome.kind === "candidate") {
        if (claim.kind === "claimed" && !await persistStageBRecovery(actionRecoveryScope, claim.claimId, recoveryHash)) {
          setRecovery({ context: actionContext, hash: recoveryHash, pending: false, persisted: false });
          setFeedback("The corroborated transaction could not be retained safely. Creation remains blocked.");
          return;
        }
        if (claim.kind === "existing") {
          const reconciliation = await reconcileStageBRecovery(actionRecoveryScope, recoveryHash);
          if (controllerContext.current !== actionContext || sessionChanged.current) return;
          if (reconciliation.kind === "conflict") {
            const existingHash = readStageBRecovery(actionRecoveryScope);
            setRecovery({ context: actionContext, hash: existingHash ?? recoveryHash, pending: false, persisted: existingHash !== null });
            setSubmittedFor(actionContext);
            setFeedback("A different transaction is already retained for this prepared attempt. Creation remains blocked.");
            return;
          }
          if (reconciliation.kind === "unavailable") {
            setRecovery({ context: actionContext, hash: recoveryHash, pending: false, persisted: false });
            setFeedback("The corroborated transaction could not be retained safely. Creation remains blocked.");
            return;
          }
        }
        setRecovery({ context: actionContext, hash: recoveryHash, pending: false, persisted: true });
        setSubmittedFor(actionContext);
        setTerminalOutcome(controllerContext.current);
        onCandidate(outcome.candidate);
        setFeedback("The public transaction was corroborated. Attach the candidate with the separate signature step.");
        return;
      }
      if (claim.kind === "claimed") await releaseStageBRecoveryReservation(actionRecoveryScope, claim.claimId);
      setRecovery({ context: actionContext, hash: recoveryHash, pending: false, persisted: currentRecovery?.persisted === true });
      setFeedback("The public transaction could not be corroborated. No MetaMask request or new transaction was made.");
    } catch {
      if (claim.kind === "claimed") await releaseStageBRecoveryReservation(actionRecoveryScope, claim.claimId);
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
        : recoveryStorageStatus === "unavailable" ? "Transaction recovery storage is unavailable or corrupt. Creation remains blocked."
          : recoveryStorageStatus === "existing" && currentRecovery?.persisted !== true ? "A retained submission has no transaction hash. Verify the original public hash; creation remains blocked."
            : sessionChanged.current ? "The wallet session changed. Reload before choosing any new action." : null)}</StatusRegion>
    </div>
  );
}
