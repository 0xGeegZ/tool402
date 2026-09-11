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
  onCandidate,
}: {
  index: number;
  session: { readonly provider: { request(input: { readonly method: string; readonly params?: readonly unknown[] }): Promise<unknown> }; readonly address: string } | null;
  stageTwoDone: boolean;
  candidate: AtsCreateCandidate | null;
  onCandidate: (candidate: AtsCreateCandidate) => void;
}) {
  const definition = providerDeployStages[index];
  if (!definition) return null;

  if ("substeps" in definition) {
    return (
      <ol className="space-y-3 border-l border-border pl-4 text-sm text-muted-foreground">
        {definition.substeps.map((substep, substepIndex) => (
          <li key={substep.label} className="space-y-1">
            <p className="font-medium text-foreground">{substepIndex + 1}. {substep.label}</p>
            {"returnsCandidate" in substep ? (
              <>
                {index === 2 && substepIndex === 0 ? <AtsCreateAction session={session} stageTwoDone={stageTwoDone} hasCandidate={candidate !== null} onCandidate={onCandidate} /> : null}
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
    <p className="font-mono text-xs text-muted-foreground">
      {definition.commandType}
      {"operationKind" in definition ? ` · ${definition.operationKind}` : ""}
    </p>
  );
}

function ConfigurationContext({ projection, stageIndex }: { projection?: AtsCreateConfigurationProjection; stageIndex: number }) {
  if (!projection || stageIndex !== 1) return null;

  return (
    <dl className="grid gap-2 rounded-field bg-muted/60 p-3 text-xs sm:grid-cols-2">
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
}: {
  states: readonly ProviderDeployStageState[];
  projection?: AtsCreateConfigurationProjection;
  enabledStage?: number;
  onActivate?: (index: number) => void;
  session?: { readonly provider: { request(input: { readonly method: string; readonly params?: readonly unknown[] }): Promise<unknown> }; readonly address: string } | null;
  candidate?: AtsCreateCandidate | null;
  onCandidate?: (candidate: AtsCreateCandidate) => void;
}) {
  const visibleStates = orderedStageStates(states);
  const stageTwoDone = visibleStates[1]?.kind === "done";
  const activeStage = enabledStage >= 0 ? visibleStates[enabledStage] : undefined;
  const activeDefinition = enabledStage >= 0 ? providerDeployStages[enabledStage] : undefined;
  const activeControl = activeStage?.kind === "actionable" && activeDefinition && onActivate
    ? providerDeployStageControl(enabledStage, activeStage, true)
    : null;
  const firstOpenStage = visibleStates.findIndex((stage) => stage.kind !== "done");
  const focusedStage = enabledStage >= 0 ? enabledStage : firstOpenStage >= 0 ? firstOpenStage : providerDeployStages.length - 1;
  const walletNeeded = (index: number, stage: ProviderDeployStageState) => session === null && index === 0 && stage.kind === "unavailable";
  const describe = (index: number, stage: ProviderDeployStageState) =>
    walletNeeded(index, stage) ? "Connect MetaMask above to request this signature." : stage.detail ?? stageStatusDescription[stage.kind];
  const focused = visibleStates[focusedStage] ?? { kind: "blocked" as const };

  return (
    <div data-ui="provider-deploy-stages" className="space-y-4">
      <p aria-live="polite" className="sr-only">
        {`Stage ${focusedStage + 1}, ${providerDeployStages[focusedStage].label}: ${describe(focusedStage, focused)}`}
      </p>
      <ol aria-label="Deployment stages" className="border-y border-border">
        {providerDeployStages.map((definition, index) => {
          const stage = visibleStates[index] ?? { kind: "blocked" as const };
          const control = providerDeployStageControl(index, stage, enabledStage === index);
          const controlDescriptionId = `provider-deploy-stage-${index + 1}-control-description`;
          const numeral = String(index + 1).padStart(2, "0");
          const showControl = session !== null && !(activeControl && index === enabledStage);
          const badge = (
            <Badge variant={stage.kind === "done" ? "default" : "outline"} className="w-fit shrink-0">
              {walletNeeded(index, stage) ? "Wallet needed" : stageStatusCopy[stage.kind]}
            </Badge>
          );
          if (index !== focusedStage) {
            return (
              <li key={definition.label} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
                <span aria-hidden="true" className="w-6 shrink-0 font-mono text-xs text-muted-foreground">{numeral}</span>
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{definition.label}</span>
                {badge}
              </li>
            );
          }
          return (
            <li key={definition.label} className="border-b border-border py-3 last:border-b-0">
              <Card className="shadow-none">
                <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-baseline gap-3">
                      <span aria-hidden="true" className="font-mono text-sm text-muted-foreground">{numeral}</span>
                      <span>{definition.label}</span>
                    </CardTitle>
                    <CardDescription>{describe(index, stage)}</CardDescription>
                  </div>
                  {badge}
                </CardHeader>
                <CardContent className="space-y-4">
                  <StageCommand index={index} session={session} stageTwoDone={stageTwoDone} candidate={candidate} onCandidate={onCandidate} />
                  <ConfigurationContext projection={projection} stageIndex={index} />
                  {showControl ? (
                    <>
                      <p id={controlDescriptionId} className="text-sm leading-6 text-muted-foreground">
                        {control.description}
                      </p>
                      <Button type="button" aria-describedby={controlDescriptionId} disabled={control.disabled} onClick={() => onActivate?.(index)} variant={control.disabled ? "outline" : "primary"} className="w-full sm:w-auto">
                        {control.label}
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
      {activeControl && activeDefinition ? (
        <div data-ui="provider-signature-handoff" className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-control border border-primary/30 bg-card p-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:pl-4">
          <p className="text-sm text-foreground">
            <span className="font-medium">Next: </span>
            <span className="font-mono text-xs text-muted-foreground">{String(enabledStage + 1).padStart(2, "0")}</span> {activeDefinition.label}
          </p>
          <Button type="button" onClick={() => onActivate?.(enabledStage)} className="w-full sm:w-auto">
            {activeControl.label}
          </Button>
        </div>
      ) : null}
      <p className="max-w-prose text-sm leading-6 text-muted-foreground">
        A declined signature leaves its stage ready to try again. Nothing was recorded, and this page never retries on its own.
      </p>
    </div>
  );
}
