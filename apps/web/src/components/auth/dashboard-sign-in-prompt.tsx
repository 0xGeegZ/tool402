import { MetaMaskDashboardSignIn } from "./metamask-dashboard-sign-in";

export function DashboardSignInPrompt({
  tour = null,
  demoStep = null,
  returnTo = null,
  accountChanged = false,
}: {
  readonly tour?: "1" | null;
  readonly demoStep?: string | null;
  readonly returnTo?: string | null;
  readonly accountChanged?: boolean;
}) {
  return (
    <main className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard access</p>
        <h1 className="text-3xl font-semibold tracking-tight">Unlock your dashboard</h1>
        <p className="text-muted-foreground">Connect MetaMask on Hedera Testnet, then sign one secure authentication message to continue. It does not send funds or cost HBAR.</p>
        {accountChanged ? <p className="text-sm text-muted-foreground">Your active MetaMask account changed. Sign in again to associate the dashboard with it.</p> : null}
      </header>
      <MetaMaskDashboardSignIn tour={tour} demoStep={demoStep} returnTo={returnTo} />
    </main>
  );
}
