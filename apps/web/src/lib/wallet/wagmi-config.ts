import { cookieStorage, createConfig, createStorage, http, injected } from "wagmi";

export const tool402HederaTestnet = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: {
    name: "HBAR",
    symbol: "HBAR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashScan",
      url: "https://hashscan.io/testnet",
    },
  },
} as const;

function readLegacyWalletStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeLegacyWalletStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Browser privacy settings can make localStorage unavailable; cookie persistence remains usable.
  }
}

const walletStorage = {
  getItem(key: string) {
    return cookieStorage.getItem(key) ?? readLegacyWalletStorage(key);
  },
  setItem(key: string, value: string) {
    cookieStorage.setItem(key, value);
    removeLegacyWalletStorage(key);
  },
  removeItem(key: string) {
    cookieStorage.removeItem(key);
    removeLegacyWalletStorage(key);
  },
};

export function getTool402WagmiConfig() {
  return createConfig({
    chains: [tool402HederaTestnet],
    connectors: [injected({ target: "metaMask" })],
    ssr: true,
    storage: createStorage({ storage: walletStorage }),
    transports: {
      [tool402HederaTestnet.id]: http(tool402HederaTestnet.rpcUrls.default.http[0]),
    },
  });
}
