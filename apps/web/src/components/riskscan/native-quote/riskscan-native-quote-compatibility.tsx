"use client";

import { evaluateDiscoveredRiskScanNativeQuote } from "@tool402/agent/riskscan-tool-native-quote-evaluation";
import { useRef, useState, type FormEvent } from "react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Field, textInputClass } from "../../ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { DetailList } from "../../ui/detail-list";
import { Status, StatusRegion, statusToneForOutcome } from "../../ui/status";
import {
  nativeQuoteCompatibilityOutcomeMessage,
  readNativeQuotePolicy,
  runExclusive,
  type NativeQuoteCompatibilityViewState,
} from "./riskscan-native-quote-state";

function NativeQuoteCompatibilityOutcome({ state }: { state: NativeQuoteCompatibilityViewState }) {
  const message = nativeQuoteCompatibilityOutcomeMessage(state);

  return (
    <StatusRegion className="mt-5 space-y-3 text-sm text-muted-foreground">
      {message === null ? null : <Status live={false} tone={statusToneForOutcome(state.kind)}>
        {message}
      </Status>}
      {state.kind === "eligible" ? (
        <DetailList
          columns={3}
          items={[
            ["Network", state.network],
            ["Asset", state.asset],
            ["Atomic amount", state.amount.toString()],
          ]}
        />
      ) : null}
    </StatusRegion>
  );
}

export function RiskScanNativeQuoteCompatibility() {
  const [state, setState] = useState<NativeQuoteCompatibilityViewState>({ kind: "idle" });
  const inFlight = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runExclusive(inFlight, async () => {
      setState({ kind: "evaluating" });
      const policy = readNativeQuotePolicy(new FormData(event.currentTarget));
      const serviceBase = new URL(window.location.origin);
      setState(await evaluateDiscoveredRiskScanNativeQuote(serviceBase, policy, window.fetch.bind(window)));
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit">Guest check</Badge>
        <CardTitle>Native quote compatibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Supply a local policy to inspect compatibility with the locally advertised native summary.
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-4">
            <Field label="Network">
              <input
                name="network"
                type="text"
                required
                className={textInputClass}
              />
            </Field>
            <Field label="Asset">
              <input
                name="asset"
                type="text"
                required
                className={textInputClass}
              />
            </Field>
            <Field label="Maximum atomic amount">
              <input
                name="maximumAmount"
                type="text"
                required
                className={textInputClass}
              />
            </Field>
          </div>
          <Button type="submit" disabled={state.kind === "evaluating"}>
            Evaluate local compatibility
          </Button>
        </form>
        <NativeQuoteCompatibilityOutcome state={state} />
      </CardContent>
    </Card>
  );
}
