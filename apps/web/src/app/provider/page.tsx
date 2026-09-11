import { Suspense } from "react";

import { LandingFooter } from "../../components/landing/landing-footer";
import { ProviderStatus } from "../../components/provider/status/provider-status";
import { PageHeader } from "../../components/ui/page-header";
import { readProviderProjections } from "../../lib/offering-projection";

async function ProviderStatusRegions() {
  const projections = await readProviderProjections(process.env, globalThis.fetch, "riskscan_offering_demo");
  return <ProviderStatus projections={projections} />;
}

export default function ProviderPage() {
  return (
    <>
      <main className="space-y-10 pb-12 sm:space-y-12 sm:pb-20">
        <PageHeader
          eyebrow="Tool operator"
          title="Provider status"
          description="Read the local offering and directory records without advancing them."
        />
        <Suspense fallback={<p aria-live="polite" className="text-sm text-muted-foreground">Loading admitted records.</p>}><ProviderStatusRegions /></Suspense>
      </main>
      <LandingFooter />
    </>
  );
}
