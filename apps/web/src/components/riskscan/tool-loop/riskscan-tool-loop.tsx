"use client";

import { runRiskScanQuickFlow } from "@tool402/agent/riskscan-tool-flow";
import type { RiskScanQuickInput } from "@tool402/core";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Status, statusToneForOutcome } from "../../ui/status";
import {
  getToolLoopDemoDefaults,
  runExclusive,
  toolLoopOutcomeMessage,
  type ToolLoopViewState,
} from "./riskscan-tool-loop-state";

function readQuickInput(data: FormData): RiskScanQuickInput {
  const field = (name: "requestRef" | "subjectRef" | "context") =>
    String(data.get(name) ?? "");

  return {
    requestRef: field("requestRef"),
    subjectRef: field("subjectRef"),
    context: field("context"),
    declarations: {
      identity: data.get("identity") === "on",
      pricing: data.get("pricing") === "on",
      limitations: data.get("limitations") === "on",
      evidence: data.get("evidence") === "on",
    },
  };
}

function ToolLoopOutcome({ state }: { state: ToolLoopViewState }) {
  const message = toolLoopOutcomeMessage(state);
  return message === null ? null : (
    <Status tone={statusToneForOutcome(state.kind)} aria-live="polite">
      {message}
    </Status>
  );
}

export function RiskScanToolLoop() {
  const [state, setState] = useState<ToolLoopViewState>({ kind: "idle" });
  const [demoMode] = useQueryState("demo", parseAsStringLiteral(["tool-loop"] as const));
  const defaults = getToolLoopDemoDefaults(demoMode);
  const inFlight = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runExclusive(inFlight, async () => {
      setState({ kind: "submitting" });
      const serviceBase = new URL(window.location.origin);
      setState(await runRiskScanQuickFlow(serviceBase, readQuickInput(new FormData(event.currentTarget))));
    });
  }

  return (
    <Card data-ui="tool-loop-request-surface" className="rounded-[calc(var(--radius)*2)] shadow-none">
      <CardHeader className="space-y-2 border-b px-6 py-6 sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">ToolLoop request</p>
        <CardTitle className="text-2xl tracking-tight">Prepare a bounded request</CardTitle>
        <CardDescription className="max-w-xl leading-6">
          The current local form sends only the declared Quick fields and caller-reported disclosures.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-6 sm:px-7 sm:pb-7">
        <form key={demoMode ?? "blank"} onSubmit={onSubmit} className="space-y-7">
          {demoMode === "tool-loop" ? <p aria-live="polite" className="rounded-[var(--radius)] border border-brand-purple/20 bg-brand-purple/10 px-3 py-2 text-sm font-medium text-secondary-foreground">Demo values loaded. Review before checking.</p> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Request reference</span>
              <input
                name="requestRef"
                required
                maxLength={96}
                defaultValue={defaults.requestRef}
                className="min-h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Subject reference</span>
              <input
                name="subjectRef"
                required
                maxLength={160}
                defaultValue={defaults.subjectRef}
                className="min-h-11 w-full rounded-[var(--radius)] border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold">Request context</span>
              <textarea
                name="context"
                required
                maxLength={280}
                defaultValue={defaults.context}
                className="min-h-28 w-full resize-y rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </label>
          </div>
          <fieldset aria-labelledby="tool-loop-disclosures" className="space-y-4 rounded-[calc(var(--radius)*1.5)] border border-border bg-secondary/35 p-4 sm:p-5">
            <div className="space-y-1">
              <legend id="tool-loop-disclosures" className="text-base font-semibold">Caller-reported disclosures</legend>
              <p className="text-sm leading-6 text-muted-foreground">Select only disclosures supplied by the caller. This form does not verify them.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-10 items-center gap-3 rounded-[var(--radius)] bg-background px-3 text-sm font-medium">
                <input name="identity" type="checkbox" defaultChecked={defaults.declarations.identity} className="size-4 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
                <span>Identity disclosure</span>
              </label>
              <label className="flex min-h-10 items-center gap-3 rounded-[var(--radius)] bg-background px-3 text-sm font-medium">
                <input name="pricing" type="checkbox" defaultChecked={defaults.declarations.pricing} className="size-4 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
                <span>Pricing disclosure</span>
              </label>
              <label className="flex min-h-10 items-center gap-3 rounded-[var(--radius)] bg-background px-3 text-sm font-medium">
                <input name="limitations" type="checkbox" defaultChecked={defaults.declarations.limitations} className="size-4 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
                <span>Limitations disclosure</span>
              </label>
              <label className="flex min-h-10 items-center gap-3 rounded-[var(--radius)] bg-background px-3 text-sm font-medium">
                <input name="evidence" type="checkbox" defaultChecked={defaults.declarations.evidence} className="size-4 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
                <span>Evidence disclosure</span>
              </label>
            </div>
          </fieldset>
          <div className="flex flex-col gap-4 rounded-[calc(var(--radius)*1.5)] border border-border bg-secondary/55 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm leading-6 text-muted-foreground">A payment challenge does not mean a payment, result, or verification has occurred.</p>
            <Button type="submit" disabled={state.kind === "submitting"} className="shrink-0">
              Check ToolLoop availability
            </Button>
          </div>
          <ToolLoopOutcome state={state} />
        </form>
      </CardContent>
    </Card>
  );
}
