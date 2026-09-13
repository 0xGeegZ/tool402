import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MetaMaskDashboardSignIn } from "../../components/auth/metamask-dashboard-sign-in";
import { dashboardTourHref } from "../../components/demo/demo-tour-navigation";
import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth.ts";

type SignInPageProps = { searchParams: Promise<{ tour?: string | string[]; demoStep?: string | string[] }> };

async function SignInBoundary({ searchParams }: SignInPageProps) {
  const requested = await searchParams;
  const requestedTour = requested.tour;
  const requestedDemoStep = requested.demoStep;
  const tour = requestedTour === "1" ? "1" : null;
  const demoStep = typeof requestedDemoStep === "string" ? requestedDemoStep : null;
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const session = await readDashboardSession(
    sessionCookieName === null ? null : (await cookies()).get(sessionCookieName)?.value ?? null,
    process.env,
    Date.now(),
  );
  if (session !== null) {
    redirect(dashboardTourHref(tour, demoStep));
  }

  return (
    <main className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard access</p>
        <h1 className="text-3xl font-semibold tracking-tight">Unlock your dashboard</h1>
        <p className="text-muted-foreground">Connect MetaMask on Hedera Testnet, then sign one secure authentication message to continue. It does not send funds or cost HBAR.</p>
      </header>
      <MetaMaskDashboardSignIn tour={tour} demoStep={demoStep} />
    </main>
  );
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <Suspense fallback={null}>
      <SignInBoundary searchParams={searchParams} />
    </Suspense>
  );
}
