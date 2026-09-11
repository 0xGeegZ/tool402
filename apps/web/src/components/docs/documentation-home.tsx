import Link from "next/link";

import { buttonVariants } from "../ui/button";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const guides = [
  {
    eyebrow: "RiskScan Quick",
    title: "Understand a bounded request",
    description: "What RiskScan Quick answers, the request it expects, and the shape of its reply.",
    href: "/docs/riskscan",
    action: "Read the RiskScan guide",
  },
  {
    eyebrow: "For providers",
    title: "Follow the local Provider path",
    description: "How a provider prepares an offering in the five-step wizard, and what stays local until a human approves the next stage.",
    href: "/docs/providers",
    action: "Read the Provider guide",
  },
  {
    eyebrow: "HTTP API",
    title: "API reference",
    description: "The current tool descriptor and request shapes, readable without sending a request.",
    href: "/docs/api",
    action: "Read the API reference",
  },
  {
    eyebrow: "Current scope",
    title: "FAQ",
    description: "Short answers on the testnet, RiskScan, and the provider path, including what is not built yet.",
    href: "/docs/faq",
    action: "Read the FAQ",
  },
] as const;


export function DocumentationHome() {
  return (
    <article className="mx-auto max-w-6xl space-y-10">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <PageHeader
          eyebrow="Documentation"
          title="Tool402, explained clearly"
          description="Tool402 lets an agent find a tool, receive its 402 challenge, and get a bounded answer once that challenge is met on Hedera testnet. These guides explain each step and where the current build stops."
        />
      </section>

      <section aria-labelledby="documentation-guides" className="space-y-6 px-5 sm:px-8">
        <div className="max-w-2xl space-y-2">
          <Badge variant="outline" className="border-border bg-background">Current local guides</Badge>
          <h2 id="documentation-guides" className="text-2xl font-bold tracking-tight sm:text-3xl">Choose a guide</h2>
          <p className="max-w-prose text-base leading-7 text-muted-foreground">
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
                  <p className="max-w-prose text-sm leading-6 text-muted-foreground">{guide.description}</p>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-2">
                <Link href={guide.href} className={buttonVariants({ variant: "outline", size: "lg", shape: "pill" })}>{guide.action}</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </article>
  );
}
