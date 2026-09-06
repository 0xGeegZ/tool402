import { Badge } from "../ui/badge";
import { WorkspaceNavigation } from "./workspace-navigation";
import { WorkspaceOverview } from "./workspace-overview";

export function WorkspaceShell() {
  return (
    <section className="max-w-2xl space-y-6" aria-label="Guest workspace preview">
      <div className="space-y-3">
        <Badge variant="outline">Guest preview</Badge>
        <p className="text-lg leading-8 text-muted-foreground">This is an unconfigured guest workspace. No session is connected.</p>
      </div>
      <WorkspaceOverview />
      <WorkspaceNavigation />
    </section>
  );
}
