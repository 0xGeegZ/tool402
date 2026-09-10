import { ExploreCatalog } from "../../components/discovery/explore-catalog";
import { PageHeader } from "../../components/ui/page-header";

export default function ExplorePage() {
  return (
    <main className="space-y-12 pb-12 sm:space-y-16 sm:pb-20">
      <PageHeader
        eyebrow="Marketplace"
        title="Explore tools"
        description="Bounded, machine-payable tools with an inspectable journey. Start with what each one covers."
      />
      <ExploreCatalog />
    </main>
  );
}
