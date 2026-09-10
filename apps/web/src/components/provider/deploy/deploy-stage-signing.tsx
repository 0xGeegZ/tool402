"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  buildStageSignatureRequest,
  stageStateForSignatureResult,
  type CampaignReviewValues,
  type StageSignatureRequest,
} from "../../../lib/wallet/command-bridge.ts";
import { SignatureDialog, type SignatureResult } from "../../wallet/signature-dialog";
import { WalletIsland, type WalletSession } from "../../wallet/wallet-connect";
import { atsCreateConfiguration } from "./ats-create-configuration";
import { directoryRecordLiteral, isDirectoryRecordComplete } from "./directory-record-literal";
import { ProviderDeployStages } from "./provider-deploy-stages";
import {
  providerDeployStageStates,
  type AtsCreateCandidate,
  type ProviderDeployStageState,
} from "./provider-deploy-state";

const finalPhases: ReadonlySet<SignatureResult["phase"]> = new Set(["complete", "rejected", "failed", "unknown"]);

function SessionReporter({
  session,
  onSession,
  children,
}: {
  session: WalletSession;
  onSession: (session: WalletSession | null) => void;
  children: ReactNode;
}) {
  const { provider, address } = session;
  useEffect(() => {
    onSession({ provider, address });
    return () => onSession(null);
  }, [provider, address, onSession]);
  return <>{children}</>;
}

export function DeployStageSigning({
  values,
  candidate = null,
}: {
  values: CampaignReviewValues;
  candidate?: AtsCreateCandidate | null;
}) {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [results, setResults] = useState<readonly (ProviderDeployStageState | undefined)[]>([]);
  const [attemptPublicId, setAttemptPublicId] = useState<string | null>(null);
  const [request, setRequest] = useState<StageSignatureRequest | null>(null);
  const [constructionError, setConstructionError] = useState<string | null>(null);
  const states = providerDeployStageStates(atsCreateConfiguration, {
    connected: session !== null,
    results,
    candidate,
    recordComplete: isDirectoryRecordComplete(directoryRecordLiteral),
  });
  const visibleStates = request
    ? states.map((stage, index) => (index === request.stage ? { kind: "in_progress" as const } : stage))
    : states;
  const enabledStage = session !== null && request === null
    ? states.findIndex((stage) => stage.kind === "actionable")
    : -1;

  function activate(stage: number) {
    if (request !== null || stage !== enabledStage) return;
    try {
      const nextRequest = buildStageSignatureRequest({
        stage,
        states,
        values,
        projection: atsCreateConfiguration,
        attemptPublicId,
        candidate,
        record: directoryRecordLiteral,
        nowMilliseconds: Date.now(),
      });
      setConstructionError(null);
      setRequest(nextRequest);
    } catch {
      setConstructionError("Check the offering details and correct them before requesting a signature.");
    }
  }

  function finish(result: SignatureResult) {
    if (request === null || !finalPhases.has(result.phase)) return;
    const stageState = stageStateForSignatureResult(result);
    setResults((previous) => {
      const next = [...previous];
      next[request.stage] = stageState;
      return next;
    });
    if (request.stage === 1 && stageState.kind === "done") setAttemptPublicId(request.idempotencyKey);
    setRequest(null);
  }

  return (
    <div className="space-y-8">
      <ProviderDeployStages states={visibleStates} projection={atsCreateConfiguration} enabledStage={enabledStage} onActivate={activate} />
      {constructionError ? <p role="status" aria-live="polite" className="rounded-[calc(var(--radius)*0.75)] border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{constructionError}</p> : null}
      <section aria-labelledby="deploy-stage-signing-title" className="space-y-4 rounded-[calc(var(--radius)*0.75)] border bg-muted/30 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Session-only signing</p>
          <h2 id="deploy-stage-signing-title" className="text-lg font-semibold">Sign the deployment stages</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Connect MetaMask on Hedera Testnet to enable the first stage that needs a signature. Stage results live only in this browser session and return to their resting state on reload. A connected wallet is not an authority, a signature is not an accepted command, and a relayed ACCEPTED is a backend admission and not an on-chain fact.
          </p>
        </div>
        <WalletIsland>
          {(walletSession) => (
            <SessionReporter session={walletSession} onSession={setSession}>
              {request ? <SignatureDialog provider={walletSession.provider} request={request} onResult={finish} /> : null}
            </SessionReporter>
          )}
        </WalletIsland>
      </section>
    </div>
  );
}
