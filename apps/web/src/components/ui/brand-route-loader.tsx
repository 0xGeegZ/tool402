"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function BrandRouteLoader() {
  const [showArtwork, setShowArtwork] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowArtwork(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="min-h-1">
      <span className="sr-only">Loading</span>
      <div
        data-ui="brand-route-loader"
        aria-hidden="true"
        className={`mx-auto mb-6 w-full max-w-xs overflow-hidden rounded-card border border-primary/15 bg-card px-5 pt-4 shadow-sm transition-opacity duration-200 ${showArtwork ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Image src="/brand/route-loader-trio.png" alt="" width={1448} height={1086} className="mx-auto h-28 w-auto object-contain" />
        <div className="flex justify-center gap-2 pb-4">
          <span className="size-2 animate-pulse rounded-full bg-brand-purple motion-reduce:animate-none" />
          <span className="size-2 animate-pulse rounded-full bg-brand-orange [animation-delay:150ms] motion-reduce:animate-none" />
          <span className="size-2 animate-pulse rounded-full bg-brand-green [animation-delay:300ms] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
