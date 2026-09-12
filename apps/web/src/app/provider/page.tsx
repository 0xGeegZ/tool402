import { Suspense } from "react";

import { LandingFooter } from "../../components/landing/landing-footer";
import { ProviderStatus } from "../../components/provider/status/provider-status";
import { readProviderProjections } from "../../lib/offering-projection";
import { riskScanOfferingPublicId } from "../../lib/dashboard-campaign";
import { parseProviderToolId } from "@tool402/core";
import { notFound } from "next/navigation";

async function ProviderStatusRegions({ selectedToolPublicId }: { selectedToolPublicId?: string }) {
  const projections = await readProviderProjections(
    process.env,
    globalThis.fetch,
    selectedToolPublicId === undefined ? riskScanOfferingPublicId : `offering_${selectedToolPublicId.slice(5)}`,
    selectedToolPublicId === undefined ? undefined : `tool-${selectedToolPublicId.slice(5)}`,
  );
  return <ProviderStatus projections={projections} />;
}

export default async function ProviderPage({ searchParams }: { searchParams: Promise<{ tool?: string | string[] }> }) {
  const tool = (await searchParams).tool;
  const selectedToolPublicId = tool === undefined
    ? undefined
    : typeof tool === "string"
      ? parseProviderToolId(tool)
      : null;
  if (selectedToolPublicId === null) notFound();
  return (
    <>
      <main aria-label="Tool operator Campaign status" className="-mt-10">
        <Suspense fallback={<p aria-live="polite" className="py-10 text-sm text-muted-foreground">Loading admitted records.</p>}><ProviderStatusRegions selectedToolPublicId={selectedToolPublicId} /></Suspense>
      </main>
      <LandingFooter />
    </>
  );
}
