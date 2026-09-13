"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useTool402Wallet, type Tool402WalletState } from "./use-tool402-wallet";

function describe(state: Tool402WalletState): string {
  switch (state.kind) {
    case "resolving":
      return "Restoring the MetaMask connection without requesting an account.";
    case "disconnected":
      return "No wallet is connected. Connecting only asks MetaMask for an account; it signs nothing.";
    case "connecting":
      return "Waiting for MetaMask.";
    case "no_provider":
      return "MetaMask was not found. Install or unlock MetaMask, then retry. No other wallet is accepted.";
    case "wrong_chain":
      return `MetaMask is on chain ${state.chainId}, not Hedera Testnet (0x128).`;
    case "request_failed":
      return state.operation === "switch"
        ? "MetaMask did not switch to Hedera Testnet. Retry the switch when ready."
        : "MetaMask did not connect. Retry when ready; nothing was signed.";
    case "connected":
      return `Connected as ${state.address} on Hedera Testnet. A connected wallet is not an authority.`;
  }
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletIsland() {
  const { state, connect, switchToHedera } = useTool402Wallet();

  return (
    <div data-slot="wallet-island" className="flex items-center gap-2">
      {state.kind === "disconnected" ? (
        <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap" onClick={() => connect()}>
          <Image src="/brand/metamask-fox.svg" alt="" aria-hidden="true" width={18} height={18} />
          Connect MetaMask
        </Button>
      ) : null}
      {state.kind === "resolving" || state.kind === "connecting" ? (
        <Button size="sm" className="whitespace-nowrap" disabled aria-disabled="true">
          Connecting…
        </Button>
      ) : null}
      {state.kind === "wrong_chain" ? (
        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => void switchToHedera()}>
          Switch to Hedera Testnet
        </Button>
      ) : null}
      {state.kind === "no_provider" || state.kind === "request_failed" ? (
        <Button
          variant="outline"
          size="sm"
          className="whitespace-nowrap"
          onClick={() => void (state.kind === "request_failed" && state.operation === "switch" ? switchToHedera() : connect())}
        >
          Retry
        </Button>
      ) : null}
      {state.kind === "connected" ? (
        <Link href="/dashboard" prefetch={false} aria-label="Open dashboard" className="touch-target rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
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
