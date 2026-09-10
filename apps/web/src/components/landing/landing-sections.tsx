import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";

const steps = [
  {
    title: "Explore a current tool",
    description: "Read the current capability and its boundaries before you choose a route.",
    number: "01",
    tone: "bg-[#eeebff] text-brand-purple",
  },
  {
    title: "Inspect its boundary",
    description: "See what the local route can show before you continue through the journey.",
    number: "02",
    tone: "bg-success text-success-foreground",
  },
  {
    title: "Choose a local next step",
    description: "Move from an overview to its guided route at your own pace.",
    number: "03",
    tone: "bg-destructive text-destructive-foreground",
  },
] as const;

export function LandingSections() {
  return (
    <div className="space-y-20 sm:space-y-28">
      <section id="how-it-works" aria-labelledby="how-it-works-title" className="space-y-10 scroll-mt-24">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Badge variant="outline" className="border-brand-purple/30 text-brand-purple">How it works</Badge>
          <h2 id="how-it-works-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            From a tool to a clearer next step
          </h2>
          <p className="leading-7 text-muted-foreground">
            Keep discovery practical: see the current tool, inspect its local boundary, then continue where the
            route is ready to take you.
          </p>
        </div>
        <ol className="relative grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full rounded-[calc(var(--radius)*2)] border border-border bg-card shadow-[0_1rem_2rem_color-mix(in_oklab,var(--foreground)_6%,transparent)]">
                <CardHeader className="gap-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`flex size-11 items-center justify-center rounded-2xl text-sm font-semibold ${step.tone}`}>
                      {index + 1}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
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
        aria-labelledby="riskscan-feature-title"
        className="space-y-8 border-y border-border py-16 sm:py-20"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" className="border-brand-purple/30 text-brand-purple">Marketplace</Badge>
            <h2 id="riskscan-feature-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Agent-native tools in the current catalogue
            </h2>
            <p className="leading-7 text-muted-foreground">
              RiskScan is the current catalogue entry. Its detail route explains the local request shape and the boundary
              before a route continues.
            </p>
          </div>
          <span className="text-sm font-medium text-muted-foreground">Current entry</span>
        </div>
        <div className="max-w-md">
          <div className="relative isolate overflow-hidden rounded-[calc(var(--radius)*2)] border border-border bg-card p-6 shadow-[0_1rem_2rem_color-mix(in_oklab,var(--foreground)_6%,transparent)] sm:p-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(115deg,#ede8ff_0%,#f9f4e9_48%,#dff7ed_100%)]" />
          <div aria-hidden="true" className="absolute right-8 top-5 size-14 rounded-full border-[0.65rem] border-brand-purple/20" />
          <div className="relative flex flex-wrap items-start justify-between gap-4 pt-10">
            <div className="space-y-2">
              <Badge className="bg-brand-purple text-primary-foreground">RiskScan</Badge>
              <h3 className="text-2xl font-semibold tracking-tight">RiskScan</h3>
              <p className="max-w-md leading-7 text-muted-foreground">
                A bounded assessment route for reviewing caller-supplied context before choosing the next local step.
              </p>
            </div>
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-xl text-brand-purple">↗</span>
          </div>
          <div className="relative mt-8 flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row">
            <Link
              href="/explore/riskscan"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              View RiskScan
            </Link>
            <Link
              href="/explore/riskscan/try"
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Try RiskScan
            </Link>
          </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="inspectable-scope-title"
        className="grid gap-8 border-y border-border py-16 sm:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(22rem,1.15fr)] lg:items-center"
      >
          <div className="max-w-xl space-y-3">
            <Badge variant="outline">Inspectable scope</Badge>
            <h2 id="inspectable-scope-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Every current route has a clear boundary
            </h2>
            <p className="leading-7 text-muted-foreground">
              Tool402 labels the current catalogue, guided demo, and local route boundaries directly. A clear screen is
              an orientation surface, not proof of an action beyond that route.
            </p>
          </div>
          <ul className="space-y-4">
            <li className="rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Catalogue</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Begin with the current tool entry and its local boundary.</p>
            </li>
            <li className="rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Guided demo</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Follow the local route map at your pace.</p>
            </li>
            <li className="rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Provider path</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Prepare an offering preview without an automatic action.</p>
            </li>
          </ul>
      </section>

      <section
        aria-labelledby="provider-path-title"
        className="relative isolate overflow-hidden rounded-[calc(var(--radius)*2)] border border-brand-purple/20 bg-[#e9e1ff] px-6 py-14 text-center sm:px-10 sm:py-18"
      >
        <div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full border-4 border-card/70" />
        <div className="relative mx-auto max-w-2xl space-y-4">
          <Badge variant="outline" className="border-brand-purple/30 text-brand-purple">For providers</Badge>
          <h2 id="provider-path-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Building an agent-native tool? Add it to Tool402.
          </h2>
          <p className="leading-7 text-muted-foreground">
            The provider journey keeps the offering preview editable and clear about what has not run.
          </p>
          <Link
            href="/provider/deploy"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Prepare a tool offering
          </Link>
        </div>
      </section>
    </div>
  );
}
