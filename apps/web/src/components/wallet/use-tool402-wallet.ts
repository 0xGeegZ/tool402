"use client";

import {
  ProviderNotFoundError,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

const hederaTestnetChainId = 296;
const metaMaskConnectorId = "metaMask";

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "reconnecting";

interface WalletStateInput {
  readonly status: ConnectionStatus;
  readonly address: string | undefined;
  readonly chainId: number | undefined;
  readonly connector: { readonly id: string } | undefined;
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

export function deriveTool402WalletState(input: WalletStateInput): Tool402WalletState {
  if (input.status === "reconnecting") {
    return { kind: "resolving" };
  }
  if (!input.hasMetaMaskConnector || input.providerUnavailable) {
    return { kind: "no_provider" };
  }
  if (input.connectError !== undefined && input.connectError !== null) {
    return { kind: "request_failed", operation: "connect" };
  }
  if (input.switchError !== undefined && input.switchError !== null) {
    return { kind: "request_failed", operation: "switch" };
  }
  if (input.status === "connecting") {
    return { kind: "connecting" };
  }
  if (input.status !== "connected" || input.address === undefined) {
    return { kind: "disconnected" };
  }
  if (input.chainId !== hederaTestnetChainId) {
    return { kind: "wrong_chain", chainId: input.chainId ?? 0 };
  }
  return { kind: "connected", address: input.address.toLowerCase() };
}

export function useTool402Wallet() {
  const connection = useConnection();
  const connectors = useConnectors();
  const { mutateAsync: connectAsync, error: connectError } = useConnect();
  const { mutateAsync: disconnectAsync } = useDisconnect();
  const { mutateAsync: switchChainAsync, error: switchError } = useSwitchChain();
  const metaMask = connectors.find((connector) => connector.id === metaMaskConnectorId);
  const state = deriveTool402WalletState({
    status: connection.status,
    address: connection.address,
    chainId: connection.chainId,
    connector: connection.connector,
    hasMetaMaskConnector: metaMask !== undefined,
    providerUnavailable: connectError instanceof ProviderNotFoundError,
    connectError,
    switchError,
  });

  return {
    state,
    async connect() {
      if (metaMask !== undefined) {
        await connectAsync({ connector: metaMask });
      }
    },
    async disconnect() {
      const connector = connection.connector ?? metaMask;
      if (connector !== undefined) {
        await disconnectAsync({ connector });
      }
    },
    async switchToHedera() {
      await switchChainAsync({ chainId: hederaTestnetChainId });
    },
  };
}
