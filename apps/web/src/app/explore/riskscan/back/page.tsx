import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";

import { BackingFlow } from "../../../../components/backing/backing-flow";
import { loadRiskScanBackingProjection } from "../../../../lib/riskscan-backing-projection";
import { readDashboardSession, readDashboardSessionCookieName } from "../../../../lib/dashboard-auth/dashboard-auth";
import { loadLegacyRiskScanPayment, loadBackerPaymentForOffering } from "../../../../lib/backing-payment-server";

async function BackingFlowRegion() {
  const cookieStore = await cookies();
  const name = readDashboardSessionCookieName(process.env);
  const sessionCookie = name === null ? null : cookieStore.get(name)?.value ?? null;
  const [projection, session, scopedPayment, legacyPayment] = await Promise.all([
    loadRiskScanBackingProjection(process.env, globalThis.fetch),
    readDashboardSession(sessionCookie, process.env),
    loadBackerPaymentForOffering(process.env, sessionCookie, "riskscan_revenue_note_demo"),
    loadLegacyRiskScanPayment(process.env, sessionCookie),
  ]);
  const payment = scopedPayment.kind === "FOUND"
    ? scopedPayment
    : legacyPayment.kind === "FOUND"
      ? legacyPayment
      : scopedPayment.kind === "UNAVAILABLE" || legacyPayment.kind === "UNAVAILABLE"
        ? { kind: "UNAVAILABLE" as const }
        : { kind: "NONE" as const };
  return <BackingFlow projection={projection} dashboardAddress={session?.address ?? null} initialPayment={payment} />;
}

export default function RiskScanBackPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <Link href="/explore/riskscan" className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Back to RiskScan
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Back RiskScan</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Request note units and fund them from MetaMask on Hedera Testnet. The issuer allocates units separately.
          </p>
        </header>
        <Suspense fallback={<BackingFlow projection={null} />}>
          <BackingFlowRegion />
        </Suspense>
      </article>
    </main>
  );
}
