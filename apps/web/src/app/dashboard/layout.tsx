import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { readDashboardSession } from "../../lib/dashboard-auth/dashboard-auth.ts";

const sessionCookieName = "__Host-tool402-dashboard-session";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await readDashboardSession(
    (await cookies()).get(sessionCookieName)?.value,
    {
      TOOL402_DASHBOARD_AUTH_ORIGIN: process.env.TOOL402_DASHBOARD_AUTH_ORIGIN,
      TOOL402_DASHBOARD_AUTH_SECRET: process.env.TOOL402_DASHBOARD_AUTH_SECRET,
    },
    Date.now(),
  );
  if (session === null) {
    redirect("/sign-in");
  }

  return children;
}
