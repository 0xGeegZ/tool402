import { Skeleton } from "../../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 py-6 sm:py-12">
      <div data-skeleton-region="navigation" className="h-24 w-48">
        <Skeleton />
      </div>
      <div data-skeleton-region="heading" className="h-32 w-full max-w-3xl">
        <Skeleton />
      </div>
      <div data-skeleton-region="inputs" className="h-96 w-full max-w-3xl">
        <Skeleton />
      </div>
      <div
        data-skeleton-region="result-boundary"
        className="h-96 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
      <div
        data-skeleton-region="configuration-boundary"
        className="h-40 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
    </main>
  );
}
