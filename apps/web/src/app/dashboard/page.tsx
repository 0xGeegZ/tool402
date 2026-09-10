import { LandingFooter } from "../../components/landing/landing-footer";
import { WorkspaceShell } from "../../components/workspace/workspace-shell";

export default function DashboardPage() {
  return (
    <>
      <main className="space-y-8 pb-10 sm:space-y-10 sm:pb-14">
        <header className="flex max-w-3xl flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Guest workspace</p>
          <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Dashboard</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Current local journeys for inspecting Tool402. Start with RiskScan, then choose the next supported boundary.
          </p>
        </header>
        <WorkspaceShell />
      </main>
      <LandingFooter />
    </>
  );
}
