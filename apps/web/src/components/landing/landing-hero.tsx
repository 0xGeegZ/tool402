import Image from "next/image";
import Link from "next/link";

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-title"
      className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden border-b border-border bg-card/35 [background-image:radial-gradient(color-mix(in_oklab,var(--border)_62%,transparent)_1px,transparent_1px)] [background-size:1.35rem_1.35rem]"
    >
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20 lg:px-8 lg:pb-[5.25rem] lg:pt-[5.8125rem]">
        <div className="max-w-2xl space-y-6">
          <div aria-label="Tool402 status" className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-3 text-xs font-medium text-brand-green">
              <span aria-hidden="true" className="flex size-4 items-center justify-center rounded-full bg-brand-green text-[11px] font-bold text-white">H</span>
              Hedera testnet preview
            </span>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 text-foreground"><path d="M4 1.75h5.5L12.5 5v9.25H4z" /><path d="M9.5 1.75V5h3M6.25 8h4M6.25 10.5h4" strokeLinecap="round" /></svg>
              402 · Payment Required
            </span>
          </div>
          <h1 id="landing-title" className="max-w-[36rem] text-4xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[4.35rem] lg:leading-[0.86]">
            Back the tools <span className="text-brand-purple">agents pay</span> to use.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            A marketplace for verifiable tools that agents can discover, pay for, and use. Tool402 makes the 402 boundary visible before a bounded answer is released.
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-brand-purple hover:shadow-[0_12px_24px_-12px_color-mix(in_oklab,var(--primary)_75%,transparent)] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Follow the hackathon demo
            </Link>
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Explore tools
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:translate-y-[0.5625rem]">
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
          <div className="absolute -left-2 top-2 z-20 w-52 rounded-card border border-border/80 bg-card/95 p-3.5 shadow-lg backdrop-blur sm:-left-6 sm:top-6 sm:w-60 sm:p-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">RiskScan</span>
            <span className="mt-1 block text-lg font-bold tracking-tight">Campaign preparation</span>
            <span aria-hidden="true" className="mt-3 block h-1.5 overflow-hidden rounded-full bg-secondary"><span className="block h-full w-1/4 rounded-full bg-brand-purple" /></span>
            <span className="mt-2 block text-[11px] text-muted-foreground">Testnet · not live</span>
          </div>
          <div className="absolute -right-2 bottom-2 z-20 rounded-card border border-border bg-card p-3 shadow-md sm:-right-4 sm:bottom-8 sm:p-3.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-purple">402 boundary</span>
            <span className="mt-1 flex items-center gap-2 text-sm font-semibold"><svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4"><rect x="3.5" y="7" width="9" height="6.5" rx="1.25" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" /></svg>Payment Required</span>
          </div>
        </div>
      </div>
      <div aria-label="Tool402 capabilities" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-12">
        <ul className="grid gap-3 border-t border-border pt-5 sm:grid-cols-3 sm:gap-0 sm:pt-6">
          <li className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-6"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-field bg-brand-purple/15 text-brand-purple"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5"><path d="m11.5 1.75-6 9h4l-1 7.5 6-9h-4z" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span className="text-sm font-medium text-muted-foreground">x402 boundary</span></li>
          <li className="flex items-center gap-3 sm:border-r sm:border-border sm:px-6"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-field bg-brand-purple/15 text-brand-purple"><span className="text-xs font-bold">H</span></span><span className="text-sm font-medium text-muted-foreground">Hedera testnet</span></li>
          <li className="flex items-center gap-3 sm:pl-6"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-field bg-brand-purple/15 text-brand-purple"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="M5 2.5h7l3 3V17.5H5z" /><path d="M12 2.5v3h3M7.5 10h5M7.5 13h5" strokeLinecap="round" /></svg></span><span className="text-sm font-medium text-muted-foreground">Provider campaign preparation</span></li>
        </ul>
      </div>
    </section>
  );
}
