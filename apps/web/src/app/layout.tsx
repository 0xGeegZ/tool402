import type { Metadata } from "next";
import Link from "next/link";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "./globals.css";
import { LocalNavigation } from "../components/discovery/local-navigation";
import { Logo } from "../components/tool402/logo";

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
        <div data-ui-shell="s00" className="min-h-svh">
          <div className="border-b border-border text-center">
            <p className="flex min-h-7 items-center justify-center gap-1.5 bg-warning px-4 py-1 text-[11px] font-medium leading-4 text-warning-foreground">
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-3">
                <path d="M3 12.5h10M4.5 10V6.5m3.5 3.5V3.5m3.5 6.5V5" strokeLinecap="round" />
              </svg>
              Hedera testnet · campaign previews are not live offers.
            </p>
            <p className="flex min-h-6 items-center justify-center gap-1 border-t border-border bg-muted px-4 py-1 text-[11px] leading-4 text-muted-foreground">
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3">
                <path d="M6 2h4M8 2v4l3.5 5.25A1.7 1.7 0 0 1 10.1 14H5.9a1.7 1.7 0 0 1-1.4-2.75L8 6V2Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.2 10h3.6" strokeLinecap="round" />
              </svg>
              Local routes are descriptive and labelled with their current boundaries.
            </p>
          </div>
          <header aria-label="Tool402" className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
            <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:min-h-14 sm:px-6 lg:px-8">
              <Link href="/" aria-label="Tool402 home" className="shrink-0">
                <Logo />
              </Link>
              <div className="flex items-center justify-end gap-2">
                <LocalNavigation />
                <Link href="/provider/deploy" className="hidden min-h-9 touch-target items-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:inline-flex">
                  Prepare a tool
                </Link>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
            <NuqsAdapter>{children}</NuqsAdapter>
          </div>
        </div>
      </body>
    </html>
  );
}
