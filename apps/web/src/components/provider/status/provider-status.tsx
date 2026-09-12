import Image from "next/image";
import Link from "next/link";

import { Badge } from "../../ui/badge";
import { buttonVariants } from "../../ui/button";
import { DetailList } from "../../ui/detail-list";
import { Status } from "../../ui/status";
import type { OfferingRecord, ProviderProjections } from "../../../lib/offering-projection";
import { formatHbar, formatShare } from "../../../lib/hbar-format";
import { hashscanContractUrl, nextProviderAction, providerCampaignPresentation, providerEvidenceRows } from "./provider-status-state";
import { ProviderTechnicalRecordControl } from "./provider-technical-record-control";

type Projection = ProviderProjections["offering"] | ProviderProjections["directory"];
type IconKind = "coins" | "target" | "capacity" | "calendar" | "shield" | "document" | "offline";

const outcomeSentences = {
  not_configured: "No campaign backend is configured for this host.",
  absent: "No admitted record exists yet.",
  unavailable: "The campaign backend did not answer.",
  unexpected_response: "The campaign backend returned a record this page cannot read.",
} as const;

const activityLabels = {
  "offering.create": "Campaign created",
  "external.prepare": "Asset preparation",
  "revenue note": "Revenue note recorded",
  "directory.publish": "Added to directory",
} as const;

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";
const headingClass = "text-2xl font-extrabold tracking-[-0.04em]";
const cardClass = "rounded-panel border border-border/90 bg-card shadow-[0_18px_55px_-42px_color-mix(in_oklab,var(--foreground)_34%,transparent)]";

function Outcome({ outcome }: { outcome: Projection }) {
  if (outcome.outcome === "loaded") return null;
  const sentence = outcomeSentences[outcome.outcome];
  return outcome.outcome === "absent" || outcome.outcome === "not_configured"
    ? <p className="text-sm text-muted-foreground">{sentence}</p>
    : <Status tone="warning">{sentence}</Status>;
}

function Icon({ kind }: { kind: IconKind }) {
  const common = "size-5";
  if (kind === "coins") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><ellipse cx="12" cy="6" rx="6.5" ry="3" /><path d="M5.5 6v4c0 1.66 2.91 3 6.5 3s6.5-1.34 6.5-3V6M5.5 10v4c0 1.66 2.91 3 6.5 3s6.5-1.34 6.5-3v-4M5.5 14v4c0 1.66 2.91 3 6.5 3s6.5-1.34 6.5-3v-4" /></svg>;
  if (kind === "target") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m12 12 6-6M15 6h3v3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (kind === "capacity") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="m12 3 7.5 4.25v9.5L12 21l-7.5-4.25v-9.5z" /><path d="m4.5 7.25 7.5 4.3 7.5-4.3M12 11.55V21" /></svg>;
  if (kind === "calendar") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3v5M16 3v5M4 10h16" strokeLinecap="round" /></svg>;
  if (kind === "shield") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M12 3 19 6v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (kind === "offline") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><circle cx="12" cy="12" r="8" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="m5.7 5.7 12.6 12.6" strokeLinecap="round" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" strokeLinecap="round" /></svg>;
}

function IconTile({ kind }: { kind: IconKind }) {
  return <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-card bg-brand-purple/10 text-brand-purple"><Icon kind={kind} /></span>;
}

