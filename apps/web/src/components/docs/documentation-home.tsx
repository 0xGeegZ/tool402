import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const guides = [
  {
    eyebrow: "RiskScan Quick",
    title: "Understand a bounded request",
    description: "See the current request shape, result boundary, and local routes for RiskScan Quick.",
    href: "/docs/riskscan",
    action: "Read the RiskScan guide",
  },
  {
    eyebrow: "For providers",
    title: "Follow the local Provider path",
    description: "Review the five-step RiskScan preview and the boundaries of the current provider route.",
    href: "/docs/providers",
    action: "Read the Provider guide",
  },
  {
    eyebrow: "HTTP API",
    title: "API reference",
    description: "Read the current descriptor and request boundaries without running a request.",
    href: "/docs/api",
    action: "Read the API reference",
  },
  {
    eyebrow: "Current scope",
    title: "FAQ",
    description: "Read the current testnet, RiskScan, and Provider boundaries.",
    href: "/docs/faq",
    action: "Read the FAQ",
  },
] as const;

const guideLinkClass = "inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function DocumentationHome() {
  return (
    <article className="mx-auto max-w-6xl space-y-10">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <PageHeader
          eyebrow="Documentation"
          title="Tool402, explained by route"
          description="Start with the current local journey you need. Each guide names what the route covers and where its boundary sits."
        />
      </section>

      <section aria-labelledby="documentation-guides" className="space-y-6 px-5 sm:px-8">
        <div className="max-w-2xl space-y-2">
          <Badge variant="outline" className="border-border bg-background">Current local guides</Badge>
          <h2 id="documentation-guides" className="text-2xl font-bold tracking-tight sm:text-3xl">Choose a guide</h2>
          <p className="text-base leading-7 text-muted-foreground">
            These pages describe the current RiskScan and Provider surfaces without adding a new product path.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {guides.map((guide) => (
            <Card key={guide.href} className="flex min-h-64 flex-col rounded-panel shadow-none">
              <CardHeader className="space-y-4">
                <Badge variant="outline" className="w-fit border-border bg-secondary/50">{guide.eyebrow}</Badge>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">{guide.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{guide.description}</p>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-2">
                <Link href={guide.href} className={guideLinkClass}>{guide.action}</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </article>
  );
}
