"use client";

import { discoverRiskScanQuick } from "@tool402/agent/riskscan-tool-directory";
import { useRef, useState } from "react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { directoryOutcomeMessage, runExclusive, type RiskScanDirectoryViewState } from "./riskscan-directory-state";

function DirectorySelection({ state }: { state: Extract<RiskScanDirectoryViewState, { kind: "tool_selected" }> }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">Selected descriptor</p>
        <p className="text-sm text-muted-foreground">{state.tool.id}</p>
        <p className="font-medium">{state.tool.name}</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Bounded inputs</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>requestRef — 1–{state.tool.input.properties.requestRef.maxLength} characters</li>
          <li>subjectRef — 1–{state.tool.input.properties.subjectRef.maxLength} characters</li>
          <li>context — 1–{state.tool.input.properties.context.maxLength} characters</li>
          <li>declarations — identity, pricing, limitations, evidence</li>
        </ul>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Known limitations</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {state.tool.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Local configuration</p>
        {state.tool.payment.state === "configuration_required" ? (
          <p className="text-sm text-muted-foreground">
            Local configuration is required before a challenge can be offered.
          </p>
        ) : state.tool.payment.network === "hedera:testnet" ? (
          <p className="text-sm text-muted-foreground">
            Local x402 metadata: {state.tool.payment.protocol} · {state.tool.payment.network} · asset {state.tool.payment.asset} · {state.tool.payment.amount} atomic units
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Local x402 metadata: {state.tool.payment.protocol} · {state.tool.payment.network} · {state.tool.payment.price}
          </p>
        )}
      </div>
    </div>
  );
}

function DirectoryOutcome({ state }: { state: RiskScanDirectoryViewState }) {
  const message = directoryOutcomeMessage(state);
  return message === null ? null : <p aria-live="polite" className="text-sm text-muted-foreground">{message}</p>;
}

export function RiskScanDirectoryDiscovery() {
  const [state, setState] = useState<RiskScanDirectoryViewState>({ kind: "idle" });
  const inFlight = useRef(false);

  async function inspectDirectory() {
    await runExclusive(inFlight, async () => {
      setState({ kind: "inspecting" });
      const serviceBase = new URL(window.location.origin);
      setState(await discoverRiskScanQuick(serviceBase));
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit">Local directory</Badge>
        <CardTitle>Inspect RiskScan Quick</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button type="button" disabled={state.kind === "inspecting"} onClick={inspectDirectory}>
          Inspect local directory
        </Button>
        <DirectoryOutcome state={state} />
        {state.kind === "tool_selected" ? <DirectorySelection state={state} /> : null}
      </CardContent>
    </Card>
  );
}
