import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth";
import { readDashboardCampaign, riskScanOfferingPublicId } from "../../lib/dashboard-campaign";
import { formatHbar } from "../../lib/hbar-format";
import { hashscanTransactionUrl } from "../../lib/hashscan-links";
import { loadBackerPayment, loadBackerPayments, type BackingPaymentHistoryRecord } from "../../lib/backing-payment-server";
import { readProviderProjections } from "../../lib/offering-projection";
import { ensureSelfServiceMembership } from "../../lib/provider-tools-server";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { NewToolAction } from "../provider/deploy/new-tool-action";
import { ProviderToolList } from "./provider-tool-list";

function DashboardBacking({ backing }: { backing: BackingPaymentHistoryRecord }) {
  const projectName = backing.offeringPublicId === riskScanOfferingPublicId ? "RiskScan" : "Provider project";
  const transactionUrl = hashscanTransactionUrl(backing.transactionHash);
  const confirmed = backing.status === "CONFIRMED";
  const rejected = backing.status === "REJECTED";
  const issuerAllocationActive = confirmed;
  const statusLabel = confirmed
    ? "Payment confirmed"
    : rejected
      ? "Payment rejected"
      : backing.status === "SUBMITTED"
        ? "Payment submitted"
        : backing.status === "PREPARED"
          ? "Funding reserved"
          : "Verification pending";
  const allocationLabel = confirmed
    ? "Allocation pending — issuer signature required"
    : rejected
      ? "Payment rejected — allocation will not proceed"
      : "Payment verification pending";

  return (
    <section aria-label="Your backing">
      <Card className="rounded-card border-border bg-card shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">{confirmed ? `${projectName} backed` : `${projectName} backing`}</h2>
            <Badge className={confirmed ? "gap-1 bg-emerald-100 text-emerald-800" : rejected ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}>
              {confirmed ? <span aria-hidden="true">✓</span> : null}
              {statusLabel}
            </Badge>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[minmax(11rem,0.72fr)_minmax(0,1.28fr)] md:items-center">
            <div className="rounded-card border border-brand-purple/10 bg-brand-purple/[0.06] px-5 py-4">
              <p className="text-4xl font-extrabold tracking-[-0.055em] text-foreground">{formatHbar(BigInt(backing.tinybars))}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{projectName} backing</p>
            </div>

            <div className="border-border md:border-l md:pl-6">
              <p className="text-sm font-semibold text-foreground">{allocationLabel}</p>
              <div className="relative mt-4 pt-1">
                <div aria-hidden="true" className={`absolute left-[16.67%] right-[16.67%] top-5 h-0.5 ${confirmed ? "bg-gradient-to-r from-emerald-500 via-emerald-500 to-border" : "bg-border"}`} />
                <ol aria-label="Backing progress" className="relative grid grid-cols-3 gap-3">
                  <li className="min-w-0">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${confirmed ? "border-emerald-600 bg-emerald-600 text-white" : rejected ? "border-destructive bg-destructive/10 text-destructive" : "border-border bg-background text-muted-foreground"}`}>{confirmed ? "✓" : "1"}</span>
                    <span className={`mt-2 block text-xs font-semibold leading-5 ${confirmed ? "text-emerald-700" : rejected ? "text-destructive" : "text-muted-foreground"}`}>{statusLabel}</span>
                  </li>
                  <li className="min-w-0">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${issuerAllocationActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>2</span>
                    <span className={`mt-2 block text-xs font-semibold leading-5 ${issuerAllocationActive ? "text-primary" : "text-muted-foreground"}`}>Issuer allocation</span>
                  </li>
                  <li className="min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-muted-foreground">3</span>
                    <span className="mt-2 block text-xs font-semibold leading-5 text-muted-foreground">Units issued</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
            <p className="text-muted-foreground">Hedera Testnet · {projectName}</p>
            {transactionUrl === null ? null : <a href={transactionUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary transition-colors hover:text-brand-purple">View transaction ↗</a>}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export async function DashboardCampaign() {
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const cookieStore = await cookies();
  const session = await readDashboardSession(
    sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null,
    process.env,
  );
  if (session === null) return null;

  const membership = await ensureSelfServiceMembership(
    process.env,
    sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null,
  );
  const projections = await readProviderProjections(process.env, globalThis.fetch, riskScanOfferingPublicId);
  const sessionCookie = sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null;
  const [legacyBacking, backingHistory] = await Promise.all([
    loadBackerPayment(process.env, sessionCookie),
    loadBackerPayments(process.env, sessionCookie),
  ]);
  // Older RiskScan evidence predates self-service frozen intents; retain it
  // until it has a scoped replacement in the new history projection.
  const backing = legacyBacking === null || backingHistory.some((record) => record.offeringPublicId === riskScanOfferingPublicId)
    ? backingHistory
    : [{ ...legacyBacking, offeringPublicId: riskScanOfferingPublicId }, ...backingHistory];
  const campaign = projections.offering.outcome === "loaded"
    ? readDashboardCampaign(projections.offering.record, session.address)
    : null;

  if (campaign === null) {
    if (backing.length !== 0) {
      return (
        <div className="space-y-6"><div className="space-y-4">{backing.map((record) => <DashboardBacking key={record.offeringPublicId} backing={record} />)}</div><section aria-label="Your tools"><Card className="rounded-card border-border bg-card shadow-none"><CardContent className="space-y-3 p-5"><p className="text-sm font-semibold">Your tools</p><ProviderToolList /></CardContent></Card></section></div>
      );
    }
    return (
      <section aria-label="No campaign yet">
        <Card className="rounded-card border-brand-purple/25 bg-brand-purple/5 shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
            <div data-ui="dashboard-empty-mascot" aria-hidden="true">
              <Image
                src="/brand/dashboard-empty-mascot.png"
                alt=""
                width={1024}
                height={1024}
                className="h-36 w-36 object-contain sm:h-40 sm:w-40"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">No campaign yet</h2>
              <p className="text-sm leading-6 text-muted-foreground">There is no RiskScan campaign associated with this signed dashboard session.</p>
            </div>
            {membership.outcome === "ACTIVE" ? null : <p role="status" className="text-sm text-muted-foreground">Self-service onboarding is currently unavailable. Your existing tools and payment records remain available.</p>}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {membership.outcome !== "ACTIVE" ? null : <NewToolAction />}
              {membership.outcome !== "ACTIVE" ? null : <Link href="/provider/deploy" className={buttonVariants({ variant: "outline", size: "lg", shape: "pill" })}>Prepare a tool</Link>}
              <Link href="/explore/riskscan" className="text-sm font-semibold text-primary transition-colors hover:text-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Explore RiskScan</Link>
            </div>
            <a href="https://portal.hedera.com/" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary transition-colors hover:text-brand-purple">Need test HBAR? Open the Hedera Portal faucet ↗</a>
          </CardContent>
        </Card>
      </section>
    );
  }

  const deployed = campaign.state === "OPEN" || campaign.state === "CLOSED";
  const description = deployed
    ? "This Provider campaign is deployed. Review its current deployment state."
    : "Continue the existing Provider campaign without creating a new draft.";
  const action = deployed ? "View deployment" : "Resume deployment";

  return (
    <div className="space-y-6">
      <section aria-label="Your campaign">
        <Card className="rounded-card border-border bg-card shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">{campaign.title}</h2>
              <Badge variant="secondary">{campaign.state}</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link href={campaign.href} className={buttonVariants({ size: "lg", shape: "pill" })}>{action}</Link>
            {membership.outcome !== "ACTIVE" ? null : <NewToolAction variant="outline" />}
          </div>
        </CardContent>
        <CardContent className="space-y-3 border-t pt-4"><p className="text-sm font-semibold">Your tools</p><ProviderToolList /></CardContent>
        </Card>
      </section>
      {backing.length === 0 ? null : <div className="space-y-4">{backing.map((record) => <DashboardBacking key={record.offeringPublicId} backing={record} />)}</div>}
    </div>
  );
}
