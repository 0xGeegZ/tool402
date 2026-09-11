"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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

export interface WalletSession {
  readonly provider: Eip1193Provider;
  readonly address: string;
}

export interface WalletSessionValue {
  readonly state: WalletState;
  readonly provider: Eip1193Provider | null;
  connect(approvedIssuerAddress?: string): Promise<void>;
  switchChain(): Promise<void>;
  disconnect(): void;
}

export function connectedWalletSession(wallet: WalletSessionValue): WalletSession | null {
  return wallet.state.kind === "connected" && wallet.provider !== null
    ? { provider: wallet.provider, address: wallet.state.address }
    : null;
}

const WalletSessionContext = createContext<WalletSessionValue | null>(null);

export function WalletSessionProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ kind: "disconnected" });
  const providerRef = useRef<Eip1193Provider | null>(null);
  const approvedIssuerRef = useRef<string | undefined>(undefined);
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
      const approvedIssuerAddress = approvedIssuerRef.current;
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
  }, [provider]);

  async function connect(approvedIssuerAddress?: string) {
    const generation = sessionReadGenerationRef.current + 1;
    sessionReadGenerationRef.current = generation;
    approvedIssuerRef.current = approvedIssuerAddress;
    setState({ kind: "connecting" });
    const connection = await connectWallet({
      discover: () => discoverMetaMaskProvider(window),
      approvedIssuerAddress,
    });
    if (sessionReadGenerationRef.current !== generation) return;
    providerRef.current = connection.provider;
    setState(connection.state);
  }

  async function switchChain() {
    const current = providerRef.current;
    if (current === null) {
      return;
    }
    const generation = sessionReadGenerationRef.current + 1;
    sessionReadGenerationRef.current = generation;
    setState({ kind: "connecting" });
    const connection = await recheckAfterSwitch(current, approvedIssuerRef.current);
    if (providerRef.current !== current || sessionReadGenerationRef.current !== generation) return;
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
    <WalletSessionContext.Provider value={{ state, provider, connect, switchChain, disconnect }}>
      {children}
    </WalletSessionContext.Provider>
  );
}

export function useWalletSession(): WalletSessionValue {
  const value = useContext(WalletSessionContext);
  if (value === null) {
    throw new Error("useWalletSession must be used inside WalletSessionProvider");
  }
  return value;
}
