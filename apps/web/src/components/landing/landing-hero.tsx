import Image from "next/image";
import Link from "next/link";

import { Badge } from "../ui/badge";

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-title"
      className="relative isolate grid items-center gap-8 overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-6 shadow-sm sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.9fr)] lg:gap-12 lg:p-14"
    >
      <div aria-hidden="true" className="absolute -right-24 -top-24 size-72 rounded-full bg-secondary/70" />
      <div aria-hidden="true" className="absolute -bottom-28 right-1/4 size-48 rounded-full border border-dashed border-border" />
      <div className="relative z-10 max-w-2xl space-y-5">
        <Badge variant="secondary">Agent tool marketplace</Badge>
        <h1 id="landing-title" className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Back the tools agents pay to use.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          Tool402 brings tool discovery and clear local routes together in one place. Begin with the current
          catalogue, then inspect the path that fits your next step.
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
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Open guided demo
          </Link>
        </div>
      </div>
      <div className="relative z-10 mx-auto aspect-square w-58 rounded-[2rem] border border-border bg-background p-4 shadow-sm sm:w-72">
        <Image src="/brand/mascot-wave.png" alt="" fill sizes="(min-width: 640px) 18rem, 14rem" className="object-contain" />
      </div>
    </section>
  );
}
