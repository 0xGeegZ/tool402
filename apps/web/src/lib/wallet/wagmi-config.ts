import { createConfig, http, injected } from "wagmi";

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

export const tool402WagmiConfig = createConfig({
  chains: [tool402HederaTestnet],
  connectors: [injected({ target: "metaMask" })],
  ssr: true,
  transports: {
    [tool402HederaTestnet.id]: http(tool402HederaTestnet.rpcUrls.default.http[0]),
  },
});
