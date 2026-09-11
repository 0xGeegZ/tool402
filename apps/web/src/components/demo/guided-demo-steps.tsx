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

export function GuidedDemoSteps() {
  return (
    <ol className="grid gap-4 md:grid-cols-2">
      {steps.map((step, index) => (
        <li key={step.href}>
          <Card className="h-full rounded-2xl shadow-none">
            <CardHeader className="gap-2">
              <p className="text-sm font-medium text-muted-foreground">Step {index + 1}</p>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.observation}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={step.href} className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Open this screen
              </Link>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}
