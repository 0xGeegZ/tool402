"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  buildStageSignatureRequest,
  stageStateForSignatureResult,
  type CampaignReviewValues,
  type StageSignatureRequest,
} from "../../../lib/wallet/command-bridge.ts";
import { SignatureDialog, type SignatureResult } from "../../wallet/signature-dialog";
import { loadProviderCampaignResume } from "../../../lib/provider-campaign-resume.ts";
import { useWalletSession, type WalletSession } from "../../wallet/wallet-session";
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
  children,
  footer,
  reviewing = true,
}: {
  values: CampaignReviewValues;
  children: ReactNode;
  footer?: ReactNode;
  reviewing?: boolean;
}) {
  const wallet = useWalletSession();
  const walletSession: WalletSession | null =
    wallet.state.kind === "connected" && wallet.provider !== null
      ? { provider: wallet.provider, address: wallet.state.address }
      : null;
  const [session, setSession] = useState<WalletSession | null>(null);
  const [candidate, setCandidate] = useState<AtsCreateCandidate | null>(null);
  const candidateRef = useRef<AtsCreateCandidate | null>(null);
  const [results, setResults] = useState<readonly (ProviderDeployStageState | undefined)[]>([]);
  const [attemptPublicId, setAttemptPublicId] = useState<string | null>(null);
  const [request, setRequest] = useState<StageSignatureRequest | null>(null);
  const [constructionError, setConstructionError] = useState<string | null>(null);
  const [resumePending, setResumePending] = useState(false);
  const states = providerDeployStageStates(atsCreateConfiguration, {
    connected: session !== null,
    results,
    candidate,
    recordComplete: isDirectoryRecordComplete(directoryRecordLiteral),
  });
  const visibleStates = request
    ? states.map((stage, index) => (index === request.stage ? { kind: "in_progress" as const } : stage))
    : states;
  const enabledStage = session !== null && request === null && !resumePending
    ? states.findIndex((stage) => stage.kind === "actionable")
    : -1;

  useEffect(() => {
    let cancelled = false;
    if (session === null) {
      setResults([]);
      setAttemptPublicId(null);
      setCandidate(null);
      candidateRef.current = null;
      setResumePending(false);
      return () => { cancelled = true; };
    }
    setResults([]);
    setAttemptPublicId(null);
    setCandidate(null);
    candidateRef.current = null;
    setResumePending(true);
    void loadProviderCampaignResume(session.address).then((resume) => {
      if (cancelled) return;
      if (resume !== null) {
        setResults([
          { kind: "done", detail: "Recovered from the durable offering record." },
          { kind: "done", detail: "Recovered from the durable prepared attempt." },
        ]);
        setAttemptPublicId(resume.attemptPublicId);
      }
      setResumePending(false);
    });
    return () => { cancelled = true; };
  }, [session?.address]);

  function activate(stage: number) {
    if (request !== null || stage !== enabledStage) return;
    try {
      const nextRequest = buildStageSignatureRequest({
        stage,
        states,
        values,
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

  function receiveCandidate(nextCandidate: AtsCreateCandidate) {
    if (candidateRef.current !== null) return;
    candidateRef.current = nextCandidate;
    setCandidate(nextCandidate);
  }

  return (
    <div className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <aside data-ui="provider-review-wallet-context" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
        <WhatSigningDoes />
      </aside>
      <div data-ui="provider-deploy-signing" className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
        {walletSession !== null ? (
          <SessionReporter session={walletSession} onSession={setSession}>
            {null}
          </SessionReporter>
        ) : null}
        {children}
        {session !== null && resumePending ? <p role="status" aria-live="polite" className="text-[13px] leading-5 text-muted-foreground">Checking the existing durable campaign before enabling any signature.</p> : null}
        {reviewing && constructionError ? <p role="status" aria-live="polite" className="rounded-control border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{constructionError}</p> : null}
        {reviewing ? <ProviderDeployStages states={visibleStates} projection={atsCreateConfiguration} enabledStage={enabledStage} onActivate={activate} session={session} candidate={candidate} onCandidate={receiveCandidate} /> : null}
        {reviewing && request && session ? <SignatureDialog provider={session.provider} request={request} onResult={finish} onCancel={() => finish({ phase: "rejected", outcome: null })} /> : null}
        {footer}
      </div>
    </div>
  );
}

export function WhatSigningDoes() {
  return (
    <section aria-labelledby="what-signing-does-title" className="flex flex-col gap-2 rounded-control border border-border bg-card p-4 shadow-none sm:p-5">
      <h2 id="what-signing-does-title" className="text-sm font-semibold">What signing does</h2>
      <p className="text-[13px] leading-5 text-muted-foreground">
        Every signature is an EIP-712 Tool402Command bound to chain 296, your address, a single-use nonce, an expiry, and the exact payload shown. The server verifies before anything is stored.
      </p>
      <p className="text-[13px] leading-5 text-muted-foreground">
        Creating the note is a separate MetaMask transaction paid in testnet HBAR. Nothing is submitted until the prepared record exists. Results live only in this browser session and reset on reload; a signature is not an authority, and a relayed ACCEPTED is not an on-chain fact.
      </p>
    </section>
  );
}
