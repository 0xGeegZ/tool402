import Link from "next/link";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import type { ProviderProjections } from "../../../lib/offering-projection";
import { hashscanContractUrl, nextProviderAction, providerEvidenceRows } from "./provider-status-state";

const outcomeSentences = {
  not_configured: "No campaign backend is configured for this host.",
  absent: "No admitted record exists yet.",
  unavailable: "The campaign backend did not answer.",
  unexpected_response: "The campaign backend returned a record this page cannot read.",
} as const;

function Outcome({ outcome }: { outcome: ProviderProjections["offering"] | ProviderProjections["directory"] }) {
  if (outcome.outcome === "loaded") return null;
  return <p className="text-sm text-muted-foreground">{outcomeSentences[outcome.outcome]}</p>;
}

function StatusSummary({ title, outcome }: { title: string; outcome: ProviderProjections["offering"] | ProviderProjections["directory"] }) {
  return (
    <section className="min-h-32 rounded-card border border-border bg-card p-5 shadow-none">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <div className="mt-3 text-lg font-semibold tracking-tight"><Outcome outcome={outcome} /></div>
    </section>
  );
}

export function ProviderStatus({ projections }: { projections: ProviderProjections }) {
  const offering = projections.offering.outcome === "loaded" ? projections.offering.record : undefined;
  const directory = projections.directory.outcome === "loaded" ? projections.directory : undefined;
  const action = offering === undefined ? undefined : nextProviderAction(offering.state);
  const rows = offering === undefined ? undefined : providerEvidenceRows(offering, directory);
  const hashscanUrl = offering === undefined ? null : hashscanContractUrl(offering.state, offering.atsAssetEvmAddress);

  return (
    <div className="space-y-8 sm:space-y-10">
      <section data-ui="provider-status-ribbon" aria-labelledby="provider-status-ribbon" className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2">
        <h2 id="provider-status-ribbon" className="sr-only">State ribbon</h2>
        {offering === undefined && directory === undefined ? <p className="text-sm text-muted-foreground">No provider records are configured in this environment.</p> : <>
          {offering === undefined ? <Outcome outcome={projections.offering} /> : <><Badge variant="outline">{offering.state}</Badge><span className="text-sm text-muted-foreground">Terms v{offering.definition.terms.version}</span></>}
          {directory === undefined ? <Outcome outcome={projections.directory} /> : <span className="text-sm text-muted-foreground">Directory v{directory.directoryVersion} · {directory.record.status}</span>}
        </>}
      </section>

      <section data-ui="provider-next-action" aria-labelledby="provider-next-action" className="flex flex-col gap-5 rounded-panel border border-brand-purple/30 bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Next action</p>
          <h2 id="provider-next-action" className="text-xl font-semibold tracking-tight">{action?.message ?? "Prepare a provider offering"}</h2>
          <p className="max-w-2xl text-sm leading-6 text-foreground/80">
            {action === undefined ? "No admitted offering record is configured in this environment. Use the local wizard to prepare the next step." : "Review the current local preparation before advancing the provider path."}
          </p>
        </div>
        <Link className="inline-flex min-h-10 touch-target shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/provider/deploy">Open the deploy wizard</Link>
      </section>

      <section aria-labelledby="provider-current-state" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Current scope</p>
            <h2 id="provider-current-state" className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Current provider state</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">These labels reflect the current local projection only.</p>
        </div>
        <div data-ui="provider-overview-state-grid" className="grid gap-4 md:grid-cols-3">
          <StatusSummary title="Offering record" outcome={projections.offering} />
          <StatusSummary title="Directory record" outcome={projections.directory} />
          <section className="min-h-32 rounded-card border border-border bg-card p-5 shadow-none">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Next step</p>
            <div className="mt-3 text-lg font-semibold tracking-tight">{action === undefined ? <Outcome outcome={projections.offering} /> : action.message}</div>
          </section>
        </div>
      </section>

      <section data-ui="provider-riskscan-offering-card" aria-labelledby="provider-riskscan-offering" className="space-y-2 rounded-panel border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Current tool offering</p>
        <h2 id="provider-riskscan-offering" className="text-2xl font-semibold tracking-[-0.03em]">RiskScan</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">The deploy wizard prepares this existing offering. A preview is not a public offer.</p>
      </section>

      <section aria-labelledby="provider-evidence" className="rounded-panel border border-border bg-card p-5 shadow-none sm:p-6">
        <h2 id="provider-evidence" className="text-2xl font-semibold tracking-[-0.03em]">Deployment evidence</h2>
        <div className="mt-4 overflow-x-auto rounded-field border border-dashed border-border bg-secondary/20 p-1">
          {rows === undefined ? <div className="p-4"><Outcome outcome={projections.offering} /></div> : <table className="w-full min-w-[42rem] text-left text-sm"><thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Record</th><th className="px-3 py-3 font-medium">Reference</th><th className="px-3 py-3 font-medium">Verification</th><th className="px-3 py-3 font-medium">Time</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]} className="border-t border-border"><td className="px-3 py-3 font-medium">{row[0]}</td><td className="px-3 py-3">{row[0] === "revenue note" && hashscanUrl !== null ? <a className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={hashscanUrl} rel="noreferrer">{row[1]} (leaving the site)</a> : row[1]}</td><td className="px-3 py-3">{row[2]}</td><td className="px-3 py-3">{row[3]}</td></tr>)}</tbody></table>}
        </div>
      </section>

      <Card className="rounded-panel border-border shadow-none"><CardHeader><CardTitle>Active terms</CardTitle></CardHeader><CardContent>{offering === undefined ? <Outcome outcome={projections.offering} /> : <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Funding target</dt><dd className="mt-1 font-medium">{offering.definition.terms.fundingTargetTinybars}</dd></div><div><dt className="text-muted-foreground">Unit price and maximum units</dt><dd className="mt-1 font-medium">{offering.definition.terms.noteUnitPriceTinybars} · {offering.definition.terms.maximumNoteUnits}</dd></div><div><dt className="text-muted-foreground">Minimum units</dt><dd className="mt-1 font-medium">{offering.definition.terms.minimumPurchaseUnits}</dd></div><div><dt className="text-muted-foreground">Shares</dt><dd className="mt-1 font-medium">{offering.definition.terms.reserveShareBps} · {offering.definition.terms.issuerShareBps} · {offering.definition.terms.platformFeeBps}</dd></div><div><dt className="text-muted-foreground">Payout cap</dt><dd className="mt-1 font-medium">{offering.definition.terms.payoutCapTinybars}</dd></div><div><dt className="text-muted-foreground">Maturity</dt><dd className="mt-1 font-medium">{offering.definition.maturityAt}</dd></div><div><dt className="text-muted-foreground">Qualifying resource</dt><dd className="mt-1 font-medium">{offering.definition.qualifyingResource}</dd></div><div><dt className="text-muted-foreground">Advertised prices</dt><dd className="mt-1 font-medium">{offering.advertisedQuickPriceTinybars} · {offering.advertisedStandardPriceTinybars}</dd></div></dl>}<p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">A material change needs a separately signed offering and directory version.</p></CardContent></Card>

      <Card className="rounded-panel border-border shadow-none"><CardHeader><CardTitle>Active directory</CardTitle></CardHeader><CardContent>{directory === undefined ? <Outcome outcome={projections.directory} /> : <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Service</dt><dd className="mt-1 font-medium">{directory.record.serviceSlug}</dd></div><div><dt className="text-muted-foreground">Version</dt><dd className="mt-1 font-medium">{directory.directoryVersion}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd className="mt-1 font-medium">{directory.record.status}</dd></div><div><dt className="text-muted-foreground">Endpoint</dt><dd className="mt-1 break-all font-medium">{directory.record.x402Endpoint}</dd></div><div><dt className="text-muted-foreground">Clearing account</dt><dd className="mt-1 font-medium">{directory.record.clearingAccount}</dd></div></dl>}</CardContent></Card>

      <Card className="rounded-panel border-border shadow-none"><CardHeader><CardTitle>Signer</CardTitle></CardHeader><CardContent>{offering === undefined ? <Outcome outcome={projections.offering} /> : <p className="break-all text-sm leading-6">Signer of the admitted command: {offering.canonicalSignerAddress} · chain 296</p>}</CardContent></Card>
    </div>
  );
}
