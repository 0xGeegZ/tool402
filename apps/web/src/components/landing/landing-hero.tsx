import Image from "next/image";

import { Badge } from "../ui/badge";

export function LandingHero() {
  return (
    <section className="grid items-center gap-8 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-6 shadow-sm sm:p-10 lg:grid-cols-[1fr_auto] lg:p-14">
      <div className="max-w-2xl space-y-5">
        <Badge variant="secondary">Thoughtful discovery</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          A clearer starting point for exploring intelligent tools.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          Tool402 brings a calm, human-centered perspective to discovering bounded assessments and understanding their
          purpose.
        </p>
      </div>
      <div className="relative mx-auto aspect-square w-58 rounded-full bg-muted p-4 sm:w-72">
        <Image src="/brand/mascot-wave.png" alt="" fill sizes="(min-width: 640px) 18rem, 14.5rem" className="object-contain" />
      </div>
    </section>
  );
}
