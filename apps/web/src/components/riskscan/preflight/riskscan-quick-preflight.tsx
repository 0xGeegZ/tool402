"use client";

import { useState, type FormEvent } from "react";

import { Button } from "../../ui/button";
import { CheckboxRow, Field, textAreaClass, textInputClass } from "../../ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Status, statusToneForOutcome } from "../../ui/status";
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
      <Status
        tone={statusToneForOutcome(
          state.kind === "assessment" ? state.assessment.disposition : state.kind,
        )}
      >
        {message}
      </Status>
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
            <Field label="Request reference">
              <input
                name="requestRef"
                type="text"
                required
                maxLength={96}
                className={textInputClass}
              />
            </Field>
            <Field label="Subject reference">
              <input
                name="subjectRef"
                type="text"
                required
                maxLength={160}
                className={textInputClass}
              />
            </Field>
            <Field label="Request context">
              <textarea
                name="context"
                required
                maxLength={280}
                className={textAreaClass}
              />
            </Field>
          </div>
          <fieldset className="space-y-3">
            <legend className="font-medium">Caller-reported disclosures</legend>
            <CheckboxRow label="Identity disclosure">
              <input name="identity" type="checkbox" />
            </CheckboxRow>
            <CheckboxRow label="Pricing disclosure">
              <input name="pricing" type="checkbox" />
            </CheckboxRow>
            <CheckboxRow label="Limitations disclosure">
              <input name="limitations" type="checkbox" />
            </CheckboxRow>
            <CheckboxRow label="Evidence disclosure">
              <input name="evidence" type="checkbox" />
            </CheckboxRow>
          </fieldset>
          <Button type="submit">Assess local preflight</Button>
          <RiskScanQuickPreflightOutcome state={state} />
        </form>
      </CardContent>
    </Card>
  );
}
