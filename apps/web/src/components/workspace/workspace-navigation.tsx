import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/explore/riskscan", label: "RiskScan" },
  { href: "/explore/riskscan/tool-loop", label: "Tool loop" },
  { href: "/dashboard/riskscan/compatibility", label: "Native compatibility" },
  { href: "/dashboard/riskscan", label: "RiskScan workbench" },
  { href: "/dashboard/riskscan/preflight", label: "Quick preflight" },
] as const;

const journeyDetails: Record<(typeof links)[number]["href"], { title: string; description: string; status: string }> = {
  "/explore": {
    title: "Explore tools",
    description: "Browse the local tool catalog and read the RiskScan overview.",
    status: "Read-only",
  },
  "/explore/riskscan": {
    title: "Read RiskScan",
    description: "Understand the bounded RiskScan journey before opening a local path.",
    status: "Read-only",
  },
  "/explore/riskscan/tool-loop": {
    title: "Open ToolLoop boundary",
    description: "Inspect the local ToolLoop boundary with an explicit user action.",
    status: "Local boundary",
  },
  "/dashboard/riskscan/compatibility": {
    title: "Check native compatibility",
    description: "Compare a policy with the locally advertised native criteria.",
    status: "Local check",
  },
  "/dashboard/riskscan": {
    title: "Open RiskScan workbench",
    description: "Inspect the directory, compatibility, and ToolLoop in one guest dashboard.",
    status: "Guest dashboard",
  },
  "/dashboard/riskscan/preflight": {
    title: "Review disclosures",
    description: "Review caller-reported disclosures before the request boundary.",
    status: "Local check",
  },
};

export function WorkspaceNavigation() {
  const featuredJourney = journeyDetails["/explore/riskscan"];
  const additionalLinks = links.filter((link) => link.href !== "/explore/riskscan");

  return (
    <nav className="max-w-5xl space-y-8" aria-label="Dashboard journeys">
      <section className="space-y-4" aria-labelledby="dashboard-current-tool">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 id="dashboard-current-tool" className="text-lg font-bold tracking-[-0.025em]">Start with RiskScan</h2>
            <p className="text-sm leading-6 text-muted-foreground">Inspect the current tool before choosing another local journey.</p>
          </div>
          <Badge variant="outline" className="border-border bg-background text-muted-foreground">Read-only</Badge>
        </div>
        <ul className="grid gap-4 sm:max-w-md">
          <li>
            <Link
              href="/explore/riskscan"
              className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="flex min-h-64 h-full flex-col rounded-2xl border-border bg-card shadow-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-foreground/15 group-hover:shadow-sm motion-reduce:transform-none motion-reduce:transition-none">
                <CardHeader className="flex-1 gap-5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9e1ff] text-sm font-bold text-[#4f3baa]">RS</span>
                    <Badge variant="secondary" className="bg-[#e9e1ff] text-secondary-foreground">{featuredJourney.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <CardTitle>RiskScan</CardTitle>
                    <CardDescription>{featuredJourney.description}</CardDescription>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <dt className="text-xs text-muted-foreground">Route</dt>
                      <dd className="font-semibold">Public detail</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs text-muted-foreground">Scope</dt>
                      <dd className="font-semibold">Risk assessment</dd>
                    </div>
                  </dl>
                </CardHeader>
                <CardFooter className="flex items-center justify-between border-border px-5 py-3">
                  <span className="text-xs text-muted-foreground">Current local route</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">Open RiskScan <span aria-hidden="true">→</span></span>
                </CardFooter>
              </Card>
            </Link>
          </li>
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="dashboard-local-journeys">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 id="dashboard-local-journeys" className="text-lg font-bold tracking-[-0.025em]">Continue a local journey</h2>
            <p className="text-sm leading-6 text-muted-foreground">Each route remains explicit about what it can do today.</p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">5 routes</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {additionalLinks.map((link, index) => {
          const journey = journeyDetails[link.href];
          const color = index % 3 === 0 ? "bg-[#ddf1e8] text-brand-green" : index % 3 === 1 ? "bg-[#e9e1ff] text-[#4f3baa]" : "bg-[#fde8e2] text-brand-coral";

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="flex h-full flex-row items-center justify-between gap-3 rounded-xl border-border bg-card p-4 shadow-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-foreground/15 group-hover:shadow-sm motion-reduce:transform-none motion-reduce:transition-none">
                  <CardHeader className="flex min-w-0 flex-1 flex-row items-center gap-3 p-0">
                    <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${color}`}>
                        ↗
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <CardTitle className="text-sm">{journey.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-xs leading-5">{journey.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors group-hover:bg-muted">Open</span>
                </Card>
              </Link>
            </li>
          );
          })}
        </ul>
      </section>
    </nav>
  );
}
