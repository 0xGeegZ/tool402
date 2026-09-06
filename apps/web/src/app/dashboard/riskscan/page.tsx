import { GuestRiskScanWorkbench } from "../../../components/workspace/guest-riskscan-workbench";

export default function GuestRiskScanWorkbenchPage() {
  return (
    <main className="space-y-8 py-6 sm:py-12">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">RiskScan workbench</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Use this unconfigured guest workbench to inspect local RiskScan boundaries in sequence.
        </p>
      </header>
      <GuestRiskScanWorkbench />
    </main>
  );
}
