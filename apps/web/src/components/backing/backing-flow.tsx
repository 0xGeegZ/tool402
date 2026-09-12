"use client";

import { useState, type ChangeEvent } from "react";

import { isUserRejection } from "../../lib/wallet/metamask-provider.ts";
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

function chipClass(selected: boolean): string {
  return `flex min-w-28 flex-col items-start gap-1 rounded-control border px-3 py-2 text-left text-sm ${selected ? "border-primary bg-muted" : "border-border"}`;
}

function describeView(view: BackingView): string {
  switch (view.kind) {
    case "choosing":
      return view.message ?? "Choose units, read the disclosure, and connect MetaMask. Nothing is requested until you sign.";
    case "prepared":
      return `The funding command was accepted. Send exactly ${formatHbar(view.intent.tinybars)} from MetaMask. A signature is not a payment.`;
    case "payment_submitted":
      return `Transfer ${view.transactionHash} was submitted from MetaMask. It is not confirmed here, and units are allocated only after the issuer signs.`;
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

function BackingForm({ offering }: { offering: BackingOffering }) {
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
  const validation = validateUnits(offering, unitsInput);
  const label = backingLifecycleLabels[view.kind];
  const committed = request ?? ("intent" in view ? view.intent : null);
  const locked = view.kind !== "choosing" || request !== null;
  const canPrepare = validation.ok && acknowledged && session !== null && !locked;
  const readoutUnits = committed !== null ? committed.units : validation.ok ? validation.units : null;

  function prepare() {
    if (!validation.ok || !canPrepare) return;
    try {
      setRequest(createBackingIntent(offering, validation.units, Date.now()));
    } catch {
      setView({ kind: "choosing", message: "The funding intent could not be prepared. Nothing was signed or sent." });
    }
  }

  function onSignature(result: SignatureResult) {
    if (request === null || !finalPhases.has(result.phase)) return;
    setView(viewAfterSignature(result, request));
    setRequest(null);
  }

  async function send() {
    if (session === null || view.kind !== "prepared" || transferring) return;
    setTransferring(true);
    setNotice(null);
    const current = await readCurrentSession(session.provider);
    if (current.state.kind !== "connected" || current.state.address !== session.address) {
      setNotice("MetaMask's account or network changed after connecting. Reconnect on Hedera Testnet before sending; nothing was sent.");
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
          <p className="text-base font-medium">{readoutUnits === null ? "—" : `${formatHbar(paymentTinybars(offering, readoutUnits))} for ${readoutUnits} note units`}</p>
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
        <p aria-live="polite" className="text-sm text-muted-foreground">{notice ?? describeView(view)}</p>
        <WalletIsland />
        {view.kind === "choosing" ? (
          <div className="space-y-2">
            <Button disabled={!canPrepare} aria-disabled={!canPrepare} onClick={prepare}>Prepare and fund</Button>
            <p className="text-xs text-muted-foreground">Two confirmations: one signature, one HBAR transfer.</p>
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
            <h3 className="text-sm font-medium">What happens next</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Mirror Node records the transfer. The request moves to allocation_pending.</li>
              <li>The issuer signs the allocation. Units are issued to the connected address.</li>
            </ol>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function BackingFlow({ projection }: { projection: BackingProjection | null }) {
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
  return <BackingForm offering={offering} />;
}
