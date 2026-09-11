import Link from "next/link";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

const inputContract = [
  ["requestRef", "A nonblank reference for the lookup."],
  ["jurisdiction", "The jurisdiction declared for the entity lookup."],
  ["query", "The caller-supplied entity name or query."],
  ["registrationNumber", "An optional registration number when the caller has one."],
] as const;

const resultBoundary = [
  ["found", "A registry candidate is identified; the sanctions screen can be clear or hit.", "clear · hit"],
  ["ambiguous", "More than one candidate needs distinction before a screen can be described.", "not_screened"],
  ["not_found", "No matching candidate is described by the bounded lookup.", "not_screened"],
] as const;

const limitation = "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";

export function EntityCheckDetail() {
  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        <ChevronLeft />
        Back to Explore
      </Link>

      <header className="border-b border-border pb-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-card bg-brand-green/15 text-brand-green">
              <BuildingIcon />
            </span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">EntityCheck France</h1>
                <Badge variant="secondary">Read-only detail</Badge>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">A source-bounded description of a French company registry lookup and sanctions screen.</p>
              <p className="text-sm text-muted-foreground">Current local route · Counterparty verification</p>
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="entitycheck-capability" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-2">
          <h2 id="entitycheck-capability" className="text-2xl font-semibold tracking-tight">Counterparty verification</h2>
          <p className="leading-7 text-muted-foreground">Review the bounded inputs, outcomes, sources, and limitations before choosing another local route.</p>
        </div>
        <Card className="rounded-panel shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle>Descriptive detail</CardTitle>
            <CardDescription>No request is made from this page.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section aria-labelledby="entitycheck-inputs" className="space-y-4">
        <div className="space-y-2">
          <h2 id="entitycheck-inputs" className="text-2xl font-semibold tracking-tight">Input contract</h2>
          <p className="leading-7 text-muted-foreground">The local boundary describes these caller-supplied fields.</p>
        </div>
        <Card className="rounded-panel shadow-none">
          <CardContent className="pb-0">
            <dl className="divide-y">
              {inputContract.map(([field, description]) => (
                <div key={field} className="space-y-1 py-4 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4 sm:space-y-0">
                  <dt className="font-mono text-sm font-medium">{field}</dt>
                  <dd className="text-sm leading-6 text-muted-foreground">{description}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="entitycheck-results" className="space-y-4">
        <div className="space-y-2">
          <h2 id="entitycheck-results" className="text-2xl font-semibold tracking-tight">Result boundary</h2>
          <p className="leading-7 text-muted-foreground">These labels describe bounded outcomes; they are not a compliance opinion.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {resultBoundary.map(([disposition, description, screen]) => (
            <li key={disposition}>
              <Card className="h-full rounded-panel shadow-none">
                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit">Disposition</Badge>
                  <CardTitle className="font-mono text-base">{disposition}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                  <p className="font-mono text-xs text-muted-foreground">Screen: {screen}</p>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="entitycheck-sources" className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-panel shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle id="entitycheck-sources">Sources</CardTitle>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              <li>French registry API</li>
              <li>OFAC SDN list</li>
            </ul>
          </CardHeader>
        </Card>
        <Card className="rounded-panel border-dashed bg-transparent shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle>Configuration boundary</CardTitle>
            <CardDescription>The API returns unavailable until its host supplies both x402 and source configuration.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <p className="border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground">{limitation}</p>
    </article>
  );
}

function ChevronLeft() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75}><path d="M10 3.5 5.5 8 10 12.5" strokeLinecap="round" /></svg>;
}

function BuildingIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.75}><path d="M5 20V5h10v15M15 10h4v10M3 20h18" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 8h1m3 0h1M8 12h1m3 0h1" strokeLinecap="round" /></svg>;
}
