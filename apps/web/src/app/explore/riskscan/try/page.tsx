import { RiskScanRequestFlow } from "../../../../components/riskscan/request/riskscan-request-flow";
import { PageHeader } from "../../../../components/ui/page-header";

export default function RiskScanTryPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="Try RiskScan"
          description="Submit a bounded Quick request to the local RiskScan endpoint."
        />
        <RiskScanRequestFlow />
      </article>
    </main>
  );
}
