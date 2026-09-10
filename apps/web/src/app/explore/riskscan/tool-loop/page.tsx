import { RiskScanToolLoop } from "../../../../components/riskscan/tool-loop/riskscan-tool-loop";
import { PageHeader } from "../../../../components/ui/page-header";

export default function RiskScanToolLoopPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <PageHeader title="RiskScan ToolLoop" description="Submit a bounded Quick request through the local ToolLoop boundary." />
        <RiskScanToolLoop />
      </article>
    </main>
  );
}
