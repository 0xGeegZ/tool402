import type { Metadata } from "next";

import "./globals.css";
import { Logo } from "../components/tool402/logo";

export const metadata: Metadata = {
  title: "Tool402",
  description: "Tool402 web foundation.",
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
            <div className="mx-auto flex h-18 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
              <Logo />
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
