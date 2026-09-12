import { Suspense } from "react";

import { LandingFooter } from "../../components/landing/landing-footer";
import { ProviderStatus } from "../../components/provider/status/provider-status";
import { readProviderProjections } from "../../lib/offering-projection";
import { riskScanOfferingPublicId } from "../../lib/dashboard-campaign";

async function ProviderStatusRegions() {
  const projections = await readProviderProjections(process.env, globalThis.fetch, riskScanOfferingPublicId);
  return <ProviderStatus projections={projections} />;
}

export default function ProviderPage() {
  return (
    <>
      <main aria-label="Tool operator Campaign status" className="-mt-10">
        <Suspense fallback={<p aria-live="polite" className="py-10 text-sm text-muted-foreground">Loading admitted records.</p>}><ProviderStatusRegions /></Suspense>
      </main>
      <LandingFooter />
    </>
  );
}
