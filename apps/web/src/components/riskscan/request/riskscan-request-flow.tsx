"use client";

import type { RiskScanQuickInput } from "@tool402/core";
import { useState, type FormEvent } from "react";

import { Button } from "../../ui/button";
import { CheckboxRow, Field, textAreaClass, textInputClass } from "../../ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Status, StatusRegion, statusToneForOutcome } from "../../ui/status";
import {
  submitRiskScanRequest,
  type RiskScanRequestOutcome,
} from "./riskscan-request-state";

type RiskScanRequestViewState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | RiskScanRequestOutcome;

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

function RequestResult({ state }: { state: RiskScanRequestViewState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "submitting") {
    return (
      <Status live={false} tone={statusToneForOutcome(state.kind)}>
        Sending the request boundary.
      </Status>
    );
  }
  if (state.kind === "unavailable") {
    return (
      <Status live={false} tone={statusToneForOutcome(state.kind)}>
        RiskScan is unavailable. No payment challenge or result was returned.
      </Status>
    );
  }
  if (state.kind === "payment_required") {
    return (
      <Status live={false} tone={statusToneForOutcome(state.kind)}>
        A payment challenge was returned. No payment was made in this browser.
      </Status>
    );
  }
  if (state.kind === "invalid_request") {
    return (
      <Status live={false} tone={statusToneForOutcome(state.kind)}>
        The request was rejected before a result. Check the fields and try again.
      </Status>
    );
  }
  if (state.kind === "transport_failure") {
    return (
      <Status live={false} tone={statusToneForOutcome(state.kind)}>
        The request could not reach the service. No payment or result was confirmed.
      </Status>
    );
  }
  if (state.kind === "unexpected_response") {
    return (
      <Status live={false} tone={statusToneForOutcome(state.kind)}>
        The service returned an unexpected response. No payment or result is shown.
      </Status>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quick endpoint response</h2>
        <Status live={false} tone={statusToneForOutcome(state.kind)}>
          This is only an endpoint response. It is not payment or lifecycle evidence.
        </Status>
      </div>
      <p className="font-medium">{state.result.disposition}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-medium">Reasons</h3>
          <ul className="list-disc space-y-1 pl-5">
            {state.result.reasons.map((reason, index) => (
              <li key={`${index}-${reason}`}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Limitations</h3>
          <ul className="list-disc space-y-1 pl-5">
            {state.result.limitations.map((limitation, index) => (
              <li key={`${index}-${limitation}`}>{limitation}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function RequestOutcome({ state }: { state: RiskScanRequestViewState }) {
  return (
    <StatusRegion>
      <RequestResult state={state} />
    </StatusRegion>
  );
}

export function RiskScanRequestFlow() {
  const [state, setState] = useState<RiskScanRequestViewState>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "submitting" });
    setState(
      await submitRiskScanRequest(
        readQuickInput(new FormData(event.currentTarget)),
      ),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <Field label="Request reference">
              <input
                name="requestRef"
                required
                maxLength={96}
                className={textInputClass}
              />
            </Field>
            <Field label="Subject reference">
              <input
                name="subjectRef"
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
          <Button type="submit" disabled={state.kind === "submitting"}>
            Check availability
          </Button>
        </form>
        <RequestOutcome state={state} />
      </CardContent>
    </Card>
  );
}
