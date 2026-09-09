import Link from "next/link";

import type { ProviderStatus as ProviderStatusRecord } from "../../../lib/offering-projection";
import { Badge } from "../../ui/badge";
import { buttonVariants } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { evidenceRows, hashscanLink, nextActionFor, outcomeStatement } from "./provider-status-state";

const noteClass = "border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground";
const headingClass = "text-2xl font-semibold tracking-tight";

function Rows({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="space-y-1">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-all font-mono text-xs text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProviderStatus({ status }: { status: ProviderStatusRecord }) {
  const { offering, directory } = status;
  const record = offering.kind === "loaded" ? offering.record : null;
  const directoryVersion = directory.kind === "loaded" ? directory : null;
  const rows = evidenceRows(offering, directory);
  const link = record === null ? null : hashscanLink(record);

  return (
    <div className="space-y-8">
      <section aria-labelledby="provider-state" className="space-y-3">
        <h2 id="provider-state" className={headingClass}>Offering state</h2>
        {record === null ? (
          <p className={noteClass}>{outcomeStatement(offering.kind)}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{record.state}</Badge>
            <span className="text-sm text-muted-foreground">Terms {record.definition.terms.version}</span>
            {directoryVersion === null ? (
              <span className="text-sm text-muted-foreground">Directory: {outcomeStatement(directory.kind)}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Directory v{directoryVersion.directoryVersion} {directoryVersion.record.status}</span>
            )}
          </div>
        )}
        <p className={noteClass}>A rendered state is an admitted record, never an on-chain fact, settlement, or deployment.</p>
      </section>

      <section aria-labelledby="provider-next-action" className="space-y-3">
        <h2 id="provider-next-action" className={headingClass}>Next action</h2>
        {record === null ? (
          <p className={noteClass}>{outcomeStatement(offering.kind)}</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-foreground">{nextActionFor(record.state).label}</p>
            {nextActionFor(record.state).control === null ? null : (
              <Link href="/provider/deploy" className={buttonVariants({ variant: "outline" })}>Open the deploy wizard</Link>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="provider-evidence" className="space-y-3">
        <h2 id="provider-evidence" className={headingClass}>Deployment evidence</h2>
        {record === null ? <p className={noteClass}>{outcomeStatement(offering.kind)}</p> : null}
        <p className="text-sm leading-6 text-muted-foreground">Every cell is drawn from a projection field; a cell with no field reads not recorded.</p>
        <div className="overflow-x-auto rounded-[var(--radius)] border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2">Record</th>
                <th scope="col" className="px-3 py-2">Reference</th>
                <th scope="col" className="px-3 py-2">Verification</th>
                <th scope="col" className="px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.record} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{row.record}</td>
                  <td className="break-all px-3 py-2 font-mono text-xs">
                    {row.record === "revenue note" && link !== null ? (
                      <a href={link} rel="noreferrer" className="underline underline-offset-2">
                        {row.reference}
                        <span className="sr-only"> (leaves this site for Hashscan)</span>
                      </a>
                    ) : row.reference}
                  </td>
                  <td className="px-3 py-2">{row.verification}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="provider-terms" className="space-y-3">
        <h2 id="provider-terms" className={headingClass}>Active terms</h2>
        {record === null ? (
          <p className={noteClass}>{outcomeStatement(offering.kind)}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Terms {record.definition.terms.version}</CardTitle>
              <CardDescription>A material change requires a new offering version with its own signature and directory version.</CardDescription>
            </CardHeader>
            <CardContent>
              <Rows
                rows={[
                  ["Funding target (tinybars)", record.definition.terms.fundingTargetTinybars],
                  ["Unit price (tinybars)", record.definition.terms.noteUnitPriceTinybars],
                  ["Maximum units", record.definition.terms.maximumNoteUnits],
                  ["Minimum units", record.definition.terms.minimumPurchaseUnits],
                  ["Reserve share (bps)", record.definition.terms.reserveShareBps],
                  ["Issuer share (bps)", record.definition.terms.issuerShareBps],
                  ["Platform fee (bps)", record.definition.terms.platformFeeBps],
                  ["Payout cap (tinybars)", record.definition.terms.payoutCapTinybars],
                  ["Maturity", record.definition.maturityAt],
                  ["Qualifying resource", record.definition.qualifyingResource],
                  ["Advertised quick tier (tinybars)", record.advertisedQuickPriceTinybars],
                  ["Advertised standard tier (tinybars)", record.advertisedStandardPriceTinybars],
                ]}
              />
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="provider-directory" className="space-y-3">
        <h2 id="provider-directory" className={headingClass}>Active directory version</h2>
        {directoryVersion === null ? (
          <p className={noteClass}>{outcomeStatement(directory.kind)}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{directoryVersion.record.serviceSlug} v{directoryVersion.directoryVersion}</CardTitle>
              <CardDescription>Published directory record as the backend stores it.</CardDescription>
            </CardHeader>
            <CardContent>
              <Rows
                rows={[
                  ["Service", directoryVersion.record.serviceSlug],
                  ["Directory version", String(directoryVersion.directoryVersion)],
                  ["Status", directoryVersion.record.status],
                  ["x402 endpoint", directoryVersion.record.x402Endpoint],
                  ["Clearing account", directoryVersion.record.clearingAccount],
                ]}
              />
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="provider-signer" className="space-y-3">
        <h2 id="provider-signer" className={headingClass}>Signer</h2>
        {record === null ? (
          <p className={noteClass}>{outcomeStatement(offering.kind)}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="break-all font-mono text-base">{record.canonicalSignerAddress}</CardTitle>
              <CardDescription>The signer of the admitted command on chain 296. This does not assert that the signer holds an authority today.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  );
}
