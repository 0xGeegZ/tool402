"use client";

import Link from "next/link";

import type { WalletState } from "../../lib/wallet/wallet-state.ts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useWalletSession } from "./wallet-session";

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

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletIsland() {
  const { state, connect, switchChain } = useWalletSession();

  return (
    <div data-slot="wallet-island" className="flex items-center gap-2">
      {state.kind === "disconnected" ? (
        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => connect()}>
          Connect MetaMask
        </Button>
      ) : null}
      {state.kind === "connecting" ? (
        <Button size="sm" className="whitespace-nowrap" disabled aria-disabled="true">
          Connecting…
        </Button>
      ) : null}
      {state.kind === "wrong_chain" ? (
        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={switchChain}>
          Switch to Hedera Testnet
        </Button>
      ) : null}
      {state.kind === "no_provider" || state.kind === "multiple_providers" ? (
        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => connect()}>
          Retry
        </Button>
      ) : null}
      {state.kind === "connected" || state.kind === "not_issuer" ? (
        <Link href="/dashboard" aria-label="Open dashboard" className="touch-target rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <Badge variant="secondary" title={state.address}>
            {shortenAddress(state.address)}
          </Badge>
        </Link>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {describe(state)}
      </p>
    </div>
  );
}
