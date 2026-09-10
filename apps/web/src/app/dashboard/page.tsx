import { WorkspaceShell } from "../../components/workspace/workspace-shell";

export default function DashboardPage() {
  return (
    <main className="space-y-10 pb-6 sm:pb-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Guest workspace</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Dashboard</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          Explore Tool402&apos;s current local journeys. Start with RiskScan and choose the next boundary you want to inspect.
        </p>
      </header>
      <WorkspaceShell />
    </main>
  );
}
