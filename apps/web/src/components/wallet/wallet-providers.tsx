"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";

import { tool402WagmiConfig } from "../../lib/wallet/wagmi-config";

const WalletHydrationContext = createContext(false);

type WagmiPersistence = Readonly<{
  hasHydrated: () => boolean;
  onFinishHydration: (listener: () => void) => () => void;
}>;

function wagmiPersistence(): WagmiPersistence {
  // Wagmi starts this persist middleware during provider hydration; it has no public completion hook.
  return (tool402WagmiConfig._internal as unknown as { store: { persist: WagmiPersistence } }).store.persist;
}

function WalletHydrationBoundary({ children }: { readonly children: ReactNode }) {
  const [hydrated, setHydrated] = useState(() => wagmiPersistence().hasHydrated());

  useEffect(() => {
    const persistence = wagmiPersistence();
    if (persistence.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persistence.onFinishHydration(() => setHydrated(true));
  }, []);

  return <WalletHydrationContext.Provider value={hydrated}>{children}</WalletHydrationContext.Provider>;
}

export function useWalletHydrated(): boolean {
  return useContext(WalletHydrationContext);
}

export function WalletProviders({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={tool402WagmiConfig}>
      <QueryClientProvider client={queryClient}><WalletHydrationBoundary>{children}</WalletHydrationBoundary></QueryClientProvider>
    </WagmiProvider>
  );
}
