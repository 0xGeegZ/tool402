"use client";

import { useRef } from "react";
import {
  ProviderNotFoundError,
  useConnect,
  useConfig,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

export const tool402HederaTestnetChainId = 296;
const metaMaskConnectorId = "metaMask";
const metaMaskRdns = "io.metamask";
type ConnectionStatus = "connected" | "connecting" | "disconnected" | "reconnecting";

interface WalletStateInput {
  readonly status: ConnectionStatus;
  readonly address: string | undefined;
  readonly chainId: number | undefined;
  readonly hasMetaMaskConnector: boolean;
  readonly providerUnavailable: boolean;
  readonly connectError?: unknown;
  readonly switchError?: unknown;
}

export type Tool402WalletState =
  | { readonly kind: "resolving" }
  | { readonly kind: "connecting" }
  | { readonly kind: "no_provider" }
  | { readonly kind: "disconnected" }
  | { readonly kind: "wrong_chain"; readonly chainId: number }
  | { readonly kind: "request_failed"; readonly operation: "connect" | "switch" }
  | { readonly kind: "connected"; readonly address: string };

export interface Tool402WalletConnection {
  readonly generation: number;
  readonly status: ConnectionStatus;
  readonly account: string | undefined;
  readonly chainId: number | undefined;
  readonly connector: { readonly id: string; readonly rdns?: string | readonly string[] } | undefined;
}

export type ConnectedTool402WalletConnection = Tool402WalletConnection & {
  readonly status: "connected";
  readonly account: string;
  readonly chainId: typeof tool402HederaTestnetChainId;
  readonly connector: { readonly id: string; readonly rdns?: string | readonly string[] };
};

export function isTool402MetaMaskConnector(
  connector: { readonly id: string; readonly rdns?: string | readonly string[] } | undefined,
): boolean {
  return connector?.id === metaMaskConnectorId
    || connector?.id === metaMaskRdns
    || hasMetaMaskRdns(connector);
}

function hasMetaMaskRdns(
  connector: { readonly rdns?: string | readonly string[] } | undefined,
): boolean {
  return connector?.rdns === metaMaskRdns
    || (Array.isArray(connector?.rdns) && connector.rdns.includes(metaMaskRdns));
}

export function connectedTool402Wallet(
  connection: Tool402WalletConnection,
  resolved: boolean,
): ConnectedTool402WalletConnection | null {
  if (
    !resolved
    || connection.status !== "connected"
    || connection.account === undefined
    || connection.chainId !== tool402HederaTestnetChainId
    || !isTool402MetaMaskConnector(connection.connector)
  ) {
    return null;
  }
  return connection as ConnectedTool402WalletConnection;
}

function walletErrorCode(error: unknown): string | null {
  if (error === null || typeof error !== "object") return null;
  const code = (error as { readonly code?: unknown }).code;
  return typeof code === "number" || typeof code === "string" ? String(code) : null;
}

export function deriveTool402WalletState(input: WalletStateInput): Tool402WalletState {
  if (input.status === "reconnecting") {
    return { kind: "resolving" };
  }
  if (input.status === "connected" && input.address !== undefined) {
    if (input.chainId !== tool402HederaTestnetChainId) {
      return { kind: "wrong_chain", chainId: input.chainId ?? 0 };
    }
    return { kind: "connected", address: input.address.toLowerCase() };
  }
  if (!input.hasMetaMaskConnector || input.providerUnavailable) {
    return { kind: "no_provider" };
  }
  if (input.status === "connecting") {
    return { kind: "connecting" };
  }
  if (input.connectError !== undefined && input.connectError !== null) {
    return { kind: "request_failed", operation: "connect" };
  }
  if (input.switchError !== undefined && input.switchError !== null) {
    return { kind: "request_failed", operation: "switch" };
  }
  return { kind: "disconnected" };
}

export function useTool402Wallet() {
  const config = useConfig();
  const connection = useConnection();
  const connectors = useConnectors();
  const { mutateAsync: connectAsync, error: connectError } = useConnect();
  const { mutateAsync: disconnectAsync } = useDisconnect();
  const { mutateAsync: switchChainAsync, error: switchError } = useSwitchChain();
  const metaMask = connectors.find((connector) => connector.id === metaMaskRdns || hasMetaMaskRdns(connector))
    ?? connectors.find((connector) => connector.id === metaMaskConnectorId);
  const account = connection.address?.toLowerCase();
  const identity = `${connection.status}:${account ?? ""}:${connection.chainId ?? ""}:${connection.connector?.id ?? ""}`;
  const generationRef = useRef({ identity, generation: 0 });
  if (generationRef.current.identity !== identity) {
    generationRef.current = {
      identity,
      generation: generationRef.current.generation + 1,
    };
  }
  const currentConnection: Tool402WalletConnection = {
    generation: generationRef.current.generation,
    status: connection.status,
    account,
    chainId: connection.chainId,
    connector: connection.connector,
  };
  const state = deriveTool402WalletState({
    status: connection.status,
    address: connection.address,
    chainId: connection.chainId,
    hasMetaMaskConnector: metaMask !== undefined,
    providerUnavailable: connectError instanceof ProviderNotFoundError,
    connectError,
    switchError,
  });
  return {
    connection: currentConnection,
    resolved: connection.status !== "reconnecting" && connection.status !== "connecting",
    state,
    connectErrorCode: walletErrorCode(connectError),
    async connect() {
      if (metaMask !== undefined) {
        try {
          await connectAsync({ connector: metaMask });
        } catch {
          // Wagmi exposes the mutation error on the next render for accessible retry copy.
        }
      }
    },
    async disconnect() {
      const connector = connection.connector ?? metaMask;
      if (connector !== undefined) {
        try {
          await disconnectAsync({ connector });
        } catch {
          // The current connection remains authoritative until Wagmi reports otherwise.
        }
      }
    },
    async cancelConnection() {
      // Clear this before disconnecting: a broken injected provider can leave
      // its disconnect promise pending, but it must never be retried on reload.
      const connector = connection.connector ?? metaMask;
      if (connector !== undefined) {
        await config.storage?.setItem(`${connector.id}.disconnected`, true);
      }
      await config.storage?.removeItem("recentConnectorId");
      try {
        // A connection request has no established connector yet. Omitting it clears Wagmi's
        // pending state without issuing another request to MetaMask.
        await disconnectAsync();
      } catch {
        // The current connection remains authoritative until Wagmi reports otherwise.
      }
    },
    async switchToHedera() {
      try {
        await switchChainAsync({ chainId: tool402HederaTestnetChainId });
      } catch {
        // Wagmi exposes the mutation error on the next render for accessible retry copy.
      }
    },
  };
}
