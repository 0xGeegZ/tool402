import { Suspense } from "react";

import { ProviderStatus } from "../../components/provider/status/provider-status";
import { readProviderProjections } from "../../lib/offering-projection";
import { PageHeader } from "../../components/ui/page-header";

async function ProviderStatusRegions() {
  const projections = await readProviderProjections(process.env, globalThis.fetch, "riskscan_offering_demo");
  return <ProviderStatus projections={projections} />;
}

export default function ProviderPage() {
  return (
    <main className="space-y-8 pb-6 sm:pb-12">
      <PageHeader
        eyebrow="Tool operator"
        title="Campaign status"
        description="Read the admitted offering and directory records for this campaign without advancing either one."
        actions={[
          { href: "/provider/deploy", label: "Open the deploy wizard" },
          { href: "/explore/riskscan", label: "Explore RiskScan" },
        ]}
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading admitted records.</p>}><ProviderStatusRegions /></Suspense>
    </main>
  );
}
