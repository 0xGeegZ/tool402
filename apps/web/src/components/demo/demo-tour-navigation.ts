import { recordingTourHref } from "./demo-control-room.ts";

export function withTour(href: string): string {
  return href.includes("?") ? `${href}&tour=1` : `${href}?tour=1`;
}

export function dashboardTourHref(tour: unknown, demoStep?: unknown): string {
  if (tour !== "1") return "/dashboard";
  if (typeof demoStep !== "string") return "/dashboard?tour=1";
  try {
    return recordingTourHref("/dashboard", demoStep);
  } catch {
    return "/dashboard?tour=1";
  }
}
