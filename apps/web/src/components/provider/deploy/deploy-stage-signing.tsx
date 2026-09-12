"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  buildStageSignatureRequest,
  providerDeploymentTarget,
  stageStateForSignatureResult,
  type CampaignReviewValues,
  type StageSignatureRequest,
} from "../../../lib/wallet/command-bridge.ts";
import { SignatureDialog, type SignatureResult } from "../../wallet/signature-dialog";
import { loadProviderCampaignResume } from "../../../lib/provider-campaign-resume.ts";
import { loadProviderDirectoryConfiguration } from "../../../lib/provider-directory-configuration-client.ts";
import { loadProviderToolDeployment, type ProviderToolDurableValues } from "../../../lib/provider-tool-deployment-client.ts";
import type { ProviderToolAtsStageProjection } from "../../../lib/ats/provider-tool-ats-projection.ts";
import { connectedWalletSession, useWalletSession, type WalletSession } from "../../wallet/wallet-session";
import { Button } from "../../ui/button";
import { atsCreateConfiguration } from "./ats-create-configuration";
import {
  completeDirectoryRecordLiteral,
  directoryRecordForProviderTool,
  directoryRecordLiteral,
  isDirectoryRecordComplete,
  type DirectoryRecordLiteral,
} from "./directory-record-literal";
import { ProviderGlyph } from "./provider-icon";
import { ProviderDeployStages } from "./provider-deploy-stages";
import {
  providerDeployStageStates,
  type AtsCreateCandidate,
  type ProviderDeployStageState,
} from "./provider-deploy-state";

const finalPhases: ReadonlySet<SignatureResult["phase"]> = new Set(["complete", "rejected", "failed", "unknown"]);
const notConfiguredDetail = "The local relay declined before forwarding. Nothing left this host and nothing was recorded.";
type SigningContext = Readonly<{ selectedToolPublicId: string | undefined; address: string | undefined }>;

function isSameSigningContext(left: SigningContext, right: SigningContext): boolean {
  return left.selectedToolPublicId === right.selectedToolPublicId && left.address === right.address;
}

