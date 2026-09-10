"use client";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { AtsCreateAction } from "./ats-create-action";
import {
  providerDeployStages,
  providerDeployStageControl,
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

function StageCommand({ index }: { index: number }) {
  const definition = providerDeployStages[index];
  if (!definition) return null;

  if ("substeps" in definition) {
    return (
      <ol className="space-y-3 border-l border-border pl-4 text-sm text-muted-foreground">
        {definition.substeps.map((substep, substepIndex) => (
          <li key={substep.label} className="space-y-1">
            <p className="font-medium text-foreground">{substepIndex + 1}. {substep.label}</p>
            {index === 2 && substepIndex === 0 && "returnsCandidate" in substep ? (
              <>
                <AtsCreateAction />
                <p>The separately carded human action returns the candidate details required by the next sub-step.</p>
              </>
            ) : "returnsCandidate" in substep ? (
              <p>The separately carded human action returns the candidate details required by the next sub-step.</p>
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
    <dl className="grid gap-2 rounded-[calc(var(--radius)*0.75)] bg-muted/60 p-3 text-xs sm:grid-cols-2">
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
}: {
  states: readonly ProviderDeployStageState[];
  projection?: AtsCreateConfigurationProjection;
  enabledStage?: number;
  onActivate?: (index: number) => void;
}) {
  const visibleStates = orderedStageStates(states);

  return (
    <section aria-labelledby="provider-deploy-stages" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Local workflow</p>
          <h2 id="provider-deploy-stages" className="text-2xl font-semibold tracking-tight">Deployment stages</h2>
        </div>
        <Badge variant="outline" className="w-fit">Session-only status</Badge>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        This is a review map, not a live status feed. The separately carded provider status route is authoritative.
      </p>
      <ol className="grid gap-3">
        {providerDeployStages.map((definition, index) => {
          const stage = visibleStates[index] ?? { kind: "blocked" as const };
          const control = providerDeployStageControl(index, stage, enabledStage === index);
          const controlDescriptionId = `provider-deploy-stage-${index + 1}-control-description`;
          return (
            <li key={definition.label}>
              <Card className="overflow-hidden">
                <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Stage {index + 1} of 4</p>
                    <CardTitle>{definition.label}</CardTitle>
                    <CardDescription>{stageStatusDescription[stage.kind]}</CardDescription>
                  </div>
                  <Badge variant={stage.kind === "done" ? "default" : "outline"} className="w-fit shrink-0">
                    {stageStatusCopy[stage.kind]}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StageCommand index={index} />
                  <ConfigurationContext projection={projection} stageIndex={index} />
                  <p aria-live="polite" className="text-sm text-muted-foreground">
                    {stage.detail ?? stageStatusDescription[stage.kind]}
                  </p>
                  <p id={controlDescriptionId} className="text-sm leading-6 text-muted-foreground">
                    {control.description}
                  </p>
                  <Button type="button" aria-describedby={controlDescriptionId} disabled={control.disabled} onClick={() => onActivate?.(index)} variant={control.disabled ? "outline" : "primary"} className="w-full sm:w-auto">
                    {control.label}
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
      <p className="border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground">
        A declined signature leaves its stage ready to try again: Nothing was recorded. This page never retries on its own.
      </p>
    </section>
  );
}
