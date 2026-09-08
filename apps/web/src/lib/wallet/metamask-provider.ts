export interface Eip1193Provider {
  readonly isMetaMask?: boolean;
  request(args: {
    readonly method: string;
    readonly params?: readonly unknown[];
  }): Promise<unknown>;
}

export interface Eip6963ProviderDetail {
  readonly info: {
    readonly uuid: string;
    readonly name: string;
    readonly icon: string;
    readonly rdns: string;
  };
  readonly provider: Eip1193Provider;
}

type EventListenerRegistration = (
  type: string,
  listener: (event: Event) => void,
) => void;

export interface DiscoveryTarget {
  readonly ethereum?: unknown;
  readonly addEventListener: EventListenerRegistration;
  readonly removeEventListener: EventListenerRegistration;
  readonly dispatchEvent: (event: Event) => boolean;
}

export type ProviderSelection =
  | { readonly kind: "selected"; readonly provider: Eip1193Provider }
  | { readonly kind: "no_provider" }
  | { readonly kind: "multiple_providers" };

export const HEDERA_TESTNET_CHAIN_ID = "0x128";

export const HEDERA_TESTNET_ADD_CHAIN_PARAMETERS = Object.freeze({
  chainId: HEDERA_TESTNET_CHAIN_ID,
  chainName: "Hedera Testnet",
  nativeCurrency: Object.freeze({ name: "HBAR", symbol: "HBAR", decimals: 18 }),
  rpcUrls: Object.freeze(["https://testnet.hashio.io/api"]),
  blockExplorerUrls: Object.freeze(["https://hashscan.io/testnet"]),
});

const announceEventType = "eip6963:announceProvider";
const requestEventType = "eip6963:requestProvider";
const metaMaskRdns = "io.metamask";
const defaultSettleMilliseconds = 250;
const unrecognizedChainErrorCode = 4902;
const addressPattern = /^0x[0-9a-fA-F]{40}$/u;

function defaultSettle(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, defaultSettleMilliseconds);
  });
}

function isProvider(value: unknown): value is Eip1193Provider {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { request?: unknown }).request === "function"
  );
}

function isMetaMaskCandidate(detail: unknown): detail is Eip6963ProviderDetail {
  if (typeof detail !== "object" || detail === null) {
    return false;
  }
  const { info, provider } = detail as { info?: unknown; provider?: unknown };
  return (
    typeof info === "object" &&
    info !== null &&
    (info as { rdns?: unknown }).rdns === metaMaskRdns &&
    isProvider(provider) &&
    provider.isMetaMask === true
  );
}

export async function discoverMetaMaskProvider(
  target: DiscoveryTarget,
  settle: () => Promise<void> = defaultSettle,
): Promise<ProviderSelection> {
  const announced: unknown[] = [];
  const listener = (event: Event) => {
    announced.push((event as { detail?: unknown }).detail);
  };
  target.addEventListener(announceEventType, listener);
  try {
    target.dispatchEvent(new Event(requestEventType));
    await settle();
  } finally {
    target.removeEventListener(announceEventType, listener);
  }

  if (announced.length === 0) {
    const legacy = target.ethereum;
    return isProvider(legacy) && legacy.isMetaMask === true
      ? Object.freeze({ kind: "selected", provider: legacy })
      : Object.freeze({ kind: "no_provider" });
  }

  const candidates = new Set<Eip1193Provider>();
  for (const detail of announced) {
    if (isMetaMaskCandidate(detail)) {
      candidates.add(detail.provider);
    }
  }
  const [only] = candidates;
  if (candidates.size === 1 && only !== undefined) {
    return Object.freeze({ kind: "selected", provider: only });
  }
  return Object.freeze({
    kind: candidates.size === 0 ? "no_provider" : "multiple_providers",
  });
}

export async function readChainId(
  provider: Eip1193Provider,
): Promise<string | null> {
  const value = await provider.request({ method: "eth_chainId" });
  return typeof value === "string" ? value : null;
}

export async function readSignerAddress(
  provider: Eip1193Provider,
  options: { readonly request: boolean },
): Promise<string | null> {
  const accounts = await provider.request({
    method: options.request ? "eth_requestAccounts" : "eth_accounts",
  });
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return null;
  }
  const [first] = accounts;
  return typeof first === "string" && addressPattern.test(first)
    ? first.toLowerCase()
    : null;
}

function errorCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const { code } = error as { code?: unknown };
  return typeof code === "number" ? code : null;
}

export async function switchToHederaTestnet(
  provider: Eip1193Provider,
): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HEDERA_TESTNET_CHAIN_ID }],
    });
  } catch (error) {
    if (errorCode(error) !== unrecognizedChainErrorCode) {
      throw error;
    }
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [HEDERA_TESTNET_ADD_CHAIN_PARAMETERS],
    });
  }
}
