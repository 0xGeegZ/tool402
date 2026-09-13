"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { isUserRejection } from "../../lib/wallet/metamask-provider.ts";
import { hashscanTransactionUrl } from "../../lib/hashscan-links.ts";
import type { BackingPaymentRecord } from "../../lib/backing-payment-server.ts";
import { readCurrentSession } from "../../lib/wallet/wallet-state.ts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DetailList } from "../ui/detail-list";
import { SignatureDialog, type SignatureResult } from "../wallet/signature-dialog";
import { WalletIsland } from "../wallet/wallet-connect";
import { connectedWalletSession, useWalletSession, type WalletSession } from "../wallet/wallet-session";
import { presetUnits, railPosition } from "./backing-presentation";
import {
  backingLifecycleLabels,
  createBackingIntent,
  formatHbar,
  formatShare,
  isCurrentBackingIntent,
  paymentTinybars,
  readBackingOffering,
  transferRequest,
  validateUnits,
  viewAfterSignature,
  viewAfterTransfer,
  type BackingIntent,
  type BackingOffering,
  type BackingProjection,
  type BackingView,
  type TransferResult,
} from "./backing-state";
import { BackingStepRail } from "./backing-step-rail";

const finalPhases: ReadonlySet<SignatureResult["phase"]> = new Set(["complete", "rejected", "failed", "unknown"]);
const pendingAttachmentKey = "tool402-backing-pending-attachment-v1";
type PendingAttachment = Readonly<{ intent: Pick<BackingIntent, "idempotencyKey" | "parameters">; transactionHash: `0x${string}` }>;

function pendingAttachment(): PendingAttachment | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(pendingAttachmentKey) ?? "null");
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    return typeof record.transactionHash === "string" && /^0x[0-9a-f]{64}$/u.test(record.transactionHash) && record.intent !== null && typeof record.intent === "object"
      ? { intent: record.intent as PendingAttachment["intent"], transactionHash: record.transactionHash as `0x${string}` }
      : null;
  } catch { return null; }
}

function chipClass(selected: boolean): string {
  return `flex min-w-28 flex-col items-start gap-1 rounded-control border px-3 py-2 text-left text-sm ${selected ? "border-primary bg-muted" : "border-border"}`;
}

function describeView(view: BackingView, payment: BackingPaymentRecord | null): string {
  if (payment?.status === "PREPARED") return "A funding transfer is already reserved for this backing attempt. Attach the recorded transaction hash instead of sending another transfer.";
  if (payment?.status === "CONFIRMED") return `Payment confirmed on Hedera Testnet for ${formatHbar(BigInt(payment.tinybars))}. Allocation still needs the issuer's separate signature.`;
  if (payment?.status === "REJECTED") return "The submitted payment does not match the signed backing intent. No units were issued.";
  if (payment?.status === "SUBMITTED") return "Payment submitted — awaiting server verification. Nothing is sent again.";
  switch (view.kind) {
    case "choosing":
      return view.message ?? "Choose units, read the disclosure, and connect MetaMask. Nothing is requested until you sign.";
    case "prepared":
      return `The funding command was accepted. Send exactly ${formatHbar(view.intent.tinybars)} from MetaMask. A signature is not a payment.`;
    case "payment_submitted":
      return `Payment submitted — allocation pending. Transaction ${view.transactionHash} was submitted from MetaMask. It is not confirmed here.`;
    case "payment_outcome_unknown":
    case "refused":
      return view.message;
    case "allocation_pending":
      return "The transfer was recorded. Units are allocated only after the issuer signs.";
    case "complete":
      return "The issuer's allocation was recorded.";
    case "offering_unavailable":
      return "No offering is available to back on this host. Nothing was requested, signed, or sent.";
  }
}

