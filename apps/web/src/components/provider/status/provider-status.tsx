import Link from "next/link";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import type { ProviderProjections } from "../../../lib/offering-projection";
import { hashscanContractUrl, nextProviderAction, providerEvidenceRows } from "./provider-status-state";

function Outcome({ outcome }: { outcome: ProviderProjections["offering"] | ProviderProjections["directory"] }) {
  return <p className="text-sm text-muted-foreground">{outcome.outcome.replaceAll("_", " ")}.</p>;
}

function StatusSummary({ title, outcome }: { title: string; outcome: ProviderProjections["offering"] | ProviderProjections["directory"] }) {
  return (
    <section className="rounded-[calc(var(--radius)*2)] border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="mt-2 text-lg font-semibold tracking-tight"><Outcome outcome={outcome} /></div>
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
    <div className="space-y-8">
      <section aria-labelledby="provider-status-ribbon" className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
        <h2 id="provider-status-ribbon" className="sr-only">State ribbon</h2>
        {offering === undefined && directory === undefined ? <p className="text-sm text-muted-foreground">No provider records are configured in this environment.</p> : <>
          {offering === undefined ? <Outcome outcome={projections.offering} /> : <><Badge variant="outline">{offering.state}</Badge><span className="text-sm text-muted-foreground">Terms v{offering.definition.terms.version}</span></>}
          {directory === undefined ? <Outcome outcome={projections.directory} /> : <span className="text-sm text-muted-foreground">Directory v{directory.directoryVersion} · {directory.record.status}</span>}
        </>}
      </section>

      <section aria-labelledby="provider-next-action" className="flex flex-col gap-5 rounded-[calc(var(--radius)*2)] border border-brand-purple/30 bg-[#e9e1ff] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple">Next action</p>
          <h2 id="provider-next-action" className="text-xl font-semibold tracking-tight">{action?.message ?? "Prepare a provider offering"}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {action === undefined ? "No admitted offering record is configured in this environment. Use the local wizard to prepare the next step." : "Review the current local preparation before advancing the provider path."}
          </p>
        </div>
        <Link className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/provider/deploy">Open the deploy wizard</Link>
      </section>

      <section aria-labelledby="provider-current-state" className="space-y-4">
        <h2 id="provider-current-state" className="text-xl font-semibold tracking-tight">Current provider state</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatusSummary title="Offering record" outcome={projections.offering} />
          <StatusSummary title="Directory record" outcome={projections.directory} />
          <section className="rounded-[calc(var(--radius)*2)] border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Provider action</p>
            <p className="mt-2 text-lg font-semibold tracking-tight">{action?.href === null ? "No further action" : "Open the local wizard"}</p>
          </section>
        </div>
      </section>

      <section aria-labelledby="provider-evidence" className="rounded-[calc(var(--radius)*2)] border bg-card p-5 shadow-sm">
        <h2 id="provider-evidence" className="text-xl font-semibold tracking-tight">Deployment evidence</h2>
        <div className="mt-4">
          {rows === undefined ? <Outcome outcome={projections.offering} /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Record</th><th>Reference</th><th>Verification</th><th>Time</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[0] === "revenue note" && hashscanUrl !== null ? <a href={hashscanUrl} rel="noreferrer">{row[1]} (leaving the site)</a> : row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody></table></div>}
        </div>
      </section>

      <Card className="rounded-[calc(var(--radius)*2)]"><CardHeader><CardTitle>Active terms</CardTitle></CardHeader><CardContent>{offering === undefined ? <Outcome outcome={projections.offering} /> : <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt>Funding target</dt><dd>{offering.definition.terms.fundingTargetTinybars}</dd></div><div><dt>Unit price and maximum units</dt><dd>{offering.definition.terms.noteUnitPriceTinybars} · {offering.definition.terms.maximumNoteUnits}</dd></div><div><dt>Minimum units</dt><dd>{offering.definition.terms.minimumPurchaseUnits}</dd></div><div><dt>Shares</dt><dd>{offering.definition.terms.reserveShareBps} · {offering.definition.terms.issuerShareBps} · {offering.definition.terms.platformFeeBps}</dd></div><div><dt>Payout cap</dt><dd>{offering.definition.terms.payoutCapTinybars}</dd></div><div><dt>Maturity</dt><dd>{offering.definition.maturityAt}</dd></div><div><dt>Qualifying resource</dt><dd>{offering.definition.qualifyingResource}</dd></div><div><dt>Advertised prices</dt><dd>{offering.advertisedQuickPriceTinybars} · {offering.advertisedStandardPriceTinybars}</dd></div></dl>}<p className="mt-4 text-sm text-muted-foreground">A material change needs a separately signed offering and directory version.</p></CardContent></Card>

      <Card className="rounded-[calc(var(--radius)*2)]"><CardHeader><CardTitle>Active directory</CardTitle></CardHeader><CardContent>{directory === undefined ? <Outcome outcome={projections.directory} /> : <dl className="grid gap-2 text-sm"><div><dt>Service</dt><dd>{directory.record.serviceSlug}</dd></div><div><dt>Version</dt><dd>{directory.directoryVersion}</dd></div><div><dt>Status</dt><dd>{directory.record.status}</dd></div><div><dt>Endpoint</dt><dd>{directory.record.x402Endpoint}</dd></div><div><dt>Clearing account</dt><dd>{directory.record.clearingAccount}</dd></div></dl>}</CardContent></Card>

      <Card className="rounded-[calc(var(--radius)*2)]"><CardHeader><CardTitle>Signer</CardTitle></CardHeader><CardContent>{offering === undefined ? <Outcome outcome={projections.offering} /> : <p className="text-sm">Signer of the admitted command: {offering.canonicalSignerAddress} · chain 296</p>}</CardContent></Card>
    </div>
  );
}
