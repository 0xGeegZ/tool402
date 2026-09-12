import { cookies } from "next/headers";

import { LocalNavigation } from "../discovery/local-navigation";
import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth";
import { DashboardSessionSync } from "./dashboard-session-sync";

export async function DashboardNavigation() {
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const cookieStore = await cookies();
  const session = await readDashboardSession(
    sessionCookieName === null ? null : cookieStore.get(sessionCookieName)?.value ?? null,
    process.env,
    Date.now(),
  );

  return (
    <>
      <LocalNavigation showDashboard={session !== null} />
      {session === null ? null : <DashboardSessionSync />}
    </>
  );
}
