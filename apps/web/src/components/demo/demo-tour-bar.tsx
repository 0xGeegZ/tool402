"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { steps } from "./guided-demo-steps";

const tourValues = ["1"] as const;

function pathOf(href: string): string {
  return href.split("?")[0];
}

function withTour(href: string): string {
  return href.includes("?") ? `${href}&tour=1` : `${href}?tour=1`;
}

const linkClass =
  "inline-flex min-h-8 touch-target items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const primaryLinkClass = `${linkClass} bg-primary text-primary-foreground hover:bg-brand-purple`;
const quietLinkClass = `${linkClass} text-muted-foreground hover:bg-secondary hover:text-foreground`;

export function DemoTourBar() {
  const pathname = usePathname();
  const [tour] = useQueryState("tour", parseAsStringLiteral(tourValues));

  if (pathname === "/demo") {
    return (
      <aside aria-label="Guided demo progress" className="border-b border-border bg-secondary/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Guided demo</span>
            <span className="font-medium">{steps.length} screens in order, about four minutes.</span>
            <span className="text-muted-foreground">This bar follows you from screen to screen.</span>
          </p>
          <p className="ml-auto">
            <Link href={withTour(steps[0].href)} className={primaryLinkClass}>Start at step 1 →</Link>
          </p>
        </div>
      </aside>
    );
  }

  if (tour !== "1") return null;

  const index = steps.findIndex((step) => pathOf(step.href) === pathname);
  if (index === -1) return null;

  const step = steps[index];
  const next = steps[index + 1];

  return (
    <aside aria-label="Guided demo progress" className="border-b border-border bg-secondary/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Guided demo</span>
          <span className="font-medium">Step {index + 1} of {steps.length}</span>
          <span className="text-muted-foreground">{step.title}</span>
        </p>
        <ol aria-hidden="true" className="flex items-center gap-1">
          {steps.map((item, itemIndex) => (
            <li key={item.href} className={`h-1.5 w-5 rounded-full ${itemIndex <= index ? "bg-primary" : "bg-border"}`} />
          ))}
        </ol>
        <p className="ml-auto flex flex-wrap items-center gap-2">
          {next ? (
            <Link href={withTour(next.href)} className={primaryLinkClass}>Next: {next.title} →</Link>
          ) : (
            <Link href="/demo" className={primaryLinkClass}>Tour complete · back to the guide</Link>
          )}
          <Link href={pathname} className={quietLinkClass}>Exit tour</Link>
        </p>
      </div>
    </aside>
  );
}
