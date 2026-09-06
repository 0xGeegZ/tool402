"use client";

import { useState, type FormEvent } from "react";

import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  evaluateRiskScanQuickPreflight,
  readRiskScanQuickPreflightInput,
  riskScanQuickPreflightOutcomeMessage,
  type RiskScanQuickPreflightViewState,
} from "./riskscan-quick-preflight-state";

function RiskScanQuickPreflightOutcome({ state }: { state: RiskScanQuickPreflightViewState }) {
  const message = riskScanQuickPreflightOutcomeMessage(state);
  if (message === null) return null;

  return (
    <section aria-live="polite" className="space-y-4 text-sm text-muted-foreground">
      <p>{message}</p>
      {state.kind === "assessment" ? (
        <>
          <p className="font-medium text-foreground">{state.assessment.disposition}</p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Reasons</p>
            <ul className="list-disc space-y-1 pl-5">
              {state.assessment.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Limitation</p>
            <ul className="list-disc space-y-1 pl-5">
              {state.assessment.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}

export function RiskScanQuickPreflight() {
  const [state, setState] = useState<RiskScanQuickPreflightViewState>({ kind: "idle" });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(evaluateRiskScanQuickPreflight(readRiskScanQuickPreflightInput(new FormData(event.currentTarget))));
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Quick preflight</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="font-medium">Request reference</span>
              <input
                name="requestRef"
                type="text"
                required
                maxLength={96}
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-medium">Subject reference</span>
              <input
                name="subjectRef"
                type="text"
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
          <Button type="submit">Assess local preflight</Button>
          <RiskScanQuickPreflightOutcome state={state} />
        </form>
      </CardContent>
    </Card>
  );
}
