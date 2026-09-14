"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";

import { tool402WagmiConfig } from "../../lib/wallet/wagmi-config";

export function useWalletHydrated(): boolean {
  // Wagmi exposes restoration through its public `reconnecting` connection
  // status. The domain hook keeps that status non-actionable; no private
  // persistence store or parallel hydration state is needed.
  return true;
}

export function WalletProviders({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={tool402WagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
