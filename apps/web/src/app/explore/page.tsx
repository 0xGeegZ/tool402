import { ExploreCatalog } from "../../components/discovery/explore-catalog";
import { Badge } from "../../components/ui/badge";

export default function ExplorePage() {
  return (
    <main className="space-y-12 pb-12 sm:space-y-16 sm:pb-20">
      <header className="max-w-3xl space-y-4">
        <Badge variant="outline" className="w-fit border-brand-green/35 bg-success/70 text-success-foreground">Marketplace</Badge>
        <h1 className="text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Explore tools</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Bounded, machine-payable tools with an inspectable journey. Start with what each one covers.
        </p>
      </header>
      <ExploreCatalog />
    </main>
  );
}
