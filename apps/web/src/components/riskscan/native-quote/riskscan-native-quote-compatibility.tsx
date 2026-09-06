"use client";

import { evaluateDiscoveredRiskScanNativeQuote } from "@tool402/agent/riskscan-tool-native-quote-evaluation";
import { useRef, useState, type FormEvent } from "react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  nativeQuoteCompatibilityOutcomeMessage,
  readNativeQuotePolicy,
  runExclusive,
  type NativeQuoteCompatibilityViewState,
} from "./riskscan-native-quote-state";

function NativeQuoteCompatibilityOutcome({ state }: { state: NativeQuoteCompatibilityViewState }) {
  const message = nativeQuoteCompatibilityOutcomeMessage(state);
  if (message === null) return null;

  return (
    <section aria-live="polite" className="space-y-3 text-sm text-muted-foreground">
      <p>{message}</p>
      {state.kind === "eligible" ? (
        <dl className="grid gap-2 sm:grid-cols-3">
          <div>
            <dt className="font-medium text-foreground">Network</dt>
            <dd>{state.network}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Asset</dt>
            <dd>{state.asset}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Atomic amount</dt>
            <dd>{state.amount.toString()}</dd>
          </div>
        </dl>
      ) : null}
    </section>
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
            <label className="block space-y-2">
              <span className="font-medium">Network</span>
              <input
                name="network"
                type="text"
                required
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-medium">Asset</span>
              <input
                name="asset"
                type="text"
                required
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-medium">Maximum atomic amount</span>
              <input
                name="maximumAmount"
                type="text"
                required
                className="min-h-10 w-full rounded-[var(--radius)] border bg-background px-3"
              />
            </label>
          </div>
          <Button type="submit" disabled={state.kind === "evaluating"}>
            Evaluate local compatibility
          </Button>
          <NativeQuoteCompatibilityOutcome state={state} />
        </form>
      </CardContent>
    </Card>
  );
}
