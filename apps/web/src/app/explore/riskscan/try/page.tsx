import { RiskScanRequestFlow } from "../../../../components/riskscan/request/riskscan-request-flow";

export default function RiskScanTryPage() {
  return (
    <main className="py-6 sm:py-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Try RiskScan
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Submit a bounded Quick request to the local RiskScan endpoint.
          </p>
        </header>
        <RiskScanRequestFlow />
      </article>
    </main>
  );
}