export function DeployStageSigning({
  values,
  selectedToolPublicId,
  children,
  footer,
  reviewing = true,
  renderReview,
  onResume,
  onRecoveredDurableValues,
  onRecoveredToolTitle,
}: {
  values: CampaignReviewValues;
  selectedToolPublicId?: string;
  children?: ReactNode;
  footer?: ReactNode;
  reviewing?: boolean;
  onResume?: () => void;
  renderReview?: (layout: {
    connect: ReactNode;
    resumeNotice: ReactNode;
    constructionNotice: ReactNode;
    stages: ReactNode;
    dialog: ReactNode;
    footer: ReactNode;
  }) => ReactNode;
  onRecoveredDurableValues?: (values: ProviderToolDurableValues) => void;
  onRecoveredToolTitle?: (title: string) => void;
}) {
  const wallet = useWalletSession();
  const session: WalletSession | null = connectedWalletSession(wallet);
  const [candidate, setCandidate] = useState<AtsCreateCandidate | null>(null);
  const [results, setResults] = useState<readonly (ProviderDeployStageState | undefined)[]>([]);
  const [directoryRecord, setDirectoryRecord] = useState<DirectoryRecordLiteral>(directoryRecordLiteral);
  const [attemptPublicId, setAttemptPublicId] = useState<string | null>(null);
  const [request, setRequest] = useState<StageSignatureRequest | null>(null);
  const [constructionError, setConstructionError] = useState<string | null>(null);
  const [resumePending, setResumePending] = useState(false);
  const [selectedAts, setSelectedAts] = useState<ProviderToolAtsStageProjection | null>(null);
  const [selectedRefresh, setSelectedRefresh] = useState(0);
  const currentSigningContext = useRef<SigningContext>({ selectedToolPublicId, address: session?.address });
  const activeRequestContext = useRef<SigningContext | null>(null);
  currentSigningContext.current = { selectedToolPublicId, address: session?.address };
  const deploymentTarget = providerDeploymentTarget(selectedToolPublicId);
  const projection = selectedToolPublicId === undefined ? atsCreateConfiguration : selectedAts?.display;
  const initialDirectoryRecord = useMemo(
    () => directoryRecordForProviderTool(selectedToolPublicId),
    [selectedToolPublicId],
  );
  const states = providerDeployStageStates(projection, {
    connected: session !== null,
    results,
    candidate,
    recordComplete: isDirectoryRecordComplete(directoryRecord),
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
      activeRequestContext.current = null;
      setRequest(null);
      setResults([]);
      setAttemptPublicId(null);
      setCandidate(null);
      setDirectoryRecord(initialDirectoryRecord);
      setResumePending(false);
      setSelectedAts(null);
      return () => { cancelled = true; };
    }
    activeRequestContext.current = null;
    setRequest(null);
    setResults([]);
    setAttemptPublicId(null);
    setCandidate(null);
    setDirectoryRecord(initialDirectoryRecord);
    setResumePending(true);
    setSelectedAts(null);
    if (selectedToolPublicId === undefined) {
      void loadProviderCampaignResume(session.address).then((resume) => {
        if (cancelled) return;
        if (resume !== null) {
          const recovered: ProviderDeployStageState[] = [
            { kind: "done", detail: "Recovered from the durable offering record." },
            { kind: "done", detail: "Recovered from the durable prepared attempt." },
          ];
          if (resume.kind === "READY") {
            recovered.push({ kind: "done", detail: "Recovered from the durable candidate attachment." });
          }
          setResults(recovered);
          if (resume.kind === "ASSET_PENDING") setAttemptPublicId(resume.attemptPublicId);
          onResume?.();
        }
        setResumePending(false);
      });
    } else {
      setResumePending(false);
    }
    void loadProviderDirectoryConfiguration().then((directoryConfiguration) => {
      if (cancelled || directoryConfiguration === null) return;
      setDirectoryRecord(completeDirectoryRecordLiteral(initialDirectoryRecord, directoryConfiguration));
    });
    if (selectedToolPublicId !== undefined) {
      void loadProviderToolDeployment(selectedToolPublicId).then((deployment) => {
        if (cancelled || deployment === null) return;
        setSelectedAts(deployment.ats);
        onRecoveredToolTitle?.(deployment.title);
        if (deployment.durableValues !== null) onRecoveredDurableValues?.(deployment.durableValues);
        if (deployment.state === "DRAFT") {
          setResults([{ kind: "done", detail: "Recovered from this tool's durable offering record." }]);
          onResume?.();
        } else if (deployment.state === "ASSET_PENDING" && deployment.atsAttemptPublicId !== null) {
          const recovered: ProviderDeployStageState[] = [
            { kind: "done", detail: "Recovered from this tool's durable offering record." },
            { kind: "done", detail: "Recovered from this tool's durable prepared attempt." },
          ];
          if (deployment.atsCandidate !== null) {
            recovered.push({
              kind: "actionable",
              detail: "Recheck the attached receipt. This sends no wallet transaction; directory publication stays blocked until durable corroboration.",
            });
          }
          setResults(recovered);
          setAttemptPublicId(deployment.atsAttemptPublicId);
          setCandidate(deployment.atsCandidate);
          onResume?.();
        } else if (deployment.state === "READY") {
          setResults([
            { kind: "done", detail: "Recovered from this tool's durable offering record." },
            { kind: "done", detail: "Recovered from this tool's durable prepared attempt." },
            { kind: "done", detail: "Recovered from this tool's corroborated receipt." },
          ]);
          onResume?.();
        } else if (deployment.state === "OPEN") {
          setResults([{ kind: "done" }, { kind: "done" }, { kind: "done" }, { kind: "done", detail: "This tool is already published." }]);
          onResume?.();
        }
      });
    }
    return () => { cancelled = true; };
  }, [session?.address, onResume, onRecoveredDurableValues, onRecoveredToolTitle, initialDirectoryRecord, selectedToolPublicId, selectedRefresh]);

  function activate(stage: number) {
    if (request !== null || stage !== enabledStage) return;
    try {
      const nextRequest = buildStageSignatureRequest({
        stage,
        states,
        values,
        attemptPublicId,
        candidate,
        record: directoryRecord,
        nowMilliseconds: Date.now(),
        deploymentTarget,
        atsCreateCommand: selectedAts?.command,
      });
      setConstructionError(null);
      activeRequestContext.current = currentSigningContext.current;
      setRequest(nextRequest);
    } catch {
      setConstructionError("Check the offering details and correct them before requesting a signature.");
    }
  }

  function finish(result: SignatureResult) {
    if (request === null || !finalPhases.has(result.phase) || activeRequestContext.current === null
      || !isSameSigningContext(activeRequestContext.current, currentSigningContext.current)) return;
    const stageState = result.outcome === "not_configured"
      ? { kind: "unavailable" as const, detail: notConfiguredDetail }
      : stageStateForSignatureResult(result);
    const selectedAttachmentAwaitingCorroboration = request.stage === 2
      && selectedToolPublicId !== undefined
      && (stageState.kind === "done" || stageState.kind === "replayed");
    setResults((previous) => {
      const next = [...previous];
      next[request.stage] = selectedAttachmentAwaitingCorroboration
        ? {
          kind: "actionable",
          detail: "Recheck the attached receipt. This sends no wallet transaction; directory publication stays blocked until durable corroboration.",
        }
        : stageState;
      return next;
    });
    if (request.stage === 1 && stageState.kind === "done") setAttemptPublicId(request.idempotencyKey);
    if (request.stage === 0 && stageState.kind === "done" && selectedToolPublicId !== undefined) {
      setSelectedRefresh((current) => current + 1);
    }
    if (selectedAttachmentAwaitingCorroboration) {
      setSelectedRefresh((current) => current + 1);
    }
    activeRequestContext.current = null;
    setRequest(null);
  }

  function receiveCandidate(nextCandidate: AtsCreateCandidate) {
    setCandidate((current) => current ?? nextCandidate);
  }

  const canRetryConnection = wallet.state.kind === "no_provider" || wallet.state.kind === "multiple_providers";
  const connect = wallet.state.kind === "disconnected" || canRetryConnection ? (
    <section data-ui="provider-deploy-connect" aria-labelledby="provider-deploy-connect-title" className="h-full rounded-card border border-primary/15 bg-primary/[0.03] p-5 shadow-none sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ProviderGlyph kind="wallet" size="20" />
        </span>
        <div>
          <h2 id="provider-deploy-connect-title" className="text-lg font-bold tracking-tight">Connect MetaMask</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Connect MetaMask on Hedera Testnet to enable the first signing step.</p>
        </div>
      </div>
      <Button size="lg" shape="pill" className="mt-5 w-full sm:w-auto" onClick={() => { void wallet.connect(); }}>{canRetryConnection ? "Retry" : "Connect MetaMask"}</Button>
    </section>
  ) : null;
  const resumeNotice = session !== null && resumePending ? <p role="status" aria-live="polite" className="text-[13px] leading-5 text-muted-foreground">Checking the existing durable campaign before enabling any signature.</p> : null;
  const constructionNotice = selectedToolPublicId !== undefined
    ? <p role="status" aria-live="polite" className="rounded-control border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">This tool has its own offering and directory identity. {selectedAts === null ? "ATS creation stays unavailable until its server-derived configuration is admitted." : "Its ATS configuration was derived from the admitted offering."}</p>
    : reviewing && constructionError ? <p role="status" aria-live="polite" className="rounded-control border border-warning bg-warning px-3 py-2 text-sm text-warning-foreground">{constructionError}</p> : null;
  const stages = reviewing ? <ProviderDeployStages states={visibleStates} projection={projection} enabledStage={enabledStage} onActivate={activate} session={session} candidate={candidate} onCandidate={receiveCandidate} atsConfiguration={selectedAts?.configuration} selectedTool={selectedToolPublicId !== undefined} selectedToolPublicId={selectedToolPublicId} /> : null;
  const dialog = reviewing && request && session ? <SignatureDialog provider={session.provider} request={request} onResult={finish} onCancel={() => finish({ phase: "rejected", outcome: null })} /> : null;

  if (renderReview) {
    return renderReview({ connect, resumeNotice, constructionNotice, stages, dialog, footer });
  }

  return (
    <div className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <aside data-ui="provider-review-wallet-context" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
        <WhatSigningDoes />
      </aside>
      <div data-ui="provider-deploy-signing" className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
        {children}
        {connect}
        {resumeNotice}
        {constructionNotice}
        {stages}
        {dialog}
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
