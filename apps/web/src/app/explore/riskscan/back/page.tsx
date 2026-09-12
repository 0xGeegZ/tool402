import { Suspense } from "react";

import { BackingFlow } from "../../../../components/backing/backing-flow";
import { loadRiskScanBackingProjection } from "../../../../lib/riskscan-backing-projection";

async function BackingFlowRegion() {
  const projection = await loadRiskScanBackingProjection(process.env, globalThis.fetch);
  return <BackingFlow projection={projection} />;
}

export default function RiskScanBackPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
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
