import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { readDashboardSession } from "../../lib/dashboard-auth/dashboard-auth.ts";

const sessionCookieName = "__Host-tool402-dashboard-session";

async function DashboardGate({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await readDashboardSession(
    (await cookies()).get(sessionCookieName)?.value ?? null,
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

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={null}>
      <DashboardGate>{children}</DashboardGate>
    </Suspense>
  );
}
