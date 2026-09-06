import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";

const steps = [
  {
    title: "Explore a bounded tool",
    description: "Start with a clear description of what the tool is designed to cover.",
  },
  {
    title: "Understand the request boundary",
    description: "Review the information the local journey asks you to consider before you continue.",
  },
  {
    title: "Follow the local RiskScan journey",
    description: "Move from its introduction to the guided flow at your own pace.",
  },
] as const;

export function LandingSections() {
  return (
    <div className="space-y-16 sm:space-y-24">
      <section id="how-it-works" aria-labelledby="how-it-works-title" className="space-y-8 scroll-mt-24">
        <div className="max-w-2xl space-y-3">
          <Badge variant="outline">How it works</Badge>
          <h2 id="how-it-works-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Three simple steps to get oriented
          </h2>
          <p className="leading-7 text-muted-foreground">
            Tool402 keeps the path readable, from discovery through the local RiskScan experience.
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full">
                <CardHeader className="gap-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="riskscan-introduction-title"
        className="grid gap-8 rounded-[calc(var(--radius)*1.5)] bg-secondary p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end"
      >
        <div className="max-w-2xl space-y-4">
          <Badge>RiskScan</Badge>
          <h2 id="riskscan-introduction-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A bounded journey for thoughtful review
          </h2>
          <p className="leading-7 text-secondary-foreground">
            Read what RiskScan considers, then continue into its guided local flow when you are ready.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row">
          <Link
            href="/explore/riskscan"
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-background"
          >
            See RiskScan
          </Link>
          <Link
            href="/explore/riskscan/try"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-purple"
          >
            Try local flow
          </Link>
        </div>
      </section>
    </div>
  );
}
