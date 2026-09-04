import type { Metadata } from "next";

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
          <header aria-label="Tool402" className="border-b border-border bg-background">
            <div className="mx-auto flex min-h-18 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <Logo />
              <LocalNavigation />
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
