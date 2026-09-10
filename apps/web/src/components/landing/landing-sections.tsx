import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";

const steps = [
  {
    title: "Explore a current tool",
    description: "Read the current capability and its boundaries before you choose a route.",
  },
  {
    title: "Inspect its boundary",
    description: "See what the local route can show before you continue through the journey.",
  },
  {
    title: "Choose a local next step",
    description: "Move from an overview to its guided route at your own pace.",
  },
] as const;

export function LandingSections() {
  return (
    <div className="space-y-16 sm:space-y-24">
      <section id="how-it-works" aria-labelledby="how-it-works-title" className="space-y-8 scroll-mt-24">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline">How it works</Badge>
          <h2 id="how-it-works-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From a tool to a clearer next step
          </h2>
          <p className="leading-7 text-muted-foreground">
            Keep discovery practical: see the current tool, inspect its local boundary, then continue where the
            route is ready to take you.
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full border-dashed bg-card shadow-none">
                <CardHeader className="gap-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="riskscan-introduction-title"
        className="grid gap-8 rounded-[calc(var(--radius)*1.5)] border border-border bg-secondary p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end"
      >
        <div className="max-w-2xl space-y-4">
          <Badge>RiskScan</Badge>
          <h2 id="riskscan-introduction-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with RiskScan
          </h2>
          <p className="leading-7 text-secondary-foreground">
            Read what RiskScan considers in a current read-only overview. Inspect its detail, then follow its local
            flow when you are ready.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row">
          <Link
            href="/explore/riskscan"
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-background motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Inspect RiskScan
          </Link>
          <Link
            href="/explore/riskscan/try"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Try RiskScan
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="inspectable-scope-title"
        className="grid gap-6 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:items-start"
      >
        <Badge variant="outline">Inspectable scope</Badge>
        <div className="max-w-2xl space-y-3">
          <h2 id="inspectable-scope-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Know what you can inspect
          </h2>
          <p className="leading-7 text-muted-foreground">
            Tool402 labels the current catalogue, guided demo, and local route boundaries directly. A clear screen is
            an orientation surface, not proof of an action beyond that route.
          </p>
        </div>
      </section>
    </div>
  );
}
