import Image from "next/image";
import { GuidedDemoSteps } from "../../components/demo/guided-demo-steps";
import { RecordingControlRoom } from "../../components/demo/recording-control-room";
import { PageHeader } from "../../components/ui/page-header";

export default function DemoPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-5xl space-y-8">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <PageHeader
            eyebrow="Hackathon recording guide"
            title="Record the Tool402 story"
            description="One practical guide for the presenter: what to do, say, show, and verify. It never fabricates a paid, verified, or onchain result."
          />
          <div data-ui="demo-guide-art" aria-hidden="true" className="overflow-hidden rounded-panel border border-primary/15 bg-primary/[0.06] px-4 pt-4">
            <Image src="/brand/demo-guide-trio.png" alt="" width={1536} height={1024} priority className="mx-auto h-auto w-full max-w-sm" />
          </div>
        </div>
        <section aria-label="Demo context" className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Target</p><p className="mt-2 font-semibold">3:30</p></div>
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Hard ceiling</p><p className="mt-2 font-semibold">5 minutes</p></div>
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Network</p><p className="mt-2 font-semibold">Hedera testnet</p></div>
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mode</p><p className="mt-2 font-semibold">Rehearsal until verified</p></div>
        </section>
        <RecordingControlRoom />
        <GuidedDemoSteps />
        <details className="rounded-card border border-border bg-card p-5 sm:p-6">
          <summary className="cursor-pointer text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Technical details and recovery</summary>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">The presenter guide never creates proof. If a transaction, payment, or World proof is interrupted, keep the existing public evidence and return to the relevant guide step without repeating an irreversible action.</p>
        </details>
      </article>
    </main>
  );
}
