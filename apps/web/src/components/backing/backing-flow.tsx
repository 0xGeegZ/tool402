"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";

import { isUserRejection } from "../../lib/wallet/metamask-provider.ts";
import { hashscanTransactionUrl } from "../../lib/hashscan-links.ts";
import type { BackingPaymentRead, BackingPaymentRecord } from "../../lib/backing-payment-server.ts";
import { readCurrentSession } from "../../lib/wallet/wallet-state.ts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DetailList } from "../ui/detail-list";
import { StatusRegion } from "../ui/status";
import { SignatureDialog, type SignatureResult } from "../wallet/signature-dialog";
import { WalletIsland } from "../wallet/wallet-connect";
import { connectedWalletSession, useWalletSession, type WalletSession } from "../wallet/wallet-session";
import { presetUnits, railPosition } from "./backing-presentation";
import {
  backingLifecycleLabels,
  createRecoveredBackingIntent,
  createFrozenBackingIntent,
  formatHbar,
  formatShare,
  isCurrentBackingIntent,
  paymentTinybars,
  readBackingOffering,
  transferRequest,
  validateUnits,
  viewAfterSignature,
  viewAfterTransfer,
  viewForRecoveredPendingPayment,
  type BackingIntent,
  type BackingOffering,
  type BackingProjection,
  type BackingView,
  type FrozenBackingIntentInput,
  type TransferResult,
} from "./backing-state";
import { BackingStepRail } from "./backing-step-rail";
import { assessFundingBalance } from "./backing-balance";

const finalPhases: ReadonlySet<SignatureResult["phase"]> = new Set(["complete", "rejected", "failed", "unknown"]);
const pendingAttachmentPrefix = "tool402-backing-pending-attachment-v2:";
const preparedIntentPrefix = "tool402-backing-prepared-intent-v1:";
type PendingAttachment = Readonly<{ canonicalSignerAddress: string; offeringPublicId: string; intent: Pick<BackingIntent, "idempotencyKey" | "parameters">; transactionHash: `0x${string}`; frozen?: FrozenBackingIntentInput }>;

function pendingAttachmentKey(canonicalSignerAddress: string, offeringPublicId: string, attemptPublicId: string): string {
  return `${pendingAttachmentPrefix}${canonicalSignerAddress}:${offeringPublicId}:${attemptPublicId}`;
}

function pendingAttachment(canonicalSignerAddress: string | null, offeringPublicId: string): PendingAttachment | null {
  if (canonicalSignerAddress === null) return null;
  if (typeof window === "undefined") return null;
  try {
    const prefix = `${pendingAttachmentPrefix}${canonicalSignerAddress}:${offeringPublicId}:`;
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith(prefix)) continue;
      const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
      if (value === null || typeof value !== "object" || Array.isArray(value)) continue;
      const record = value as Record<string, unknown>;
      const intent = record.intent;
      if (record.canonicalSignerAddress === canonicalSignerAddress && record.offeringPublicId === offeringPublicId
        && typeof record.transactionHash === "string" && /^0x[0-9a-f]{64}$/u.test(record.transactionHash)
        && intent !== null && typeof intent === "object" && !Array.isArray(intent)
        && typeof (intent as Record<string, unknown>).idempotencyKey === "string") {
        return { canonicalSignerAddress, offeringPublicId, intent: intent as PendingAttachment["intent"], transactionHash: record.transactionHash as `0x${string}`, ...(record.frozen !== null && typeof record.frozen === "object" && !Array.isArray(record.frozen) ? { frozen: record.frozen as FrozenBackingIntentInput } : {}) };
      }
    }
    return null;
  } catch { return null; }
}

function recoveryFrozenIntent(intent: BackingIntent): FrozenBackingIntentInput {
  const payload = JSON.parse(new TextDecoder().decode(intent.canonicalPayloadBytes)) as Record<string, unknown>;
  return {
    idempotencyKey: intent.idempotencyKey, purchaseIntentId: intent.purchaseIntentId,
    offeringPublicId: intent.parameters.offeringPublicId, subjectPublicId: payload.subjectPublicId as string,
    recipient: intent.treasury, units: intent.parameters.units, tinybars: intent.parameters.tinybars,
    canonicalParametersHash: payload.canonicalParametersHash as string, expiresAt: intent.expiresAt,
  };
}

