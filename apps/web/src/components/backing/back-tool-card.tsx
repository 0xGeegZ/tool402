import Link from "next/link";

import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { DetailList } from "../ui/detail-list";
import { formatHbar, formatShare, readBackingOffering, type BackingProjection } from "./backing-state";

export function BackToolCard({ tool, href, projection }: { tool: string; href?: string; projection: BackingProjection | null }) {
  const offering = projection?.state === "OPEN" ? readBackingOffering(projection) : null;

  if (offering === null || href === undefined) {
    return (
      <Card className="rounded-panel">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Back {tool}</CardTitle>
            <Badge variant="outline">No open offering</Badge>
          </div>
          <CardDescription>{tool} has no open offering. This card opens the funding flow once an issuer's offering is OPEN.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-panel">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Back {tool}</CardTitle>
          <Badge variant="secondary">Open offering</Badge>
        </div>
        <CardDescription>Fund note units with HBAR. A disclosed {formatShare(offering.terms.reserveShareBps)}% of qualifying usage revenue funds capped distributions under the offering terms.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailList
          items={[
            ["Minimum", `${offering.terms.minimumPurchaseUnits} units · ${formatHbar(offering.terms.minimumPurchaseUnits * offering.terms.noteUnitPriceTinybars)}`],
            ["Unit price", formatHbar(offering.terms.noteUnitPriceTinybars)],
            ["Revenue share", `${formatShare(offering.terms.reserveShareBps)}%`],
            ["Maturity", offering.maturityAt],
          ]}
        />
        <Link href={href} className={buttonVariants({ className: "w-full" })}>
          Back {tool}
        </Link>
        <p className="text-sm text-muted-foreground">MetaMask · Hedera Testnet · one signature, one HBAR transfer.</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Terms {offering.terms.version} · not a projected return. No payout amount or timeline is promised.</p>
      </CardFooter>
    </Card>
  );
}
