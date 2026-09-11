import { GuidedDemoSteps } from "../../components/demo/guided-demo-steps";
import { PageHeader } from "../../components/ui/page-header";

export default function DemoPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-5xl space-y-8">
        <PageHeader
          eyebrow="Hackathon demo guide"
          title="Follow the Tool402 demo"
          description="A presenter-first route through local discovery, request boundaries, and current guest surfaces. Keep this guide open while you present."
        />
        <section aria-label="Demo context" className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Target duration</p><p className="mt-2 font-semibold">3–4 minutes</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Network</p><p className="mt-2 font-semibold">Hedera testnet</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Core story</p><p className="mt-2 font-semibold">Discover → request → inspect</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mode</p><p className="mt-2 font-semibold">Presenter guide</p></div>
        </section>
        <section aria-labelledby="demo-loop-title" className="rounded-3xl border border-brand-purple/20 bg-brand-purple/5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-purple">The route map</p><h2 id="demo-loop-title" className="mt-1 text-xl font-bold">Discover → Request → 402 → Inspect boundary → Next local step</h2></div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">The guide points to screens that are available locally and names the limits of each surface.</p>
          </div>
        </section>
        <GuidedDemoSteps />
      </article>
    </main>
  );
}
