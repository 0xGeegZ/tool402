import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function RiskScanDiscoveryCard() {
  return (
    <Card className="max-w-2xl overflow-hidden">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit">
          In discovery
        </Badge>
        <CardTitle>RiskScan</CardTitle>
        <CardDescription>
          A read-only introduction to a bounded assessment for considering a tool&apos;s risk signals with care.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">This surface is descriptive only.</p>
      </CardContent>
    </Card>
  );
}
