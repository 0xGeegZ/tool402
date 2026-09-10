import { GuestRiskScanWorkbench } from "../../../components/workspace/guest-riskscan-workbench";
import { PageHeader } from "../../../components/ui/page-header";

export default function GuestRiskScanWorkbenchPage() {
  return (
    <main className="space-y-8 pb-6 sm:pb-12">
      <PageHeader
        title="RiskScan workbench"
        description="Use this unconfigured guest workbench to inspect local RiskScan boundaries in sequence."
      />
      <GuestRiskScanWorkbench />
    </main>
  );
}
