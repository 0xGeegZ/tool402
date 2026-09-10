import Link from "next/link";

import { LandingFooter } from "../../../../components/landing/landing-footer";
import { RiskScanToolLoop } from "../../../../components/riskscan/tool-loop/riskscan-tool-loop";

export default function RiskScanToolLoopPage() {
  return (
    <>
      <main className="pb-6 sm:pb-10">
        <article className="mx-auto max-w-3xl space-y-8 pt-2 sm:space-y-10 sm:pt-6">
          <div className="space-y-6">
            <Link href="/explore/riskscan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <ChevronLeft />
              Back to RiskScan
            </Link>
            <header className="space-y-4">
              <p className="inline-flex rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success-foreground">
                Testnet request boundary · no payment is made from this form.
              </p>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">Run RiskScan through ToolLoop</h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Prepare a bounded Quick request with the same fields an agent can inspect through the current local route.
                </p>
              </div>
            </header>
            <aside aria-label="ToolLoop request boundary" className="flex gap-3 rounded-[calc(var(--radius)*1.5)] border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
              <InfoIcon />
              <p>Review the request before sending it. A returned payment challenge does not confirm a payment, result, or verification.</p>
            </aside>
          </div>
          <RiskScanToolLoop />
        </article>
      </main>
      <div className="mx-auto mt-18 max-w-7xl">
        <LandingFooter />
      </div>
    </>
  );
}

function ChevronLeft() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-4">
      <path d="M10 3.5 5.5 8 10 12.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 7.25v3.25M8 5.25h.01" strokeLinecap="round" />
    </svg>
  );
}
