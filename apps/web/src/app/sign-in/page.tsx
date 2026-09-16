import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardSignInPrompt } from "../../components/auth/dashboard-sign-in-prompt";
import { dashboardTourHref, safeDashboardReturnHref } from "../../components/demo/demo-tour-navigation";
import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth.ts";

type SignInPageProps = { searchParams: Promise<{ tour?: string | string[]; demoStep?: string | string[]; returnTo?: string | string[] }> };

async function SignInBoundary({ searchParams }: SignInPageProps) {
  const requested = await searchParams;
  const requestedTour = requested.tour;
  const requestedDemoStep = requested.demoStep;
  const requestedReturnTo = requested.returnTo;
  const tour = requestedTour === "1" ? "1" : null;
  const demoStep = typeof requestedDemoStep === "string" ? requestedDemoStep : null;
  const returnTo = safeDashboardReturnHref(typeof requestedReturnTo === "string" ? requestedReturnTo : null);
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const session = await readDashboardSession(
    sessionCookieName === null ? null : (await cookies()).get(sessionCookieName)?.value ?? null,
    process.env,
    Date.now(),
  );
  if (session !== null) {
    redirect(returnTo ?? dashboardTourHref(tour, demoStep));
  }

  return <DashboardSignInPrompt tour={tour} demoStep={demoStep} returnTo={returnTo} />;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <Suspense fallback={null}>
      <SignInBoundary searchParams={searchParams} />
    </Suspense>
  );
}
