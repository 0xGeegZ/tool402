import Link from "next/link";

import { Badge } from "../../ui/badge";
import { buttonVariants } from "../../ui/button";
import { Status } from "../../ui/status";
import type { OfferingRecord, ProviderProjections } from "../../../lib/offering-projection";
import { formatHbar, formatShare } from "../../../lib/hbar-format";
import { hashscanContractUrl, nextProviderAction, providerEvidenceRows } from "./provider-status-state";

type Projection = ProviderProjections["offering"] | ProviderProjections["directory"];

const outcomeSentences = {
  not_configured: "No campaign backend is configured for this host.",
  absent: "No admitted record exists yet.",
  unavailable: "The campaign backend did not answer.",
  unexpected_response: "The campaign backend returned a record this page cannot read.",
} as const;

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const labelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground";
const headingClass = "text-xl font-semibold tracking-tight";

function Outcome({ outcome }: { outcome: Projection }) {
  if (outcome.outcome === "loaded") return null;
  const sentence = outcomeSentences[outcome.outcome];
  return outcome.outcome === "absent" || outcome.outcome === "not_configured"
    ? <p className="text-sm text-muted-foreground">{sentence}</p>
    : <Status tone="warning">{sentence}</Status>;
}

function Term({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-all font-medium">{value}</dd></div>;
}

function LoadedRegions({ offering, directoryOutcome }: { offering: OfferingRecord; directoryOutcome: ProviderProjections["directory"] }) {
  const directory = directoryOutcome.outcome === "loaded" ? directoryOutcome : undefined;
  const rows = providerEvidenceRows(offering, directory);
  const hashscanUrl = hashscanContractUrl(offering.state, offering.atsAssetEvmAddress);
  const terms = offering.definition.terms;
  return (
    <>
      <section aria-labelledby="provider-evidence" className="space-y-4 border-t border-border pt-8">
        <h2 id="provider-evidence" className={headingClass}>Deployment evidence</h2>
        <div className="overflow-x-auto rounded-field border border-border">
          <table className="w-full min-w-[42rem] text-left text-sm tabular-nums">
            <caption className="sr-only">Admitted commands and recorded references for {offering.offeringPublicId}</caption>
            <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Record</th><th className="px-3 py-3 font-medium">Reference</th><th className="px-3 py-3 font-medium">Verification</th><th className="px-3 py-3 font-medium">Time</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row[0]} className="border-t border-border"><td className="px-3 py-3 font-medium">{row[0]}</td><td className="px-3 py-3">{row[0] === "revenue note" && hashscanUrl !== null ? <a className={`underline-offset-4 hover:underline ${focusRing}`} href={hashscanUrl} rel="noreferrer">{row[1]} (leaving the site)</a> : row[1]}</td><td className="px-3 py-3">{row[2]}</td><td className="px-3 py-3">{row[3]}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="provider-terms" className="space-y-4 border-t border-border pt-8">
        <h2 id="provider-terms" className={headingClass}>Active terms</h2>
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Term label="Funding target" value={formatHbar(BigInt(terms.fundingTargetTinybars))} />
          <Term label="Payout cap" value={formatHbar(BigInt(terms.payoutCapTinybars))} />
          <Term label="Unit price" value={formatHbar(BigInt(terms.noteUnitPriceTinybars))} />
          <Term label="Maximum units" value={terms.maximumNoteUnits} />
          <Term label="Minimum purchase units" value={terms.minimumPurchaseUnits} />
          <Term label="Reserve share" value={`${formatShare(BigInt(terms.reserveShareBps))}%`} />
          <Term label="Issuer share" value={`${formatShare(BigInt(terms.issuerShareBps))}%`} />
          <Term label="Platform fee" value={`${formatShare(BigInt(terms.platformFeeBps))}%`} />
          <Term label="Maturity" value={offering.definition.maturityAt} />
          <Term label="Qualifying resource" value={offering.definition.qualifyingResource} />
          <Term label="Advertised quick price" value={formatHbar(BigInt(offering.advertisedQuickPriceTinybars))} />
          <Term label="Advertised standard price" value={formatHbar(BigInt(offering.advertisedStandardPriceTinybars))} />
        </dl>
        <p className="max-w-prose text-sm leading-6 text-muted-foreground">A material change needs a separately signed offering and directory version.</p>
      </section>

      <section aria-labelledby="provider-directory" className="space-y-4 border-t border-border pt-8">
        <h2 id="provider-directory" className={headingClass}>Active directory</h2>
        {directory === undefined ? <Outcome outcome={directoryOutcome} /> : <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Term label="Service" value={directory.record.serviceSlug} />
          <Term label="Version" value={String(directory.directoryVersion)} />
          <Term label="Status" value={directory.record.status} />
          <Term label="Endpoint" value={directory.record.x402Endpoint} />
          <Term label="Clearing account" value={directory.record.clearingAccount} />
        </dl>}
      </section>

      <section aria-labelledby="provider-signer" className="space-y-3 border-t border-border pt-8">
        <h2 id="provider-signer" className={headingClass}>Signer</h2>
        <p className="break-all font-mono text-sm">{offering.canonicalSignerAddress}</p>
        <p className="text-sm text-muted-foreground">Signer of the admitted command on chain 296.</p>
      </section>
    </>
  );
}

export function ProviderStatus({ projections }: { projections: ProviderProjections }) {
  const offering = projections.offering.outcome === "loaded" ? projections.offering.record : undefined;
  const directory = projections.directory.outcome === "loaded" ? projections.directory : undefined;
  const action = offering === undefined ? { message: "Prepare a provider offering", href: "/provider/deploy" } : nextProviderAction(offering.state);

  return (
    <div className="space-y-10">
      <section data-ui="provider-status-block" aria-labelledby="provider-next-action" className="space-y-6 rounded-panel border border-brand-purple/30 bg-secondary p-6 sm:p-7">
        <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
          <div><dt className={labelClass}>Offering record</dt><dd className="mt-2">{offering === undefined ? <Outcome outcome={projections.offering} /> : <span className="flex flex-wrap items-center gap-2"><Badge variant="outline">{offering.state}</Badge><span className="text-muted-foreground">Terms {offering.definition.terms.version}</span></span>}</dd></div>
          <div><dt className={labelClass}>Directory record</dt><dd className="mt-2">{directory === undefined ? <Outcome outcome={projections.directory} /> : <span className="flex flex-wrap items-center gap-2"><Badge variant="outline">{directory.record.status}</Badge><span className="text-muted-foreground">Directory v{directory.directoryVersion}</span></span>}</dd></div>
        </dl>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 id="provider-next-action" className="text-2xl font-semibold tracking-[-0.03em]">{action.message}</h2>
            <p className="max-w-prose text-sm leading-6 text-foreground/80">
              {offering === undefined ? "Prepare the existing RiskScan offering in the local wizard. A preview is not a public offer. Evidence, terms, directory, and signer appear here once a signed offering command is admitted." : "Review the current local preparation before advancing the provider path."}
              {" "}<Link className={`underline underline-offset-4 ${focusRing}`} href="/docs/providers">How provider records are admitted</Link>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            {action.href === null ? null : <Link className={buttonVariants({ variant: "primary", shape: "pill", className: focusRing })} href="/provider/deploy">Prepare an offering</Link>}
            <Link className={buttonVariants({ variant: "outline", shape: "pill", className: focusRing })} href="/explore/riskscan">Explore RiskScan</Link>
          </div>
        </div>
      </section>

      {offering === undefined ? null : <LoadedRegions offering={offering} directoryOutcome={projections.directory} />}
    </div>
  );
}
