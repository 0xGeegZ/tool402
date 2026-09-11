import Image from "next/image";
import Link from "next/link";

import { Card } from "../ui/card";

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
    <div className="space-y-0">
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="relative left-1/2 w-screen -translate-x-1/2 border-b border-border bg-muted/40 scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-[5.25rem]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple">How it works</p>
            <h2 id="how-it-works-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three clear steps, one current route at a time
            </h2>
          </div>
          <div className="relative mt-12">
            <div aria-hidden="true" className="absolute left-[16.5%] right-[16.5%] top-[2.4rem] hidden border-t border-dashed border-border sm:block" />
            <ol className="relative grid gap-6 sm:grid-cols-3 lg:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <Card className="relative flex min-h-60 flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-none transition-colors hover:border-foreground/15 motion-reduce:transition-none lg:min-h-[15.125rem]">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`flex size-11 items-center justify-center rounded-xl text-sm font-semibold ${step.tone}`}>
                        {index + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-muted-foreground/70">{step.number}</span>
                    </div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="campaigns-title"
        className="relative left-1/2 w-screen -translate-x-1/2 border-b border-border"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple">Campaign marketplace</p>
              <h2 id="campaigns-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Back the next tools agents will pay to use
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Browse all tools →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campaignCards.map((campaign) => (
              <article key={campaign.name} className="group flex min-h-[25rem] flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 motion-reduce:transform-none motion-reduce:transition-none">
                <div className="flex items-start justify-between gap-3">
                  <span aria-hidden="true" className={`flex size-11 items-center justify-center rounded-xl text-lg font-bold ${campaign.tone}`}>{campaign.icon}</span>
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
                  <Link href={campaign.href} className="inline-flex min-h-8 items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    {campaign.action}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="inspectable-scope-title"
        className="relative left-1/2 w-screen -translate-x-1/2 border-b border-border"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-20">
            <div className="max-w-xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple">Current scope</p>
              <h2 id="inspectable-scope-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Every current route has a clear boundary
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Tool402 labels the current catalogue, guided demo, and local route boundaries directly. A clear screen is
                an orientation surface, not proof of an action beyond that route.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/explore" className="inline-flex min-h-8 items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Explore tools
                </Link>
                <Link href="/demo" className="inline-flex min-h-8 items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Open guided demo
                </Link>
              </div>
            </div>
            <ul className="space-y-4">
              <li className="flex min-h-28 gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/15 motion-reduce:transition-none">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 12h5M10 16h5" /></svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold">Catalogue</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Begin with the current tool entry and its local boundary.</p>
                </div>
              </li>
              <li className="flex min-h-28 gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/15 motion-reduce:transition-none">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 12h5M10 16h3" /><circle cx="16" cy="16" r="3" /></svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold">Guided demo</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Follow the local route map at your pace.</p>
                </div>
              </li>
              <li className="flex min-h-28 gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/15 motion-reduce:transition-none">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M4 5h8l2 2h6v12H4z" /><path d="M4 5v12M9 16h7" /><circle cx="17" cy="17" r="2" /></svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold">Provider path</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Prepare an offering preview without an automatic action.</p>
                </div>
              </li>
            </ul>
        </div>
      </section>

      <section
        aria-labelledby="provider-path-title"
        className="relative left-1/2 w-screen -translate-x-1/2"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="relative isolate overflow-hidden rounded-3xl border border-border bg-[#e9e1ff] px-6 py-[4.375rem] text-center">
            <div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full border-4 border-card/70" />
            <div aria-hidden="true" className="absolute -right-4 -top-5 hidden size-28 overflow-hidden rounded-full border-4 border-card bg-[#f8f2e8] shadow-lg sm:block lg:size-40">
              <Image src="/brand/mascot-wave.png" alt="" width={160} height={160} unoptimized className="size-full scale-125 object-cover" />
            </div>
            <div className="relative mx-auto max-w-2xl space-y-4">
              <h2 id="provider-path-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Building an agent-native tool? Add it to the Tool402 directory.
              </h2>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                The provider journey keeps the offering preview editable and clear about what has not run.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href="/provider/deploy"
                  className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Prepare a tool offering
                </Link>
                <Link
                  href="/provider"
                  className="inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Provider overview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
