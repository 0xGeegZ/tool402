import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MetaMaskDashboardSignIn } from "../../components/auth/metamask-dashboard-sign-in";
import { readDashboardSession } from "../../lib/dashboard-auth/dashboard-auth.ts";

const sessionCookieName = "__Host-tool402-dashboard-session";

export default async function SignInPage() {
  const session = await readDashboardSession(
    (await cookies()).get(sessionCookieName)?.value,
    {
      TOOL402_DASHBOARD_AUTH_ORIGIN: process.env.TOOL402_DASHBOARD_AUTH_ORIGIN,
      TOOL402_DASHBOARD_AUTH_SECRET: process.env.TOOL402_DASHBOARD_AUTH_SECRET,
    },
    Date.now(),
  );
  if (session !== null) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard access</p>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to Tool402</h1>
        <p className="text-muted-foreground">Connect MetaMask on Hedera Testnet, then choose whether to sign in.</p>
      </header>
      <MetaMaskDashboardSignIn />
    </main>
  );
}
