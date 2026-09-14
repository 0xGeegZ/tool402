"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { getTool402WagmiConfig } from "../../lib/wallet/wagmi-config";

export function WalletProviders({
  children,
  initialState,
}: {
  readonly children: ReactNode;
  readonly initialState: State | undefined;
}) {
  const [config] = useState(getTool402WagmiConfig);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
