import { ExploreCatalog } from "../../components/discovery/explore-catalog";
import { PageHeader } from "../../components/ui/page-header";

export default function ExplorePage() {
  return (
    <main className="space-y-8 pb-6 sm:pb-12">
      <PageHeader eyebrow="Marketplace" title="Explore tools" description="Bounded, machine-payable tools with an inspectable journey. Start with what each one covers." />
      <ExploreCatalog />
    </main>
  );
}
