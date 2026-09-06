import { RiskScanQuickPreflight } from "../../../../components/riskscan/preflight/riskscan-quick-preflight";

export default function RiskScanQuickPreflightPage() {
  return (
    <main className="py-6 sm:py-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">RiskScan Quick preflight</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Review caller-reported disclosures in this guest local preflight before the unsigned request boundary.
          </p>
        </header>
        <RiskScanQuickPreflight />
      </article>
    </main>
  );
}
