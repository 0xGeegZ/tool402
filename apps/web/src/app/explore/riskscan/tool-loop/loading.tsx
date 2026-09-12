import { BrandRouteLoader } from "../../../../components/ui/brand-route-loader";
import { Skeleton } from "../../../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 pb-6 sm:pb-12">
      <BrandRouteLoader />
      <div data-skeleton-region="heading" className="h-32 w-full max-w-3xl">
        <Skeleton />
      </div>
      <div
        data-skeleton-region="tool-loop-boundary"
        className="h-96 w-full max-w-3xl"
      >
        <Skeleton />
      </div>
    </main>
  );
}
