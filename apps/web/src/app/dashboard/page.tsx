import { LandingFooter } from "../../components/landing/landing-footer";
import { PageHeader } from "../../components/ui/page-header";
import { WorkspaceShell } from "../../components/workspace/workspace-shell";

export default function DashboardPage() {
  return (
    <>
      <main className="space-y-8 pb-10 sm:space-y-10 sm:pb-14">
        <PageHeader
          eyebrow="Dashboard"
          title="Dashboard"
          description="Current local journeys for inspecting Tool402. Start with RiskScan, then choose the next supported boundary."
        />
        <WorkspaceShell />
      </main>
      <LandingFooter />
    </>
  );
}
