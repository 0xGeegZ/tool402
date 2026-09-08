import {
  HEDERA_TESTNET_CHAIN_ID,
  readChainId,
  readSignerAddress,
  switchToHederaTestnet,
  type Eip1193Provider,
  type ProviderSelection,
} from "./metamask-provider.ts";

export const WALLET_STATE_KINDS = Object.freeze([
  "disconnected",
  "connecting",
  "no_provider",
  "multiple_providers",
  "wrong_chain",
  "not_issuer",
  "connected",
] as const);

export type WalletStateKind = (typeof WALLET_STATE_KINDS)[number];

export type WalletState =
  | { readonly kind: "disconnected" }
  | { readonly kind: "connecting" }
  | { readonly kind: "no_provider" }
  | { readonly kind: "multiple_providers" }
  | { readonly kind: "wrong_chain"; readonly chainId: string | null }
  | {
      readonly kind: "not_issuer";
      readonly address: string;
      readonly approvedIssuerAddress: string;
    }
  | { readonly kind: "connected"; readonly address: string };

export interface WalletConnection {
  readonly state: WalletState;
  readonly provider: Eip1193Provider | null;
}

export interface ConnectWalletInput {
  readonly discover: () => Promise<ProviderSelection>;
  readonly approvedIssuerAddress?: string;
}

const lowerCaseAddressPattern = /^0x[0-9a-f]{40}$/u;

function connection(
  state: WalletState,
  provider: Eip1193Provider | null,
): WalletConnection {
  return Object.freeze({ state: Object.freeze(state), provider });
}

function normalizeApprovedIssuer(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const lowerCase = value.toLowerCase();
  if (!lowerCaseAddressPattern.test(lowerCase)) {
    throw new TypeError("approvedIssuerAddress must be an EVM address");
  }
  return lowerCase;
}

async function readChainOrNull(
  provider: Eip1193Provider,
): Promise<string | null> {
  try {
    return await readChainId(provider);
  } catch {
    return null;
  }
}

async function readSignerOrNull(
  provider: Eip1193Provider,
  request: boolean,
): Promise<string | null> {
  try {
    return await readSignerAddress(provider, { request });
  } catch {
    return null;
  }
}

function decideSigner(
  provider: Eip1193Provider,
  address: string | null,
  approvedIssuerAddress: string | undefined,
): WalletConnection {
  if (address === null) {
    return connection({ kind: "disconnected" }, null);
  }
  if (
    approvedIssuerAddress !== undefined &&
    approvedIssuerAddress !== address
  ) {
    return connection(
      { kind: "not_issuer", address, approvedIssuerAddress },
      provider,
    );
  }
  return connection({ kind: "connected", address }, provider);
}

export async function connectWallet(
  input: ConnectWalletInput,
): Promise<WalletConnection> {
  const approvedIssuerAddress = normalizeApprovedIssuer(
    input.approvedIssuerAddress,
  );
  const selection = await input.discover();
  switch (selection.kind) {
    case "no_provider":
    case "multiple_providers":
      return connection({ kind: selection.kind }, null);
    case "selected":
      break;
    default:
      throw new TypeError("unknown provider selection");
  }

  const { provider } = selection;
  const address = await readSignerOrNull(provider, true);
  if (address === null) {
    return connection({ kind: "disconnected" }, null);
  }
  const chainId = await readChainOrNull(provider);
  if (chainId !== HEDERA_TESTNET_CHAIN_ID) {
    return connection({ kind: "wrong_chain", chainId }, provider);
  }
  return decideSigner(provider, address, approvedIssuerAddress);
}

export async function readCurrentSession(
  provider: Eip1193Provider,
  approvedIssuerAddress?: string,
): Promise<WalletConnection> {
  const approved = normalizeApprovedIssuer(approvedIssuerAddress);
  const chainId = await readChainOrNull(provider);
  if (chainId !== HEDERA_TESTNET_CHAIN_ID) {
    return connection({ kind: "wrong_chain", chainId }, provider);
  }
  const address = await readSignerOrNull(provider, false);
  return decideSigner(provider, address, approved);
}

export async function recheckAfterSwitch(
  provider: Eip1193Provider,
  approvedIssuerAddress?: string,
): Promise<WalletConnection> {
  try {
    await switchToHederaTestnet(provider);
  } catch {
    // A declined or failed switch is not an outcome; the chain re-read below decides.
  }
  return readCurrentSession(provider, approvedIssuerAddress);
}
