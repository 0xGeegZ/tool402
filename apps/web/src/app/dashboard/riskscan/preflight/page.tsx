import { RiskScanQuickPreflight } from "../../../../components/riskscan/preflight/riskscan-quick-preflight";
import { PageHeader } from "../../../../components/ui/page-header";

export default function RiskScanQuickPreflightPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="RiskScan Quick preflight"
          description="Review caller-reported disclosures in this guest local preflight before the unsigned request boundary."
        />
        <RiskScanQuickPreflight />
      </article>
    </main>
  );
}
