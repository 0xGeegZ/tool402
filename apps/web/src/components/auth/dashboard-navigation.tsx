import { cookies } from "next/headers";

import { LocalNavigation } from "../discovery/local-navigation";
import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth";

export async function DashboardNavigation() {
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const session = await readDashboardSession(
    sessionCookieName === null ? null : (await cookies()).get(sessionCookieName)?.value ?? null,
    process.env,
    Date.now(),
  );

  return <LocalNavigation showDashboard={session !== null} />;
}
