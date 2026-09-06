"use client";

import { runRiskScanQuickFlow, type RiskScanToolFlowOutcome } from "@tool402/agent/riskscan-tool-flow";
import type { RiskScanQuickInput } from "@tool402/core";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

type RiskScanToolLoopState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | RiskScanToolFlowOutcome;

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

function ToolLoopOutcome({ state }: { state: RiskScanToolLoopState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "submitting") {
    return <p aria-live="polite">Sending the ToolLoop request boundary.</p>;
  }
  if (state.kind === "directory_unavailable") {
    return <p aria-live="polite">RiskScan directory is unavailable. No RiskScan request was sent.</p>;
  }
  if (state.kind === "directory_invalid") {
    return <p aria-live="polite">RiskScan directory is invalid. No RiskScan request was sent.</p>;
  }
  if (state.kind === "input_invalid") {
    return <p aria-live="polite">The input was rejected. No RiskScan request was sent.</p>;
  }
  if (state.kind === "transport_failure") {
    return <p aria-live="polite">The request could not reach the service. No payment or result is confirmed or shown.</p>;
  }
  if (state.kind === "unavailable") {
    return <p aria-live="polite">RiskScan is unavailable. No payment or result is confirmed or shown.</p>;
  }
  if (state.kind === "payment_required") {
    return <p aria-live="polite">A payment challenge was returned. No payment was made in this browser.</p>;
  }
  if (state.kind === "unexpected_response") {
    return <p aria-live="polite">The service returned an unexpected response. No payment or result is confirmed or shown.</p>;
  }
  return null;
}

export function RiskScanToolLoop() {
  const [state, setState] = useState<RiskScanToolLoopState>({ kind: "idle" });
  const inFlight = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setState({ kind: "submitting" });
      const serviceBase = new URL(window.location.origin);
      setState(await runRiskScanQuickFlow(serviceBase, readQuickInput(new FormData(event.currentTarget))));
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ToolLoop request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="font-medium">Request reference</span>
              <input
                name="requestRef"
                required
                maxLength={96}
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-medium">Subject reference</span>
              <input
                name="subjectRef"
                required
                maxLength={160}
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-medium">Request context</span>
              <textarea
                name="context"
                required
                maxLength={280}
                className="min-h-24 w-full rounded-[var(--radius)] border bg-background px-3 py-2"
              />
            </label>
          </div>
          <fieldset className="space-y-3">
            <legend className="font-medium">Caller-reported disclosures</legend>
            <label className="flex items-center gap-2">
              <input name="identity" type="checkbox" />
              <span>Identity disclosure</span>
            </label>
            <label className="flex items-center gap-2">
              <input name="pricing" type="checkbox" />
              <span>Pricing disclosure</span>
            </label>
            <label className="flex items-center gap-2">
              <input name="limitations" type="checkbox" />
              <span>Limitations disclosure</span>
            </label>
            <label className="flex items-center gap-2">
              <input name="evidence" type="checkbox" />
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
