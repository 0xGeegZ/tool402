import { WorkspaceShell } from "../../components/workspace/workspace-shell";
import { PageHeader } from "../../components/ui/page-header";

export default function DashboardPage() {
  return (
    <main className="space-y-10 pb-6 sm:pb-12">
      <PageHeader eyebrow="Guest workspace" title="Dashboard" description="Explore Tool402's current local journeys. Start with RiskScan and choose the next boundary you want to inspect." />
      <WorkspaceShell />
    </main>
  );
}
