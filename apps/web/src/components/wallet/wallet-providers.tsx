"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import { reconnect } from "wagmi/actions";

import { getTool402WagmiConfig } from "../../lib/wallet/wagmi-config";

const passiveReconnectDelayMs = 500;
const passiveReconnectTimeoutMs = 8_000;
const metaMaskRdns = "io.metamask";
type WalletConfig = Parameters<typeof reconnect>[0];
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

function clearPendingReconnect(config: WalletConfig) {
  if (config.state.status !== "connecting" && config.state.status !== "reconnecting") return;
  config.setState((current) => ({
    ...current,
    connections: new Map(),
    current: null,
    status: "disconnected",
  }));
}

export function WalletProviders({
  children,
  initialState,
}: {
  readonly children: ReactNode;
  readonly initialState: State | undefined;
}) {
  const [config] = useState(getTool402WagmiConfig);
  const [queryClient] = useState(() => new QueryClient());
  const [isPassiveReconnectPending, setPassiveReconnectPending] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const connectors = config.connectors.filter(isMetaMaskConnector);
      void Promise.race([
        reconnect(config, { connectors }),
        new Promise<"timeout">((resolve) => {
          window.setTimeout(() => resolve("timeout"), passiveReconnectTimeoutMs);
        }),
      ]).then((result) => {
        if (result === "timeout") clearPendingReconnect(config);
      }).catch(() => {
        clearPendingReconnect(config);
      }).finally(() => {
        if (active) setPassiveReconnectPending(false);
      });
    }, passiveReconnectDelayMs);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [config]);

  return (
    <PassiveWalletRestoreContext.Provider value={isPassiveReconnectPending}>
      <WagmiProvider config={config} initialState={initialState} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </PassiveWalletRestoreContext.Provider>
  );
}
