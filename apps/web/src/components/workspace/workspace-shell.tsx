import { Badge } from "../ui/badge";
import { WorkspaceNavigation } from "./workspace-navigation";
import { WorkspaceOverview } from "./workspace-overview";

export function WorkspaceShell() {
  return (
    <section className="max-w-6xl space-y-8" aria-label="Guest workspace">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">Guest workspace</Badge>
        <p className="text-sm leading-6 text-muted-foreground">Choose a local journey to inspect its current boundary.</p>
      </div>
      <WorkspaceOverview />
      <WorkspaceNavigation />
    </section>
  );
}
