"use client";

import { useRef, useState, type KeyboardEvent } from "react";

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
  readonly onCancel?: () => void;
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

const phaseTone: Record<SignaturePhase, string> = {
  idle: "bg-muted text-muted-foreground",
  waiting: "bg-warning text-warning-foreground",
  checking: "bg-warning text-warning-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  failed: "bg-destructive text-destructive-foreground",
  complete: "bg-success text-success-foreground",
  unknown: "bg-destructive text-destructive-foreground",
};

function ShieldIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function SignatureDialog({
  provider,
  request,
  onResult,
  onCancel,
  relay,
}: SignatureDialogProps) {
  const [state, setState] = useState<DialogState>(idleState);
  const cardRef = useRef<HTMLElement>(null);
  const busy = state.phase === "waiting" || state.phase === "checking";

  function keepFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      if (!busy) onCancel?.();
      return;
    }
    if (event.key !== "Tab" || !cardRef.current) return;
    const focusable = [...cardRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]")];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  const expired =
    state.phase === "failed" &&
    state.outcome === null &&
    state.message.startsWith("This signature request expired");

  function finish(next: DialogState) {
    setState(next);
    cardRef.current?.focus();
    onResult?.({ phase: next.phase, outcome: next.outcome });
  }

  async function sign() {
    setState({
      phase: "waiting",
      message: "Confirm the signature in MetaMask.",
      outcome: null,
    });
    cardRef.current?.focus();
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

  const rows: readonly (readonly [string, string])[] = [
    ["Type", request.type],
    ["Chain", "296 · hedera:testnet"],
    ["Payload", `${request.canonicalPayloadBytes.byteLength} bytes, canonical JSON`],
    ["Expires", `${clockTime(request.expiresAt)} · nonce single use`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4">
      <Card
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-dialog-title"
        aria-describedby="signature-dialog-status"
        onKeyDown={keepFocus}
        className="flex w-[440px] max-w-full flex-col gap-4 rounded-control p-6 shadow-[0_20px_50px_rgba(22,22,42,0.25)] outline-none"
      >
        <CardHeader className="gap-1 p-0">
          <CardTitle id="signature-dialog-title" className="flex items-center gap-2 text-lg font-semibold">
            <ShieldIcon />
            {request.title}
          </CardTitle>
          <CardDescription className="text-[13px] leading-5">{request.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-0">
          <dl className="flex flex-col gap-2 rounded-[10px] border border-border bg-muted/50 px-4 py-3 text-[13px]">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-all text-right font-medium font-mono tabular-nums tracking-[-0.02em]">{value}</dd>
              </div>
            ))}
          </dl>
          <p
            id="signature-dialog-status"
            aria-live="polite"
            data-phase={state.phase}
            className={`rounded-[10px] px-3 py-2 text-[13px] leading-5 ${phaseTone[state.phase]}`}
          >
            {state.message}
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t-0 p-0">
          {state.phase === "idle" ? (
            <>
              {onCancel ? (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              ) : null}
              <Button autoFocus onClick={sign}>Sign with MetaMask</Button>
            </>
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
    </div>
  );
}
