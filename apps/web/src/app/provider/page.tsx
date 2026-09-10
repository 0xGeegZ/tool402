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
    <main className="space-y-8 pb-6 sm:pb-12">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Provider campaign status</h1>
        <p className="text-lg leading-8 text-muted-foreground">Read the admitted offering and directory records without advancing either one.</p>
        <p className="flex gap-4 text-sm"><Link className="underline" href="/provider/deploy">Open the deploy wizard</Link><Link className="underline" href="/explore/riskscan">Explore RiskScan</Link></p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading admitted records.</p>}><ProviderStatusRegions /></Suspense>
    </main>
  );
}
