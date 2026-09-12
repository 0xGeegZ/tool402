"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { recordingTourHref } from "./demo-control-room";
import { steps } from "./guided-demo-steps";

const tourValues = ["1"] as const;
const demoStepValues = steps.map((step) => step.id) as [string, ...string[]];

const linkClass = "inline-flex min-h-8 touch-target items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const primaryLinkClass = linkClass + " bg-primary text-primary-foreground hover:bg-brand-purple";
const quietLinkClass = linkClass + " text-muted-foreground hover:bg-secondary hover:text-foreground";

export function DemoTourBar() {
  const pathname = usePathname();
  const [tour] = useQueryState("tour", parseAsStringLiteral(tourValues));
  const [demoStep] = useQueryState("demoStep", parseAsStringLiteral(demoStepValues));
  const [notesVisible, setNotesVisible] = useState(true);

  if (pathname === "/demo" && tour !== "1") {
    return (
      <aside aria-label="Guided demo progress" className="border-b border-border bg-secondary/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Recording guide</span><span className="font-medium">15 ordered steps. Start in rehearsal mode until evidence is verified.</span></p>
          <p className="ml-auto"><Link href={recordingTourHref(steps[0].href, steps[0].id)} className={primaryLinkClass}>Start recording demo →</Link></p>
        </div>
      </aside>
    );
  }

  if (tour !== "1" || demoStep === null) return null;

  const index = steps.findIndex((candidate) => candidate.id === demoStep);
  if (index === -1) return null;
  const step = steps[index];
  const previous = steps[index - 1];
  const next = steps[index + 1];

  return (
    <aside aria-label="Guided demo progress" className="border-b border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Recording guide</span>
          <span className="font-medium">Step {index + 1} of {steps.length}</span>
          <span className="text-muted-foreground">{step.title}</span>
          {step.wallet === null ? null : <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-semibold">Wallet: {step.wallet}</span>}
        </div>
        {notesVisible ? (
          <div className="grid gap-2 rounded-control border border-border bg-card p-3 md:grid-cols-3">
            <p><span className="font-semibold">DO</span><br /><span className="text-muted-foreground">{step.do}</span></p>
            <p><span className="font-semibold">SAY</span><br /><span className="text-muted-foreground">{step.say}</span></p>
            <p><span className="font-semibold">SHOW</span><br /><span className="text-muted-foreground">{step.show}</span></p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {previous === undefined ? null : <Link href={recordingTourHref(previous.href, previous.id)} className={quietLinkClass}>Previous</Link>}
          {next === undefined ? null : <Link href={recordingTourHref(next.href, next.id)} className={primaryLinkClass}>{step.nextAction ?? `Next: ${next.title} →`}</Link>}
          <Link href="/demo" className={next === undefined ? primaryLinkClass : quietLinkClass}>Back to demo guide</Link>
          <button type="button" onClick={() => setNotesVisible((visible) => !visible)} className={quietLinkClass}>{notesVisible ? "Hide presenter notes" : "Show presenter notes"}</button>
          <Link href={recordingTourHref(steps[0].href, steps[0].id)} className={quietLinkClass}>Restart guide</Link>
          <Link href={pathname === "/dashboard" ? pathname : step.href} className={quietLinkClass}>Exit tour</Link>
        </div>
      </div>
    </aside>
  );
}
