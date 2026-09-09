import { ExploreCatalog } from "../../components/discovery/explore-catalog";
import { Badge } from "../../components/ui/badge";

export default function ExplorePage() {
  return (
    <main className="space-y-8 pb-6 sm:pb-12">
      <header className="max-w-3xl space-y-4">
        <Badge variant="outline" className="w-fit">Marketplace</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Explore tools</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Bounded, machine-payable tools with an inspectable journey. Start with what each one covers.
        </p>
      </header>
      <ExploreCatalog />
    </main>
  );
}
