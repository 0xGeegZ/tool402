import Link from "next/link";
import { cookies } from "next/headers";

import { readDashboardSession } from "../../lib/dashboard-auth/dashboard-auth";
import { readDashboardCampaign } from "../../lib/dashboard-campaign";
import { readProviderProjections } from "../../lib/offering-projection";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const riskScanOfferingPublicId = "riskscan_revenue_note_demo";
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

  if (campaign === null) return null;

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
