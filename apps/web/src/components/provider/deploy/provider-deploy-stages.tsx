"use client";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { AtsCreateAction } from "./ats-create-action";
import {
  providerDeployStages,
  providerDeployStageControl,
  type AtsCreateCandidate,
  type AtsCreateConfigurationProjection,
  type ProviderDeployStageKind,
  type ProviderDeployStageState,
} from "./provider-deploy-state";

const stageCopy = [
  { description: "EIP-712 offering.create → server verifies → the draft offering is recorded.", label: "Sign to record the draft", done: "Draft recorded" },
  { description: "external.prepare(ATS_CREATE) is persisted before any wallet transaction.", label: "Sign to prepare the asset", done: "Asset prepared" },
  { description: "Bond.create via the ATS SDK in MetaMask, then attach the returned candidate.", label: "Sign to attach the candidate", done: "Candidate attached" },
  { description: "directory.publish activates version v1. The offering becomes OPEN.", label: "Sign to publish", done: "Published" },
] as const;

const offeringStates = [
  { label: "NOT STARTED", className: "bg-muted text-muted-foreground" },
  { label: "DRAFT", className: "bg-secondary text-secondary-foreground" },
  { label: "ASSET_PENDING", className: "bg-warning text-warning-foreground" },
  { label: "READY", className: "bg-success text-success-foreground" },
  { label: "OPEN", className: "bg-brand-green text-white" },
] as const;

const stageChipClassName: Record<ProviderDeployStageKind, string> = {
  blocked: "bg-muted text-muted-foreground",
  actionable: "bg-secondary text-secondary-foreground",
  in_progress: "bg-warning text-warning-foreground",
  done: "bg-success text-success-foreground",
  unavailable: "bg-warning text-warning-foreground",
  unsupported_type: "bg-destructive text-destructive-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  replayed: "bg-warning text-warning-foreground",
  conflict: "bg-destructive text-destructive-foreground",
  unknown: "bg-destructive text-destructive-foreground",
};

const stageStatusCopy: Record<ProviderDeployStageKind, string> = {
  blocked: "Blocked",
  actionable: "Needs signature",
  in_progress: "Awaiting signature",
  done: "Done",
  unavailable: "Stage B · human",
  unsupported_type: "Unsupported type",
  rejected: "Rejected",
  replayed: "Replayed",
  conflict: "Conflict",
  unknown: "Outcome unknown",
};

const stageStatusDescription: Record<ProviderDeployStageKind, string> = {
  blocked: "Finish the preceding stage before this one becomes available.",
  actionable: "This stage is ready for one signature request from the connected wallet.",
  in_progress: "This local preview does not infer a signature result.",
  done: "This browser session received a reported result. Reloading restores the local starting state.",
  unavailable: "A required local projection or separately carded human step is not available here.",
  unsupported_type: "The server did not enable this command type.",
  rejected: "The server gave no reason. Possible authority or validation causes are not asserted here.",
  replayed: "This command was already claimed and was not repeated.",
  conflict: "The existing idempotent operation does not match this request.",
  unknown: "The outcome may already be recorded. Do not retry automatically.",
};

function StageIcon() {
  return (
    <span data-ui="provider-deploy-stage-icon" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
        <path d="m4 12 8 4.5 8-4.5" />
        <path d="m4 16.5 8 4.5 8-4.5" />
      </svg>
    </span>
  );
}

function orderedStageStates(states: readonly ProviderDeployStageState[]): readonly ProviderDeployStageState[] {
  return states.map((stage, index) => {
    if (stage.kind === "unavailable" || index === 0) return stage;
    const predecessor = states[index - 1];
    return predecessor?.kind === "done" ? stage : { kind: "blocked" };
  });
}

