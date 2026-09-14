import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { metaMask } from "wagmi/connectors";

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

export function getTool402WagmiConfig() {
  return createConfig({
    chains: [tool402HederaTestnet],
    connectors: [metaMask()],
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports: {
      [tool402HederaTestnet.id]: http(tool402HederaTestnet.rpcUrls.default.http[0]),
    },
  });
}
