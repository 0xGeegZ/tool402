import { ExploreCatalog } from "../../components/discovery/explore-catalog";
import { PageHeader } from "../../components/ui/page-header";

export default function ExplorePage() {
  return (
    <main className="space-y-10 pb-12 sm:space-y-12 sm:pb-20">
      <section aria-label="Explore introduction" className="border-b border-border bg-muted/35 px-5 py-9 sm:px-8 sm:py-11">
        <PageHeader
          eyebrow="Marketplace"
          title="Explore tools"
          description="Two local tools with clear routes to inspect what each one covers."
        />
      </section>
      <ExploreCatalog />
    </main>
  );
}
