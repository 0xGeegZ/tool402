import Link from "next/link";

import { Logo } from "../tool402/logo";

export function LandingFooter() {
  return (
    <footer className="grid gap-8 border-t border-border pt-10 sm:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
      <div className="max-w-sm space-y-4">
        <Logo className="h-7" />
        <p className="text-sm leading-6 text-muted-foreground">
          A clear starting point for the tools agents use.
        </p>
      </div>
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
        </ul>
      </nav>
    </footer>
  );
}
