"use client";

import { runRiskScanQuickFlow } from "@tool402/agent/riskscan-tool-flow";
import type { RiskScanQuickInput } from "@tool402/core";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>ToolLoop request</CardTitle>
      </CardHeader>
      <CardContent>
        <form key={demoMode ?? "blank"} onSubmit={onSubmit} className="space-y-6">
          {demoMode === "tool-loop" ? <p aria-live="polite" className="rounded-[var(--radius)] border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">Demo values loaded. Review before checking.</p> : null}
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="font-medium">Request reference</span>
              <input
                name="requestRef"
                required
                maxLength={96}
                defaultValue={defaults.requestRef}
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-medium">Subject reference</span>
              <input
                name="subjectRef"
                required
                maxLength={160}
                defaultValue={defaults.subjectRef}
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-medium">Request context</span>
              <textarea
                name="context"
                required
                maxLength={280}
                defaultValue={defaults.context}
                className="min-h-24 w-full rounded-[var(--radius)] border bg-background px-3 py-2"
              />
            </label>
          </div>
          <fieldset className="space-y-3">
            <legend className="font-medium">Caller-reported disclosures</legend>
            <label className="flex items-center gap-2">
              <input name="identity" type="checkbox" defaultChecked={defaults.declarations.identity} />
              <span>Identity disclosure</span>
            </label>
            <label className="flex items-center gap-2">
              <input name="pricing" type="checkbox" defaultChecked={defaults.declarations.pricing} />
              <span>Pricing disclosure</span>
            </label>
            <label className="flex items-center gap-2">
              <input name="limitations" type="checkbox" defaultChecked={defaults.declarations.limitations} />
              <span>Limitations disclosure</span>
            </label>
            <label className="flex items-center gap-2">
              <input name="evidence" type="checkbox" defaultChecked={defaults.declarations.evidence} />
              <span>Evidence disclosure</span>
            </label>
          </fieldset>
          <Button type="submit" disabled={state.kind === "submitting"}>
            Check ToolLoop availability
          </Button>
          <ToolLoopOutcome state={state} />
        </form>
      </CardContent>
    </Card>
  );
}
