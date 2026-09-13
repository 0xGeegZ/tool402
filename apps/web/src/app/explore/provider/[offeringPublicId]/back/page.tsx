import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";

import { BackingFlow } from "../../../../../components/backing/backing-flow";
import { loadBackerPaymentForOffering } from "../../../../../lib/backing-payment-server";
import { readDashboardSession, readDashboardSessionCookieName } from "../../../../../lib/dashboard-auth/dashboard-auth";
import { loadProviderBackingProjection } from "../../../../../lib/provider-backing-projection";

async function BackingFlowRegion({ offeringPublicId }: { offeringPublicId: string }) {
  const cookieStore = await cookies();
  const name = readDashboardSessionCookieName(process.env);
  const sessionCookie = name === null ? null : cookieStore.get(name)?.value ?? null;
  const [projection, session, payment] = await Promise.all([
    loadProviderBackingProjection(process.env, globalThis.fetch, offeringPublicId),
    readDashboardSession(sessionCookie, process.env),
    loadBackerPaymentForOffering(process.env, sessionCookie, offeringPublicId),
  ]);
  return <BackingFlow projection={projection} dashboardAddress={session?.address ?? null} initialPayment={payment} />;
}

export default async function ProviderBackPage({ params }: { params: Promise<{ offeringPublicId: string }> }) {
  const { offeringPublicId } = await params;
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <Link href="/explore" className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Back to explore
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Back a published provider tool</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Review the fixed testnet terms, sign the funding intent, then explicitly send HBAR from MetaMask.
          </p>
        </header>
        <Suspense fallback={<div className="min-h-80 rounded-panel border bg-card" aria-busy="true" />}>
          <BackingFlowRegion offeringPublicId={offeringPublicId} />
        </Suspense>
      </article>
    </main>
  );
}
