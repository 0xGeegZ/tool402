import { RiskScanNativeQuoteCompatibility } from "../../../../components/riskscan/native-quote/riskscan-native-quote-compatibility";

export default function RiskScanNativeQuoteCompatibilityPage() {
  return (
    <main className="py-6 sm:py-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Native quote compatibility
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Run a guest compatibility check against the local RiskScan directory.
          </p>
        </header>
        <RiskScanNativeQuoteCompatibility />
      </article>
    </main>
  );
}
