import { Suspense } from "react";

import { RiskScanDetail } from "../../../components/riskscan/detail/riskscan-detail";
import { loadRiskScanBackingProjection } from "../../../lib/riskscan-backing-projection";

async function RiskScanDetailRegion() {
  const projection = await loadRiskScanBackingProjection(process.env, globalThis.fetch);
  return <RiskScanDetail projection={projection} />;
}

export default function RiskScanDetailPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <Suspense fallback={<RiskScanDetail projection={null} />}>
        <RiskScanDetailRegion />
      </Suspense>
    </main>
  );
}
