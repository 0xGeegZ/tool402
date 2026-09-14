"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";

import { tool402WagmiConfig } from "../../lib/wallet/wagmi-config";

export function useWalletHydrated(): boolean {
  // The client-only config restores persistence before its provider children
  // render. While Wagmi reconnects, the domain hook still exposes a
  // non-actionable `reconnecting` state.
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
