import { Skeleton } from "../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="space-y-8 py-6 sm:py-12">
      <div data-skeleton-region="heading" className="h-32 w-full max-w-2xl">
        <Skeleton />
      </div>
      <div
        data-skeleton-region="risk-scan-discovery"
        className="h-48 w-full max-w-2xl"
      >
        <Skeleton />
      </div>
      <div
        data-skeleton-region="directory-inspection"
        className="h-64 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
    </main>
  );
}
