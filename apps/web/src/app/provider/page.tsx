import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { ProviderStatus } from "../../components/provider/status/provider-status";
import { Badge } from "../../components/ui/badge";
import { buttonVariants } from "../../components/ui/button";
import { PROVIDER_OFFERING_PUBLIC_ID, readProviderStatus } from "../../lib/offering-projection";

async function ProviderStatusRegions() {
  await connection();
  const status = await readProviderStatus(PROVIDER_OFFERING_PUBLIC_ID);
  return <ProviderStatus status={status} />;
}

export default function ProviderPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 pb-6 sm:pb-12">
      <header className="space-y-4">
        <Badge variant="outline" className="w-fit">Provider workspace</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Provider campaign</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          The durable offering and directory records as the backend projections return them. This page reads; it writes, signs, and advances nothing.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/provider/deploy" className={buttonVariants({})}>Open the deploy wizard</Link>
          <Link href="/explore/riskscan" className={buttonVariants({ variant: "outline" })}>View RiskScan</Link>
        </div>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Reading the offering record.</p>}>
        <ProviderStatusRegions />
      </Suspense>
    </main>
  );
}
