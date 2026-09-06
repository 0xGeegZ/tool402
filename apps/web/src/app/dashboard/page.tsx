import { WorkspaceShell } from "../../components/workspace/workspace-shell";

export default function DashboardPage() {
  return (
    <main className="space-y-8 py-6 sm:py-12">
      <header className="max-w-2xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Workspace preview</h1>
      </header>
      <WorkspaceShell />
    </main>
  );
}
