"use client";

import { useState } from "react";

import {
  signAndRelayCommand,
  type RelayOutcome,
  type SignatureFlowResult,
  type SignatureRequest,
} from "../../lib/wallet/command-relay.ts";
import type { Eip1193Provider } from "../../lib/wallet/metamask-provider.ts";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const SIGNATURE_PHASES = [
  "idle",
  "waiting",
  "checking",
  "rejected",
  "failed",
  "complete",
  "unknown",
] as const;

export type SignaturePhase = (typeof SIGNATURE_PHASES)[number];

export interface SignatureDialogRequest extends SignatureRequest {
  readonly title: string;
  readonly description: string;
}

export interface SignatureResult {
  readonly phase: SignaturePhase;
  readonly outcome: RelayOutcome | null;
}

export interface SignatureDialogProps {
  readonly provider: Eip1193Provider;
  readonly request: SignatureDialogRequest;
  readonly onResult?: (result: SignatureResult) => void;
  readonly relay?: (body: string) => Promise<RelayOutcome>;
}

interface DialogState {
  readonly phase: SignaturePhase;
  readonly message: string;
  readonly outcome: RelayOutcome | null;
}

const idleState: DialogState = {
  phase: "idle",
  message:
    "Signing asks MetaMask for one EIP-712 signature. It sends no transaction.",
  outcome: null,
};

function failed(
  message: string,
  outcome: RelayOutcome | null = null,
): DialogState {
  return { phase: "failed", message, outcome };
}

function describeOutcome(outcome: RelayOutcome): DialogState {
  switch (outcome) {
    case "ACCEPTED":
      return {
        phase: "complete",
        message:
          "Backend outcome: ACCEPTED. The command was admitted. This is not an on-chain fact.",
        outcome,
      };
    case "REPLAYED":
      return {
        phase: "complete",
        message:
          "Backend outcome: REPLAYED. This nonce was already claimed by an earlier attempt, so this attempt recorded nothing. Check the status surface for the earlier command's fate.",
        outcome,
      };
    case "CONFLICT":
      return failed(
        "Backend outcome: CONFLICT. The idempotency key was already used with different content, so nothing was recorded.",
        outcome,
      );
    case "REJECTED":
      return failed(
        "Outcome: REJECTED. The command was refused before or at the backend, which gives no reason. Common causes are an unauthorized issuer, an expired command, or a malformed or oversized body. Nothing was recorded.",
        outcome,
      );
    case "UNSUPPORTED_TYPE":
      return failed(
        "Backend outcome: UNSUPPORTED_TYPE. No dispatch entry is enabled for this command type, so nothing was recorded.",
        outcome,
      );
    case "not_configured":
      return failed(
        "The relay is not configured, so nothing left this host and nothing was recorded.",
        outcome,
      );
    case "transport_failure":
    case "unexpected_response":
      return {
        phase: "unknown",
        message:
          "The relay could not confirm an outcome. The command may already have been admitted; check the status surface before signing again with a fresh nonce.",
        outcome,
      };
  }
}

function describeResult(result: SignatureFlowResult): DialogState {
  switch (result.kind) {
    case "expired":
      return failed(
        "This signature request expired before signing, so nothing was sent or recorded. Start the step again to get fresh timestamps.",
      );
    case "wrong_chain":
      return failed(
        "MetaMask is not on Hedera Testnet. Nothing was sent or recorded.",
      );
    case "no_account":
      return failed(
        "MetaMask reports no connected account. Nothing was sent or recorded.",
      );
    case "declined":
      return {
        phase: "rejected",
        message: "You declined the signature. Nothing was sent or recorded.",
        outcome: null,
      };
    case "signing_failed":
      return failed(
        "The signature request failed before anything was sent. Nothing was recorded.",
      );
    case "relayed":
      return describeOutcome(result.outcome);
  }
}

export function SignatureDialog({
  provider,
  request,
  onResult,
  relay,
}: SignatureDialogProps) {
  const [state, setState] = useState<DialogState>(idleState);
  const busy = state.phase === "waiting" || state.phase === "checking";
  const expired =
    state.phase === "failed" &&
    state.outcome === null &&
    state.message.startsWith("This signature request expired");

  function finish(next: DialogState) {
    setState(next);
    onResult?.({ phase: next.phase, outcome: next.outcome });
  }

  async function sign() {
    setState({
      phase: "waiting",
      message: "Confirm the signature in MetaMask.",
      outcome: null,
    });
    const result = await signAndRelayCommand(provider, request, {
      relay,
      onSigned: () =>
        setState({
          phase: "checking",
          message: "Signature received. Relaying the command.",
          outcome: null,
        }),
    });
    finish(describeResult(result));
  }

  return (
    <Card
      role="dialog"
      aria-labelledby="signature-dialog-title"
      aria-describedby="signature-dialog-status"
    >
      <CardHeader>
        <CardTitle id="signature-dialog-title">{request.title}</CardTitle>
        <CardDescription>{request.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p
          id="signature-dialog-status"
          aria-live="polite"
          data-phase={state.phase}
          className="text-sm"
        >
          {state.message}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {state.phase === "idle" ? (
          <Button onClick={sign}>Sign with MetaMask</Button>
        ) : null}
        {busy ? (
          <Button disabled aria-disabled="true">
            {state.phase === "waiting" ? "Waiting for MetaMask…" : "Checking…"}
          </Button>
        ) : null}
        {(state.phase === "rejected" ||
          state.phase === "failed" ||
          state.phase === "unknown") &&
        !expired ? (
          <Button variant="outline" onClick={() => setState(idleState)}>
            Sign again
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
