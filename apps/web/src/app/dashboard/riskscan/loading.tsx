import { Skeleton } from "../../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="space-y-8 py-6 sm:py-12">
      <div data-skeleton-region="heading" className="h-12 w-2/3 max-w-3xl">
        <Skeleton />
      </div>
      <div data-skeleton-region="intro" className="h-16 w-full max-w-3xl">
        <Skeleton />
      </div>
      <div
        data-skeleton-region="directory-step"
        className="h-72 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
      <div
        data-skeleton-region="compatibility-step"
        className="h-72 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
      <div
        data-skeleton-region="tool-loop-step"
        className="h-72 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
    </main>
  );
}
