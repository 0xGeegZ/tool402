export function withTour(href: string): string {
  return href.includes("?") ? `${href}&tour=1` : `${href}?tour=1`;
}

export function dashboardTourHref(tour: unknown): "/dashboard" | "/dashboard?tour=1" {
  return tour === "1" ? "/dashboard?tour=1" : "/dashboard";
}
