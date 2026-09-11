import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const requestFields = ["requestRef", "subjectRef", "context"] as const;
const declarationFields = ["identity", "pricing", "limitations", "evidence"] as const;

const topics = [
  { href: "#scope", label: "What Quick covers" },
  { href: "#request-shape", label: "Request shape" },
  { href: "#result-boundary", label: "Result boundary" },
  { href: "#local-routes", label: "Local routes" },
] as const;

const localRoutes = [
  { href: "/explore/riskscan", label: "Open RiskScan", description: "Read the current local detail route." },
  { href: "/explore/riskscan/tool-loop", label: "Follow ToolLoop", description: "Inspect the bounded local request journey." },
  { href: "/demo", label: "Open guided demo", description: "Continue through the local product tour." },
] as const;

const linkClass = "inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function RiskScanGuide() {
  return (
    <article className="mx-auto max-w-6xl">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-5">
          <Badge variant="outline" className="border-border bg-background">RiskScan Quick · local guide</Badge>
          <PageHeader
            title="RiskScan Quick"
            description="A concise guide to the bounded assessment of caller-supplied declarations and its current local routes."
          />
        </div>
      </section>

      <div className="grid gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0 space-y-8">
          <section id="scope" aria-labelledby="scope-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-purple">01 · Scope</p>
              <h2 id="scope-title" className="text-2xl font-bold tracking-tight">What Quick covers</h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Quick is a bounded assessment of caller-supplied declarations. It does not verify an external service, payment, or evidence record.
              </p>
            </div>
            <Card className="rounded-[calc(var(--radius)*2)] bg-card shadow-none">
              <CardHeader className="space-y-2">
                <p className="text-sm font-semibold">Start from the descriptor</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">GET /api/tools</code> to read the current descriptor before choosing a local next step.
                </p>
              </CardHeader>
            </Card>
          </section>

          <section id="request-shape" aria-labelledby="request-shape-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-purple">02 · Input</p>
              <h2 id="request-shape-title" className="text-2xl font-bold tracking-tight">Request shape</h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                RiskScan Quick uses <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">POST /api/riskscan</code> with three top-level references and one required declarations object.
              </p>
            </div>
            <Card className="rounded-[calc(var(--radius)*2)] shadow-none">
              <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Top-level fields</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {requestFields.map((field) => <li key={field}><code className="font-mono text-foreground">{field}</code></li>)}
                  </ul>
                </div>
                <div className="space-y-2 border-t border-dashed border-border pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <p className="text-sm font-semibold">Required declarations</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {declarationFields.map((field) => <li key={field}><code className="font-mono text-foreground">{field}</code> · boolean</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="result-boundary" aria-labelledby="result-boundary-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-purple">03 · Boundary</p>
              <h2 id="result-boundary-title" className="text-2xl font-bold tracking-tight">Read the result boundary</h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                The result can report <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">needs_disclosure</code> or <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">disclosures_reported</code>. Those dispositions describe the submitted declarations only.
              </p>
            </div>
            <Card className="rounded-[calc(var(--radius)*2)] bg-secondary/35 shadow-none">
              <CardContent className="pt-5 text-sm leading-6 text-muted-foreground">
                x402 configuration is host-specific. When it is not configured, the current unavailable boundary is returned; this guide does not expose configuration values.
              </CardContent>
            </Card>
          </section>

          <section id="local-routes" aria-labelledby="local-routes-title" className="space-y-4 scroll-mt-24">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-purple">04 · Continue locally</p>
              <h2 id="local-routes-title" className="text-2xl font-bold tracking-tight">Choose a local next step</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {localRoutes.map((route) => (
                <Card key={route.href} className="rounded-[calc(var(--radius)*2)] shadow-none">
                  <CardContent className="space-y-4 pt-5">
                    <p className="text-sm leading-6 text-muted-foreground">{route.description}</p>
                    <Link href={route.href} className={linkClass}>{route.label}</Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-first h-fit rounded-[calc(var(--radius)*2)] border bg-card p-4 shadow-none lg:sticky lg:top-24 lg:order-none">
          <p className="text-sm font-semibold">On this page</p>
          <nav aria-label="RiskScan guide topics" className="mt-3">
            <ul className="space-y-1">
              {topics.map((topic) => (
                <li key={topic.href}>
                  <Link href={topic.href} className="block rounded-[var(--radius)] px-3 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
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
