import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

export function EntityCheckDiscoveryCard() {
  return (
    <Link
      href="/explore/entitycheck"
      className="group block rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="flex h-full min-h-[25rem] flex-col overflow-hidden rounded-[calc(var(--radius)*2)] shadow-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-green/45 motion-reduce:transform-none motion-reduce:transition-none">
        <CardHeader className="gap-5">
          <div className="flex items-start justify-between gap-4">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
              <BuildingIcon />
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant="secondary">In discovery</Badge>
              <Badge variant="outline">Counterparty verification</Badge>
            </div>
          </div>
          <CardTitle>EntityCheck</CardTitle>
          <CardDescription>
            A bounded lookup of a French company&apos;s public registry record with a sanctions screen, cited to its sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div aria-hidden="true" className="h-1 rounded-full bg-secondary">
            <div className="h-full w-full rounded-full bg-brand-green" />
          </div>
          <p className="text-xs text-muted-foreground">Current local route</p>
        </CardContent>
        <CardFooter className="mt-auto flex items-center justify-between gap-4">
          <p className="text-sm leading-6 text-muted-foreground">This surface is descriptive only.</p>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
            View details
            <ArrowRight />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M5 20V5h10v15M15 10h4v10M3 20h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8h1m3 0h1M8 12h1m3 0h1" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
