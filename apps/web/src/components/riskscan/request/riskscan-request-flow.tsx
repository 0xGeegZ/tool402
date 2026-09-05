"use client";

import type { RiskScanQuickInput } from "@tool402/core";
import { useState, type FormEvent } from "react";

import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
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

function RequestOutcome({ state }: { state: RiskScanRequestViewState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "submitting") {
    return <p aria-live="polite">Sending the request boundary.</p>;
  }
  if (state.kind === "unavailable") {
    return (
      <p aria-live="polite">
        RiskScan is unavailable. No payment challenge or result was returned.
      </p>
    );
  }
  if (state.kind === "payment_required") {
    return (
      <p aria-live="polite">
        A payment challenge was returned. No payment was made in this browser.
      </p>
    );
  }
  if (state.kind === "invalid_request") {
    return (
      <p aria-live="polite">
        The request was rejected before a result. Check the fields and try again.
      </p>
    );
  }
  if (state.kind === "transport_failure") {
    return (
      <p aria-live="polite">
        The request could not reach the service. No payment or result was confirmed.
      </p>
    );
  }
  if (state.kind === "unexpected_response") {
    return (
      <p aria-live="polite">
        The service returned an unexpected response. No payment or result is shown.
      </p>
    );
  }

  return (
    <section aria-live="polite" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quick endpoint response</h2>
        <p className="text-sm text-muted-foreground">
          This is only an endpoint response. It is not payment or lifecycle evidence.
        </p>
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
    </section>
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
            Check availability
          </Button>
          <RequestOutcome state={state} />
        </form>
      </CardContent>
    </Card>
  );
}
