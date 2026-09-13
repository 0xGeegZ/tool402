import { recordingTourHref } from "./demo-control-room.ts";

export function dashboardTourHref(tour: unknown, demoStep?: unknown): string {
  if (tour !== "1") return "/dashboard";
  if (typeof demoStep !== "string") return "/dashboard?tour=1";
  try {
    return recordingTourHref("/dashboard", demoStep);
  } catch {
    return "/dashboard?tour=1";
  }
}

/** Allows an explicitly local post-auth route while rejecting every external or recursive target. */
export function safeDashboardReturnHref(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const target = new URL(value, "https://tool402.invalid");
    if (target.origin !== "https://tool402.invalid" || target.pathname === "/sign-in" || target.hash !== "") return null;
    return `${target.pathname}${target.search}`;
  } catch {
    return null;
  }
}
