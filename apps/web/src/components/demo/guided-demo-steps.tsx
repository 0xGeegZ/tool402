import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const steps = [
  { href: "/", title: "Product overview", observation: "Read the product overview and continue to Explore." },
  { href: "/explore", title: "Explore assessments", observation: "Find the RiskScan entry and its local discovery surface." },
  { href: "/explore/riskscan", title: "Read RiskScan", observation: "Review the Quick input, result, and configuration boundaries." },
  { href: "/explore/riskscan/try", title: "Try the local request", observation: "Inspect the bounded Quick request surface." },
  { href: "/explore/riskscan/tool-loop?demo=tool-loop", title: "Follow ToolLoop", observation: "Inspect the local ToolLoop request boundary." },
  { href: "/dashboard", title: "Open the dashboard", observation: "See the guest dashboard shell." },
  { href: "/dashboard/riskscan", title: "Review the workbench", observation: "Follow the guest RiskScan workbench sequence." },
  { href: "/dashboard/riskscan/compatibility", title: "Check compatibility", observation: "Inspect the guest native quote compatibility surface." },
  { href: "/dashboard/riskscan/preflight", title: "Review disclosures", observation: "Inspect the guest Quick disclosure preflight." },
] as const;

const chapters = [
  { title: "01 · Discovery", description: "Start with the current tool catalogue and its declared boundaries.", start: 0, end: 3 },
  { title: "02 · Request boundary", description: "Follow the local request surfaces and inspect the 402 boundary in context.", start: 3, end: 5 },
  { title: "03 · Dashboard", description: "Close with the dashboard and its current guest surfaces.", start: 5, end: 9 },
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
            <span className="text-xs font-medium text-muted-foreground">{chapter.end - chapter.start} screens</span>
          </div>
          <ol className="grid gap-4 md:grid-cols-2">
            {steps.slice(chapter.start, chapter.end).map((step, index) => (
              <li key={step.href}>
                <Card className="h-full rounded-2xl shadow-none">
                  <CardHeader className="gap-2">
                    <p className="text-sm font-medium text-brand-purple">Step {chapter.start + index + 1}</p>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.observation}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={step.href} className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
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
