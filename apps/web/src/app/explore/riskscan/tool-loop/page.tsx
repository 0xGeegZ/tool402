import { RiskScanToolLoop } from "../../../../components/riskscan/tool-loop/riskscan-tool-loop";

export default function RiskScanToolLoopPage() {
  return (
    <main className="py-6 sm:py-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">RiskScan ToolLoop</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Submit a bounded Quick request through the local ToolLoop boundary.
          </p>
        </header>
        <RiskScanToolLoop />
      </article>
    </main>
  );
}
