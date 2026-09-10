import Image from "next/image";
import Link from "next/link";

import { Badge } from "../ui/badge";

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-title"
      className="relative isolate overflow-hidden py-12 sm:py-16 lg:py-24 [background-image:radial-gradient(color-mix(in_oklab,var(--border)_70%,transparent)_1px,transparent_1px)] [background-size:1.35rem_1.35rem]"
    >
      <div aria-hidden="true" className="absolute -right-28 top-0 size-96 rounded-full bg-[#e9e1ff]/80 blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-8 left-[48%] size-32 rounded-full border border-brand-purple/15" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.9fr)] lg:gap-16">
        <div className="max-w-2xl space-y-6">
          <Badge variant="secondary">Agent tool marketplace</Badge>
          <h1 id="landing-title" className="max-w-xl text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Back the tools <span className="text-brand-purple">agents pay</span> to use.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Tool402 brings a current tool catalogue, an inspectable RiskScan path, and a provider preparation route
            into one clear surface.
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
          <dl className="grid max-w-xl gap-4 border-t border-border pt-6 sm:grid-cols-3">
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
          </dl>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute inset-x-5 bottom-2 top-8 rounded-[2.75rem] border border-border bg-card/75 shadow-[0_1.5rem_3rem_color-mix(in_oklab,var(--foreground)_10%,transparent)]" />
          <div aria-hidden="true" className="absolute left-0 top-8 z-20 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm">Current catalogue</div>
          <div aria-hidden="true" className="absolute bottom-12 right-0 z-20 rounded-full bg-brand-purple px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm">RiskScan</div>
          <Image
            src="/brand/hero-trio.png"
            alt=""
            width={1024}
            height={1024}
            priority
            unoptimized
            sizes="(min-width: 1024px) 34rem, (min-width: 640px) 30rem, calc(100vw - 3rem)"
            className="relative z-10 h-auto w-full scale-[1.06] object-contain sm:scale-110"
          />
        </div>
      </div>
    </section>
  );
}
