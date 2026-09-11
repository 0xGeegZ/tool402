import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { EntityCheckDiscoveryCard } from "./entitycheck-discovery-card";
import { RiskScanDiscoveryCard } from "./riskscan-discovery-card";

const CATALOG = Object.freeze([
  {
    id: "riskscan",
    name: "RiskScan",
    category: "Risk assessment",
    status: "In discovery",
    access: "Read-only preview",
    href: "/explore/riskscan",
    description: "A read-only introduction to a bounded assessment for considering a tool's risk signals with care.",
  },
  {
    id: "entitycheck",
    name: "EntityCheck",
    category: "Counterparty verification",
    status: "In discovery",
    access: "Read-only preview",
    href: "/explore/entitycheck",
    description: "A bounded lookup of a French company's public registry record with a sanctions screen, cited to its sources.",
  },
]);

export function ExploreCatalog() {
  return (
    <section className="space-y-5" aria-label="Current tool catalogue">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Current catalogue</p>
          <p className="text-sm leading-6 text-muted-foreground">Static marketplace view</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">{CATALOG.length} current tools</p>
          <Badge variant="outline" className="border-border bg-background">Hedera testnet</Badge>
        </div>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">
        Current routes, with no simulated availability or pricing.
      </p>

      <div className="min-w-0">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <RiskScanDiscoveryCard />
          <EntityCheckDiscoveryCard />
          <Card className="flex min-h-[20rem] flex-col rounded-panel border-dashed bg-transparent shadow-none">
            <CardHeader className="gap-4">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-control bg-secondary text-secondary-foreground">
                <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                </svg>
              </span>
              <CardTitle>More tools to come</CardTitle>
              <CardDescription>New tools appear here once their journey is accepted.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">This space stays intentionally quiet until another journey is ready.</p>
            </CardContent>
            <CardFooter className="mt-auto">
              <p className="text-sm text-muted-foreground">Catalogue updates remain deliberate and reviewable.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
