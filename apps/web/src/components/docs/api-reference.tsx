import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const requestFields = ["requestRef", "subjectRef", "context"] as const;
const declarationFields = ["identity", "pricing", "limitations", "evidence"] as const;

const documentationLinks = [
  { href: "/docs/riskscan", label: "RiskScan guide" },
  { href: "/docs/faq", label: "Read the FAQ" },
  { href: "/docs", label: "All documentation" },
] as const;

const linkClass = "inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function ApiReference() {
  return (
    <article className="mx-auto max-w-6xl">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-5">
          <Badge variant="outline" className="border-border bg-background">HTTP API · current boundary</Badge>
          <PageHeader
            title="API reference"
            description="Use the current HTTP surfaces to discover the tool descriptor and submit a bounded RiskScan request. This reference documents the real request shape without inventing a payment or settlement result."
          />
        </div>
      </section>

      <div className="space-y-10 px-5 py-10 sm:px-8 sm:py-14">
        <section aria-labelledby="api-routes-title" className="space-y-5">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-semibold text-primary">01 · Current routes</p>
            <h2 id="api-routes-title" className="text-2xl font-bold tracking-tight">Two current HTTP boundaries</h2>
            <p className="max-w-prose text-base leading-7 text-muted-foreground">
              These route descriptions are static. They do not run a request or expose configuration values.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="rounded-panel shadow-none">
              <CardHeader className="space-y-3">
                <Badge variant="outline" className="w-fit border-border bg-secondary/50">Descriptor</Badge>
                <div className="space-y-2">
                  <h3 className="font-mono text-lg font-bold tracking-tight">GET /api/tools</h3>
                  <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                    The default boundary returns the current tool descriptor. It does not establish a configured payment path.
                  </p>
                </div>
              </CardHeader>
            </Card>

            <Card className="rounded-panel shadow-none">
              <CardHeader className="space-y-3">
                <Badge variant="outline" className="w-fit border-border bg-secondary/50">RiskScan Quick</Badge>
                <div className="space-y-2">
                  <h3 className="font-mono text-lg font-bold tracking-tight">POST /api/riskscan</h3>
                  <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                    The request boundary evaluates caller-supplied declarations for the current RiskScan Quick surface.
                  </p>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section aria-labelledby="request-shape-title" className="space-y-5">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-semibold text-primary">02 · Request shape</p>
            <h2 id="request-shape-title" className="text-2xl font-bold tracking-tight">RiskScan Quick fields</h2>
            <p className="max-w-prose text-base leading-7 text-muted-foreground">
              The request shape has three top-level fields and one declarations object with four boolean fields.
            </p>
          </div>

          <Card className="rounded-panel shadow-none">
            <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Top-level fields</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {requestFields.map((field) => (
                    <li key={field}><code className="font-mono text-foreground">{field}</code></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 border-t border-dashed border-border pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <p className="text-sm font-semibold">Required declarations</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {declarationFields.map((field) => (
                    <li key={field}><code className="font-mono text-foreground">{field}</code> · boolean</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="api-boundary-title" className="space-y-5">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-semibold text-primary">03 · Boundary</p>
            <h2 id="api-boundary-title" className="text-2xl font-bold tracking-tight">Configuration and protocol limits</h2>
          </div>
          <Card className="rounded-panel bg-secondary/35 shadow-none">
            <CardContent className="space-y-3 pt-6 text-sm leading-6 text-muted-foreground">
              <p>x402 configuration is host-specific. If it is not configured, the existing unavailable boundary can be returned.</p>
              <p>A 402 boundary is not proof of a completed payment.</p>
              <p>A public MCP endpoint is not part of the current local routes.</p>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="api-next-title" className="space-y-5">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-semibold text-primary">04 · Continue reading</p>
            <h2 id="api-next-title" className="text-2xl font-bold tracking-tight">Use a local guide</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {documentationLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>{link.label}</Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
