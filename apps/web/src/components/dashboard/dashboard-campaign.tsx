import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth";
import { readDashboardCampaign, riskScanOfferingPublicId } from "../../lib/dashboard-campaign";
import { readProviderProjections } from "../../lib/offering-projection";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { NewToolAction } from "../provider/deploy/new-tool-action";
import { ProviderToolList } from "./provider-tool-list";

export async function DashboardCampaign() {
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const cookieStore = await cookies();
  const session = await readDashboardSession(
    sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null,
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
              <Link href="/provider/deploy" className={buttonVariants({ size: "sm" })}>Prepare a tool</Link>
              <Link href="/explore/riskscan" className="text-sm font-semibold text-primary transition-colors hover:text-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Explore RiskScan</Link>
            </div>
          </CardContent>
          <CardContent className="border-t pt-4"><p className="text-sm font-semibold">Your tools</p><ProviderToolList /></CardContent>
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
    <section aria-label="Your campaign">
      <Card className="rounded-card border-border bg-card shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Your campaign</p>
            <h2 className="text-xl font-bold tracking-[-0.035em] text-foreground">{campaign.title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Badge variant="secondary">{campaign.state}</Badge>
            <Link href={campaign.href} className={buttonVariants({ size: "sm" })}>{action}</Link>
            <NewToolAction />
          </div>
        </CardContent>
        <CardContent className="border-t pt-4"><p className="text-sm font-semibold">Your tools</p><ProviderToolList /></CardContent>
      </Card>
    </section>
  );
}
