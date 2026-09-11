import Image from "next/image";
import Link from "next/link";

import { Logo } from "../tool402/logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border pt-12 pb-10">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <div className="relative max-w-xs space-y-3">
          <Logo className="h-7" />
          <p className="text-sm leading-6 text-muted-foreground">
            A clear starting point for the tools agents use.
          </p>
          <div aria-hidden="true" className="pointer-events-none absolute -right-3 -top-3 hidden size-16 overflow-hidden rounded-full border border-border bg-secondary/50 shadow-sm sm:block lg:-right-16">
            <Image src="/brand/mascot-flag.png" alt="" width={96} height={96} unoptimized className="size-full scale-125 object-cover" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-12">
          <nav aria-label="Product links">
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/explore" className="transition-colors hover:text-foreground">Explore tools</Link></li>
              <li><Link href="/explore/riskscan" className="transition-colors hover:text-foreground">RiskScan</Link></li>
              <li><Link href="/demo" className="transition-colors hover:text-foreground">Guided demo</Link></li>
            </ul>
          </nav>
          <nav aria-label="Provider links">
            <p className="text-sm font-semibold">For providers</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/provider" className="transition-colors hover:text-foreground">Provider overview</Link></li>
              <li><Link href="/provider/deploy" className="transition-colors hover:text-foreground">Prepare a tool offering</Link></li>
              <li><Link href="/docs/providers" className="transition-colors hover:text-foreground">Provider documentation</Link></li>
            </ul>
          </nav>
          <nav aria-label="Dashboard links">
            <p className="text-sm font-semibold">Dashboard</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="transition-colors hover:text-foreground">Home</Link></li>
              <li><Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link></li>
            </ul>
          </nav>
          <aside>
            <p className="text-sm font-semibold">Current scope</p>
            <p className="mt-3 max-w-40 text-sm leading-6 text-muted-foreground">
              Local routes and their boundaries are labelled directly.
            </p>
          </aside>
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <p>© 2026 Tool402. Hedera testnet prototype.</p>
        <p className="max-w-xl lg:text-right">Current local routes are labelled with their boundaries.</p>
      </div>
    </footer>
  );
}
