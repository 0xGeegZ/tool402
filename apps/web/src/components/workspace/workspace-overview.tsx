import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function WorkspaceOverview() {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-label="Workspace orientation">
      <Card className="border-primary/20 bg-secondary/45">
        <CardHeader className="space-y-3">
          <CardTitle>Start with Tool402</CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7 text-secondary-foreground">
            Tool402 brings local tool journeys into one workspace. RiskScan is the current guided example.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-secondary-foreground">
          Choose a route below to read its purpose, inspect its local boundary, or continue through the guided flow.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>What to expect</CardTitle>
          <CardDescription className="leading-6">
            These guest routes stay local. Nothing is sent until you explicitly submit a journey that supports it.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}
