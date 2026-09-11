import { cookies } from "next/headers";

import { LocalNavigation } from "../discovery/local-navigation";
import { readDashboardSession } from "../../lib/dashboard-auth/dashboard-auth";

const sessionCookieName = "__Host-tool402-dashboard-session";

export async function DashboardNavigation() {
  const session = await readDashboardSession(
    (await cookies()).get(sessionCookieName)?.value ?? null,
    {
      TOOL402_DASHBOARD_AUTH_ORIGIN: process.env.TOOL402_DASHBOARD_AUTH_ORIGIN,
      TOOL402_DASHBOARD_AUTH_SECRET: process.env.TOOL402_DASHBOARD_AUTH_SECRET,
    },
    Date.now(),
  );

  return <LocalNavigation showDashboard={session !== null} />;
}
