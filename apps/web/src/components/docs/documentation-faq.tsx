import Link from "next/link";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const questions = [
  {
    question: "What is Tool402?",
    answer: "Tool402 is a Hedera testnet prototype for discovering tools and reading the current local routes around them.",
  },
  {
    question: "What does RiskScan Quick assess?",
    answer: "RiskScan Quick assesses caller-supplied declarations. It does not verify an external service, payment, or evidence record.",
  },
  {
    question: "Does a 402 boundary prove that a payment completed?",
    answer: "No. A 402 boundary is not proof of a completed payment.",
  },
  {
    question: "Does the Provider path deploy an ATS asset?",
    answer: "No. A Provider preview, review, or signature is not an ATS deployment and does not publish a public campaign.",
  },
  {
    question: "Is there a public MCP endpoint?",
    answer: "No. A public MCP endpoint is not part of the current local routes.",
  },
] as const;

const linkClass = "inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function DocumentationFaq() {
  return (
    <article className="mx-auto max-w-6xl">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-5">
          <Badge variant="outline" className="border-border bg-background">Current scope · FAQ</Badge>
          <PageHeader
            title="Frequently asked questions"
            description="Short answers about the current Tool402 routes and their boundaries."
          />
        </div>
      </section>

      <section aria-labelledby="faq-title" className="space-y-6 px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold text-brand-purple">Current local facts</p>
          <h2 id="faq-title" className="text-2xl font-bold tracking-tight">Read the boundary before the route</h2>
          <p className="text-base leading-7 text-muted-foreground">
            These answers describe the present prototype without adding a product claim or a new action.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {questions.map((item) => (
            <Card key={item.question} className="rounded-[calc(var(--radius)*2)] shadow-none">
              <CardHeader className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">{item.question}</h3>
              </CardHeader>
              <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Link href="/docs/api" className={linkClass}>Read the API reference</Link>
          <Link href="/docs/riskscan" className={linkClass}>Read the RiskScan guide</Link>
          <Link href="/docs/providers" className={linkClass}>Read the Provider guide</Link>
        </div>
      </section>
    </article>
  );
}
