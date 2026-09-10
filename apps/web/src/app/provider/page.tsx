import Link from "next/link";
import { Suspense } from "react";

import { ProviderStatus } from "../../components/provider/status/provider-status";
import { readProviderProjections } from "../../lib/offering-projection";

async function ProviderStatusRegions() {
  const projections = await readProviderProjections(process.env, globalThis.fetch, "riskscan_offering_demo");
  return <ProviderStatus projections={projections} />;
}

export default function ProviderPage() {
  return (
    <main className="space-y-10 pb-12 sm:space-y-12 sm:pb-20">
      <header className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple">Provider workspace</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Provider workspace</h1>
        <p className="text-lg leading-8 text-muted-foreground">Read the admitted offering and directory records without advancing either one.</p>
        <p className="flex flex-wrap gap-3 text-sm">
          <Link className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/provider/deploy">Open the deploy wizard</Link>
          <Link className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 py-2 font-medium transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/explore/riskscan">Explore RiskScan</Link>
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading admitted records.</p>}><ProviderStatusRegions /></Suspense>
    </main>
  );
}
