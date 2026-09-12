import Link from "next/link";
import type {
  RiskScanQuickDeclaration,
  RiskScanQuickDisposition,
  RiskScanRequestInput,
} from "@tool402/core";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { PageHeader } from "../../ui/page-header";
import type { BackingProjection } from "../../backing/backing-state";

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

export function RiskScanDetail({ projection }: { projection: BackingProjection | null }) {
  return (
    <article className="space-y-10">
      <div className="space-y-5">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft />
          Back to Explore
        </Link>

        <div className="flex items-start gap-4 border-b border-border pb-10">
          <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-card bg-brand-purple/15 text-brand-purple">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path d="M12 3 5 6v5c0 4.5 3 7.8 7 10 4-2.2 7-5.5 7-10V6l-7-3Z" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="space-y-3">
            <PageHeader
              eyebrow="Read-only detail"
              title="RiskScan"
              description="A bounded Quick assessment that makes caller-reported disclosure gaps visible."
              actions={[
                { href: "/explore/riskscan/try", label: "Try RiskScan" },
                { href: "/explore/riskscan/tool-loop", label: "Explore RiskScan ToolLoop" },
              ]}
            />
            <p className="text-sm text-muted-foreground">Current local route · Risk assessment</p>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-10">
          <section aria-labelledby="riskscan-inputs" className="space-y-4">
            <div className="space-y-2">
              <h2 id="riskscan-inputs" className="text-2xl font-semibold tracking-tight">
                Inputs
              </h2>
              <p className="leading-7 text-muted-foreground">Quick accepts the following request fields and declarations.</p>
            </div>
            <Card className="rounded-panel">
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
                  <Card className="h-full rounded-panel">
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          {projection !== null ? <Card className="rounded-panel border-brand-purple/30">
            <CardHeader className="space-y-2">
              <CardTitle>Back this tool</CardTitle>
              <CardDescription>Choose note units and send HBAR on Hedera Testnet. Allocation is separate.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/explore/riskscan/back" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Back this tool</Link>
            </CardContent>
          </Card> : null}
          <Card className="rounded-panel">
            <CardHeader className="space-y-2">
              <CardTitle>Current boundary</CardTitle>
              <CardDescription>What this local detail can show today.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="rounded-control bg-secondary/45 px-3 py-2"><span className="font-medium text-foreground">Read-only detail</span><br />No request is submitted from this page.</li>
                <li className="rounded-control bg-secondary/45 px-3 py-2"><span className="font-medium text-foreground">Caller-reported inputs</span><br />The result describes declarations, not a score.</li>
              </ul>
            </CardContent>
          </Card>
          <section aria-labelledby="riskscan-availability">
            <Card className="rounded-panel border-dashed bg-transparent shadow-none">
              <CardHeader className="space-y-2">
                <CardTitle id="riskscan-availability">Configuration boundary</CardTitle>
                <CardDescription>
                  The endpoint remains unavailable until its host supplies valid supported configuration.
                </CardDescription>
              </CardHeader>
            </Card>
          </section>
        </aside>
      </div>
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
