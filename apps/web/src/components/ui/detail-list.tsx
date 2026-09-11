import type * as React from "react";

import { cn } from "./cn";

export type DetailItem = readonly [label: string, value: React.ReactNode];

type DetailListProps = Omit<React.ComponentPropsWithoutRef<"dl">, "children"> & {
  items: ReadonlyArray<DetailItem>;
  columns?: 2 | 3;
};

export function DetailList({ items, columns = 2, className, ...props }: DetailListProps) {
  return (
    <dl
      data-slot="detail-list"
      className={cn("grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", className)}
      {...props}
    >
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-all font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
