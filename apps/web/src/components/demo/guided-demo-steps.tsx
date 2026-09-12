import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { withTour } from "./demo-tour-navigation";

export const steps = [
  { href: "/", title: "Introduce Tool402", observation: "Explain the idea: agents discover useful tools and pay per request; providers prepare a campaign around their tool." },
  { href: "/explore", title: "Find RiskScan", observation: "Locate RiskScan in the catalogue. Open its detail page to show what an agent can discover before requesting an assessment." },
  { href: "/explore/riskscan", title: "Explain the tool", observation: "Show the Quick input, caller-reported disclosures, and result limitations. These define what the assessment can tell the caller." },
  { href: "/explore/riskscan/tool-loop?demo=tool-loop", title: "Inspect one request", observation: "Review the editable sample, then select Inspect request boundary. ToolLoop discovers the service and sends one Quick request. Explain the actual response: a 402 asks for payment; this browser form does not pay." },
  { href: "/provider/deploy", title: "Prepare a campaign", observation: "Show the prefilled RiskScan details, terms, and signing stages. Review the sample values before any acknowledgement or signature. If a campaign already exists, resume it instead of creating another note." },
  { href: "/sign-in", title: "Open your dashboard", observation: "Sign in with MetaMask if needed. The dashboard shows the campaign associated with your signed session, or its empty state. A connected wallet alone does not unlock it." },
] as const;

const chapters = [
  { title: "01 · Discover the tool", description: "About 1 minute · Explain the product and the scope of RiskScan.", start: 0, end: 3 },
  { title: "02 · Inspect a request", description: "About 45 seconds · One prefilled request is enough to show the payment boundary.", start: 3, end: 4 },
  { title: "03 · Prepare and manage a campaign", description: "About 2 minutes · Show the provider flow, then the signed dashboard.", start: 4, end: 6 },
] as const;

export function GuidedDemoSteps() {
  return (
    <div className="flex flex-col gap-8">
      {chapters.map((chapter) => (
        <section key={chapter.title} aria-labelledby={chapter.title.replaceAll(" ", "-").toLowerCase()}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id={chapter.title.replaceAll(" ", "-").toLowerCase()} className="text-xl font-bold">{chapter.title}</h2>
              <p className="text-sm text-muted-foreground">{chapter.description}</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{chapter.end - chapter.start} {chapter.end - chapter.start === 1 ? "screen" : "screens"}</span>
          </div>
          <ol start={chapter.start + 1} className="grid gap-4 md:grid-cols-2">
            {steps.slice(chapter.start, chapter.end).map((step, index) => (
              <li key={step.href}>
                <Card className="h-full rounded-card shadow-none">
                  <CardHeader className="gap-2">
                    <p className="text-sm font-medium text-primary">Step {chapter.start + index + 1}</p>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.observation}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={withTour(step.href)} className="inline-flex min-h-9 touch-target items-center rounded-control bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      Open this screen →
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
