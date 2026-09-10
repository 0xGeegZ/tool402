import { Card, CardContent } from "../ui/card";

export function WorkspaceOverview() {
  return (
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Dashboard overview">
      <Card className="rounded-2xl border-border bg-card shadow-none">
        <CardContent className="flex min-h-28 flex-col justify-center gap-1.5 p-5">
          <span className="text-xs font-medium text-muted-foreground">Access</span>
          <span className="text-xl font-bold tracking-[-0.035em] text-foreground">Guest</span>
          <span className="text-xs leading-5 text-muted-foreground">Local dashboard</span>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card shadow-none">
        <CardContent className="flex min-h-28 flex-col justify-center gap-1.5 p-5">
          <span className="text-xs font-medium text-muted-foreground">Current tool</span>
          <span className="text-xl font-bold tracking-[-0.035em] text-foreground">RiskScan</span>
          <span className="text-xs leading-5 text-muted-foreground">Read the local detail</span>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card shadow-none">
        <CardContent className="flex min-h-28 flex-col justify-center gap-1.5 p-5">
          <span className="text-xs font-medium text-muted-foreground">Available journeys</span>
          <span className="text-xl font-bold tracking-[-0.035em] text-foreground">6 local routes</span>
          <span className="text-xs leading-5 text-muted-foreground">Choose a bounded next step</span>
        </CardContent>
      </Card>
    </section>
  );
}
