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
      return "MetaMask only. Exactly one EIP-6963 provider with rdns io.metamask is accepted; anything else fails closed.";
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

const walletChips: Record<WalletState["kind"], { label: string; className: string }> = {
  disconnected: { label: "Not connected", className: "bg-muted text-muted-foreground" },
  connecting: { label: "Connecting", className: "bg-warning text-warning-foreground" },
  no_provider: { label: "Fail closed", className: "bg-destructive text-destructive-foreground" },
  multiple_providers: { label: "Fail closed", className: "bg-destructive text-destructive-foreground" },
  wrong_chain: { label: "Wrong network", className: "bg-warning text-warning-foreground" },
  not_issuer: { label: "Not the issuer", className: "bg-destructive text-destructive-foreground" },
  connected: { label: "Connected · 296", className: "bg-success text-success-foreground" },
};

function shortAddress(address: string): string {
  return `${address.slice(0, 14)}…${address.slice(-6)}`;
}

function WalletIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4" />
      <path d="M16 12h6" />
      <path d="M4 7V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="mt-0.5 shrink-0 animate-spin motion-reduce:animate-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
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

  const chip = walletChips[state.kind];
  const tone = state.kind === "disconnected" ? "" : `rounded-[10px] px-3 py-2 ${chip.className}`;

  return (
    <section
      data-slot="wallet-island"
      aria-labelledby="wallet-island-title"
      className={className ?? "space-y-3"}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="wallet-island-title" className="text-base font-semibold">
          {heading}
        </h2>
        <Badge className={`shrink-0 ${chip.className}`}>{chip.label}</Badge>
      </div>
      <p aria-live="polite" className={`flex min-w-0 items-start gap-2 text-[13px] leading-5 ${tone || "text-muted-foreground"}`}>
        {state.kind === "connecting" ? <SpinnerIcon /> : null}
        <span className="min-w-0 [overflow-wrap:anywhere]">{describe(state)}</span>
      </p>
      {state.kind === "connected" ? (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px]">
          <dt className="text-muted-foreground">Address</dt>
          <dd className="font-mono tabular-nums tracking-[-0.02em]" title={state.address}>
            <span aria-hidden="true">{shortAddress(state.address)}</span>
            <span className="sr-only">{state.address}</span>
          </dd>
          <dt className="text-muted-foreground">Network</dt>
          <dd className="font-mono tabular-nums tracking-[-0.02em]">Hedera Testnet · 296</dd>
        </dl>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {state.kind === "disconnected" ? (
          <Button className="gap-2" onClick={connect}>
            <WalletIcon />
            Connect MetaMask
          </Button>
        ) : null}
        {state.kind === "wrong_chain" ? (
          <Button onClick={switchChain}>Switch to Hedera Testnet</Button>
        ) : null}
        {state.kind === "no_provider" ||
        state.kind === "multiple_providers" ||
        state.kind === "wrong_chain" ? (
          <Button variant="outline" onClick={connect}>
            Retry
          </Button>
        ) : null}
        {state.kind === "not_issuer" ? (
          <Button variant="outline" onClick={disconnect}>
            Disconnect
          </Button>
        ) : null}
        {state.kind === "connected" ? (
          <Button variant="outline" size="sm" onClick={disconnect}>
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
