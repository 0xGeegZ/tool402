"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";

import { getTool402WagmiConfig } from "../../lib/wallet/wagmi-config";

const WalletHydrationContext = createContext(false);

function WalletHydrationBoundary({ children }: { readonly children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return <WalletHydrationContext.Provider value={hydrated}>{children}</WalletHydrationContext.Provider>;
}

export function useWalletHydrated(): boolean {
  return useContext(WalletHydrationContext);
}

export function WalletProviders({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [config] = useState(getTool402WagmiConfig);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}><WalletHydrationBoundary>{children}</WalletHydrationBoundary></QueryClientProvider>
    </WagmiProvider>
  );
}
