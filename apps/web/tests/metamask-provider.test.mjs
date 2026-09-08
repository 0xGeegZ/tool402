import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const sourceUrl = new URL("../src/lib/wallet/metamask-provider.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const componentPaths = [
  fileURLToPath(new URL("../src/components/wallet/wallet-connect.tsx", import.meta.url)),
  fileURLToPath(new URL("../src/components/wallet/signature-dialog.tsx", import.meta.url)),
];
const implementedTest = sourceExists ? test : test.skip;
let api;

function candidate(provider, rdns = "io.metamask") {
  return Object.freeze({
    info: Object.freeze({ rdns }),
    provider,
  });
}

test("requires the declared MetaMask provider and presentation source paths", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
  for (const componentPath of componentPaths) {
    assert.equal(existsSync(componentPath), true, `missing declared source module: ${componentPath}`);
  }
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("selects exactly one announced MetaMask provider and fails closed otherwise", () => {
  const metamask = Object.freeze({ isMetaMask: true });
  const other = Object.freeze({ isMetaMask: false });

  assert.deepEqual(
    api.selectMetaMaskProvider({
      announcedProviders: [candidate(metamask)],
      legacyProvider: undefined,
    }),
    { kind: "provider", provider: metamask },
  );

  for (const input of [
    { announcedProviders: [], legacyProvider: undefined },
    { announcedProviders: [candidate(other)], legacyProvider: metamask },
    { announcedProviders: [candidate(metamask, "com.example.wallet")], legacyProvider: metamask },
  ]) {
    assert.deepEqual(api.selectMetaMaskProvider(input), { kind: "no_provider" });
  }

  assert.deepEqual(
    api.selectMetaMaskProvider({
      announcedProviders: [candidate(metamask), candidate(metamask)],
      legacyProvider: undefined,
    }),
    { kind: "multiple_providers" },
  );
});

implementedTest("uses legacy injection only when no EIP-6963 candidate was announced", () => {
  const legacy = Object.freeze({ isMetaMask: true });
  const nonMetaMaskLegacy = Object.freeze({ isMetaMask: false });
  const announcedOther = Object.freeze({ isMetaMask: false });

  assert.deepEqual(
    api.selectMetaMaskProvider({ announcedProviders: [], legacyProvider: legacy }),
    { kind: "provider", provider: legacy },
  );
  assert.deepEqual(
    api.selectMetaMaskProvider({ announcedProviders: [], legacyProvider: nonMetaMaskLegacy }),
    { kind: "no_provider" },
  );
  assert.deepEqual(
    api.selectMetaMaskProvider({
      announcedProviders: [candidate(announcedOther, "com.example.wallet")],
      legacyProvider: legacy,
    }),
    { kind: "no_provider" },
  );
});

// Lane contracts (work/s15), block-scoped beside the root's contracts above.
{
const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadProviderModule() {
  return import("../src/lib/wallet/metamask-provider.ts");
}

const mixedCaseAddress = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf";
const lowerCaseAddress = mixedCaseAddress.toLowerCase();

function createProvider(options = {}) {
  const calls = [];
  const provider = {
    isMetaMask: options.isMetaMask ?? true,
    calls,
    async request({ method, params }) {
      calls.push({ method, params });
      switch (method) {
        case "eth_chainId":
          return options.chainId ?? "0x128";
        case "eth_accounts":
        case "eth_requestAccounts":
          if (options.accountsError) {
            throw options.accountsError;
          }
          return options.accounts ?? [mixedCaseAddress];
        case "wallet_switchEthereumChain":
          if (options.switchError) {
            throw options.switchError;
          }
          return null;
        case "wallet_addEthereumChain":
          if (options.addError) {
            throw options.addError;
          }
          return null;
        default:
          throw new Error(`unexpected method ${method}`);
      }
    },
  };
  return provider;
}

function metaMaskDetail(provider = createProvider(), uuid = "metamask-1") {
  return {
    info: {
      uuid,
      name: "MetaMask",
      icon: "data:image/svg+xml,",
      rdns: "io.metamask",
    },
    provider,
  };
}

function otherWalletDetail(
  provider = createProvider({ isMetaMask: true }),
  uuid = "other-1",
) {
  return {
    info: {
      uuid,
      name: "Other",
      icon: "data:image/svg+xml,",
      rdns: "io.other.wallet",
    },
    provider,
  };
}

function createTarget({ announcements = [], ethereum } = {}) {
  const listeners = new Map();
  const dispatched = [];
  let maximumAnnounceListeners = 0;
  const target = {
    ethereum,
    dispatched,
    addEventListener(type, listener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(listener);
      maximumAnnounceListeners = Math.max(
        maximumAnnounceListeners,
        listeners.get("eip6963:announceProvider")?.size ?? 0,
      );
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event) {
      dispatched.push(event.type);
      if (event.type === "eip6963:requestProvider") {
        for (const detail of announcements) {
          for (const listener of listeners.get("eip6963:announceProvider") ??
            []) {
            listener({ type: "eip6963:announceProvider", detail });
          }
        }
      }
      return true;
    },
    listenerCount(type) {
      return listeners.get(type)?.size ?? 0;
    },
    announce(detail) {
      const current = [...(listeners.get("eip6963:announceProvider") ?? [])];
      for (const listener of current) {
        listener({ type: "eip6963:announceProvider", detail });
      }
      return current.length;
    },
    get maximumAnnounceListeners() {
      return maximumAnnounceListeners;
    },
  };
  return target;
}

const settleImmediately = () => Promise.resolve();

test("selects exactly one announced io.metamask candidate and removes its listener afterwards", async () => {
  const { discoverMetaMaskProvider } = await loadProviderModule();
  const provider = createProvider();
  const target = createTarget({ announcements: [metaMaskDetail(provider)] });

  const selection = await discoverMetaMaskProvider(target, settleImmediately);

  assert.deepEqual(selection, { kind: "provider", provider });
  assert.equal(selection.provider, provider);
  assert.deepEqual(target.dispatched, ["eip6963:requestProvider"]);
  assert.equal(target.maximumAnnounceListeners, 1);
  assert.equal(target.listenerCount("eip6963:announceProvider"), 0);
  assert.equal(Object.isFrozen(selection), true);
});

test("fails closed with no matching candidate and no legacy fallback once anything was announced", async () => {
  const { discoverMetaMaskProvider } = await loadProviderModule();
  const legacy = createProvider();
  const target = createTarget({
    announcements: [otherWalletDetail()],
    ethereum: legacy,
  });

  const selection = await discoverMetaMaskProvider(target, settleImmediately);

  assert.deepEqual(selection, { kind: "no_provider" });
  assert.equal(target.listenerCount("eip6963:announceProvider"), 0);

  const spoofed = createTarget({
    announcements: [
      {
        info: { uuid: "x", name: "X", icon: "", rdns: "io.metamask" },
        provider: createProvider({ isMetaMask: false }),
      },
    ],
    ethereum: legacy,
  });
  assert.deepEqual(await discoverMetaMaskProvider(spoofed, settleImmediately), {
    kind: "no_provider",
  });
});

test("admits legacy window.ethereum only when nothing was announced and isMetaMask is true", async () => {
  const { discoverMetaMaskProvider } = await loadProviderModule();
  const legacy = createProvider();

  const accepted = await discoverMetaMaskProvider(
    createTarget({ ethereum: legacy }),
    settleImmediately,
  );
  assert.deepEqual(accepted, { kind: "provider", provider: legacy });

  const notMetaMask = createProvider({ isMetaMask: false });
  assert.deepEqual(
    await discoverMetaMaskProvider(
      createTarget({ ethereum: notMetaMask }),
      settleImmediately,
    ),
    { kind: "no_provider" },
  );
  assert.deepEqual(
    await discoverMetaMaskProvider(createTarget(), settleImmediately),
    {
      kind: "no_provider",
    },
  );
  const flagOnly = { isMetaMask: true };
  assert.deepEqual(
    await discoverMetaMaskProvider(
      createTarget({ ethereum: flagOnly }),
      settleImmediately,
    ),
    { kind: "provider", provider: flagOnly },
  );
});

test("fails closed on several distinct candidates and deduplicates one provider announced twice", async () => {
  const { discoverMetaMaskProvider } = await loadProviderModule();
  const first = createProvider();
  const second = createProvider();

  const several = createTarget({
    announcements: [metaMaskDetail(first, "a"), metaMaskDetail(second, "b")],
  });
  assert.deepEqual(await discoverMetaMaskProvider(several, settleImmediately), {
    kind: "multiple_providers",
  });

  const repeated = createTarget({
    announcements: [metaMaskDetail(first, "a"), metaMaskDetail(first, "a")],
  });
  assert.deepEqual(
    await discoverMetaMaskProvider(repeated, settleImmediately),
    {
      kind: "provider",
      provider: first,
    },
  );
});

test("counts announcements that arrive during the settle window and none after it", async () => {
  const { discoverMetaMaskProvider } = await loadProviderModule();
  const provider = createProvider();
  const target = createTarget();
  let settled = false;
  const settle = async () => {
    target.announce(metaMaskDetail(provider));
    settled = true;
  };

  const selection = await discoverMetaMaskProvider(target, settle);

  assert.equal(settled, true);
  assert.deepEqual(selection, { kind: "provider", provider });
  assert.equal(target.listenerCount("eip6963:announceProvider"), 0);
  assert.equal(target.announce(metaMaskDetail(createProvider())), 0);
  assert.equal(provider.calls.length, 0);

  const synchronous = createTarget({
    announcements: [metaMaskDetail(provider)],
  });
  assert.deepEqual(await discoverMetaMaskProvider(synchronous), {
    kind: "provider",
    provider,
  });
});

test("registers no listener and reads no global at module load", async () => {
  const source = await readAppFile("src/lib/wallet/metamask-provider.ts");
  const listenerRegistrations = [...source.matchAll(/addEventListener\(/gu)];
  const timers = [...source.matchAll(/setTimeout\(/gu)];

  assert.equal(listenerRegistrations.length, 1);
  assert.equal(timers.length, 1);
  assert.doesNotMatch(source, /^\s*(?:window|globalThis|document)\./mu);
  assert.doesNotMatch(
    source,
    /\b(?:fetch|console|localStorage|sessionStorage|setInterval)\b/u,
  );
  assert.doesNotMatch(source, /\bfrom\s+["']node:/u);
  assert.match(source, /["']io\.metamask["']/u);
  assert.match(source, /["']0x128["']/u);
  await loadProviderModule();
});

test("reads the chain id verbatim and the signer once as a validated lower-case address", async () => {
  const { readChainId, readSignerAddress } = await loadProviderModule();

  const provider = createProvider({ chainId: "0x128" });
  assert.equal(await readChainId(provider), "0x128");
  assert.equal(await readChainId(createProvider({ chainId: "0x1" })), "0x1");
  assert.equal(await readChainId(createProvider({ chainId: 296 })), null);

  assert.equal(
    await readSignerAddress(provider, { request: true }),
    lowerCaseAddress,
  );
  assert.equal(
    await readSignerAddress(provider, { request: false }),
    lowerCaseAddress,
  );
  assert.deepEqual(
    provider.calls.map((call) => call.method),
    ["eth_chainId", "eth_requestAccounts", "eth_accounts"],
  );

  assert.equal(
    await readSignerAddress(createProvider({ accounts: [] }), {
      request: false,
    }),
    null,
  );
  assert.equal(
    await readSignerAddress(createProvider({ accounts: ["0x12"] }), {
      request: false,
    }),
    null,
  );
  assert.equal(
    await readSignerAddress(createProvider({ accounts: "0x12" }), {
      request: false,
    }),
    null,
  );
  assert.equal(
    await readSignerAddress(
      createProvider({ accounts: [`${lowerCaseAddress}0`] }),
      { request: false },
    ),
    null,
  );
});

test("recognizes only the EIP-1193 user-rejected code as a rejection", async () => {
  const { isUserRejection } = await loadProviderModule();

  assert.equal(isUserRejection({ code: 4001, message: "User rejected the request." }), true);
  assert.equal(isUserRejection({ code: 4902 }), false);
  assert.equal(isUserRejection({ code: "4001" }), false);
  assert.equal(isUserRejection(new Error("4001")), false);
  assert.equal(isUserRejection(null), false);
  assert.equal(isUserRejection(undefined), false);
});

test("switches once, falls back to add-chain only on the unrecognized-chain code, and never re-reads the chain itself", async () => {
  const {
    HEDERA_TESTNET_ADD_CHAIN_PARAMETERS,
    HEDERA_TESTNET_CHAIN_ID,
    switchToHederaTestnet,
  } = await loadProviderModule();

  assert.equal(HEDERA_TESTNET_CHAIN_ID, "0x128");
  assert.deepEqual(HEDERA_TESTNET_ADD_CHAIN_PARAMETERS, {
    chainId: "0x128",
    chainName: "Hedera Testnet",
    nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
    rpcUrls: ["https://testnet.hashio.io/api"],
    blockExplorerUrls: ["https://hashscan.io/testnet"],
  });
  assert.equal(Object.isFrozen(HEDERA_TESTNET_ADD_CHAIN_PARAMETERS), true);
  assert.equal(
    Object.isFrozen(HEDERA_TESTNET_ADD_CHAIN_PARAMETERS.rpcUrls),
    true,
  );

  const plain = createProvider();
  await switchToHederaTestnet(plain);
  assert.deepEqual(plain.calls, [
    { method: "wallet_switchEthereumChain", params: [{ chainId: "0x128" }] },
  ]);

  const unrecognized = createProvider({
    switchError: { code: 4902, message: "Unrecognized chain ID" },
  });
  await switchToHederaTestnet(unrecognized);
  assert.deepEqual(
    unrecognized.calls.map((call) => call.method),
    ["wallet_switchEthereumChain", "wallet_addEthereumChain"],
  );
  assert.deepEqual(unrecognized.calls[1].params, [
    HEDERA_TESTNET_ADD_CHAIN_PARAMETERS,
  ]);

  const declined = createProvider({
    switchError: { code: 4001, message: "User rejected the request." },
  });
  await assert.rejects(switchToHederaTestnet(declined));
  assert.deepEqual(
    declined.calls.map((call) => call.method),
    ["wallet_switchEthereumChain"],
  );

  const addFailed = createProvider({
    switchError: { code: 4902 },
    addError: { code: 4001 },
  });
  await assert.rejects(switchToHederaTestnet(addFailed));
  for (const provider of [plain, unrecognized, declined, addFailed]) {
    assert.equal(
      provider.calls.some((call) => call.method === "eth_chainId"),
      false,
    );
  }
});
}
