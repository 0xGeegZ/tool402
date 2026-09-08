import { Skeleton } from "../../../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 py-6 sm:py-12">
      <div data-skeleton-region="heading" className="h-12 w-2/3 max-w-3xl">
        <Skeleton />
      </div>
      <div data-skeleton-region="intro" className="h-16 w-full max-w-3xl">
        <Skeleton />
      </div>
      <div
        data-skeleton-region="preflight-boundary"
        className="h-96 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
    </main>
  );
}
