import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

export function EntityCheckDiscoveryCard() {
  return (
    <Link
      href="/explore/entitycheck"
      className="group block rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="flex h-full min-h-[20rem] flex-col overflow-hidden rounded-panel shadow-none transition-colors duration-200 group-hover:border-brand-green/45 motion-reduce:transition-none">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-field bg-brand-green/15 text-brand-green">
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
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Current route</p>
            <span className="text-xs font-medium text-foreground">Local detail</span>
          </div>
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
