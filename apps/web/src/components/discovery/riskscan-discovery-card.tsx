import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

export function RiskScanDiscoveryCard() {
  return (
    <Link
      href="/explore/riskscan"
      className="group block rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="flex h-full min-h-[20rem] flex-col overflow-hidden rounded-panel shadow-none transition-colors duration-200 group-hover:border-primary/40 motion-reduce:transition-none">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-field bg-brand-purple/15 text-brand-purple">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path d="M5 17.5V19h14v-1.5M7.5 15l2.25-3 2 1.75L15.5 9l2 2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 5h14v10.5H5z" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant="secondary">Inspection available</Badge>
              <Badge variant="outline">Risk assessment</Badge>
            </div>
          </div>
          <CardTitle>RiskScan</CardTitle>
          <CardDescription>
            A read-only introduction to a bounded assessment for considering a tool&apos;s risk signals with care.
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
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
