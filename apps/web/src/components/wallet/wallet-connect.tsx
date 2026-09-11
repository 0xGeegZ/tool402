"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  discoverMetaMaskProvider,
  type Eip1193Provider,
  watchWalletSessionChanges,
} from "../../lib/wallet/metamask-provider.ts";
import {
  connectWallet,
  readCurrentSession,
  recheckAfterSwitch,
  type WalletState,
} from "../../lib/wallet/wallet-state.ts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export interface WalletSession {
  readonly provider: Eip1193Provider;
  readonly address: string;
}

export interface WalletIslandProps {
  readonly approvedIssuerAddress?: string;
  readonly children?: (session: WalletSession) => ReactNode;
  readonly className?: string;
  readonly heading?: string;
}

function describe(state: WalletState): string {
  switch (state.kind) {
    case "disconnected":
      return "No wallet is connected. Connecting only asks MetaMask for an account; it signs nothing.";
    case "connecting":
      return "Waiting for MetaMask.";
    case "no_provider":
      return "MetaMask was not found. Install or unlock MetaMask, then retry. No other wallet is accepted.";
    case "multiple_providers":
      return "More than one MetaMask provider answered. Disable the extra wallet extension, then retry.";
    case "wrong_chain":
      return state.chainId === null
        ? "MetaMask did not report a chain. Select Hedera Testnet in MetaMask, then retry."
        : `MetaMask is on chain ${state.chainId}, not Hedera Testnet (0x128).`;
    case "not_issuer":
      return `Connected as ${state.address}, which is not the approved issuer ${state.approvedIssuerAddress}. The server decides authority; this is only a local hint.`;
    case "connected":
      return `Connected as ${state.address} on Hedera Testnet. A connected wallet is not an authority.`;
  }
}

export function WalletIsland({
  approvedIssuerAddress,
  children,
  className,
  heading = "Wallet",
}: WalletIslandProps) {
  const [state, setState] = useState<WalletState>({ kind: "disconnected" });
  const providerRef = useRef<Eip1193Provider | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const sessionReadGenerationRef = useRef(0);
  const provider = providerRef.current;

  useEffect(() => {
    if (provider === null) {
      return;
    }

    const cleanup = watchWalletSessionChanges(provider, async () => {
      const readGeneration = sessionReadGenerationRef.current + 1;
      sessionReadGenerationRef.current = readGeneration;
      setState({ kind: "connecting" });
      const connection = await readCurrentSession(provider, approvedIssuerAddress);
      if (
        providerRef.current === provider &&
        sessionReadGenerationRef.current === readGeneration
      ) {
        setState(connection.state);
      }
    });
    cleanupRef.current = cleanup;
    return () => {
      sessionReadGenerationRef.current += 1;
      cleanup();
    };
  }, [approvedIssuerAddress, provider]);

  async function connect() {
    setState({ kind: "connecting" });
    const connection = await connectWallet({
      discover: () => discoverMetaMaskProvider(window),
      approvedIssuerAddress,
    });
    providerRef.current = connection.provider;
    setState(connection.state);
  }

  async function switchChain() {
    const provider = providerRef.current;
    if (provider === null) {
      return;
    }
    setState({ kind: "connecting" });
    const connection = await recheckAfterSwitch(
      provider,
      approvedIssuerAddress,
    );
    providerRef.current = connection.provider;
    setState(connection.state);
  }

  function disconnect() {
    sessionReadGenerationRef.current += 1;
    cleanupRef.current?.();
    cleanupRef.current = null;
    providerRef.current = null;
    setState({ kind: "disconnected" });
  }

  return (
    <section
      data-slot="wallet-island"
      aria-labelledby="wallet-island-title"
      className={className ?? "space-y-3"}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="wallet-island-title" className="text-lg font-semibold">
          {heading}
        </h2>
        {state.kind === "connected" ? (
          <Badge variant="secondary">{state.address}</Badge>
        ) : null}
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {describe(state)}
      </p>
      <div className="flex flex-wrap gap-2">
        {state.kind === "disconnected" ? (
          <Button onClick={connect}>Connect MetaMask</Button>
        ) : null}
        {state.kind === "connecting" ? (
          <Button disabled aria-disabled="true">
            Connecting…
          </Button>
        ) : null}
        {state.kind === "wrong_chain" ? (
          <Button onClick={switchChain}>Switch to Hedera Testnet</Button>
        ) : null}
        {state.kind === "no_provider" ||
        state.kind === "multiple_providers" ||
        state.kind === "wrong_chain" ||
        state.kind === "not_issuer" ? (
          <Button variant="outline" onClick={connect}>
            Retry
          </Button>
        ) : null}
        {state.kind === "connected" ? (
          <Button variant="outline" onClick={disconnect}>
            Disconnect
          </Button>
        ) : null}
      </div>
      {state.kind === "connected" && provider !== null && children !== undefined
        ? children({ provider, address: state.address })
        : null}
    </section>
  );
}
