import Link from "next/link";

import { Badge } from "../../ui/badge";
import { buttonVariants } from "../../ui/button";
import { DetailList } from "../../ui/detail-list";
import { Status } from "../../ui/status";
import type { OfferingRecord, ProviderProjections } from "../../../lib/offering-projection";
import { formatHbar, formatShare } from "../../../lib/hbar-format";
import { hashscanContractUrl, nextProviderAction, providerCampaignPresentation, providerEvidenceRows } from "./provider-status-state";

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

function LoadedRegions({ offering, directoryOutcome }: { offering: OfferingRecord; directoryOutcome: ProviderProjections["directory"] }) {
  const directory = directoryOutcome.outcome === "loaded" ? directoryOutcome : undefined;
  const rows = providerEvidenceRows(offering, directory);
  const hashscanUrl = hashscanContractUrl(offering.state, offering.atsAssetEvmAddress);
  const terms = offering.definition.terms;
  const presentation = providerCampaignPresentation(offering.state, directory !== undefined);
  return (
    <div data-ui="provider-command-center" className="space-y-8">
      <section aria-labelledby="provider-campaign-title" className="rounded-panel border border-brand-purple/30 bg-secondary p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap gap-2"><Badge variant="outline">Not live</Badge><Badge variant="outline">{offering.state}</Badge></div><p className={`mt-5 ${labelClass}`}>RiskScan campaign</p><h2 id="provider-campaign-title" className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{presentation.heroTitle}</h2><p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">Your offering is recorded locally. Read the admitted evidence before advancing the provider path.</p></div><Link className={buttonVariants({ variant: "outline", shape: "pill", className: focusRing })} href="/explore/riskscan">Explore RiskScan</Link></div>
        <div aria-label="Campaign progress" className="mt-7 grid gap-4 rounded-card border bg-card p-4 sm:grid-cols-3"><div><p className={labelClass}>Offering record</p><p className="mt-2 font-semibold">{presentation.offeringStage}</p></div><div><p className={labelClass}>Directory record</p><p className="mt-2 font-semibold">{presentation.directoryStage}</p>{directory === undefined ? <Outcome outcome={directoryOutcome} /> : null}</div><div><p className={labelClass}>Backer issuance</p><p className="mt-2 font-semibold">{presentation.issuanceStage}</p></div></div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2"><section aria-labelledby="provider-snapshot" className="rounded-panel border bg-card p-5 sm:p-6"><h2 id="provider-snapshot" className={headingClass}>Campaign snapshot</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className={labelClass}>Unit price</dt><dd className="mt-1 text-xl font-bold">{formatHbar(BigInt(terms.noteUnitPriceTinybars))}</dd></div><div><dt className={labelClass}>Funding target</dt><dd className="mt-1 text-xl font-bold">{formatHbar(BigInt(terms.fundingTargetTinybars))}</dd></div><div><dt className={labelClass}>Maximum units</dt><dd className="mt-1 text-xl font-bold">{terms.maximumNoteUnits}</dd></div><div><dt className={labelClass}>Maturity</dt><dd className="mt-1 font-semibold">{offering.definition.maturityAt}</dd></div></dl></section>
      <section aria-labelledby="provider-evidence" className="space-y-4 border-t border-border pt-8">
        <h2 id="provider-evidence" className={headingClass}>Activity &amp; proof <span className="sr-only">Deployment evidence</span></h2>
        <div className="overflow-x-auto rounded-field border border-border">
          <table className="w-full min-w-[42rem] text-left text-sm tabular-nums">
            <caption className="sr-only">Admitted commands and recorded references for {offering.offeringPublicId}</caption>
            <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Record</th><th className="px-3 py-3 font-medium">Reference</th><th className="px-3 py-3 font-medium">Verification</th><th className="px-3 py-3 font-medium">Time</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row[0]} className="border-t border-border"><td className="px-3 py-3 font-medium">{row[0]}</td><td className="px-3 py-3">{row[0] === "revenue note" && hashscanUrl !== null ? <a className={`underline-offset-4 hover:underline ${focusRing}`} href={hashscanUrl} rel="noreferrer">{row[1]} (leaving the site)</a> : row[1]}</td><td className="px-3 py-3">{row[2]}</td><td className="px-3 py-3">{row[3]}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3"><section className="rounded-panel border bg-card p-5"><h2 className="text-lg font-semibold">Economics</h2><p className="mt-3 text-sm text-muted-foreground">Target {formatHbar(BigInt(terms.fundingTargetTinybars))} · Unit {formatHbar(BigInt(terms.noteUnitPriceTinybars))}</p></section><section className="rounded-panel border bg-card p-5"><h2 className="text-lg font-semibold">Capacity</h2><p className="mt-3 text-sm text-muted-foreground">{terms.maximumNoteUnits} maximum units · {terms.minimumPurchaseUnits} minimum purchase</p></section><section className="rounded-panel border bg-card p-5"><h2 className="text-lg font-semibold">Governance</h2><p className="mt-3 text-sm text-muted-foreground">{formatShare(BigInt(terms.issuerShareBps))}% issuer share · {formatShare(BigInt(terms.platformFeeBps))}% platform fee</p></section></div>
      <section aria-labelledby="provider-terms" className="space-y-4 border-t border-border pt-8">
        <h2 id="provider-terms" className={headingClass}>Active terms <span className="sr-only">Economics Capacity Governance</span></h2>
        <DetailList
          columns={3}
          items={[
            ["Funding target", formatHbar(BigInt(terms.fundingTargetTinybars))],
            ["Payout cap", formatHbar(BigInt(terms.payoutCapTinybars))],
            ["Unit price", formatHbar(BigInt(terms.noteUnitPriceTinybars))],
            ["Maximum units", terms.maximumNoteUnits],
            ["Minimum purchase units", terms.minimumPurchaseUnits],
            ["Reserve share", `${formatShare(BigInt(terms.reserveShareBps))}%`],
            ["Issuer share", `${formatShare(BigInt(terms.issuerShareBps))}%`],
            ["Platform fee", `${formatShare(BigInt(terms.platformFeeBps))}%`],
            ["Maturity", offering.definition.maturityAt],
            ["Qualifying resource", offering.definition.qualifyingResource],
            ["Advertised quick price", formatHbar(BigInt(offering.advertisedQuickPriceTinybars))],
            ["Advertised standard price", formatHbar(BigInt(offering.advertisedStandardPriceTinybars))],
          ]}
        />
        <p className="max-w-prose text-sm leading-6 text-muted-foreground">A material change needs a separately signed offering and directory version.</p>
      </section>

      <section aria-labelledby="provider-directory" className="space-y-4 border-t border-border pt-8">
        <h2 id="provider-directory" className={headingClass}>Trust details <span className="sr-only">Active directory</span></h2>
        {directory === undefined ? <Outcome outcome={directoryOutcome} /> : <DetailList
          columns={3}
          items={[
            ["Service", directory.record.serviceSlug],
            ["Version", String(directory.directoryVersion)],
            ["Status", directory.record.status],
            ["Endpoint", directory.record.x402Endpoint],
            ["Clearing account", directory.record.clearingAccount],
          ]}
        />}
        <p className="mt-5 break-all font-mono text-sm">{offering.canonicalSignerAddress}</p>
        <p className="text-sm text-muted-foreground">Signer of the admitted command on chain 296.</p>
      </section>
    </div>
  );
}

export function ProviderStatus({ projections }: { projections: ProviderProjections }) {
  const offering = projections.offering.outcome === "loaded" ? projections.offering.record : undefined;
  const directory = projections.directory.outcome === "loaded" ? projections.directory : undefined;
  const action = offering === undefined ? { message: "Prepare a provider offering", href: "/provider/deploy" } : nextProviderAction(offering.state);
  const summary = offering === undefined
    ? "Prepare the existing RiskScan offering in the local wizard. A preview is not a public offer. Evidence, terms, directory, and signer appear here once a signed offering command is admitted."
    : offering.state === "OPEN"
      ? "The revenue note and active directory are recorded. Backer issuance is not available in this demo."
      : offering.state === "CLOSED"
        ? "This campaign is closed. Its deployment evidence remains available for inspection."
        : "Review the current local preparation before advancing the provider path.";

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
              {summary}
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
