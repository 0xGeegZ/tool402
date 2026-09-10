import Link from "next/link";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import type { ProviderProjections } from "../../../lib/offering-projection";
import { hashscanContractUrl, nextProviderAction, providerEvidenceRows } from "./provider-status-state";

type ProjectionOutcome = ProviderProjections["offering"] | ProviderProjections["directory"];

const outcomeSentences: Record<Exclude<ProjectionOutcome["outcome"], "loaded">, string> = {
  not_configured: "No campaign backend is configured for this host.",
  absent: "No admitted record exists yet.",
  unavailable: "The campaign backend did not answer.",
  unexpected_response: "The campaign backend returned a record this page cannot read.",
};

function Outcome({ outcome }: { outcome: ProjectionOutcome }) {
  return outcome.outcome === "loaded" ? null : <p className="text-sm text-muted-foreground">{outcomeSentences[outcome.outcome]}</p>;
}

export function ProviderStatus({ projections }: { projections: ProviderProjections }) {
  const offering = projections.offering.outcome === "loaded" ? projections.offering.record : undefined;
  const directory = projections.directory.outcome === "loaded" ? projections.directory : undefined;
  const action = offering === undefined ? undefined : nextProviderAction(offering.state);
  const rows = offering === undefined ? undefined : providerEvidenceRows(offering, directory);
  const hashscanUrl = offering === undefined ? null : hashscanContractUrl(offering.state, offering.atsAssetEvmAddress);

  return (
    <div className="space-y-5">
      <section aria-labelledby="provider-status-ribbon" className="flex flex-wrap items-center gap-2">
        <h2 id="provider-status-ribbon" className="sr-only">State ribbon</h2>
        {offering === undefined ? <Outcome outcome={projections.offering} /> : <><Badge variant="outline">{offering.state}</Badge><span className="text-sm text-muted-foreground">Terms v{offering.definition.terms.version}</span></>}
        {directory === undefined ? <Outcome outcome={projections.directory} /> : <span className="text-sm text-muted-foreground">Directory v{directory.directoryVersion} · {directory.record.status}</span>}
      </section>

      <section aria-labelledby="provider-next-action" className="space-y-2">
        <h2 id="provider-next-action" className="text-xl font-semibold">Next action</h2>
        {action === undefined ? <Outcome outcome={projections.offering} /> : <p className="text-sm text-muted-foreground">{action.message} {action.href === null ? null : <Link className="underline" href={action.href}>Open the deploy wizard</Link>}</p>}
      </section>

      <section aria-labelledby="provider-evidence" className="space-y-2">
        <h2 id="provider-evidence" className="text-xl font-semibold">Deployment evidence</h2>
        {rows === undefined ? <Outcome outcome={projections.offering} /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Record</th><th>Reference</th><th>Verification</th><th>Time</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[0] === "revenue note" && hashscanUrl !== null ? <a href={hashscanUrl} rel="noreferrer">{row[1]} (leaving the site)</a> : row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody></table></div>}
      </section>

      <Card><CardHeader><CardTitle>Active terms</CardTitle></CardHeader><CardContent>{offering === undefined ? <Outcome outcome={projections.offering} /> : <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt>Funding target</dt><dd>{offering.definition.terms.fundingTargetTinybars}</dd></div><div><dt>Unit price and maximum units</dt><dd>{offering.definition.terms.noteUnitPriceTinybars} · {offering.definition.terms.maximumNoteUnits}</dd></div><div><dt>Minimum units</dt><dd>{offering.definition.terms.minimumPurchaseUnits}</dd></div><div><dt>Shares</dt><dd>{offering.definition.terms.reserveShareBps} · {offering.definition.terms.issuerShareBps} · {offering.definition.terms.platformFeeBps}</dd></div><div><dt>Payout cap</dt><dd>{offering.definition.terms.payoutCapTinybars}</dd></div><div><dt>Maturity</dt><dd>{offering.definition.maturityAt}</dd></div><div><dt>Qualifying resource</dt><dd>{offering.definition.qualifyingResource}</dd></div><div><dt>Advertised prices</dt><dd>{offering.advertisedQuickPriceTinybars} · {offering.advertisedStandardPriceTinybars}</dd></div></dl>}<p className="mt-4 text-sm text-muted-foreground">A material change needs a separately signed offering and directory version.</p></CardContent></Card>

      <Card><CardHeader><CardTitle>Active directory</CardTitle></CardHeader><CardContent>{directory === undefined ? <Outcome outcome={projections.directory} /> : <dl className="grid gap-2 text-sm"><div><dt>Service</dt><dd>{directory.record.serviceSlug}</dd></div><div><dt>Version</dt><dd>{directory.directoryVersion}</dd></div><div><dt>Status</dt><dd>{directory.record.status}</dd></div><div><dt>Endpoint</dt><dd>{directory.record.x402Endpoint}</dd></div><div><dt>Clearing account</dt><dd>{directory.record.clearingAccount}</dd></div></dl>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Signer</CardTitle></CardHeader><CardContent>{offering === undefined ? <Outcome outcome={projections.offering} /> : <p className="text-sm">Signer of the admitted command: {offering.canonicalSignerAddress} · chain 296</p>}</CardContent></Card>
    </div>
  );
}
