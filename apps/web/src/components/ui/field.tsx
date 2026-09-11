import type * as React from "react";

import { cn } from "./cn";

export const textInputClass = "min-h-10 w-full rounded-control border bg-background px-3";
export const textAreaClass = "min-h-24 w-full rounded-control border bg-background px-3 py-2";

type FieldProps = React.ComponentPropsWithoutRef<"label"> & {
  label: string;
};

export function Field({ label, className, children, ...props }: FieldProps) {
  return (
    <label className={cn("block space-y-2", className)} {...props}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function CheckboxRow({ label, className, children, ...props }: FieldProps) {
  return (
    <label className={cn("flex items-center gap-2", className)} {...props}>
      {children}
      <span>{label}</span>
    </label>
  );
}
