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
