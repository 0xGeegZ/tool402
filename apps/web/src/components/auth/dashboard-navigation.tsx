import { cookies } from "next/headers";

import { LocalNavigation } from "../discovery/local-navigation";
import { readDashboardSession } from "../../lib/dashboard-auth/dashboard-auth";

const sessionCookieName = "__Host-tool402-dashboard-session";

export async function DashboardNavigation() {
  const session = await readDashboardSession(
    (await cookies()).get(sessionCookieName)?.value ?? null,
    process.env,
    Date.now(),
  );

  return <LocalNavigation showDashboard={session !== null} />;
}
