import { Card, CardContent } from "../ui/card";

export function WorkspaceOverview() {
  return (
    <section className="grid gap-4 sm:grid-cols-3" aria-label="Dashboard overview">
      <Card className="rounded-2xl border-border bg-card shadow-none">
        <CardContent className="flex min-h-24 flex-col justify-center gap-1 p-5">
          <span className="text-xs text-muted-foreground">Current access</span>
          <span className="text-lg font-bold tracking-[-0.025em] text-foreground">Guest dashboard</span>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card shadow-none">
        <CardContent className="flex min-h-24 flex-col justify-center gap-1 p-5">
          <span className="text-xs text-muted-foreground">Current tool</span>
          <span className="text-lg font-bold tracking-[-0.025em] text-foreground">RiskScan</span>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card shadow-none">
        <CardContent className="flex min-h-24 flex-col justify-center gap-1 p-5">
          <span className="text-xs text-muted-foreground">Current limits</span>
          <span className="text-lg font-bold tracking-[-0.025em] text-foreground">Local routes</span>
        </CardContent>
      </Card>
    </section>
  );
}
