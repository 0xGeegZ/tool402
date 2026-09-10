import Image from "next/image";
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

const campaignCards = [
  {
    name: "RiskScan",
    description: "A bounded assessment route for reviewing caller-supplied context before choosing the next local step.",
    status: "Campaign preview",
    mode: "Public detail",
    route: "/explore/riskscan",
    scope: "Risk assessment",
    action: "View tool",
    href: "/explore/riskscan",
    tone: "bg-brand-purple/15 text-brand-purple",
    icon: "◇",
    line: "bg-brand-purple",
  },
  {
    name: "EntityCheck France",
    description: "A source-bounded French entity assessment for agent workflows, with clear limits on what a screen can establish.",
    status: "Campaign preview",
    mode: "Protected API",
    route: "/provider",
    scope: "Provider path",
    action: "Provider overview",
    href: "/provider",
    tone: "bg-brand-green/15 text-brand-green",
    icon: "↗",
    line: "bg-brand-green",
  },
] as const;

export function LandingSections() {
  return (
    <div className="space-y-20 sm:space-y-28">
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="-mx-4 space-y-10 border-y border-border bg-muted/40 px-4 py-16 scroll-mt-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:py-20"
      >
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Badge variant="outline" className="border-brand-purple/30 text-brand-purple">How it works</Badge>
          <h2 id="how-it-works-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Three clear steps,<br />one current route at a time
          </h2>
          <p className="leading-7 text-muted-foreground">
            Keep discovery practical: see the current tool, inspect its local boundary, then continue where the
            route is ready to take you.
          </p>
        </div>
        <div className="relative">
          <div aria-hidden="true" className="absolute left-[16.5%] right-[16.5%] top-[2.4rem] hidden border-t border-dashed border-border sm:block" />
          <ol className="relative grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Card className="relative min-h-64 rounded-[calc(var(--radius)*2)] border border-border bg-card shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none">
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
        </div>
      </section>

      <section
        aria-labelledby="campaigns-title"
        className="space-y-8 border-y border-border py-16 sm:py-20"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="border-brand-purple/30 text-brand-purple">Campaign marketplace</Badge>
            <h2 id="campaigns-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Back the next tools agents will pay to use
            </h2>
          </div>
          <Link
            href="/explore"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Browse all tools →
          </Link>
        </div>
        <div className="grid max-w-4xl gap-5 sm:grid-cols-2">
          {campaignCards.map((campaign) => (
            <article key={campaign.name} className="group flex min-h-[25rem] flex-col rounded-[calc(var(--radius)*2)] border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none">
              <div className="flex items-start justify-between gap-3">
                <span aria-hidden="true" className={`flex size-11 items-center justify-center rounded-2xl text-lg font-bold ${campaign.tone}`}>{campaign.icon}</span>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">{campaign.status}</span>
                  <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">{campaign.mode}</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">{campaign.name}</h3>
                <p className="min-h-16 text-sm leading-6 text-muted-foreground">{campaign.description}</p>
              </div>
              <div className="mt-5 space-y-2">
                <div aria-hidden="true" className="h-1 rounded-full bg-secondary"><div className={`h-full w-full rounded-full ${campaign.line}`} /></div>
                <p className="text-xs text-muted-foreground">Campaign preparation</p>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 rounded-[var(--radius)] border border-dashed border-border bg-secondary/30 p-3 text-xs">
                <div className="min-w-0">
                  <dt className="uppercase tracking-wide text-muted-foreground">Route</dt>
                  <dd className="mt-1 truncate font-medium text-foreground">{campaign.route}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="uppercase tracking-wide text-muted-foreground">Scope</dt>
                  <dd className="mt-1 font-medium text-foreground">{campaign.scope}</dd>
                </div>
              </dl>
              <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                <span className="text-xs text-muted-foreground">by Tool402</span>
                <Link href={campaign.href} className="inline-flex min-h-8 items-center rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  {campaign.action}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="inspectable-scope-title"
        className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(22rem,1.15fr)] lg:items-center"
      >
          <div className="max-w-xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-purple">Current scope</p>
            <h2 id="inspectable-scope-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Every current route has a clear boundary
            </h2>
            <p className="leading-7 text-muted-foreground">
              Tool402 labels the current catalogue, guided demo, and local route boundaries directly. A clear screen is
              an orientation surface, not proof of an action beyond that route.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/explore" className="inline-flex min-h-9 items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Explore tools
              </Link>
              <Link href="/demo" className="inline-flex min-h-9 items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Open guided demo
              </Link>
            </div>
          </div>
          <ul className="space-y-4">
            <li className="flex gap-4 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 12h5M10 16h5" /></svg>
              </span>
              <div>
                <h3 className="font-semibold">Catalogue</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Begin with the current tool entry and its local boundary.</p>
              </div>
            </li>
            <li className="flex gap-4 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 12h5M10 16h3" /><circle cx="16" cy="16" r="3" /></svg>
              </span>
              <div>
                <h3 className="font-semibold">Guided demo</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Follow the local route map at your pace.</p>
              </div>
            </li>
            <li className="flex gap-4 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M4 5h8l2 2h6v12H4z" /><path d="M4 5v12M9 16h7" /><circle cx="17" cy="17" r="2" /></svg>
              </span>
              <div>
                <h3 className="font-semibold">Provider path</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Prepare an offering preview without an automatic action.</p>
              </div>
            </li>
          </ul>
      </section>

      <section
        aria-labelledby="provider-path-title"
        className="relative isolate overflow-hidden rounded-[calc(var(--radius)*2)] border border-brand-purple/20 bg-[#e9e1ff] px-6 py-14 text-center sm:px-10 sm:py-18"
      >
        <div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full border-4 border-card/70" />
        <div aria-hidden="true" className="absolute -right-4 -top-5 hidden size-28 overflow-hidden rounded-full border-4 border-card bg-[#f8f2e8] shadow-lg sm:block">
          <Image src="/brand/mascot-wave.png" alt="" width={160} height={160} unoptimized className="size-full scale-125 object-cover" />
        </div>
        <div className="relative mx-auto max-w-2xl space-y-4">
          <h2 id="provider-path-title" className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Building an agent-native tool? Add it to the Tool402 directory.
          </h2>
          <p className="leading-7 text-muted-foreground">
            The provider journey keeps the offering preview editable and clear about what has not run.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/provider/deploy"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Prepare a tool offering
            </Link>
            <Link
              href="/provider"
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Provider overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
