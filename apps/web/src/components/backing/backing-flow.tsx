"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";

import { isUserRejection } from "../../lib/wallet/metamask-provider.ts";
import { readCurrentSession } from "../../lib/wallet/wallet-state.ts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DetailList } from "../ui/detail-list";
import { SignatureDialog, type SignatureResult } from "../wallet/signature-dialog";
import { WalletIsland, type WalletSession } from "../wallet/wallet-connect";
import {
  backingLifecycleLabels,
  createBackingIntent,
  formatHbar,
  formatShare,
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

const finalPhases: ReadonlySet<SignatureResult["phase"]> = new Set(["complete", "rejected", "failed", "unknown"]);

function SessionReporter({
  session,
  onSession,
  children,
}: {
  session: WalletSession;
  onSession: (session: WalletSession | null) => void;
  children?: ReactNode;
}) {
  const { provider, address } = session;
  useEffect(() => {
    onSession({ provider, address });
    return () => onSession(null);
  }, [provider, address, onSession]);
  return <>{children}</>;
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
  const [unitsInput, setUnitsInput] = useState(offering.terms.minimumPurchaseUnits.toString());
  const [acknowledged, setAcknowledged] = useState(false);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [view, setView] = useState<BackingView>({ kind: "choosing" });
  const [request, setRequest] = useState<BackingIntent | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const validation = validateUnits(offering, unitsInput);
  const label = backingLifecycleLabels[view.kind];
  const committed = request ?? ("intent" in view ? view.intent : null);
  const locked = view.kind !== "choosing" || request !== null;
  const canPrepare = validation.ok && acknowledged && session !== null && !locked;

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
          <CardTitle>Choose units</CardTitle>
          <CardDescription>Whole units only. The amount is the units multiplied by the unit price.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Units</span>
            <input name="units" inputMode="numeric" value={unitsInput} disabled={locked} aria-invalid={!validation.ok} aria-describedby="backing-units-message" onChange={(event: ChangeEvent<HTMLInputElement>) => setUnitsInput(event.target.value)} className="block w-full rounded-control border border-border bg-background px-3 py-2" />
          </label>
          <p id="backing-units-message" className="text-sm text-muted-foreground">{validation.ok ? "Whole units within the offering bounds." : validation.message}</p>
          <p className="text-sm">Amount: {committed !== null ? formatHbar(committed.tinybars) : validation.ok ? formatHbar(validation.units * offering.terms.noteUnitPriceTinybars) : "—"}</p>
          <label className="flex items-start gap-3 text-sm">
            <input name="acknowledgement" type="checkbox" checked={acknowledged} disabled={locked} onChange={(event: ChangeEvent<HTMLInputElement>) => setAcknowledged(event.target.checked)} className="mt-1" />
            <span>I understand this is a testnet experiment with no real funds, that units are allocated only after the issuer signs, and that the payout cap is {formatHbar(offering.terms.payoutCapTinybars)}.</span>
          </label>
        </CardContent>
      </Card>

      <WalletIsland>
        {(walletSession: WalletSession) => <SessionReporter session={walletSession} onSession={setSession} />}
      </WalletIsland>

      <section aria-labelledby="backing-status" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="backing-status" className="text-lg font-semibold">Funding</h2>
          {label === null ? null : <Badge variant="outline">{label}</Badge>}
        </div>
        <p aria-live="polite" className="text-sm text-muted-foreground">{notice ?? describeView(view)}</p>
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
