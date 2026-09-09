import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

export function EntityCheckDiscoveryCard() {
  return (
    <Link
      href="/explore/entitycheck"
      className="group block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/40">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-secondary text-secondary-foreground">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path d="M4 20h16M6 20V5.5L12 3l6 2.5V20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 9h2m2 0h2M9 12.5h2m2 0h2M9 16h2m2 0h2" strokeLinecap="round" />
              </svg>
            </span>
            <div className="space-y-2 text-right">
              <Badge variant="secondary">In discovery</Badge>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Counterparty verification</p>
            </div>
          </div>
          <CardTitle>EntityCheck</CardTitle>
          <CardDescription>
            A bounded lookup of a French company&apos;s public registry record with a sanctions screen, cited to its sources.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-between gap-4">
          <p className="text-sm leading-6 text-muted-foreground">This surface is descriptive only.</p>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
            View details
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