function StageCommand({
  index,
  session,
  stageTwoDone,
  candidate,
  atsConfiguration,
  selectedTool,
  selectedToolPublicId,
  onCandidate,
}: {
  index: number;
  session: { readonly provider: { request(input: { readonly method: string; readonly params?: readonly unknown[] }): Promise<unknown> }; readonly address: string } | null;
  stageTwoDone: boolean;
  candidate: AtsCreateCandidate | null;
  atsConfiguration?: unknown;
  selectedTool: boolean;
  selectedToolPublicId?: string;
  onCandidate: (candidate: AtsCreateCandidate) => void;
}) {
  const definition = providerDeployStages[index];
  if (!definition) return null;

  if ("substeps" in definition) {
    return (
      <ol className="flex flex-col gap-2 text-[13px] leading-5 text-muted-foreground">
        {definition.substeps.map((substep, substepIndex) => (
          <li key={substep.label} className="space-y-1">
            <p className="font-medium text-foreground">{substepIndex + 1}. {substep.label}</p>
            {"returnsCandidate" in substep ? (
              <>
                {index === 2 && substepIndex === 0 ? <AtsCreateAction session={session} configuration={atsConfiguration} selectedTool={selectedTool} selectedToolPublicId={selectedToolPublicId} stageTwoDone={stageTwoDone} hasCandidate={candidate !== null} onCandidate={onCandidate} /> : null}
                <p>The separately carded human action returns the candidate details required by the next sub-step.</p>
              </>
            ) : (
              <p>
                A later command bridge would bind the returned candidate&apos;s <code className="font-mono text-xs">transactionId</code> and <code className="font-mono text-xs">evmAddress</code> after it is separately accepted.
              </p>
            )}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <span className="font-mono text-xs text-muted-foreground">
      {definition.commandType}
      {"operationKind" in definition ? ` · ${definition.operationKind}` : ""}
    </span>
  );
}

function ConfigurationContext({ projection, stageIndex }: { projection?: AtsCreateConfigurationProjection; stageIndex: number }) {
  if (!projection || stageIndex !== 1) return null;

  return (
    <dl className="grid gap-2 rounded-control bg-muted px-3 py-2.5 text-xs sm:grid-cols-2">
      <div className="space-y-1">
        <dt className="text-muted-foreground">Factory identifier</dt>
        <dd className="font-mono text-foreground">{projection.factoryHederaId}</dd>
      </div>
      <div className="space-y-1">
        <dt className="text-muted-foreground">Resolver identifier</dt>
        <dd className="font-mono text-foreground">{projection.resolverHederaId}</dd>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <dt className="text-muted-foreground">Expected target</dt>
        <dd className="break-all font-mono text-foreground">{projection.expectedTarget}</dd>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <dt className="text-muted-foreground">Canonical parameters hash</dt>
        <dd className="break-all font-mono text-foreground">{projection.canonicalParametersHash}</dd>
      </div>
    </dl>
  );
}

export function ProviderDeployStages({
  states,
  projection,
  enabledStage = -1,
  onActivate,
  session = null,
  candidate = null,
  onCandidate = () => {},
  atsConfiguration,
  selectedTool,
  selectedToolPublicId,
}: {
  states: readonly ProviderDeployStageState[];
  projection?: AtsCreateConfigurationProjection;
  enabledStage?: number;
  onActivate?: (index: number) => void;
  session?: { readonly provider: { request(input: { readonly method: string; readonly params?: readonly unknown[] }): Promise<unknown> }; readonly address: string } | null;
  candidate?: AtsCreateCandidate | null;
  onCandidate?: (candidate: AtsCreateCandidate) => void;
  atsConfiguration?: unknown;
  selectedTool: boolean;
  selectedToolPublicId?: string;
}) {
  const visibleStates = orderedStageStates(states);
  const stageTwoDone = visibleStates[1]?.kind === "done";
  const activeStage = enabledStage >= 0 ? visibleStates[enabledStage] : undefined;
  const activeDefinition = enabledStage >= 0 ? providerDeployStages[enabledStage] : undefined;
  const activeControl = activeStage?.kind === "actionable" && activeDefinition && onActivate
    ? providerDeployStageControl(enabledStage, activeStage, true)
    : null;
  const firstOpenStage = visibleStates.findIndex((stage) => stage.kind !== "done");
  const doneCount = firstOpenStage >= 0 ? firstOpenStage : providerDeployStages.length;
  const focusedStage = enabledStage >= 0 ? enabledStage : Math.min(doneCount, providerDeployStages.length - 1);
  const focused = visibleStates[focusedStage] ?? { kind: "blocked" as const };
  const offering = offeringStates[doneCount] ?? offeringStates[0];
  const walletNeeded = (index: number, stage: ProviderDeployStageState) => session === null && index === 0 && stage.kind === "unavailable";
  const describe = (index: number, stage: ProviderDeployStageState) =>
    walletNeeded(index, stage) ? "Connect MetaMask to request this signature." : stage.detail ?? stageStatusDescription[stage.kind];

  return (
    <Card data-ui="provider-deploy-stages" className="rounded-control border border-primary/10 bg-card shadow-none">
      <p aria-live="polite" className="sr-only">
        {`Stage ${focusedStage + 1}, ${providerDeployStages[focusedStage].label}: ${describe(focusedStage, focused)}`}
      </p>
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <StageIcon />
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-semibold sm:text-lg">Deployment stages</CardTitle>
          <CardDescription className="hidden text-[13px] leading-5 sm:block">Persist before sign. A wallet callback is never success; each stage closes only on a verified record.</CardDescription>
          </div>
        </div>
        <Badge className={`shrink-0 font-mono ${offering.className}`}>{offering.label}</Badge>
      </CardHeader>
      <ol data-ui="provider-deploy-stage-rail" className="border-t border-primary/10">
        {providerDeployStages.map((definition, index) => {
          const stage = visibleStates[index] ?? { kind: "blocked" as const };
          const control = providerDeployStageControl(index, stage, enabledStage === index);
          const controlDescriptionId = `provider-deploy-stage-${index + 1}-control-description`;
          const copy = stageCopy[index] ?? stageCopy[0];
          const done = stage.kind === "done";
          const isHandoff = activeControl !== null && index === enabledStage;
          const chipLabel = walletNeeded(index, stage) ? "Wallet needed" : stage.kind === "unavailable" && stage.detail ? "Unavailable" : stageStatusCopy[stage.kind];
          const showControl = index !== 2 || stage.kind !== "unavailable";
          const detail = stage.detail ?? (stage.kind === "done" || stage.kind === "blocked" || stage.kind === "actionable" || stage.kind === "unavailable" ? undefined : stageStatusDescription[stage.kind]);
          return (
            <li key={definition.label} className="relative grid grid-cols-[28px_minmax(0,1fr)] items-start gap-x-2.5 gap-y-2.5 border-t border-primary/10 px-4 py-3.5 first:border-t-0 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 sm:py-4">
              <span aria-hidden="true" className={`relative flex size-7 items-center justify-center rounded-full text-xs font-semibold sm:size-8 sm:text-[13px] ${index < providerDeployStages.length - 1 ? "after:absolute after:left-1/2 after:top-full after:h-[calc(100%+1rem)] after:w-px after:-translate-x-1/2 after:bg-primary/15" : ""} ${done ? "bg-success text-success-foreground ring-4 ring-success/10" : "border border-primary/20 bg-primary/5 text-primary"}`}>{index + 1}</span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{definition.label}</span>
                  <Badge className={stageChipClassName[stage.kind]}>{chipLabel}</Badge>
                </div>
                <span className="text-[13px] leading-5 text-muted-foreground">{copy.description}</span>
                <StageCommand index={index} session={session} stageTwoDone={stageTwoDone} candidate={candidate} atsConfiguration={atsConfiguration} selectedTool={selectedTool} selectedToolPublicId={selectedToolPublicId} onCandidate={onCandidate} />
                {detail ? <span className="break-all font-mono text-xs text-foreground">{detail}</span> : null}
                <p id={controlDescriptionId} className="sr-only">{describe(index, stage)} {control.description}</p>
              </div>
              {showControl ? (
                <div data-ui={isHandoff ? "provider-signature-handoff" : undefined} className="col-span-2 flex flex-col gap-1.5 sm:col-span-1 sm:items-end">
                  <Button type="button" size="sm" aria-describedby={controlDescriptionId} disabled={control.disabled} onClick={() => onActivate?.(index)} variant={done ? "outline" : "primary"} className="w-full sm:w-auto">
                    {done ? copy.done : copy.label}
                    {control.disabled ? <span className="sr-only"> ({control.label})</span> : null}
                  </Button>
                </div>
              ) : null}
              {projection && index === 1 ? (
                <div className="col-span-2 sm:col-start-2 sm:col-span-2">
                  <ConfigurationContext projection={projection} stageIndex={index} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="border-t border-primary/10 px-4 py-3 text-[13px] leading-5 text-muted-foreground sm:px-5">
        A declined signature leaves its stage ready to try again. Nothing was recorded, and this page never retries on its own.
      </p>
    </Card>
  );
}
