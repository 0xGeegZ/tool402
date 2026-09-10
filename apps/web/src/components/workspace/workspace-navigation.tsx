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
    description: "Inspect the directory, compatibility, and ToolLoop in one guest workspace.",
    status: "Guest workspace",
  },
  "/dashboard/riskscan/preflight": {
    title: "Review disclosures",
    description: "Review caller-reported disclosures before the request boundary.",
    status: "Local check",
  },
};

export function WorkspaceNavigation() {
  return (
    <nav aria-label="Dashboard journeys">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          const journey = journeyDetails[link.href];

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group block h-full rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-primary/40 group-hover:bg-secondary/25">
                  <CardHeader className="flex-1 gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-secondary text-sm font-semibold text-secondary-foreground">
                        ↗
                      </span>
                      <Badge variant="secondary">{journey.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <CardTitle>{journey.title}</CardTitle>
                      <CardDescription className="leading-6">{journey.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter className="text-sm font-medium text-primary">Open journey</CardFooter>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
