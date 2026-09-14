import Link from "next/link";

import { readProviderBackingCatalog } from "../../lib/offering-projection.ts";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";

export async function ProviderBackingDiscovery() {
  const entries = await readProviderBackingCatalog(process.env, globalThis.fetch);
  if (entries.length === 0) return null;
  return (
    <section className="space-y-4" aria-label="Published provider projects">
      <div className="space-y-1">
        <p className="text-sm font-semibold">Published provider projects</p>
        <p className="text-sm leading-6 text-muted-foreground">OPEN offerings with server-owned terms and an explicit testnet backing route.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <Card key={entry.offeringPublicId} className="flex min-h-52 flex-col">
            <CardHeader className="gap-3">
              <Badge variant="outline" className="w-fit border-primary/20 bg-primary/[0.06] text-primary">OPEN · Hedera testnet</Badge>
              <CardTitle>{entry.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">Review terms and explicitly back this provider project with your own testnet HBAR.</CardContent>
            <CardFooter className="mt-auto"><Link className="text-sm font-semibold text-primary hover:underline" href={`/explore/provider/${entry.offeringPublicId}/back`}>Review backing terms →</Link></CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