function preparedIntentKey(canonicalSignerAddress: string, offeringPublicId: string, attemptPublicId: string): string {
  return `${preparedIntentPrefix}${canonicalSignerAddress}:${offeringPublicId}:${attemptPublicId}`;
}

function preparedIntent(canonicalSignerAddress: string | null, offering: BackingOffering): BackingIntent | null {
  if (canonicalSignerAddress === null || typeof window === "undefined") return null;
  try {
    const prefix = `${preparedIntentPrefix}${canonicalSignerAddress}:${offering.offeringPublicId}:`;
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith(prefix)) continue;
      const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
      if (value === null || typeof value !== "object" || Array.isArray(value)) continue;
      const record = value as Record<string, unknown>;
      if (record.canonicalSignerAddress !== canonicalSignerAddress || record.offeringPublicId !== offering.offeringPublicId || record.frozen === null || typeof record.frozen !== "object") continue;
      try { return createFrozenBackingIntent(offering, record.frozen as Parameters<typeof createFrozenBackingIntent>[1], Date.now()); } catch { continue; }
    }
  } catch { /* browser recovery is best effort only */ }
  return null;
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

function BackingForm({ offering, initialPayment, dashboardAddress }: { offering: BackingOffering; initialPayment: BackingPaymentRead; dashboardAddress: string | null }) {
  const wallet = useWalletSession();
  const session: WalletSession | null = connectedWalletSession(wallet);
  const presets = presetUnits(offering.terms);
  const [preset, setPreset] = useState<bigint | null>(offering.terms.minimumPurchaseUnits);
  const [unitsInput, setUnitsInput] = useState(offering.terms.minimumPurchaseUnits.toString());
  const [acknowledged, setAcknowledged] = useState(false);
  const recoveredPending = pendingAttachment(dashboardAddress, offering.offeringPublicId);
  const recoveredIntent = preparedIntent(dashboardAddress, offering) ?? (recoveredPending?.frozen === undefined ? null : (() => {
    try { return createRecoveredBackingIntent(offering, recoveredPending.frozen, Date.now()); } catch { return null; }
  })());
  const [view, setView] = useState<BackingView>(() => viewForRecoveredPendingPayment(recoveredIntent, recoveredPending, initialPayment.kind === "FOUND" ? initialPayment.payment.status : null));
  const [request, setRequest] = useState<BackingIntent | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [payment, setPayment] = useState<BackingPaymentRecord | null>(initialPayment.kind === "FOUND" ? initialPayment.payment : null);
  const [pending, setPending] = useState<PendingAttachment | null>(recoveredPending);
  const sendingRef = useRef(false);
  const validation = validateUnits(offering, unitsInput);
  const label = payment?.status === "CONFIRMED" ? "payment_confirmed" : payment?.status === "REJECTED" ? "payment_rejected" : backingLifecycleLabels[view.kind];
  const committed = request ?? ("intent" in view ? view.intent : null);
  const resumedReservation = payment?.status === "PREPARED" && view.kind === "prepared";
  const paymentReadUnavailable = initialPayment.kind === "UNAVAILABLE";
  const locked = paymentReadUnavailable || (payment !== null && !resumedReservation) || view.kind !== "choosing" || request !== null || preparing;
  const dashboardMatchesWallet = session !== null && dashboardAddress !== null && session.address === dashboardAddress;
  const canPrepare = offering.fundingOpen && initialPayment.kind === "NONE" && payment === null && validation.ok && acknowledged && dashboardMatchesWallet && !locked;
  const readoutUnits = committed !== null ? committed.units : validation.ok ? validation.units : null;
  const readoutTinybars = committed !== null ? committed.tinybars : validation.ok ? paymentTinybars(offering, validation.units) : null;
  const backingPath = offering.offeringPublicId === "riskscan_revenue_note_demo"
    ? "/explore/riskscan/back"
    : `/explore/provider/${encodeURIComponent(offering.offeringPublicId)}/back`;
  const signInHref = `/sign-in?returnTo=${encodeURIComponent(backingPath)}`;

  async function prepare() {
    if (!validation.ok || !canPrepare) return;
    setPreparing(true);
    try {
      const response = await fetch("/api/backing/intent", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ offeringPublicId: offering.offeringPublicId, units: validation.units.toString() }),
      });
      const value: unknown = await response.json();
      if (!response.ok || value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("frozen intent unavailable");
      const frozen = (value as Record<string, unknown>).intent;
      if (frozen === null || typeof frozen !== "object" || Array.isArray(frozen)) throw new Error("invalid frozen intent");
      const intent = createFrozenBackingIntent(offering, frozen as Parameters<typeof createFrozenBackingIntent>[1], Date.now());
      if (dashboardAddress !== null) {
        try { window.localStorage.setItem(preparedIntentKey(dashboardAddress, offering.offeringPublicId, intent.idempotencyKey), JSON.stringify({ canonicalSignerAddress: dashboardAddress, offeringPublicId: offering.offeringPublicId, frozen })); } catch { /* authoritative reservation remains server-side */ }
      }
      setRequest(intent);
    } catch {
      setView({ kind: "choosing", message: "The funding intent could not be prepared. Nothing was signed or sent." });
    } finally {
      setPreparing(false);
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
          try { window.localStorage.removeItem(pendingAttachmentKey(dashboardAddress ?? "", offering.offeringPublicId, intent.idempotencyKey)); } catch { /* recovery storage is best effort only */ }
          try { window.localStorage.removeItem(preparedIntentKey(dashboardAddress ?? "", offering.offeringPublicId, intent.idempotencyKey)); } catch { /* recovery storage is best effort only */ }
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

  async function beginDispatch(intent: BackingIntent): Promise<boolean> {
    try {
      const response = await fetch("/api/backing/payment/dispatch", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptPublicId: intent.idempotencyKey, parameters: intent.parameters }),
      });
      const value: unknown = await response.json();
      if (!response.ok || value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("dispatch claim unavailable");
      const record = value as Record<string, unknown>;
      if (record.status === "RECOVERY_REQUIRED" && typeof record.recoveryAttemptPublicId === "string" && /^[A-Za-z0-9_-]{21}[AQgw]$/u.test(record.recoveryAttemptPublicId)) {
        setView({ kind: "payment_outcome_unknown", intent, message: "A previous funding attempt is unresolved. Reloading its server recovery state; nothing is sent again." });
        window.location.assign(backingPath);
        return false;
      }
      if (record.status !== "OUTCOME_UNKNOWN") throw new Error("dispatch claim unavailable");
      return true;
    } catch {
      setNotice("The funding dispatch could not be claimed. Nothing was sent.");
      return false;
    }
  }

  function onSignature(result: SignatureResult) {
    if (request === null || !finalPhases.has(result.phase)) return;
    const next = viewAfterSignature(result, request);
    if (next.kind !== "prepared") {
      try { window.localStorage.removeItem(preparedIntentKey(dashboardAddress ?? "", offering.offeringPublicId, request.idempotencyKey)); } catch { /* recovery storage is best effort only */ }
    }
    setView(next);
    setRequest(null);
  }

  async function send() {
    if (session === null || dashboardAddress === null || session.address !== dashboardAddress || view.kind !== "prepared" || transferring || sendingRef.current) {
      if (session !== null && dashboardAddress !== null && session.address !== dashboardAddress) setNotice("The connected MetaMask wallet differs from the signed dashboard wallet. Sign in with this backing wallet before funding; nothing was sent.");
      return;
    }
    if (!offering.fundingOpen) {
      setNotice("This offering is closed. The recorded payment can be recovered or rechecked, but no new transfer is sent.");
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
    const request = transferRequest(view, session.address);
    const initialBalance = await assessFundingBalance(session.provider, request);
    if (initialBalance === "INSUFFICIENT") {
      setNotice("Insufficient testnet HBAR for this transfer and its estimated network fee. Nothing was sent.");
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    if (initialBalance === "UNAVAILABLE") {
      setNotice("Your testnet HBAR balance or fee estimate is unavailable. Nothing was sent.");
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    if (!await reservePayment(view.intent)) {
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    const reservedBalance = await assessFundingBalance(session.provider, request);
    if (reservedBalance === "INSUFFICIENT") {
      setNotice("Insufficient testnet HBAR for this transfer and its estimated network fee. The funding reservation remains; nothing was sent.");
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    if (reservedBalance === "UNAVAILABLE") {
      setNotice("Your testnet HBAR balance or fee estimate is unavailable. The funding reservation remains; nothing was sent.");
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    const immediatelyBeforeDispatch = await readCurrentSession(session.provider);
    if (immediatelyBeforeDispatch.state.kind !== "connected" || immediatelyBeforeDispatch.state.address !== session.address || immediatelyBeforeDispatch.state.address !== dashboardAddress) {
      setNotice("MetaMask's account or network changed while funding was prepared. Nothing was sent.");
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    if (!await beginDispatch(view.intent)) {
      sendingRef.current = false;
      setTransferring(false);
      return;
    }
    const afterDispatchClaim = await readCurrentSession(session.provider);
    if (afterDispatchClaim.state.kind !== "connected" || afterDispatchClaim.state.address !== session.address || afterDispatchClaim.state.address !== dashboardAddress) {
      setView({ kind: "payment_outcome_unknown", intent: view.intent, message: "The dispatch was reserved, but MetaMask changed before invocation. Nothing was sent." });
      setNotice("MetaMask's account or network changed before the wallet request. Nothing was sent.");
      setTransferring(false);
      return;
    }
    let result: TransferResult;
    try {
      const response = await session.provider.request(request);
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
      const attachment = { canonicalSignerAddress: dashboardAddress, offeringPublicId: offering.offeringPublicId, intent: { idempotencyKey: view.intent.idempotencyKey, parameters: view.intent.parameters }, transactionHash: result.hash as `0x${string}`, frozen: recoveryFrozenIntent(view.intent) };
      try { window.localStorage.setItem(pendingAttachmentKey(dashboardAddress, offering.offeringPublicId, view.intent.idempotencyKey), JSON.stringify(attachment)); } catch { /* the authoritative attachment still proceeds */ }
      setPending(attachment);
      await persistPayment(attachment.intent, attachment.transactionHash);
    }
    if (result.kind === "declined") sendingRef.current = false;
    setTransferring(false);
  }

  return (
    <div className="space-y-6">
      <BackingStepRail {...railPosition(view.kind, request !== null)} />

      {paymentReadUnavailable ? <StatusRegion>The payment status could not be read. Funding is unavailable until the existing attempt can be recovered or rechecked; nothing is sent.</StatusRegion> : null}

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
            <p className="text-xs text-muted-foreground">{dashboardAddress === null ? <><Link href={signInHref} className="font-semibold text-primary">Sign in</Link> to continue this backing route and restore a submitted payment.</> : dashboardMatchesWallet ? "Two confirmations: one signature, one HBAR transfer." : "The connected MetaMask wallet must match the signed dashboard wallet before funding."}</p>
          </div>
        ) : null}
        {request !== null && session !== null ? <SignatureDialog request={request} onResult={onSignature} /> : null}
        {view.kind === "prepared" ? (
          <Button disabled={transferring || session === null} aria-disabled={transferring || session === null} onClick={send}>
            Send {formatHbar(view.intent.tinybars)} to the treasury
          </Button>
        ) : null}
        {view.kind === "payment_submitted" ? (
          <div className="space-y-2">
            {(payment === null || payment.status === "SUBMITTED" || payment.status === "OUTCOME_UNKNOWN") ? <Button variant="outline" onClick={() => void persistPayment(view.intent, view.transactionHash)}>Retry payment verification</Button> : null}
            <h3 className="text-sm font-medium">What happens next</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Mirror Node records the transfer. The request moves to allocation_pending.</li>
              <li>The issuer signs the allocation. Units are issued to the connected address.</li>
            </ol>
          </div>
        ) : null}
        {pending !== null && payment?.status !== "CONFIRMED" && payment?.status !== "REJECTED" ? <Button variant="outline" onClick={() => void persistPayment(pending.intent, pending.transactionHash)}>Attach recorded transaction</Button> : null}
        {payment !== null && hashscanTransactionUrl(payment.transactionHash) !== null ? (
          <a href={hashscanTransactionUrl(payment.transactionHash)!} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-primary hover:text-brand-purple">View on HashScan</a>
        ) : null}
      </section>
    </div>
  );
}

export function BackingFlow({ projection, initialPayment = { kind: "UNAVAILABLE" }, dashboardAddress = null }: { projection: BackingProjection | null; initialPayment?: BackingPaymentRead; dashboardAddress?: string | null }) {
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
