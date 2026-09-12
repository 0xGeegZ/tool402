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
