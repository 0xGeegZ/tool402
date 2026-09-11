import Image from "next/image";
import Link from "next/link";

import { Badge } from "../ui/badge";

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-title"
      className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden border-b border-border bg-card/30 [background-image:radial-gradient(color-mix(in_oklab,var(--border)_70%,transparent)_1px,transparent_1px)] [background-size:1.35rem_1.35rem]"
    >
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20 lg:px-8 lg:pb-[7.125rem] lg:pt-[5.8125rem]">
        <div className="max-w-2xl space-y-6">
          <Badge variant="secondary">Agent tool marketplace</Badge>
          <h1 id="landing-title" className="max-w-[36rem] text-4xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[4.35rem] lg:leading-[0.86]">
            Back the tools <span className="text-brand-purple">agents pay</span> to use.
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Tool402 brings discovery, tool inspection, and provider preparation together. Each local route names the
            boundary of what it can show, so you can choose the next step with context instead of a claim beyond the route.
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-purple motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Explore tools
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Open guided demo
            </Link>
          </div>
          <dl className="grid min-h-36 max-w-xl grid-cols-2 gap-x-5 gap-y-5 border-t border-border pt-6 sm:grid-cols-4 sm:gap-4 lg:translate-y-1">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Explore</dt>
              <dd className="mt-1 font-medium">Current catalogue</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Inspect</dt>
              <dd className="mt-1 font-medium">RiskScan detail</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Prepare</dt>
              <dd className="mt-1 font-medium">Provider route</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Guide</dt>
              <dd className="mt-1 font-medium">Local demo</dd>
            </div>
          </dl>
        </div>
        <div className="relative mx-auto w-full max-w-sm lg:translate-y-[0.5625rem]">
          <div className="aspect-square overflow-hidden rounded-frame border border-border bg-muted shadow-[0_1.5rem_5rem_-1.75rem_color-mix(in_oklab,var(--brand-purple)_45%,transparent)]">
            <Image
              src="/brand/hero-trio.png"
              alt=""
              width={1024}
              height={1024}
              priority
              sizes="(min-width: 1024px) 24rem, (min-width: 640px) 24rem, calc(100vw - 3rem)"
              className="size-full scale-110 object-cover"
            />
          </div>
          <div className="absolute -left-2 top-2 z-20 rounded-card border border-border/80 bg-card/95 p-3.5 shadow-lg backdrop-blur sm:-left-6 sm:top-6 sm:p-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">RiskScan</span>
            <span className="mt-1 block text-base font-bold">Current entry</span>
            <span className="mt-1 block text-[11px] text-muted-foreground">Explore the detail route</span>
          </div>
          <div className="absolute -right-2 bottom-2 z-20 rounded-card border border-border bg-card p-3 shadow-md sm:-right-4 sm:bottom-8 sm:p-3.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">Guided demo</span>
            <span className="mt-1 block text-[11px] text-muted-foreground">Current local route</span>
          </div>
        </div>
      </div>
    </section>
  );
}
