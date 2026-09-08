import Link from "next/link";
import type {
  RiskScanQuickDeclaration,
  RiskScanQuickDisposition,
  RiskScanRequestInput,
} from "@tool402/core";

import { Badge } from "../../ui/badge";
import { buttonVariants } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

const requestFields = [
  ["requestRef", "A nonblank reference for the assessment."],
  ["subjectRef", "A bounded reference for the subject being considered."],
  ["context", "A bounded description of the request context."],
] as const satisfies readonly [keyof RiskScanRequestInput, string][];

const declarationFields = [
  ["identity", "Whether the caller reports an identity disclosure."],
  ["pricing", "Whether the caller reports a pricing disclosure."],
  ["limitations", "Whether the caller reports a limitations disclosure."],
  ["evidence", "Whether the caller reports an evidence disclosure."],
] as const satisfies readonly [RiskScanQuickDeclaration, string][];

const dispositions = [
  ["needs_disclosure", "One or more caller-reported declarations are absent."],
  ["disclosures_reported", "The caller reports all four declarations without certifying a claim."],
] as const satisfies readonly [RiskScanQuickDisposition, string][];

const groupLabelClass = "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const noteClass = "border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground";

function FieldGroup({
  label,
  fields,
  tag,
}: {
  label: string;
  fields: readonly (readonly [string, string])[];
  tag?: string;
}) {
  return (
    <div className="space-y-3 py-5">
      <p className={groupLabelClass}>{label}</p>
      <dl className="space-y-3">
        {fields.map(([field, description]) => (
          <div key={field} className="space-y-1 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4 sm:space-y-0">
            <dt className="flex items-center gap-2 font-mono text-sm">
              {field}
              {tag ? <Badge variant="outline">{tag}</Badge> : null}
            </dt>
            <dd className="text-sm leading-6 text-muted-foreground">{description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function RiskScanDetail() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft />
          Back to Explore
        </Link>

        <header className="space-y-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary">Read-only detail</Badge>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">RiskScan</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/explore/riskscan/try" className={buttonVariants({ className: "gap-1.5" })}>
                Try RiskScan
                <ArrowRight />
              </Link>
              <Link href="/explore/riskscan/tool-loop" className={buttonVariants({ variant: "outline" })}>
                Explore RiskScan ToolLoop
              </Link>
            </div>
          </div>
          <p className="text-lg leading-8 text-muted-foreground">
            A bounded Quick assessment that makes caller-reported disclosure gaps visible.
          </p>
        </header>
      </div>

      <section aria-labelledby="riskscan-inputs" className="space-y-4">
        <div className="space-y-2">
          <h2 id="riskscan-inputs" className="text-2xl font-semibold tracking-tight">
            Inputs
          </h2>
          <p className="leading-7 text-muted-foreground">Quick accepts the following request fields and declarations.</p>
        </div>
        <Card>
          <CardContent className="divide-y pb-0">
            <FieldGroup label="Request fields" fields={requestFields} />
            <FieldGroup label="Declarations" fields={declarationFields} tag="boolean" />
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
        <ul className="grid gap-4 sm:grid-cols-2">
          {dispositions.map(([disposition, description]) => (
            <li key={disposition}>
              <Card className="h-full">
                <CardHeader className="space-y-2">
                  <Badge variant="secondary" className="w-fit">
                    Disposition
                  </Badge>
                  <CardTitle className="font-mono text-base">{disposition}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
        <p className={noteClass}>
          Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.
        </p>
      </section>

      <section aria-labelledby="riskscan-availability" className="space-y-3">
        <h2 id="riskscan-availability" className="text-2xl font-semibold tracking-tight">
          Configuration boundary
        </h2>
        <p className={noteClass}>
          The endpoint remains unavailable until its host supplies valid supported configuration.
        </p>
      </section>
    </article>
  );
}

function ChevronLeft() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M10 3.5 5.5 8 10 12.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
