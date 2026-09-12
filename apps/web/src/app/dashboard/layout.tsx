import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { readDashboardSession, readDashboardSessionCookieName } from "../../lib/dashboard-auth/dashboard-auth.ts";

async function DashboardGate({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sessionCookieName = readDashboardSessionCookieName(process.env);
  const session = await readDashboardSession(
    sessionCookieName === null ? null : (await cookies()).get(sessionCookieName)?.value ?? null,
    process.env,
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
