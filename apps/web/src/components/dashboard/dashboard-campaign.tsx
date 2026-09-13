import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth";
import { readDashboardCampaign, riskScanOfferingPublicId } from "../../lib/dashboard-campaign";
import { hashscanTransactionUrl } from "../../lib/hashscan-links";
import { loadBackerPayment } from "../../lib/backing-payment-server";
import { readProviderProjections } from "../../lib/offering-projection";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { NewToolAction } from "../provider/deploy/new-tool-action";
import { ProviderToolList } from "./provider-tool-list";

function DashboardBacking({ backing }: { backing: NonNullable<Awaited<ReturnType<typeof loadBackerPayment>>> }) {
  const transactionUrl = hashscanTransactionUrl(backing.transactionHash);
  return (
    <section aria-label="Your backing">
      <Card className="rounded-card border-border bg-card shadow-none">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">Your backing</h2><Badge variant="secondary">{backing.status}</Badge></div>
          <p className="text-sm leading-6 text-muted-foreground">RiskScan · {backing.tinybars} tinybars. A confirmed payment remains allocation pending until the issuer signs.</p>
          {transactionUrl === null ? null : <a href={transactionUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary transition-colors hover:text-brand-purple">View on HashScan</a>}
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

  const projections = await readProviderProjections(process.env, globalThis.fetch, riskScanOfferingPublicId);
  const backing = await loadBackerPayment(process.env, sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null);
  const campaign = projections.offering.outcome === "loaded"
    ? readDashboardCampaign(projections.offering.record, session.address)
    : null;

  if (campaign === null) {
    if (backing !== null) {
      return (
        <div className="space-y-6"><DashboardBacking backing={backing} /><section aria-label="Your tools"><Card className="rounded-card border-border bg-card shadow-none"><CardContent className="space-y-3 p-5"><p className="text-sm font-semibold">Your tools</p><ProviderToolList /></CardContent></Card></section></div>
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
            <div className="flex flex-wrap items-center justify-center gap-4">
              <NewToolAction />
              <Link href="/provider/deploy" className={buttonVariants({ variant: "outline", size: "lg", shape: "pill" })}>Prepare a tool</Link>
              <Link href="/explore/riskscan" className="text-sm font-semibold text-primary transition-colors hover:text-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Explore RiskScan</Link>
            </div>
          </CardContent>
          <CardContent className="space-y-3 border-t pt-4"><p className="text-sm font-semibold">Your tools</p><ProviderToolList /></CardContent>
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
            <NewToolAction variant="outline" />
          </div>
        </CardContent>
        <CardContent className="space-y-3 border-t pt-4"><p className="text-sm font-semibold">Your tools</p><ProviderToolList /></CardContent>
        </Card>
      </section>
      {backing === null ? null : <DashboardBacking backing={backing} />}
    </div>
  );
}
