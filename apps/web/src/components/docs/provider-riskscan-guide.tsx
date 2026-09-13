import Link from "next/link";

import { buttonVariants } from "../ui/button";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const providerSteps = [
  { number: "01", title: "Tool details", detail: "Set the title, category, one-line description, and customer problem for the offering draft." },
  { number: "02", title: "Interface and capability", detail: "Set the qualifying resource and capability summary; the declared capability remains fixed." },
  { number: "03", title: "Pricing and target agent customers", detail: "Set advertised tiers and target customers. The live x402 requirement remains the payment authority." },
  { number: "04", title: "Funding and revenue-note terms", detail: "Record use of funds, risks, and acknowledgement. The v1 economics and revenue-note parameters are fixed for the offering version." },
  { number: "05", title: "Review and sign", detail: "Review the non-editable summary before requesting the separately gated deployment-stage signatures." },
] as const;

const topics = [
  { href: "#provider-preview", label: "Provider status" },
  { href: "#five-steps", label: "Five wizard steps" },
  { href: "#issuer-and-ats", label: "Issuer and ATS" },
  { href: "#control-boundary", label: "Control boundary" },
  { href: "#local-next-steps", label: "Local next steps" },
] as const;

const localRoutes = [
  { href: "/provider", label: "Open Provider", description: "Read the current provider projection." },
  { href: "/provider/deploy", label: "Open campaign deployment", description: "Continue through the existing RiskScan provider wizard and its stage rail." },
  { href: "/explore/riskscan", label: "Open RiskScan", description: "Return to the current RiskScan detail route." },
  { href: "/demo", label: "Open guided demo", description: "Continue through the local product tour." },
] as const;


export function ProviderRiskScanGuide() {
  return (
    <article className="mx-auto max-w-6xl">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-5">
          <Badge variant="outline" className="border-border bg-background">RiskScan · Provider guide</Badge>
          <PageHeader
            title="Prepare a RiskScan Provider campaign"
            description="A route-by-route guide to the current five-step wizard, issuer-controlled ATS preparation, and the evidence required before a campaign can be OPEN."
          />
        </div>
      </section>

      <div className="grid gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0 space-y-8">
          <section id="provider-preview" aria-labelledby="provider-preview-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">01 · Provider status</p>
              <h2 id="provider-preview-title" className="text-2xl font-bold tracking-tight">Read the current local surface</h2>
              <p className="max-w-prose text-base leading-7 text-muted-foreground">
                The Provider overview is read-only. It reflects admitted campaign records and does not itself change a campaign.
              </p>
            </div>
            <Card className="rounded-panel bg-card shadow-none">
              <CardContent className="pt-5 text-sm leading-6 text-muted-foreground">
                Use <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">/provider/deploy</code> to work through the campaign wizard. A missing record, command bridge, or accepted authority leaves the corresponding step unavailable.
              </CardContent>
            </Card>
          </section>

          <section id="five-steps" aria-labelledby="five-steps-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">02 · Five steps</p>
              <h2 id="five-steps-title" className="text-2xl font-bold tracking-tight">Follow the campaign wizard</h2>
              <p className="max-w-prose text-base leading-7 text-muted-foreground">
                The first four steps contain the current editable fields. Review and sign is a non-editable review surface; signed durable values cannot be changed from that review.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {providerSteps.map((step) => (
                <li key={step.number}>
                  <Card className="h-full rounded-panel shadow-none">
                    <CardHeader className="space-y-3">
                      <Badge variant="outline" className="w-fit border-border bg-secondary/50">Step {step.number}</Badge>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
                        <p className="max-w-prose text-sm leading-6 text-muted-foreground">{step.detail}</p>
                      </div>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          <section id="issuer-and-ats" aria-labelledby="issuer-and-ats-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">03 · Control boundary</p>
              <h2 id="issuer-and-ats-title" className="text-2xl font-bold tracking-tight">Issuer and ATS stages</h2>
            </div>
            <Card className="rounded-panel bg-secondary/35 shadow-none">
              <CardContent className="space-y-3 pt-5 text-sm leading-6 text-muted-foreground">
                <p>The review uses an issuer wallet on Hedera Testnet, chain 296. The current stage rail is: Record the draft offering; Prepare asset creation (<code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">ATS_CREATE</code>); Create the revenue note in MetaMask and attach its returned candidate; then Publish to the Tool Directory.</p>
                <p>Prepare asset creation records an external preparation before any wallet transaction. The revenue-note action and directory publication each need their own accepted inputs and receipts.</p>
              </CardContent>
            </Card>
          </section>

          <section id="control-boundary" aria-labelledby="control-boundary-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">04 · Control boundary</p>
              <h2 id="control-boundary-title" className="text-2xl font-bold tracking-tight">Do not infer deployment from a signature</h2>
            </div>
            <Card className="rounded-panel bg-secondary/35 shadow-none">
              <CardContent className="space-y-3 pt-5 text-sm leading-6 text-muted-foreground">
                <p>A review or signature is not an ATS deployment. A relayed accepted signature is not an on-chain fact, and a prepared record is not a created revenue note.</p>
                <p>The directory becomes OPEN only after the full staged path and corroborated receipt conditions are met. Until then, the relevant handoff remains unavailable or blocked.</p>
              </CardContent>
            </Card>
          </section>

          <section id="local-next-steps" aria-labelledby="local-next-steps-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">05 · Continue locally</p>
              <h2 id="local-next-steps-title" className="text-2xl font-bold tracking-tight">Choose a local next step</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {localRoutes.map((route) => (
                <Card key={route.href} className="rounded-panel shadow-none">
                  <CardContent className="space-y-4 pt-5">
                    <p className="max-w-prose text-sm leading-6 text-muted-foreground">{route.description}</p>
                    <Link href={route.href} className={buttonVariants({ variant: "outline", size: "lg", shape: "pill" })}>{route.label}</Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-first h-fit rounded-panel border bg-card p-4 shadow-none lg:sticky lg:top-24 lg:order-none">
          <p className="text-sm font-semibold">On this page</p>
          <nav aria-label="Provider guide topics" className="mt-3">
            <ul className="space-y-1">
              {topics.map((topic) => (
                <li key={topic.href}>
                  <Link href={topic.href} className="block rounded-control px-3 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    {topic.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </article>
  );
}
