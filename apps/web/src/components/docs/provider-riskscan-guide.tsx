import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const providerSteps = [
  { number: "01", title: "Tool details", detail: "Name the local tool and describe the boundary shown by the preview." },
  { number: "02", title: "Interface and capability", detail: "Review the local capability description and interface details." },
  { number: "03", title: "Pricing and target agent customers", detail: "Use the existing wizard label to review the local preview fields." },
  { number: "04", title: "Funding and revenue-note terms", detail: "Use the existing wizard label to review the local preview fields." },
  { number: "05", title: "Review and sign", detail: "Read the non-editable review and sign surface before returning to the local route." },
] as const;

const topics = [
  { href: "#provider-preview", label: "Provider preview" },
  { href: "#five-steps", label: "Five local steps" },
  { href: "#control-boundary", label: "Control boundary" },
  { href: "#local-next-steps", label: "Local next steps" },
] as const;

const localRoutes = [
  { href: "/provider", label: "Open Provider", description: "Read the current provider projection." },
  { href: "/provider/deploy", label: "Open the local preview", description: "Continue through the existing RiskScan provider route." },
  { href: "/explore/riskscan", label: "Open RiskScan", description: "Return to the current RiskScan detail route." },
  { href: "/demo", label: "Open guided demo", description: "Continue through the local product tour." },
] as const;

const linkClass = "inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ProviderRiskScanGuide() {
  return (
    <article className="mx-auto max-w-6xl">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-5">
          <Badge variant="outline" className="border-border bg-background">RiskScan · Provider guide</Badge>
          <PageHeader
            title="Prepare a RiskScan provider preview"
            description="A route-by-route guide to the existing Provider preview and the boundaries of its local controls."
          />
        </div>
      </section>

      <div className="grid gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0 space-y-8">
          <section id="provider-preview" aria-labelledby="provider-preview-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">01 · Provider preview</p>
              <h2 id="provider-preview-title" className="text-2xl font-bold tracking-tight">Read the current local surface</h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                The Provider overview is read-only. It reflects the current local projection and does not publish a public campaign.
              </p>
            </div>
            <Card className="rounded-panel bg-card shadow-none">
              <CardContent className="pt-5 text-sm leading-6 text-muted-foreground">
                The local preview keeps its existing route and fields. This guide only explains where each step belongs.
              </CardContent>
            </Card>
          </section>

          <section id="five-steps" aria-labelledby="five-steps-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">02 · Five steps</p>
              <h2 id="five-steps-title" className="text-2xl font-bold tracking-tight">Follow the local preview</h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                The first four steps contain the documented local editable fields. Review and sign is a non-editable review and sign surface.
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
                        <p className="text-sm leading-6 text-muted-foreground">{step.detail}</p>
                      </div>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          <section id="control-boundary" aria-labelledby="control-boundary-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">03 · Control boundary</p>
              <h2 id="control-boundary-title" className="text-2xl font-bold tracking-tight">Keep the current boundary clear</h2>
            </div>
            <Card className="rounded-panel bg-secondary/35 shadow-none">
              <CardContent className="space-y-3 pt-5 text-sm leading-6 text-muted-foreground">
                <p>A review or signature is not an ATS deployment.</p>
                <p>The current control is conditionally gated. It does not create a deployed asset or publish a public campaign.</p>
              </CardContent>
            </Card>
          </section>

          <section id="local-next-steps" aria-labelledby="local-next-steps-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">04 · Continue locally</p>
              <h2 id="local-next-steps-title" className="text-2xl font-bold tracking-tight">Choose a local next step</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {localRoutes.map((route) => (
                <Card key={route.href} className="rounded-panel shadow-none">
                  <CardContent className="space-y-4 pt-5">
                    <p className="text-sm leading-6 text-muted-foreground">{route.description}</p>
                    <Link href={route.href} className={linkClass}>{route.label}</Link>
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
