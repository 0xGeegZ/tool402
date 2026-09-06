import { RiskScanDirectoryDiscovery } from "../../components/discovery/riskscan-directory-discovery";
import { RiskScanDiscoveryCard } from "../../components/discovery/riskscan-discovery-card";

export default function ExplorePage() {
  return (
    <main className="space-y-8 py-6 sm:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm font-medium text-foreground">Discovery</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Explore assessments</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Start with a clear view of the assessments being shaped for Tool402.
        </p>
      </header>
      <RiskScanDiscoveryCard />
      <RiskScanDirectoryDiscovery />
    </main>
  );
}