function BackingForm({ offering, initialPayment, dashboardAddress }: { offering: BackingOffering; initialPayment: BackingPaymentRecord | null; dashboardAddress: string | null }) {
  const wallet = useWalletSession();
  const session: WalletSession | null = connectedWalletSession(wallet);
  const presets = presetUnits(offering.terms);
  const [preset, setPreset] = useState<bigint | null>(offering.terms.minimumPurchaseUnits);
  const [unitsInput, setUnitsInput] = useState(offering.terms.minimumPurchaseUnits.toString());
  const [acknowledged, setAcknowledged] = useState(false);
  const [view, setView] = useState<BackingView>({ kind: "choosing" });
  const [request, setRequest] = useState<BackingIntent | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [payment, setPayment] = useState<BackingPaymentRecord | null>(initialPayment);
  const [pending, setPending] = useState<PendingAttachment | null>(pendingAttachment);
  const sendingRef = useRef(false);
  const validation = validateUnits(offering, unitsInput);
  const label = payment?.status === "CONFIRMED" ? "payment_confirmed" : payment?.status === "REJECTED" ? "payment_rejected" : backingLifecycleLabels[view.kind];
  const committed = request ?? ("intent" in view ? view.intent : null);
  const locked = payment !== null || view.kind !== "choosing" || request !== null;
  const dashboardMatchesWallet = session !== null && dashboardAddress !== null && session.address === dashboardAddress;
  const canPrepare = validation.ok && acknowledged && dashboardMatchesWallet && !locked;
  const readoutUnits = committed !== null ? committed.units : validation.ok ? validation.units : null;
  const readoutTinybars = committed !== null ? committed.tinybars : validation.ok ? paymentTinybars(offering, validation.units) : null;

  function prepare() {
    if (!validation.ok || !canPrepare) return;
    try {
      setRequest(createBackingIntent(offering, validation.units, Date.now()));
    } catch {
      setView({ kind: "choosing", message: "The funding intent could not be prepared. Nothing was signed or sent." });
    }
  }

  async function persistPayment(intent: Pick<BackingIntent, "idempotencyKey" | "parameters">, transactionHash: `0x${string}`): Promise<void> {
    try {
      const response = await fetch("/api/backing/payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptPublicId: intent.idempotencyKey, transactionHash, parameters: intent.parameters }),
      });
      if (!response.ok) throw new Error("backing payment record unavailable");
      const value: unknown = await response.json();
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        const record = value as Record<string, unknown>;
        if ((record.status === "CONFIRMED" || record.status === "REJECTED" || record.status === "SUBMITTED" || record.status === "OUTCOME_UNKNOWN")
          && typeof record.transactionHash === "string" && /^0x[0-9a-f]{64}$/u.test(record.transactionHash)
          && typeof record.tinybars === "string" && /^(?:0|[1-9][0-9]*)$/u.test(record.tinybars)) {
          setPayment({ status: record.status, transactionHash: record.transactionHash as `0x${string}`, tinybars: record.tinybars });
          try { window.localStorage.removeItem(pendingAttachmentKey); } catch { /* recovery storage is best effort only */ }
          setPending(null);
          return;
        }
      }
      throw new Error("invalid backing payment record");
    } catch {
      setNotice("Payment was submitted, but its server status could not be recorded. Retry verification only; nothing is sent again.");
    }
  }

  async function reservePayment(intent: BackingIntent): Promise<boolean> {
    try {
      const response = await fetch("/api/backing/payment/reserve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptPublicId: intent.idempotencyKey, parameters: intent.parameters }),
      });
      const value: unknown = await response.json();
      if (!response.ok || value === null || typeof value !== "object" || Array.isArray(value)
        || (value as Record<string, unknown>).status !== "PREPARED") throw new Error("backing reservation unavailable");
      return true;
    } catch {
      setNotice("The server could not reserve this funding attempt. Nothing was sent.");
      return false;
    }
  }

  function onSignature(result: SignatureResult) {
    if (request === null || !finalPhases.has(result.phase)) return;
    setView(viewAfterSignature(result, request));
    setRequest(null);
  }

  async function send() {
    if (session === null || dashboardAddress === null || session.address !== dashboardAddress || view.kind !== "prepared" || transferring || sendingRef.current) {
      if (session !== null && dashboardAddress !== null && session.address !== dashboardAddress) setNotice("The connected MetaMask wallet differs from the signed dashboard wallet. Sign in with this backing wallet before funding; nothing was sent.");
      return;
    }
    sendingRef.current = true;
    setTransferring(true);
    setNotice(null);
    if (!isCurrentBackingIntent(offering, view.intent)) {
      setNotice("The accepted funding intent no longer matches the offering. Nothing was sent.");
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    const current = await readCurrentSession(session.provider);
    if (current.state.kind !== "connected" || current.state.address !== session.address || current.state.address !== dashboardAddress) {
      setNotice("MetaMask's account or network changed after connecting. Reconnect on Hedera Testnet before sending; nothing was sent.");
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    if (!await reservePayment(view.intent)) {
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    let result: TransferResult;
    try {
      const response = await session.provider.request(transferRequest(view, session.address));
      result = typeof response === "string" ? { kind: "hash", hash: response } : { kind: "no_hash" };
    } catch (error) {
      result = isUserRejection(error) ? { kind: "declined" } : { kind: "no_hash" };
    }
    try {
      setView(viewAfterTransfer(view, result));
    } catch {
      setView(viewAfterTransfer(view, { kind: "no_hash" }));
    }
    if (result.kind === "hash" && /^0x[0-9a-f]{64}$/u.test(result.hash)) {
      const attachment = { intent: { idempotencyKey: view.intent.idempotencyKey, parameters: view.intent.parameters }, transactionHash: result.hash as `0x${string}` };
      try { window.localStorage.setItem(pendingAttachmentKey, JSON.stringify(attachment)); } catch { /* the authoritative attachment still proceeds */ }
      setPending(attachment);
      await persistPayment(attachment.intent, attachment.transactionHash);
    }
    if (result.kind === "declined") sendingRef.current = false;
    setTransferring(false);
  }

  return (
    <div className="space-y-6">
      <BackingStepRail {...railPosition(view.kind, request !== null)} />

      <Card>
        <CardHeader>
          <CardTitle>Terms v{offering.terms.version.replace(/^v/u, "")}</CardTitle>
          <CardDescription>Fixed by the offering. A material change needs a separately signed offering version.</CardDescription>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              ["Unit price", formatHbar(offering.terms.noteUnitPriceTinybars)],
              ["Minimum", `${offering.terms.minimumPurchaseUnits.toString()} units`],
              ["Payout cap", formatHbar(offering.terms.payoutCapTinybars)],
              ["Terms version", offering.terms.version],
              ["Maturity", offering.maturityAt],
              ["Units requested", committed !== null ? committed.units.toString() : validation.ok ? validation.units.toString() : "—"],
            ]}
          />
          <p className="mt-4 text-sm text-muted-foreground">
            A disclosed {formatShare(offering.terms.reserveShareBps)}% of qualifying usage revenue funds capped distributions under the offering terms. This is not a projected return. No payout amount or timeline is promised.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choose amount</CardTitle>
          <CardDescription>Whole note units at {formatHbar(offering.terms.noteUnitPriceTinybars)} each. Minimum {offering.terms.minimumPurchaseUnits.toString()} units.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset disabled={locked}>
            <legend className="sr-only">Amount</legend>
            <div className="flex flex-wrap gap-2">
              {presets.map((units, index) => (
                <label key={units.toString()} className={chipClass(preset === units)}>
                  <input type="radio" name="units-preset" value={units.toString()} checked={preset === units} onChange={() => { setPreset(units); setUnitsInput(units.toString()); }} />
                  <span className="font-medium">{formatHbar(paymentTinybars(offering, units))}</span>
                  <span className="text-xs text-muted-foreground">{units.toString()} units{index === 0 ? " minimum" : ""}</span>
                </label>
              ))}
              <label className={chipClass(preset === null)}>
                <input type="radio" name="units-preset" value="custom" checked={preset === null} onChange={() => setPreset(null)} />
                <span className="font-medium">Custom</span>
                <span className="text-xs text-muted-foreground">{offering.terms.minimumPurchaseUnits.toString()} to {offering.terms.maximumNoteUnits.toString()} units</span>
              </label>
            </div>
          </fieldset>
          <div hidden={preset !== null}>
            <label className="block space-y-2 text-sm">
              <span className="font-medium">Units</span>
              <input name="units" inputMode="numeric" value={unitsInput} disabled={locked} aria-invalid={!validation.ok} aria-describedby="backing-units-message" onChange={(event: ChangeEvent<HTMLInputElement>) => setUnitsInput(event.target.value)} className="block w-full rounded-control border border-border bg-background px-3 py-2" />
            </label>
            <p id="backing-units-message" className="mt-2 text-sm text-muted-foreground">{validation.ok ? "Whole units within the offering bounds." : validation.message}</p>
          </div>
          <p className="text-base font-medium">{readoutTinybars === null ? "—" : `${formatHbar(readoutTinybars)} for ${readoutUnits} note units`}</p>
          <label className="flex items-start gap-3 text-sm">
            <input name="acknowledgement" type="checkbox" checked={acknowledged} disabled={locked} onChange={(event: ChangeEvent<HTMLInputElement>) => setAcknowledged(event.target.checked)} className="mt-1" />
            <span>I understand this is a testnet experiment with no real funds, that units are allocated only after the issuer signs, and that the payout cap is {formatHbar(offering.terms.payoutCapTinybars)}.</span>
          </label>
        </CardContent>
      </Card>

      <section aria-labelledby="backing-status" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="backing-status" className="text-lg font-semibold">Funding</h2>
          {label === null ? null : <Badge variant="outline">{label}</Badge>}
        </div>
        <p aria-live="polite" className="text-sm text-muted-foreground">{notice ?? describeView(view, payment)}</p>
        <WalletIsland />
        {view.kind === "choosing" ? (
          <div className="space-y-2">
            <Button disabled={!canPrepare} aria-disabled={!canPrepare} onClick={prepare}>Prepare and fund</Button>
            <p className="text-xs text-muted-foreground">{dashboardAddress === null ? "Sign in to the dashboard first so a submitted payment can be confirmed and restored." : dashboardMatchesWallet ? "Two confirmations: one signature, one HBAR transfer." : "The connected MetaMask wallet must match the signed dashboard wallet before funding."}</p>
          </div>
        ) : null}
        {request !== null && session !== null ? <SignatureDialog provider={session.provider} request={request} onResult={onSignature} /> : null}
        {view.kind === "prepared" ? (
          <Button disabled={transferring || session === null} aria-disabled={transferring || session === null} onClick={send}>
            Send {formatHbar(view.intent.tinybars)} to the treasury
          </Button>
        ) : null}
        {view.kind === "payment_submitted" ? (
          <div className="space-y-2">
            {payment === null ? <Button variant="outline" onClick={() => void persistPayment(view.intent, view.transactionHash)}>Retry payment verification</Button> : null}
            <h3 className="text-sm font-medium">What happens next</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Mirror Node records the transfer. The request moves to allocation_pending.</li>
              <li>The issuer signs the allocation. Units are issued to the connected address.</li>
            </ol>
          </div>
        ) : null}
        {payment?.status === "PREPARED" && pending !== null ? <Button variant="outline" onClick={() => void persistPayment(pending.intent, pending.transactionHash)}>Attach recorded transaction</Button> : null}
        {payment !== null && hashscanTransactionUrl(payment.transactionHash) !== null ? (
          <a href={hashscanTransactionUrl(payment.transactionHash)!} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-primary hover:text-brand-purple">View on HashScan</a>
        ) : null}
      </section>
    </div>
  );
}

export function BackingFlow({ projection, initialPayment = null, dashboardAddress = null }: { projection: BackingProjection | null; initialPayment?: BackingPaymentRecord | null; dashboardAddress?: string | null }) {
  const offering = readBackingOffering(projection);
  if (offering === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backing is unavailable</CardTitle>
          <CardDescription>No offering is available to back on this host. Nothing was requested, signed, or sent.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return <BackingForm offering={offering} initialPayment={initialPayment} dashboardAddress={dashboardAddress} />;
}
