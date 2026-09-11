import { Badge } from "../ui/badge";
import { WorkspaceNavigation } from "./workspace-navigation";
import { WorkspaceOverview } from "./workspace-overview";

export function WorkspaceShell() {
  return (
    <section className="max-w-7xl space-y-8" aria-label="Guest dashboard">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
            <path d="m8 2 4 1.65v3.1c0 2.55-1.6 4.85-4 5.75-2.4-.9-4-3.2-4-5.75v-3.1L8 2Z" strokeLinejoin="round" />
            <path d="M6.3 7.9 7.35 9l2.35-2.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Guest access
        </Badge>
        <p className="text-sm leading-6 text-muted-foreground">Routes stay local until a supported journey asks you to continue.</p>
      </div>
      <WorkspaceOverview />
      <WorkspaceNavigation />
    </section>
  );
}
