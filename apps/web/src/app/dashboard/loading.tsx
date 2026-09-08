import { Skeleton } from "../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="space-y-8 py-6 sm:py-12">
      <div data-skeleton-region="heading" className="h-12 w-2/3 max-w-2xl">
        <Skeleton />
      </div>
      <div
        data-skeleton-region="guest-context"
        className="h-24 w-full max-w-2xl"
      >
        <Skeleton />
      </div>
      <div data-skeleton-region="overview" className="h-40 w-full max-w-2xl">
        <Skeleton />
      </div>
      <div
        data-skeleton-region="navigation"
        className="h-24 w-full max-w-2xl"
      >
        <Skeleton />
      </div>
    </main>
  );
}
