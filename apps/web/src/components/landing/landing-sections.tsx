import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "../ui/button";
import { Card } from "../ui/card";

const steps = [
  {
    title: "Find a tool",
    description: "Your agent checks what the tool does and the information it needs.",
    number: "01",
    tone: "bg-secondary text-primary",
  },
  {
    title: "Check the price and rules",
    description: "It compares the requested price with the spending rules you configured.",
    number: "02",
    tone: "bg-secondary text-primary",
  },
  {
    title: "Pay and get the result",
    description: "The tool returns its response after the service verifies payment.",
    number: "03",
    tone: "bg-secondary text-primary",
  },
] as const;

const campaignCards = [
  {
    name: "RiskScan",
    description: "RiskScan reviews four declarations: identity, pricing, limitations, and evidence. It reports what is missing; it does not independently assess a tool.",
    status: "Testnet tool",
    facts: [["Input", "Four declarations"], ["Returns", "Missing disclosures"]],
    example: "Example: pricing marked as not provided → missing pricing disclosure.",
    action: "View RiskScan",
    href: "/explore/riskscan",
    tone: "bg-brand-purple/15 text-brand-purple",
    icon: "◇",
  },
  {
    name: "EntityCheck France",
    description: "Preview a French company lookup and possible matches on a U.S. sanctions list. It cannot search live sources until configured and does not make a compliance decision.",
    status: "Preview only",
    facts: [["Input", "Company name or registration"], ["Returns", "Company and sanctions matches"]],
    example: null,
    action: "View EntityCheck",
    href: "/explore/entitycheck",
    tone: "bg-brand-green/15 text-brand-green",
    icon: "↗",
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
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">How it works</p>
            <h2 id="how-it-works-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              How agents find, pay for, and use tools
            </h2>
          </div>
          <div className="relative mt-12">
            <div aria-hidden="true" className="absolute left-[16.5%] right-[16.5%] top-[2.4rem] hidden border-t border-dashed border-border sm:block" />
            <ol className="relative grid gap-6 sm:grid-cols-3 lg:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <Card className="relative flex min-h-60 flex-col gap-3 rounded-card border border-border bg-card p-6 shadow-none transition-colors hover:border-foreground/15 motion-reduce:transition-none lg:min-h-[15.125rem]">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`flex size-11 items-center justify-center rounded-field text-sm font-semibold ${step.tone}`}>
                        {index + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-muted-foreground">{step.number}</span>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tool marketplace</p>
              <h2 id="campaigns-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Tools to explore
              </h2>
            </div>
            <Link
              href="/explore"
              className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
            >
              Explore the directory →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campaignCards.map((campaign) => (
              <article key={campaign.name} className="group flex min-h-[25rem] flex-col rounded-card border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 motion-reduce:transform-none motion-reduce:transition-none">
                <div className="flex items-start justify-between gap-3">
                  <span aria-hidden="true" className={`flex size-11 items-center justify-center rounded-field text-lg font-bold ${campaign.tone}`}>{campaign.icon}</span>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{campaign.status}</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">{campaign.name}</h3>
                  <p className="min-h-16 text-sm leading-6 text-muted-foreground">{campaign.description}</p>
                </div>
                {campaign.example === null ? null : <p className="mt-5 text-xs leading-5 text-muted-foreground">{campaign.example}</p>}
                <dl className="mt-5 grid grid-cols-2 gap-4 rounded-control border border-dashed border-border bg-secondary/30 p-3 text-xs">
                  {campaign.facts.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="uppercase tracking-wide text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                  <span className="text-xs text-muted-foreground">by Tool402</span>
                  <Link href={campaign.href} className={buttonVariants({ size: "sm" })}>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Agent controls</p>
              <h2 id="inspectable-scope-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Know what your agent is paying for
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Before your agent pays, decide whether a tool fits the job, the price, and the rules you set.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/explore" className={buttonVariants({ size: "sm" })}>
                  Explore tools
                </Link>
              </div>
            </div>
            <ul className="space-y-4">
              <li className="flex min-h-28 gap-4 rounded-card border border-border bg-card p-5 transition-colors hover:border-foreground/15 motion-reduce:transition-none">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-field bg-brand-green/15 text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 12h5M10 16h5" /></svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold">Check the fit first</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Read what a tool does, what it needs, and its stated limits before your agent uses it.</p>
                </div>
              </li>
              <li className="flex min-h-28 gap-4 rounded-card border border-border bg-card p-5 transition-colors hover:border-foreground/15 motion-reduce:transition-none">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-field bg-brand-green/15 text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 12h5M10 16h3" /><circle cx="16" cy="16" r="3" /></svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold">Know the cost before paying</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">See the requested price before your agent sends payment.</p>
                </div>
              </li>
              <li className="flex min-h-28 gap-4 rounded-card border border-border bg-card p-5 transition-colors hover:border-foreground/15 motion-reduce:transition-none">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-field bg-brand-green/15 text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M4 5h8l2 2h6v12H4z" /><path d="M4 5v12M9 16h7" /><circle cx="17" cy="17" r="2" /></svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold">Reject requests outside your rules</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Your agent can decline a request that does not match the spending rules you configure.</p>
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
          <div className="relative isolate overflow-hidden rounded-panel border border-border bg-secondary px-6 py-[4.375rem] text-center">
            <div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full border-4 border-card/70" />
            <div aria-hidden="true" className="absolute -right-4 -top-5 hidden size-28 overflow-hidden rounded-full border-4 border-card bg-background shadow-lg sm:block lg:size-40">
              <Image src="/brand/mascot-wave.png" alt="" width={160} height={160} className="size-full scale-125 object-cover" />
            </div>
            <div className="relative mx-auto max-w-2xl space-y-4">
              <h2 id="provider-path-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Building a tool for AI agents?
              </h2>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                Prepare your tool details, prices, and terms so agents can understand what you offer. The next step lets you review the offering before any provider action; preparing it does not publish a live tool.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href="/provider/deploy"
                  className={buttonVariants({ size: "sm" })}
                >
                  Prepare a tool offering
                </Link>
                <Link
                  href="/provider"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
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
