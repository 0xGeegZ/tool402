"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useConnectors, useReconnect, WagmiProvider } from "wagmi";

import { getTool402WagmiConfig } from "../../lib/wallet/wagmi-config";

const metaMaskRdns = "io.metamask";
const PassiveWalletRestoreContext = createContext(true);

export function usePassiveWalletRestore(): boolean {
  return useContext(PassiveWalletRestoreContext);
}

function isMetaMaskConnector(connector: { readonly id: string; readonly rdns?: string | readonly string[] }): boolean {
  return connector.id === "metaMask"
    || connector.id === metaMaskRdns
    || connector.rdns === metaMaskRdns
    || (Array.isArray(connector.rdns) && connector.rdns.includes(metaMaskRdns));
}

function PassiveWalletRestore({ children }: { readonly children: ReactNode }) {
  const connectors = useConnectors();
  const { mutateAsync: reconnectAsync } = useReconnect();
  const [isPassiveReconnectPending, setPassiveReconnectPending] = useState(true);

  useEffect(() => {
    let active = true;
    const metaMaskConnectors = connectors.filter(isMetaMaskConnector);

    void reconnectAsync({ connectors: metaMaskConnectors }).catch(() => {
      // A rejected passive reconnect only finishes resolution; it never opens a wallet request.
    }).finally(() => {
      if (active) setPassiveReconnectPending(false);
    });

    return () => {
      active = false;
    };
  }, [connectors, reconnectAsync]);

  return (
    <PassiveWalletRestoreContext.Provider value={isPassiveReconnectPending}>
      {children}
    </PassiveWalletRestoreContext.Provider>
  );
}

export function WalletProviders({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [config] = useState(getTool402WagmiConfig);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <PassiveWalletRestore>{children}</PassiveWalletRestore>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
