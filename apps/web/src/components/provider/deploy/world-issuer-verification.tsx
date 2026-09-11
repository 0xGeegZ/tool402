"use client";

import { IDKitRequestWidget, selfieCheckLegacy, type IDKitResult, type RpContext } from "@worldcoin/idkit";
import { useState } from "react";

type RequestValues = Readonly<{ app_id: `app_${string}`; action: string; environment: "staging" | "production"; rp_context: RpContext }>;

export function WorldIssuerVerification({ address, onVerified }: { address: string; onVerified: () => void }) {
  const [request, setRequest] = useState<RequestValues | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("World Selfie Check is required before directory publication.");

  async function start() {
    setStatus("Preparing the World verification request.");
    try {
      const response = await fetch("/api/world/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address }), cache: "no-store" });
      if (!response.ok) throw new Error("request");
      setRequest(await response.json());
      setOpen(true);
    } catch { setStatus("World verification is not available. Check the staging configuration and try again."); }
  }

  async function verify(result: IDKitResult) {
    const response = await fetch("/api/world/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, idkitResponse: result }), cache: "no-store" });
    if (!response.ok) throw new Error("verification");
  }

  return <section aria-labelledby="world-issuer-title" className="rounded-[calc(var(--radius)*0.75)] border bg-background p-4 space-y-3">
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">World ID · staging</p>
      <h3 id="world-issuer-title" className="text-base font-semibold">Verify issuer liveness</h3>
      <p className="text-sm leading-6 text-muted-foreground">Selfie Check is a liveness signal for this session, not identity verification or KYC.</p>
    </div>
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{status}</p>
    <button type="button" onClick={start} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Verify with World</button>
    {request ? <IDKitRequestWidget open={open} onOpenChange={setOpen} app_id={request.app_id} action={request.action} rp_context={request.rp_context} environment={request.environment} allow_legacy_proofs={false} preset={selfieCheckLegacy({ signal: address })} handleVerify={verify} onSuccess={() => { setStatus("World verification complete for this browser session."); onVerified(); }} onError={() => setStatus("World verification did not complete. Try again when you are ready.")} /> : null}
  </section>;
}