function formatMaturity(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function formatEvidenceTime(value: string) {
  if (value === "not recorded") return "Not recorded";
  const date = /^\d+$/u.test(value) ? new Date(Number(value)) : new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(date);
}

function stageCircle(tone: "complete" | "current", number: number) {
  return tone === "complete"
    ? <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-green text-white shadow-sm"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5"><path d="m5 10 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    : <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white shadow-sm">{number}</span>;
}

function LoadedRegions({ offering, directoryOutcome }: { offering: OfferingRecord; directoryOutcome: ProviderProjections["directory"] }) {
  const directory = directoryOutcome.outcome === "loaded" ? directoryOutcome : undefined;
  const rows = providerEvidenceRows(offering, directory);
  const hashscanUrl = hashscanContractUrl(offering.state, offering.atsAssetEvmAddress);
  const terms = offering.definition.terms;
  const presentation = providerCampaignPresentation(offering.state, directory !== undefined);
  const nextAction = nextProviderAction(offering.state);
  const campaignName = offering.narrative.title;
  const heroDescription = offering.state === "OPEN" && directory !== undefined
    ? "Your offering is published and discoverable."
    : offering.state === "OPEN"
      ? "Your offering is published; its directory record is currently unavailable."
    : offering.state === "CLOSED"
      ? "Your campaign is closed, but its admitted record remains inspectable."
      : "Your offering is recorded locally and ready for its next provider step.";

  return (
    <div data-ui="provider-command-center" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-card/25 [background-image:radial-gradient(color-mix(in_oklab,var(--border)_55%,transparent)_1px,transparent_1px)] [background-size:1.35rem_1.35rem]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 sm:pb-16 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/provider" className={`hover:text-foreground ${focusRing}`}>Provider</Link><span aria-hidden="true">/</span><span>Campaign</span><span aria-hidden="true">/</span><span className="font-medium text-foreground">{campaignName}</span>
        </nav>

        <section data-ui="provider-campaign-hero" aria-labelledby="provider-campaign-title" className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="py-2 sm:py-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-brand-green/25 bg-brand-green/10 px-3 text-xs font-medium text-brand-green"><span aria-hidden="true" className="flex size-4 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">H</span>Hedera testnet preview</span>
              <Badge variant="outline" className="min-h-8 gap-2 border-destructive-foreground/50 bg-card px-3"><Icon kind="offline" />Not live</Badge>
              <Badge variant="outline" className="min-h-8 bg-card px-3">{offering.state}</Badge>
            </div>
            <h1 id="provider-campaign-title" className="mt-6 max-w-[43rem] text-5xl font-extrabold leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-[4.85rem]">{presentation.heroTitle}</h1>
            <p className="mt-4 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">{heroDescription}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className={buttonVariants({ size: "lg", shape: "pill", className: focusRing })} href="/explore/riskscan">Explore RiskScan <span aria-hidden="true" className="ml-2">→</span></Link>
              {nextAction.href === null ? null : <Link className={buttonVariants({ variant: "outline", size: "lg", shape: "pill", className: `bg-card ${focusRing}` })} href={nextAction.href}>{nextAction.message}</Link>}
            </div>
          </div>
          <div aria-hidden="true" className="relative min-h-60 overflow-hidden rounded-panel border border-brand-purple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--secondary)_76%,white),color-mix(in_oklab,var(--brand-purple)_13%,white))] shadow-[0_24px_70px_-45px_color-mix(in_oklab,var(--brand-purple)_75%,transparent)] sm:min-h-72">
            <Image src="/brand/provider-campaign-duo.png" alt="" width={1536} height={1024} priority sizes="(min-width: 1024px) 34rem, calc(100vw - 3rem)" className="absolute bottom-0 left-0 h-[108%] w-[74%] object-contain object-bottom" />
            <p className="absolute right-6 top-1/2 max-w-32 -translate-y-1/2 text-2xl font-extrabold leading-[1.02] tracking-[-0.045em] text-brand-purple/65 sm:right-8 sm:text-3xl">Tools power what&apos;s next.</p>
          </div>
        </section>

        <section data-ui="provider-campaign-progress" aria-label="Campaign progress" className={`${cardClass} grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center`}>
          <div className="flex items-center gap-4">{stageCircle(presentation.offeringTone, 1)}<div><p className="font-bold">1. {presentation.offeringTitle}</p><p className="mt-0.5 text-sm text-muted-foreground">{presentation.offeringStage}</p></div></div>
          <span aria-hidden="true" className="hidden h-px w-16 bg-brand-green lg:block xl:w-28" />
          <div className="flex items-center gap-4">{stageCircle(presentation.directoryTone, 2)}<div><p className="font-bold">2. {presentation.directoryTitle}</p><p className="mt-0.5 text-sm text-muted-foreground">{presentation.directoryStage}</p>{directory === undefined ? <Outcome outcome={directoryOutcome} /> : null}</div></div>
          <span aria-hidden="true" className="hidden h-px w-16 border-t border-dashed border-muted-foreground/40 lg:block xl:w-28" />
          <div className="flex items-center gap-4"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">3</span><div><p className="font-bold text-muted-foreground">3. Backer issuance</p><p className="mt-0.5 text-sm text-muted-foreground">{presentation.issuanceStage}</p></div></div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section data-ui="provider-activity-timeline" aria-labelledby="provider-evidence" className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-4"><h2 id="provider-evidence" className={headingClass}>Activity &amp; proof <span className="sr-only">Deployment evidence</span></h2><ProviderTechnicalRecordControl label="View all activity" className={buttonVariants({ variant: "outline", size: "sm", shape: "pill", className: focusRing })} /></div>
            <ol className="mt-6 space-y-0">
              {rows.map((row, index) => <li key={row[0]} className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[8rem_1.25rem_minmax(0,1fr)] sm:gap-4">
                <time className="text-xs leading-5 text-muted-foreground sm:pt-0.5">{formatEvidenceTime(row[3])}</time>
                <span aria-hidden="true" className="relative hidden justify-center sm:flex"><span className={`mt-1.5 size-3 rounded-full ${row[2] === "not recorded" ? "bg-muted-foreground/35" : "bg-brand-green"}`} />{index === rows.length - 1 ? null : <span className="absolute bottom-0 top-4 w-px bg-border" />}</span>
                <div className="min-w-0 pb-5"><p className="font-bold">{activityLabels[row[0]]}</p><p className="mt-0.5 text-sm leading-5 text-muted-foreground">{row[2]}</p><p className="mt-1 break-words text-xs text-muted-foreground"><span className="font-mono text-foreground/70">{row[0]}</span> · {row[0] === "revenue note" && hashscanUrl !== null ? <a className={`break-all underline underline-offset-4 hover:text-foreground ${focusRing}`} href={hashscanUrl} rel="noreferrer">{row[1]} (leaving the site)</a> : row[1]}</p></div>
              </li>)}
            </ol>
          </section>

          <section data-ui="provider-campaign-snapshot" aria-labelledby="provider-snapshot" className={`${cardClass} flex flex-col p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-4"><h2 id="provider-snapshot" className={headingClass}>Campaign snapshot</h2><Badge variant="secondary" className="px-3 py-1 text-primary">{campaignName}</Badge></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-card bg-secondary/55 p-4"><IconTile kind="coins" /><dl className="flex flex-col-reverse"><dt className="text-sm text-muted-foreground">HBAR unit price</dt><dd className="text-2xl font-extrabold tracking-tight">{formatHbar(BigInt(terms.noteUnitPriceTinybars)).replace(" HBAR", "")}</dd></dl></div>
              <div className="flex items-center gap-4 rounded-card bg-secondary/55 p-4"><IconTile kind="target" /><dl className="flex flex-col-reverse"><dt className="text-sm text-muted-foreground">HBAR target</dt><dd className="text-2xl font-extrabold tracking-tight">{formatHbar(BigInt(terms.fundingTargetTinybars)).replace(" HBAR", "")}</dd></dl></div>
              <div className="flex items-center gap-4 rounded-card bg-secondary/55 p-4"><IconTile kind="capacity" /><dl className="flex flex-col-reverse"><dt className="text-sm text-muted-foreground">max units</dt><dd className="text-2xl font-extrabold tracking-tight">{terms.maximumNoteUnits}</dd></dl></div>
              <div className="flex items-center gap-4 rounded-card bg-secondary/55 p-4"><IconTile kind="calendar" /><dl className="flex flex-col-reverse"><dt className="text-sm text-muted-foreground">maturity</dt><dd className="text-xl font-extrabold tracking-tight">{formatMaturity(offering.definition.maturityAt)}</dd></dl></div>
            </div>
            <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2"><Link className={buttonVariants({ shape: "pill", className: focusRing })} href="/explore/riskscan">Explore RiskScan <span aria-hidden="true" className="ml-2">→</span></Link><ProviderTechnicalRecordControl label="View technical record" className={buttonVariants({ variant: "outline", shape: "pill", className: focusRing })} /></div>
          </section>
        </div>

        <div data-ui="provider-supporting-cards" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <section className={`${cardClass} p-5`}><div className="flex items-center gap-3"><IconTile kind="coins" /><h2 className="text-base font-bold">Economics</h2></div><dl className="mt-4 grid grid-cols-2 gap-4"><div><dd className="font-bold">{formatHbar(BigInt(terms.noteUnitPriceTinybars))}</dd><dt className="text-xs text-muted-foreground">unit price</dt></div><div><dd className="font-bold">{formatHbar(BigInt(terms.fundingTargetTinybars))}</dd><dt className="text-xs text-muted-foreground">target</dt></div></dl></section>
          <section className={`${cardClass} p-5`}><div className="flex items-center gap-3"><IconTile kind="capacity" /><h2 className="text-base font-bold">Capacity</h2></div><dl className="mt-4 grid grid-cols-2 gap-4"><div><dd className="font-bold">{terms.maximumNoteUnits}</dd><dt className="text-xs text-muted-foreground">max units</dt></div><div><dd className="font-bold">{terms.minimumPurchaseUnits}</dd><dt className="text-xs text-muted-foreground">minimum</dt></div></dl></section>
          <section className={`${cardClass} p-5`}><div className="flex items-center gap-3"><IconTile kind="shield" /><h2 className="text-base font-bold">Governance</h2></div><dl className="mt-4 grid grid-cols-2 gap-4"><div><dd className="font-bold">{formatShare(BigInt(terms.issuerShareBps))}%</dd><dt className="text-xs text-muted-foreground">issuer share</dt></div><div><dd className="font-bold">{formatShare(BigInt(terms.reserveShareBps))}%</dd><dt className="text-xs text-muted-foreground">reserve share</dt></div></dl></section>
          <section className={`${cardClass} p-5`}><div className="flex items-center gap-3"><IconTile kind="document" /><h2 className="text-base font-bold">Trust details</h2></div>{directory === undefined ? <div className="mt-4"><Outcome outcome={directoryOutcome} /></div> : <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3 border-b pb-2"><dt>Directory</dt><dd className="text-muted-foreground">v{directory.directoryVersion}</dd></div><div className="flex justify-between gap-3 border-b pb-2"><dt>Signer</dt><dd className="text-success-foreground">Recorded</dd></div><div className="flex justify-between gap-3"><dt>Endpoint</dt><dd className="text-muted-foreground">Recorded</dd></div></dl>}</section>
        </div>

        <details id="technical-record" data-ui="provider-technical-record" className={`${cardClass} group scroll-mt-24 p-5 sm:p-6`}>
          <summary className="flex list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden"><span>Technical record</span><span aria-hidden="true" className="text-brand-purple transition-transform group-open:rotate-180">⌄</span></summary>
          <div className="mt-6 grid gap-8 border-t pt-6 lg:grid-cols-2">
            <section aria-labelledby="provider-terms"><h2 id="provider-terms" className="text-lg font-bold">Active terms <span className="sr-only">Economics Capacity Governance</span></h2><div className="mt-4"><DetailList columns={2} items={[["Funding target", formatHbar(BigInt(terms.fundingTargetTinybars))], ["Payout cap", formatHbar(BigInt(terms.payoutCapTinybars))], ["Unit price", formatHbar(BigInt(terms.noteUnitPriceTinybars))], ["Maximum units", terms.maximumNoteUnits], ["Minimum purchase units", terms.minimumPurchaseUnits], ["Reserve share", `${formatShare(BigInt(terms.reserveShareBps))}%`], ["Issuer share", `${formatShare(BigInt(terms.issuerShareBps))}%`], ["Platform fee", `${formatShare(BigInt(terms.platformFeeBps))}%`], ["Maturity", offering.definition.maturityAt], ["Qualifying resource", offering.definition.qualifyingResource], ["Advertised quick price", formatHbar(BigInt(offering.advertisedQuickPriceTinybars))], ["Advertised standard price", formatHbar(BigInt(offering.advertisedStandardPriceTinybars))]]} /></div><p className="mt-4 text-sm leading-6 text-muted-foreground">A material change needs a separately signed offering and directory version.</p></section>
            <section aria-labelledby="provider-directory"><h2 id="provider-directory" className="text-lg font-bold">Active directory</h2>{directory === undefined ? <div className="mt-4"><Outcome outcome={directoryOutcome} /></div> : <div className="mt-4"><DetailList columns={2} items={[["Service", directory.record.serviceSlug], ["Version", String(directory.directoryVersion)], ["Status", directory.record.status], ["Endpoint", directory.record.x402Endpoint], ["Clearing account", directory.record.clearingAccount]]} /></div>}<p className="mt-5 break-all font-mono text-sm">{offering.canonicalSignerAddress}</p><p className="mt-1 text-sm text-muted-foreground">Signer of the admitted command on chain 296.</p></section>
          </div>
        </details>
      </div>
    </div>
  );
}

export function ProviderStatus({ projections }: { projections: ProviderProjections }) {
  const offering = projections.offering.outcome === "loaded" ? projections.offering.record : undefined;
  const directory = projections.directory.outcome === "loaded" ? projections.directory : undefined;
  if (offering !== undefined) return <LoadedRegions offering={offering} directoryOutcome={projections.directory} />;

  return (
    <div className="space-y-8 py-10">
      <header className="space-y-3"><Badge variant="outline">Tool operator</Badge><h1 className="text-4xl font-extrabold tracking-[-0.045em]">Campaign status</h1><p className="max-w-2xl text-lg text-muted-foreground">Read the local offering and directory records without advancing them.</p></header>
      <section data-ui="provider-status-block" aria-labelledby="provider-next-action" className="space-y-6 rounded-panel border border-brand-purple/30 bg-secondary p-6 sm:p-7">
        <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2"><div><dt className={labelClass}>Offering record</dt><dd className="mt-2"><Outcome outcome={projections.offering} /></dd></div><div><dt className={labelClass}>Directory record</dt><dd className="mt-2">{directory === undefined ? <Outcome outcome={projections.directory} /> : null}</dd></div></dl>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="provider-next-action" className="text-2xl font-semibold tracking-[-0.03em]">Prepare a provider offering</h2><p className="mt-2 max-w-prose text-sm leading-6 text-foreground/80">Prepare the existing RiskScan offering in the local wizard. Backer issuance is not available in this demo. <Link className={`underline underline-offset-4 ${focusRing}`} href="/docs/providers">How provider records are admitted</Link></p></div><Link className={buttonVariants({ shape: "pill", className: focusRing })} href="/provider/deploy">Prepare an offering</Link></div>
      </section>
    </div>
  );
}
