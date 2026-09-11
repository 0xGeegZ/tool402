import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const chapters = [
  {
    title: "01 · Discovery",
    description: "Start with the tool and its declared capability.",
    steps: [
      { href: "/", title: "Product overview", observation: "Read the product overview and frame Tool402 as a marketplace for tools agents pay to use.", say: "Agents need to discover a capability before they spend." },
      { href: "/explore", title: "Explore assessments", observation: "Find the RiskScan entry and its local discovery surface.", say: "The directory gives the agent a bounded tool to inspect." },
      { href: "/explore/riskscan", title: "Read RiskScan", observation: "Review the Quick input, result, and configuration boundaries.", say: "The tool describes what it can return before any result is claimed." },
    ],
  },
  {
    title: "02 · Payment boundary",
    description: "Show where the agent meets the 402 requirement.",
    steps: [
      { href: "/explore/riskscan/try", title: "Try the local request", observation: "Inspect the bounded Quick request surface.", say: "A request can meet a payment requirement before the result is released." },
      { href: "/explore/riskscan/tool-loop?demo=tool-loop", title: "Follow ToolLoop", observation: "Inspect the local ToolLoop request boundary.", say: "The loop makes the payment boundary explicit instead of hiding it." },
    ],
  },
  {
    title: "03 · Workspace",
    description: "Close with the workspace and its truthful limits.",
    steps: [
      { href: "/dashboard", title: "Open the dashboard", observation: "See the guest dashboard shell.", say: "The workspace gathers the next inspection surfaces in one place." },
      { href: "/dashboard/riskscan", title: "Review the workbench", observation: "Follow the guest RiskScan workbench sequence.", say: "This is the operator view of the same bounded tool journey." },
      { href: "/dashboard/riskscan/compatibility", title: "Check compatibility", observation: "Inspect the guest native quote compatibility surface.", say: "Compatibility is shown as a declared surface, not as an unverified deployment claim." },
      { href: "/dashboard/riskscan/preflight", title: "Review disclosures", observation: "Inspect the guest Quick disclosure preflight.", say: "End by naming what is configured, what is preview-only, and what has not run." },
    ],
  },
] as const;

export function GuidedDemoSteps() {
  return (
    <div className="flex flex-col gap-8">
      {chapters.map((chapter) => (
        <section key={chapter.title} aria-labelledby={chapter.title.replaceAll(" ", "-").toLowerCase()}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 id={chapter.title.replaceAll(" ", "-").toLowerCase()} className="text-xl font-bold">{chapter.title}</h2><p className="text-sm text-muted-foreground">{chapter.description}</p></div><span className="text-xs font-medium text-muted-foreground">{chapter.steps.length} screens</span></div>
          <ol className="grid gap-4 md:grid-cols-2">
            {chapter.steps.map((step, index) => (
              <li key={step.href}>
                <Card className="h-full">
                  <CardHeader className="gap-2">
                    <p className="text-sm font-medium text-brand-purple">Step {index + 1} in this chapter</p>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.observation}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="rounded-xl bg-muted/60 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">What to say</p><p className="mt-1 text-sm leading-relaxed text-foreground">{step.say}</p></div>
                    <Link href={step.href} className="inline-flex min-h-9 items-center self-start rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open step →</Link>
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
