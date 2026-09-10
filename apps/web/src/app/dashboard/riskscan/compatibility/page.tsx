import { RiskScanNativeQuoteCompatibility } from "../../../../components/riskscan/native-quote/riskscan-native-quote-compatibility";
import { PageHeader } from "../../../../components/ui/page-header";

export default function RiskScanNativeQuoteCompatibilityPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="Native quote compatibility"
          description="Run a guest compatibility check against the local RiskScan directory."
        />
        <RiskScanNativeQuoteCompatibility />
      </article>
    </main>
  );
}
