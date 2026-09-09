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

const FILTER_GROUPS = [
  { label: "Category", field: "category", includeAll: true },
  { label: "Status", field: "status", includeAll: false },
  { label: "Access", field: "access", includeAll: false },
] as const;

function countsFor(field: "category" | "status" | "access") {
  const values = [...new Set(CATALOG.map(tool => tool[field]))];

  return values
    .map((value) => ({ value, count: CATALOG.filter(tool => tool[field] === value).length }))
    .filter(row => row.count > 0);
}

export function ExploreCatalog() {
  return (
    <section className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]" aria-label="Tool catalog">
      <aside className="space-y-6 rounded-[var(--radius)] border bg-card p-5 shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Browse tools</p>
          <p className="text-sm leading-6 text-muted-foreground">A static view of the journeys currently ready to inspect.</p>
        </div>

        {FILTER_GROUPS.map(({ label, field, includeAll }) => {
          const rows = countsFor(field);

          return (
            <section key={field} className="space-y-2" aria-labelledby={`${field}-filters`}>
              <h2 id={`${field}-filters`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </h2>
              <ul className="space-y-2 text-sm">
                {includeAll ? (
                  <li className="flex items-center justify-between gap-3 font-medium">
                    <span>All tools</span>
                    <span className="font-mono text-xs text-muted-foreground">{CATALOG.length}</span>
                  </li>
                ) : null}
                {rows.map((row) => (
                  <li key={row.value} className="flex items-center justify-between gap-3 text-muted-foreground">
                    <span>{row.value}</span>
                    <span className="font-mono text-xs">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </aside>

      <div className="min-w-0 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {CATALOG.length} tools
          </p>
          <Badge variant="outline">Read-only catalog</Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <RiskScanDiscoveryCard />
          <EntityCheckDiscoveryCard />
          <Card className="border-dashed bg-transparent shadow-none">
            <CardHeader className="gap-4">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-[var(--radius)] bg-secondary text-secondary-foreground">
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
            <CardFooter>
              <p className="text-sm text-muted-foreground">Catalog updates remain deliberate and reviewable.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
