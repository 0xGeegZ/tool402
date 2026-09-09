import Link from "next/link";
import type { EntityCheckDisposition, EntitySanctionsScreen } from "@tool402/core";

import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

const inputFields = [
  ["requestRef", "A nonblank caller reference of at most 96 characters."],
  ["jurisdiction", "The exact literal FR; no other jurisdiction is accepted."],
  ["query", "A company name or SIREN of at most 160 characters."],
  ["registrationNumber", "Optional. Exactly nine digits, the SIREN that disambiguates a name."],
] as const;

const dispositions = [
  ["found", "Exactly one registry candidate resolved, or one candidate matched the supplied SIREN."],
  ["ambiguous", "Two or more candidates and no SIREN match; the first five pairs are listed."],
  ["not_found", "The registry search returned no candidate."],
] as const satisfies readonly [EntityCheckDisposition, string][];

const screens = [
  ["clear", "No sanctions entry matched the resolved legal name exactly."],
  ["hit", "At least one entry matched; every match is listed in dataset order."],
  ["not_screened", "No screen ran because no single entity was resolved."],
] as const satisfies readonly [EntitySanctionsScreen, string][];

const sources = [
  ["FR_RECHERCHE_ENTREPRISES", "The French company registry search API (recherche-entreprises), read once per request."],
  ["OFAC_SDN", "The US Treasury OFAC Specially Designated Nationals list, read at most once a day and cited by content hash."],
] as const;

const baselineLimitation =
  "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";

const groupLabelClass = "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const noteClass = "border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground";

function FieldGroup({
  label,
  fields,
}: {
  label: string;
  fields: readonly (readonly [string, string])[];
}) {
  return (
    <div className="space-y-3 py-5">
      <p className={groupLabelClass}>{label}</p>
      <dl className="space-y-3">
        {fields.map(([field, description]) => (
          <div key={field} className="space-y-1 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-4 sm:space-y-0">
            <dt className="font-mono text-sm">{field}</dt>
            <dd className="text-sm leading-6 text-muted-foreground">{description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function OutcomeCards({
  label,
  rows,
}: {
  label: string;
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {rows.map(([value, description]) => (
        <li key={value}>
          <Card className="h-full">
            <CardHeader className="space-y-2">
              <Badge variant="secondary" className="w-fit">
                {label}
              </Badge>
              <CardTitle className="font-mono text-base">{value}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function EntityCheckDetail() {
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
          <Badge variant="secondary">Read-only detail</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">EntityCheck France</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            A bounded lookup that resolves a French company query to one public registry record and screens its legal name against a public sanctions list.
          </p>
        </header>
      </div>

      <section aria-labelledby="entitycheck-capability" className="space-y-3">
        <h2 id="entitycheck-capability" className="text-2xl font-semibold tracking-tight">
          Capability
        </h2>
        <p className="leading-7 text-muted-foreground">
          One request resolves a name or SIREN to a registry record with its legal name, administrative status, incorporation date, registered address, and officer count, then reports whether that legal name appears on the sanctions list. Nothing is inferred beyond the two records read.
        </p>
      </section>

      <section aria-labelledby="entitycheck-inputs" className="space-y-4">
        <div className="space-y-2">
          <h2 id="entitycheck-inputs" className="text-2xl font-semibold tracking-tight">
            Inputs
          </h2>
          <p className="leading-7 text-muted-foreground">EntityCheck accepts the following request fields.</p>
        </div>
        <Card>
          <CardContent className="pb-0">
            <FieldGroup label="Request fields" fields={inputFields} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="entitycheck-results" className="space-y-4">
        <div className="space-y-2">
          <h2 id="entitycheck-results" className="text-2xl font-semibold tracking-tight">
            Result boundary
          </h2>
          <p className="leading-7 text-muted-foreground">
            Every result carries one disposition and one sanctions screen value, without a score.
          </p>
        </div>
        <OutcomeCards label="Disposition" rows={dispositions} />
        <OutcomeCards label="Sanctions screen" rows={screens} />
        <p className={noteClass}>{baselineLimitation}</p>
      </section>

      <section aria-labelledby="entitycheck-sources" className="space-y-4">
        <div className="space-y-2">
          <h2 id="entitycheck-sources" className="text-2xl font-semibold tracking-tight">
            Sources
          </h2>
          <p className="leading-7 text-muted-foreground">Both sources are public and each result cites the descriptor of the record it used.</p>
        </div>
        <Card>
          <CardContent className="pb-0">
            <FieldGroup label="Public sources" fields={sources} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="entitycheck-availability" className="space-y-3">
        <h2 id="entitycheck-availability" className="text-2xl font-semibold tracking-tight">
          Configuration boundary
        </h2>
        <p className={noteClass}>
          The API returns unavailable until its host supplies both x402 and source configuration.
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
