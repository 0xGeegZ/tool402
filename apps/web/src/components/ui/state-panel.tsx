import type * as React from "react";

import { cn } from "./cn";

export type StatePanelProps = React.ComponentPropsWithoutRef<"section"> & {
  title: string;
  description: string;
  action?: React.ReactNode;
  illustration?: Omit<React.ComponentPropsWithoutRef<"img">, "alt" | "aria-hidden">;
};

export function StatePanel({
  action,
  className,
  description,
  illustration,
  title,
  ...props
}: StatePanelProps) {
  return (
    <section
      data-slot="state-panel"
      className={cn("space-y-4 rounded-control border border-border bg-card p-5 text-center", className)}
      {...props}
    >
      {illustration ? <img {...illustration} alt="" aria-hidden="true" /> : null}
      <div className="space-y-2">
        <h2 data-slot="state-panel-title" className="text-lg font-semibold">{title}</h2>
        <p data-slot="state-panel-description" className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div data-slot="state-panel-action">{action}</div> : null}
    </section>
  );
}
