import type * as React from "react";

import { cn } from "./cn";

export const statusTones = ["neutral", "working", "success", "warning", "error"] as const;

export type StatusTone = (typeof statusTones)[number];

const toneLabels: Record<StatusTone, string> = {
  neutral: "Status",
  working: "Working",
  success: "Complete",
  warning: "Attention",
  error: "Error",
};

const toneClassNames: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  working: "border-primary/30 bg-secondary text-secondary-foreground",
  success: "border-success/30 bg-success text-success-foreground",
  warning: "border-warning/30 bg-warning text-warning-foreground",
  error: "border-destructive/30 bg-destructive text-destructive-foreground",
};

export function statusToneForOutcome(outcome: string): StatusTone {
  switch (outcome) {
    case "idle":
      return "neutral";
    case "submitting":
    case "inspecting":
    case "evaluating":
      return "working";
    case "quick_response":
    case "tool_selected":
    case "eligible":
    case "disclosures_reported":
      return "success";
    case "payment_required":
    case "declined":
    case "needs_disclosure":
      return "warning";
    case "unavailable":
    case "invalid_request":
    case "transport_failure":
    case "unexpected_response":
    case "directory_unavailable":
    case "directory_invalid":
    case "native_summary_unavailable":
    case "invalid_input":
      return "error";
    default:
      return "error";
  }
}

export function StatusRegion({ className, children, ...props }: React.ComponentPropsWithoutRef<"section">) {
  return (
    <section data-slot="status-region" aria-live="polite" className={cn("mt-6 empty:mt-0", className)} {...props}>
      {children}
    </section>
  );
}

export type StatusProps = React.ComponentPropsWithoutRef<"p"> & {
  tone: StatusTone;
  live?: boolean;
};

export function Status({ className, children, tone, live = true, ...props }: StatusProps) {
  return (
    <p
      data-slot="status"
      data-tone={tone}
      role={live ? (tone === "error" ? "alert" : "status") : undefined}
      className={cn("flex items-start gap-2 rounded-control border px-3 py-2 text-sm", toneClassNames[tone], className)}
      {...props}
    >
      <span data-slot="status-label" className="shrink-0 font-medium">{toneLabels[tone]}</span>
      <span>{children}</span>
    </p>
  );
}
