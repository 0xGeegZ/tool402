"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { usePassiveWalletRestore } from "./wallet-providers";
import { useTool402Wallet, type Tool402WalletState } from "./use-tool402-wallet";

function describe(state: Tool402WalletState, isCheckingConnection: boolean): string {
  if (isCheckingConnection) return "Checking whether MetaMask is already connected.";

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
  const { state, connect, disconnect, switchToHedera } = useTool402Wallet();
  const isPassiveReconnectPending = usePassiveWalletRestore();
  const isCheckingConnection = isPassiveReconnectPending || state.kind === "resolving";

  return (
    <div data-slot="wallet-island" className="flex items-center gap-2">
      {state.kind === "disconnected" && !isCheckingConnection ? (
        <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap" onClick={() => void connect()}>
          <Image src="/brand/metamask-fox.svg" alt="" aria-hidden="true" width={18} height={18} />
          Connect MetaMask
        </Button>
      ) : null}
      {isCheckingConnection ? (
        <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap" disabled aria-disabled="true">
          <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
          Checking MetaMask…
        </Button>
      ) : null}
      {state.kind === "connecting" ? (
        <Button variant="outline" size="sm" className="whitespace-nowrap" disabled aria-disabled="true">
          Waiting for MetaMask…
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
        <>
          <Link href="/dashboard" prefetch={false} aria-label="Open dashboard" className="touch-target rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <Badge variant="secondary" title={state.address}>
              {shortenAddress(state.address)}
            </Badge>
          </Link>
          <Button variant="outline" size="sm" aria-label="Disconnect MetaMask" onClick={() => void disconnect()}>
            Disconnect
          </Button>
        </>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {describe(state, isCheckingConnection)}
      </p>
    </div>
  );
}
