import type * as React from "react";

import { cn } from "./cn";

type CardProps = React.ComponentPropsWithoutRef<"section">;
type CardSectionProps = React.ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return <section data-slot="card" className={cn("rounded-[var(--radius)] border bg-card text-card-foreground shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardSectionProps) {
  return <div data-slot="card-header" className={cn("space-y-1 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentPropsWithoutRef<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-lg font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: CardSectionProps) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardSectionProps) {
  return <div data-slot="card-content" className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardSectionProps) {
  return <div data-slot="card-footer" className={cn("border-t px-5 py-4", className)} {...props} />;
}
