import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "./globals.css";
import { DashboardNavigation } from "../components/auth/dashboard-navigation";
import { DemoTourBar } from "../components/demo/demo-tour-bar";
import { LocalNavigation } from "../components/discovery/local-navigation";
import { Logo } from "../components/tool402/logo";
import { WalletIsland } from "../components/wallet/wallet-connect";
import { WalletSessionProvider } from "../components/wallet/wallet-session";

export const metadata: Metadata = {
  title: "Tool402",
  description: "A starting point for thoughtful tool discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-svh bg-background text-foreground antialiased">
        <WalletSessionProvider>
        <div data-ui-shell="s00" className="min-h-svh">
          <div className="border-b border-brand-purple/20 bg-brand-purple/[0.07] text-center">
            <p className="flex min-h-9 items-center justify-center gap-2 px-4 py-1.5 text-[10px] font-semibold leading-4 text-foreground sm:text-[11px]">
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-3.5 shrink-0 text-brand-purple">
                <path d="M3 12.5h10M4.5 10V6.5m3.5 3.5V3.5m3.5 6.5V5" strokeLinecap="round" />
              </svg>
              <span><span className="text-brand-purple">Hedera testnet preview</span><span className="mx-1.5 text-muted-foreground">·</span>Tool previews are not live offerings.</span>
            </p>
          </div>
          <header aria-label="Tool402" className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
            <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:min-h-14 sm:px-6 lg:px-8">
              <Link href="/" aria-label="Tool402 home" className="shrink-0">
                <Logo />
              </Link>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Suspense fallback={<LocalNavigation />}>
                  <DashboardNavigation />
                </Suspense>
                <WalletIsland />
                <Link href="/provider/deploy" className="hidden min-h-9 touch-target items-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:inline-flex">
                  Prepare a tool
                </Link>
              </div>
            </div>
          </header>
          <NuqsAdapter>
            <Suspense fallback={null}>
              <DemoTourBar />
            </Suspense>
          </NuqsAdapter>
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
            <NuqsAdapter>{children}</NuqsAdapter>
          </div>
        </div>
        </WalletSessionProvider>
      </body>
    </html>
  );
}
