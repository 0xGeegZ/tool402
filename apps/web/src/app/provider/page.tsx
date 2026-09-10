import Link from "next/link";
import { Suspense } from "react";

import { LandingFooter } from "../../components/landing/landing-footer";
import { ProviderStatus } from "../../components/provider/status/provider-status";
import { readProviderProjections } from "../../lib/offering-projection";

async function ProviderStatusRegions() {
  const projections = await readProviderProjections(process.env, globalThis.fetch, "riskscan_offering_demo");
  return <ProviderStatus projections={projections} />;
}

export default function ProviderPage() {
  return (
    <>
      <main className="space-y-10 pb-12 sm:space-y-12 sm:pb-20">
        <header className="grid gap-7 border-b border-border pb-10 sm:pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">Provider workspace</p>
            <h1 className="text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl lg:text-6xl">Provider workspace</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Prepare a tool offering, then review the current local records before choosing the next provider step.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/provider/deploy">Prepare a tool offering</Link>
            <Link className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/explore/riskscan">Explore RiskScan</Link>
          </div>
        </header>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading admitted records.</p>}><ProviderStatusRegions /></Suspense>
      </main>
      <LandingFooter />
    </>
  );
}
