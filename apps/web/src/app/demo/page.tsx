import Image from "next/image";
import Link from "next/link";
import { GuidedDemoSteps } from "../../components/demo/guided-demo-steps";
import { PageHeader } from "../../components/ui/page-header";

export default function DemoPage() {
  return (
    <main className="pb-6 sm:pb-12">
      <article className="mx-auto max-w-5xl space-y-8">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <PageHeader
            eyebrow="Hackathon demo guide"
            title="Follow the Tool402 demo"
            description="Six screens to tell one story: discover a tool, inspect a request, prepare a campaign, and open your signed dashboard. Keep this guide open while recording."
          />
          <div data-ui="demo-guide-art" aria-hidden="true" className="overflow-hidden rounded-panel border border-primary/15 bg-primary/[0.06] px-4 pt-4">
            <Image src="/brand/demo-guide-trio.png" alt="" width={1536} height={1024} priority className="mx-auto h-auto w-full max-w-sm" />
          </div>
        </div>
        <section aria-label="Demo context" className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Target duration</p><p className="mt-2 font-semibold">3–4 minutes</p></div>
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Network</p><p className="mt-2 font-semibold">Hedera testnet</p></div>
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Core story</p><p className="mt-2 font-semibold">Discover → request → campaign</p></div>
          <div className="rounded-card border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mode</p><p className="mt-2 font-semibold">Presenter guide</p></div>
        </section>
        <section aria-labelledby="demo-loop-title" className="rounded-panel border border-brand-purple/20 bg-brand-purple/5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Before recording</p><h2 id="demo-loop-title" className="mt-1 text-xl font-bold">Ready-to-edit samples, real responses</h2></div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">ToolLoop opens with an editable request; Deploy already loads the RiskScan campaign sample. Review both before submitting or signing. Have MetaMask on Hedera Testnet ready for dashboard sign-in.</p>
          </div>
          <p className="mt-4 border-t border-brand-purple/15 pt-4 text-sm leading-relaxed text-muted-foreground">The browser request can show a 402 payment challenge, or an unavailable response if the service is not configured. A paid result needs a separate Consumer Agent run with verified settlement. Only show a payment or deployed note when you have its actual evidence; recording another take does not require another transaction.</p>
        </section>
        <GuidedDemoSteps />
        <details className="rounded-card border border-border bg-card p-5 sm:p-6">
          <summary className="cursor-pointer text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Optional detail screens · outside the video route</summary>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">These screens answer specific technical questions. They are alternatives or diagnostics, so there is no need to repeat them in the main recording. Dashboard diagnostics require a signed session.</p>
          <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
            <div className="space-y-1"><dt className="font-semibold"><Link href="/explore/riskscan/try" className="text-primary underline underline-offset-4">Direct Quick request</Link></dt><dd className="leading-relaxed text-muted-foreground">Calls the Quick endpoint directly. ToolLoop first discovers and validates the service, then sends the same kind of request. Choose ToolLoop for the video; both forms are not required.</dd></div>
            <div className="space-y-1"><dt className="font-semibold"><Link href="/dashboard/riskscan" className="text-primary underline underline-offset-4">RiskScan workbench · former step 7</Link></dt><dd className="leading-relaxed text-muted-foreground">Combines discovery, quote compatibility, and ToolLoop in one technical workspace. It repeats the request story already covered above.</dd></div>
            <div className="space-y-1"><dt className="font-semibold"><Link href="/dashboard/riskscan/compatibility" className="text-primary underline underline-offset-4">Quote compatibility · former step 8</Link></dt><dd className="leading-relaxed text-muted-foreground">Checks a native Hedera quote against the chosen network, asset, and spending ceiling. It is a policy check and sends no payment.</dd></div>
            <div className="space-y-1"><dt className="font-semibold"><Link href="/dashboard/riskscan/preflight" className="text-primary underline underline-offset-4">Disclosure preflight · former step 9</Link></dt><dd className="leading-relaxed text-muted-foreground">Checks caller-reported disclosure flags locally. It does not call RiskScan or verify the declarations against external evidence.</dd></div>
            <div className="space-y-1 sm:col-span-2"><dt className="font-semibold"><Link href="/provider" className="text-primary underline underline-offset-4">Campaign records</Link></dt><dd className="leading-relaxed text-muted-foreground">Shows the recorded campaign status, commands, terms, and directory publication when available. Deploy prepares the campaign; the signed dashboard finds your campaign; this page shows the detailed records.</dd></div>
          </dl>
        </details>
      </article>
    </main>
  );
}
