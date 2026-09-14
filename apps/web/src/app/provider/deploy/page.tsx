import { LandingFooter } from "../../../components/landing/landing-footer";
import { ProviderDeployWizard } from "../../../components/provider/deploy/provider-deploy-wizard";
import { NewToolAction } from "../../../components/provider/deploy/new-tool-action";
import { readDashboardSession, readDashboardSessionCookieName } from "../../../lib/dashboard-auth/dashboard-auth";
import { ensureSelfServiceMembership } from "../../../lib/provider-tools-server";
import { parseProviderToolId } from "@tool402/core";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

type ProviderDeployPageProps = {
  readonly searchParams: Promise<{ tool?: string }>;
};

export default function ProviderDeployPage({ searchParams }: ProviderDeployPageProps) {
  return (
    <Suspense fallback={null}>
      <ProviderDeployBoundary searchParams={searchParams} />
    </Suspense>
  );
}

async function ProviderDeployBoundary({ searchParams }: ProviderDeployPageProps) {
  const tool = (await searchParams).tool;
  const parsedToolPublicId = tool === undefined ? undefined : parseProviderToolId(tool);
  if (parsedToolPublicId === null) notFound();
  const selectedToolPublicId = parsedToolPublicId;
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const cookieStore = await cookies();
  const sessionCookie = sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null;
  const session = await readDashboardSession(sessionCookie, process.env, Date.now());
  const returnTo = selectedToolPublicId === undefined ? "/provider/deploy" : `/provider/deploy?tool=${encodeURIComponent(selectedToolPublicId)}`;
  if (session === null) redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  await ensureSelfServiceMembership(
    process.env,
    sessionCookie,
  );
  if (selectedToolPublicId === undefined) {
    return (
      <>
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><section className="rounded-card border bg-card p-6"><h1 className="text-3xl font-bold tracking-tight">Create your provider tool</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Create one tool explicitly, then continue its own resumable deployment. This does not modify the legacy RiskScan campaign.</p><div className="mt-6"><NewToolAction /></div></section></main>
        <LandingFooter />
      </>
    );
  }
  return (
    <>
      <ProviderDeployWizard selectedToolPublicId={selectedToolPublicId} />
      <LandingFooter />
    </>
  );
}
