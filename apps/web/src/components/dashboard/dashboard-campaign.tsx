import Link from "next/link";
import { cookies } from "next/headers";

import { readDashboardSession } from "../../lib/dashboard-auth/dashboard-auth";
import { readDashboardCampaign, riskScanOfferingPublicId } from "../../lib/dashboard-campaign";
import { readProviderProjections } from "../../lib/offering-projection";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const sessionCookieName = "__Host-tool402-dashboard-session";

export async function DashboardCampaign() {
  const session = await readDashboardSession(
    (await cookies()).get(sessionCookieName)?.value ?? null,
    process.env,
  );
  if (session === null) return null;

  const projections = await readProviderProjections(process.env, globalThis.fetch, riskScanOfferingPublicId);
  const campaign = projections.offering.outcome === "loaded"
    ? readDashboardCampaign(projections.offering.record, session.address)
    : null;

  if (campaign === null) {
    return (
      <section aria-label="No campaign yet">
        <Card className="rounded-card border-brand-purple/25 bg-brand-purple/5 shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-tile border border-brand-purple/25 bg-background text-brand-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
                <path d="M7 3.75h7.75L19.5 8.5v11.75H7V3.75Z" strokeLinejoin="round" />
                <path d="M14.75 3.75V8.5h4.75M9.5 12h5M9.5 15.5h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">No campaign yet</h2>
              <p className="text-sm leading-6 text-muted-foreground">There is no RiskScan campaign associated with this signed dashboard session.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/provider/deploy" className={buttonVariants({ size: "sm" })}>Prepare a tool</Link>
              <Link href="/explore/riskscan" className="text-sm font-semibold text-primary transition-colors hover:text-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Explore RiskScan</Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label="Your campaign">
      <Card className="rounded-card border-border bg-card shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Your campaign</p>
            <h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">{campaign.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">Continue the existing Provider campaign without creating a new draft.</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Badge variant="secondary">{campaign.state}</Badge>
            <Link href={campaign.href} className={buttonVariants({ size: "sm" })}>Resume campaign</Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
