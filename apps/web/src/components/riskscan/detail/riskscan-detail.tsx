import Link from "next/link";
import type {
  RiskScanQuickDeclaration,
  RiskScanQuickDisposition,
  RiskScanRequestInput,
} from "@tool402/core";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

const inputFields = [
  ["requestRef", "A nonblank reference for the assessment."],
  ["subjectRef", "A bounded reference for the subject being considered."],
  ["context", "A bounded description of the request context."],
  ["identity", "Whether the caller reports an identity disclosure."],
  ["pricing", "Whether the caller reports a pricing disclosure."],
  ["limitations", "Whether the caller reports a limitations disclosure."],
  ["evidence", "Whether the caller reports an evidence disclosure."],
] as const satisfies readonly [keyof RiskScanRequestInput | RiskScanQuickDeclaration, string][];

const dispositions = [
  ["needs_disclosure", "One or more caller-reported declarations are absent."],
  ["disclosures_reported", "The caller reports all four declarations without certifying a claim."],
] as const satisfies readonly [RiskScanQuickDisposition, string][];

export function RiskScanDetail() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/explore" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Back to Explore
      </Link>
      <Link
        href="/explore/riskscan/try"
        className="block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Try RiskScan
      </Link>
      <Link
        href="/explore/riskscan/tool-loop"
        className="block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Explore RiskScan ToolLoop
      </Link>

      <header className="space-y-3">
        <Badge variant="secondary">Read-only detail</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">RiskScan</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          A bounded Quick assessment that makes caller-reported disclosure gaps visible.
        </p>
      </header>

      <section aria-labelledby="riskscan-inputs" className="space-y-4">
        <div className="space-y-2">
          <h2 id="riskscan-inputs" className="text-2xl font-semibold tracking-tight">
            Inputs
          </h2>
          <p className="leading-7 text-muted-foreground">Quick accepts the following request fields and declarations.</p>
        </div>
        <Card>
          <CardContent className="pt-5">
            <ul className="space-y-3">
              {inputFields.map(([field, description]) => (
                <li key={field} className="space-y-1">
                  <p className="font-medium">{field}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="riskscan-results" className="space-y-4">
        <div className="space-y-2">
          <h2 id="riskscan-results" className="text-2xl font-semibold tracking-tight">
            Result boundary
          </h2>
          <p className="leading-7 text-muted-foreground">
            Quick reports caller-supplied declarations without assigning a score.
          </p>
        </div>
        <ul className="space-y-4">
          {dispositions.map(([disposition, description]) => (
            <li key={disposition}>
              <Card>
                <CardHeader>
                  <CardTitle>{disposition}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-6 text-muted-foreground">
          Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.
        </p>
      </section>

      <section aria-labelledby="riskscan-availability" className="space-y-4">
        <h2 id="riskscan-availability" className="text-2xl font-semibold tracking-tight">
          Configuration boundary
        </h2>
        <Card>
          <CardContent className="pt-5">
            <p className="leading-7 text-muted-foreground">
              The endpoint remains unavailable until its host supplies valid supported configuration.
            </p>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
