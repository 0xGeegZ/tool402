"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  buildStageSignatureRequest,
  stageStateForSignatureResult,
  type CampaignReviewValues,
  type StageSignatureRequest,
} from "../../../lib/wallet/command-bridge.ts";
import { SignatureDialog, type SignatureResult } from "../../wallet/signature-dialog";
import { WalletIsland, type WalletSession } from "../../wallet/wallet-connect";
import { createStageBAtsCreateExecutionProjection } from "../../../lib/ats/stage-b-ats-create-execution-projection.ts";
import { loadProviderCampaignResume } from "../../../lib/provider-campaign-resume.ts";
import { atsCreateConfiguration } from "./ats-create-configuration";
import { directoryRecordLiteral, isDirectoryRecordComplete } from "./directory-record-literal";
import { Status, type StatusTone } from "../../ui/status";
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
}: {
  values: CampaignReviewValues;
  children: ReactNode;
}) {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [candidate, setCandidate] = useState<AtsCreateCandidate | null>(null);
  const candidateRef = useRef<AtsCreateCandidate | null>(null);
  const [results, setResults] = useState<readonly (ProviderDeployStageState | undefined)[]>([]);
  const [attemptPublicId, setAttemptPublicId] = useState<string | null>(null);
  const [request, setRequest] = useState<StageSignatureRequest | null>(null);
  const [constructionError, setConstructionError] = useState<string | null>(null);
  const [resumePending, setResumePending] = useState(false);
  const executionProjection = createStageBAtsCreateExecutionProjection();
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

  const doneCount = visibleStates.filter((stage) => stage.kind === "done").length;
  const has = (kind: ProviderDeployStageState["kind"]) => visibleStates.some((stage) => stage.kind === kind);
  const progressTone: StatusTone = doneCount === visibleStates.length
    ? "success"
    : has("rejected") || has("conflict") || has("unknown") || has("unsupported_type")
      ? "error"
      : has("replayed") ? "warning" : has("in_progress") ? "working" : "neutral";

  return (
    <div className="space-y-8">
      {children}
      <section aria-labelledby="deploy-stage-signing-title" data-ui="provider-deploy-signing" className="space-y-5">
        <div className="space-y-1">
          <h2 id="deploy-stage-signing-title" className="text-xl font-semibold tracking-tight">Sign the deployment stages</h2>
          <p className="max-w-prose text-sm leading-6 text-muted-foreground">
            {session === null
              ? "Connect MetaMask on Hedera Testnet to request the first signature. Nothing is recorded until the relay reports acceptance."
              : "Request each signature in order. Results live only in this browser session and reset on reload; a signature is not an authority, and a relayed ACCEPTED is not an on-chain fact."}
          </p>
          {session !== null && resumePending ? <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Checking the existing durable campaign before enabling any signature.</p> : null}
        </div>
        {constructionError ? <p role="status" aria-live="polite" className="rounded-field border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{constructionError}</p> : null}
        <Status tone={progressTone}>{doneCount} of {visibleStates.length} stages reported done in this session.</Status>
        <div data-ui="provider-review-wallet-context" className={session === null ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
          <WalletIsland approvedIssuerAddress={executionProjection.issuerEvmAddress} heading="Issuer wallet" className="space-y-3 rounded-card border border-border bg-card p-5 shadow-none">
            {(walletSession) => (
              <SessionReporter session={walletSession} onSession={setSession}>
                {null}
              </SessionReporter>
            )}
          </WalletIsland>
          <section className="rounded-card border border-border bg-card p-5 shadow-none">
            <h3 className="text-base font-semibold tracking-tight">What signing does</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A connected wallet only enables the next local signature request. It does not create, fund, or publish anything by itself.
            </p>
          </section>
        </div>
        {request && session ? <SignatureDialog provider={session.provider} request={request} onResult={finish} /> : null}
        <ProviderDeployStages states={visibleStates} projection={atsCreateConfiguration} enabledStage={enabledStage} onActivate={activate} session={session} candidate={candidate} onCandidate={receiveCandidate} />
      </section>
    </div>
  );
}
