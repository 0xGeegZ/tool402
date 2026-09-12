import { BrandRouteLoader } from "../../components/ui/brand-route-loader";
import { Skeleton } from "../../components/ui/skeleton";

export default function Loading() {
  return (
    <main className="space-y-8 pb-6 sm:pb-12">
      <BrandRouteLoader />
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
