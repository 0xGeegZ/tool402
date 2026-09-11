import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const sourceUrl = new URL("../src/lib/wallet/wallet-state.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const connectedAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";

test("requires the declared wallet-state source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("exposes exactly the closed wallet-state union", () => {
  assert.deepEqual(api.walletStateKinds, [
    "disconnected",
    "connecting",
    "no_provider",
    "multiple_providers",
    "wrong_chain",
    "not_issuer",
    "connected",
  ]);

  for (const kind of api.walletStateKinds) {
    assert.equal(api.isWalletStateKind(kind), true);
  }
  for (const kind of ["idle", "failed", "authorized", "complete", ""]) {
    assert.equal(api.isWalletStateKind(kind), false);
  }
});

implementedTest("keeps the issuer comparison advisory and opt-in", () => {
  assert.equal(api.isIssuerAdvisory(connectedAddress, undefined), false);
  assert.equal(api.isIssuerAdvisory(connectedAddress, connectedAddress), false);
  assert.equal(
    api.isIssuerAdvisory(connectedAddress, "0x0000000000000000000000000000000000000402"),
    true,
  );
  assert.equal(api.isIssuerAdvisory(connectedAddress.toUpperCase(), connectedAddress), true);
});

// Lane contracts (work/s15), block-scoped beside the root's contracts above.
{
const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function extractBracedBody(source, from) {
  const opening = source.indexOf("{", from);
  assert.notEqual(opening, -1, "expected a braced callback body");
  let depth = 0;
  for (let index = opening; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(opening + 1, index);
      }
    }
  }
  assert.fail("expected the callback body to close");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function loadStateModule() {
  return import("../src/lib/wallet/wallet-state.ts");
}

const mixedCaseAddress = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf";
const lowerCaseAddress = mixedCaseAddress.toLowerCase();
const otherAddress = "0x0000000000000000000000000000000000000402";

function createProvider(options = {}) {
  const calls = [];
  let chainId = options.chainId ?? "0x128";
  return {
    isMetaMask: true,
    calls,
    async request({ method, params }) {
      calls.push({ method, params });
      switch (method) {
        case "eth_chainId":
          return chainId;
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
          if (options.chainIdAfterSwitch !== undefined) {
            chainId = options.chainIdAfterSwitch;
          }
          return null;
        case "wallet_addEthereumChain":
          return null;
        default:
          throw new Error(`unexpected method ${method}`);
      }
    },
  };
}

function selecting(provider) {
  return async () => Object.freeze({ kind: "provider", provider });
}

test("fixes the closed seven-kind wallet state union", async () => {
  const { walletStateKinds } = await loadStateModule();

  assert.deepEqual(walletStateKinds, [
    "disconnected",
    "connecting",
    "no_provider",
    "multiple_providers",
    "wrong_chain",
    "not_issuer",
    "connected",
  ]);
  assert.equal(Object.isFrozen(walletStateKinds), true);
});

test("maps discovery refusals to closed states without touching a provider", async () => {
  const { connectWallet } = await loadStateModule();

  assert.deepEqual(
    await connectWallet({ discover: async () => ({ kind: "no_provider" }) }),
    {
      state: { kind: "no_provider" },
      provider: null,
    },
  );
  assert.deepEqual(
    await connectWallet({
      discover: async () => ({ kind: "multiple_providers" }),
    }),
    {
      state: { kind: "multiple_providers" },
      provider: null,
    },
  );
  await assert.rejects(
    connectWallet({ discover: async () => ({ kind: "something_else" }) }),
  );
});

test("returns disconnected when the account request is declined and never switches on its own", async () => {
  const { connectWallet } = await loadStateModule();
  const declined = createProvider({
    accountsError: { code: 4001, message: "User rejected the request." },
  });

  const result = await connectWallet({ discover: selecting(declined) });

  assert.deepEqual(result, { state: { kind: "disconnected" }, provider: null });
  assert.deepEqual(
    declined.calls.map((call) => call.method),
    ["eth_requestAccounts"],
  );

  const empty = createProvider({ accounts: [] });
  assert.deepEqual(await connectWallet({ discover: selecting(empty) }), {
    state: { kind: "disconnected" },
    provider: null,
  });
});

test("gates on chain 0x128 after the account request and reports the observed chain", async () => {
  const { connectWallet } = await loadStateModule();
  const wrong = createProvider({ chainId: "0x1" });

  const result = await connectWallet({ discover: selecting(wrong) });

  assert.deepEqual(result, {
    state: { kind: "wrong_chain", chainId: "0x1" },
    provider: wrong,
  });
  assert.deepEqual(
    wrong.calls.map((call) => call.method),
    ["eth_requestAccounts", "eth_chainId"],
  );
  assert.equal(Object.isFrozen(result.state), true);

  const unreadable = createProvider({ chainId: 296 });
  assert.deepEqual(
    (await connectWallet({ discover: selecting(unreadable) })).state,
    {
      kind: "wrong_chain",
      chainId: null,
    },
  );
});

test("treats a resolved switch request as no evidence and re-reads the chain and signer", async () => {
  const { recheckAfterSwitch } = await loadStateModule();

  const stubborn = createProvider({ chainId: "0x1" });
  const stillWrong = await recheckAfterSwitch(stubborn);
  assert.deepEqual(stillWrong, {
    state: { kind: "wrong_chain", chainId: "0x1" },
    provider: stubborn,
  });
  assert.deepEqual(
    stubborn.calls.map((call) => call.method),
    ["wallet_switchEthereumChain", "eth_chainId"],
  );

  const switched = createProvider({
    chainId: "0x1",
    chainIdAfterSwitch: "0x128",
  });
  const connected = await recheckAfterSwitch(switched);
  assert.deepEqual(connected, {
    state: { kind: "connected", address: lowerCaseAddress },
    provider: switched,
  });
  assert.deepEqual(
    switched.calls.map((call) => call.method),
    ["wallet_switchEthereumChain", "eth_chainId", "eth_accounts"],
  );

  const declined = createProvider({
    chainId: "0x1",
    switchError: { code: 4001 },
  });
  assert.deepEqual(await recheckAfterSwitch(declined), {
    state: { kind: "wrong_chain", chainId: "0x1" },
    provider: declined,
  });
});

test("reaches not_issuer only through the approved issuer address prop", async () => {
  const { connectWallet } = await loadStateModule();

  const withoutProp = await connectWallet({
    discover: selecting(createProvider()),
  });
  assert.deepEqual(withoutProp.state, {
    kind: "connected",
    address: lowerCaseAddress,
  });

  const matching = await connectWallet({
    discover: selecting(createProvider()),
    approvedIssuerAddress: mixedCaseAddress,
  });
  assert.deepEqual(matching.state, {
    kind: "connected",
    address: lowerCaseAddress,
  });

  const mismatch = await connectWallet({
    discover: selecting(createProvider()),
    approvedIssuerAddress: otherAddress,
  });
  assert.deepEqual(mismatch.state, {
    kind: "not_issuer",
    address: lowerCaseAddress,
    approvedIssuerAddress: otherAddress,
  });
  assert.notEqual(mismatch.provider, null);

  await assert.rejects(
    connectWallet({
      discover: selecting(createProvider()),
      approvedIssuerAddress: "0x12",
    }),
  );
});

test("reads the current session passively without an account prompt or a switch", async () => {
  const { readCurrentSession } = await loadStateModule();

  const wrong = createProvider({ chainId: "0x1" });
  assert.deepEqual(await readCurrentSession(wrong), {
    state: { kind: "wrong_chain", chainId: "0x1" },
    provider: wrong,
  });
  assert.deepEqual(wrong.calls.map((call) => call.method), ["eth_chainId"]);

  const empty = createProvider({ accounts: [] });
  assert.deepEqual(await readCurrentSession(empty), {
    state: { kind: "disconnected" },
    provider: null,
  });
  assert.deepEqual(empty.calls.map((call) => call.method), ["eth_chainId", "eth_accounts"]);

  const connected = createProvider();
  assert.deepEqual(await readCurrentSession(connected), {
    state: { kind: "connected", address: lowerCaseAddress },
    provider: connected,
  });
  assert.deepEqual((await readCurrentSession(connected, otherAddress)).state, {
    kind: "not_issuer",
    address: lowerCaseAddress,
    approvedIssuerAddress: otherAddress,
  });
  assert.equal(
    connected.calls.some((call) =>
      ["eth_requestAccounts", "wallet_switchEthereumChain"].includes(call.method),
    ),
    false,
  );
});

test("keeps the state library free of network, storage, timers, and logging", async () => {
  const source = await readAppFile("src/lib/wallet/wallet-state.ts");

  assert.doesNotMatch(
    source,
    /\b(?:fetch|console|localStorage|sessionStorage|setTimeout|setInterval|window|document)\b/u,
  );
  assert.doesNotMatch(source, /\bfrom\s+["']node:/u);
  assert.doesNotMatch(source, /wallet_addEthereumChain|eip6963/u);
});

test("renders every wallet state from a client island that synchronizes only an explicitly selected session", async () => {
  const source = await readAppFile("src/components/wallet/wallet-connect.tsx");

  assert.match(source, /^"use client";/u);
  assert.match(
    source,
    /from\s+["']\.\.\/\.\.\/lib\/wallet\/wallet-state\.ts["']/u,
  );
  assert.match(
    source,
    /from\s+["']\.\.\/\.\.\/lib\/wallet\/metamask-provider\.ts["']/u,
  );
  assert.match(source, /\bwatchWalletSessionChanges\b/u);
  assert.match(source, /\breadCurrentSession\b/u);
  assert.match(source, /from\s+["']\.\.\/ui\/button["']/u);
  for (const kind of [
    "disconnected",
    "connecting",
    "no_provider",
    "multiple_providers",
    "wrong_chain",
    "not_issuer",
    "connected",
  ]) {
    assert.match(source, new RegExp(`case\\s+["']${kind}["']`, "u"));
  }
  assert.match(source, /\buseEffect\b/u);
  assert.equal(
    [...source.matchAll(/discoverMetaMaskProvider\(\s*window\s*\)/gu)].length,
    1,
    "provider discovery remains in the explicit Connect or Retry path",
  );
  assert.match(
    source,
    /async function connect\(\)[\s\S]*?discoverMetaMaskProvider\(\s*window\s*\)/u,
  );
  const effectStart = source.indexOf("useEffect(");
  assert.notEqual(effectStart, -1);
  const effectBody = extractBracedBody(source, source.indexOf("=>", effectStart));
  const cleanupBinding = effectBody.match(
    /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*watchWalletSessionChanges\s*\(/u,
  );
  assert.notEqual(cleanupBinding, null, "the effect owns the native subscription");
  const cleanup = cleanupBinding[1];
  const cleanupReference = effectBody.match(
    new RegExp(
      `\\b([A-Za-z_$][\\w$]*)\\.current\\s*=\\s*${escapeRegExp(cleanup)}\\s*;`,
      "u",
    ),
  );
  assert.notEqual(cleanupReference, null, "the local disconnect shares the effect cleanup");
  const cleanupRef = cleanupReference[1];
  assert.match(
    effectBody,
    new RegExp(
      `return\\s*(?:${escapeRegExp(cleanup)}\\s*;|\\(\\s*\\)\\s*=>\\s*(?:\\{[\\s\\S]*?\\b${escapeRegExp(cleanup)}\\s*\\(\\s*\\)[\\s\\S]*?\\}|${escapeRegExp(cleanup)}\\s*\\(\\s*\\)\\s*;?))`,
      "u",
    ),
    "the effect returns the exact subscription cleanup for unmount",
  );
  const disconnectStart = source.indexOf("function disconnect()");
  assert.notEqual(disconnectStart, -1);
  const disconnectBody = extractBracedBody(source, disconnectStart);
  assert.match(
    disconnectBody,
    new RegExp(`${escapeRegExp(cleanupRef)}\\.current\\?\\.\\s*\\(\\s*\\)`, "u"),
    "local disconnect invokes the shared listener cleanup",
  );
  const sessionChangeStart = source.indexOf("watchWalletSessionChanges(");
  assert.notEqual(sessionChangeStart, -1);
  const sessionChangeHandler = extractBracedBody(source, sessionChangeStart);
  const connecting = sessionChangeHandler.search(
    /setState\(\s*\{\s*kind:\s*["']connecting["']\s*\}\s*\)/u,
  );
  const passiveRead = sessionChangeHandler.search(
    /await\s+readCurrentSession\(\s*provider\s*,\s*approvedIssuerAddress\s*\)/u,
  );
  assert.ok(
    connecting !== -1 && passiveRead !== -1 && connecting < passiveRead,
    "a native session-change invalidates actionable content before the passive re-read",
  );
  assert.doesNotMatch(
    sessionChangeHandler,
    /\b(?:eth_requestAccounts|wallet_[A-Za-z0-9_]*|eth_sign(?:TypedData(?:_v4)?|[A-Za-z0-9_]*)?|personal_sign|signAndRelayCommand|signCommand|signTypedData(?:_v4)?|signMessage|relay[A-Za-z0-9_]*|fetch|eth_send(?:Raw)?Transaction|send(?:Raw)?Transaction|rawTransaction|localStorage|sessionStorage|indexedDB|setTimeout|setInterval)\b|\bprovider\s*\.\s*request\s*\(/u,
    "session changes only invalidate and use the passive reader",
  );
  assert.doesNotMatch(
    source,
    /\b(?:fetch|console|localStorage|sessionStorage|setTimeout|setInterval)\b/u,
  );
  assert.doesNotMatch(source, /\bdocument\.cookie\b/u);
  assert.doesNotMatch(
    source,
    /(?:\.|\?\.)\s*(?:on|addListener|removeListener|off)\s*\(|\[\s*["'](?:on|addListener|removeListener|off)["']\s*\]\s*\(/u,
    "only watchWalletSessionChanges owns native provider event wiring",
  );
  assert.match(source, /Connect MetaMask/u);
  assert.match(source, /Switch to Hedera Testnet/u);
  assert.match(source, /Retry/u);
  assert.match(source, /aria-live=["']polite["']/u);
  assert.doesNotMatch(source, /WalletConnect|Coinbase|wagmi|rainbow/iu);
  assert.doesNotMatch(source, /0\.0\.\d+|HBAR|balance/u);
});

test("renders the closed seven-phase signature dialog with refusal copy inside existing phases", async () => {
  const source = await readAppFile("src/components/wallet/signature-dialog.tsx");

  assert.match(source, /^"use client";/u);
  assert.match(
    source,
    /SIGNATURE_PHASES\s*=\s*\[\s*"idle",\s*"waiting",\s*"checking",\s*"rejected",\s*"failed",\s*"complete",\s*"unknown",?\s*\]\s+as\s+const/u,
  );
  const phaseLiterals = new Set(
    [...source.matchAll(/phase:\s*["']([a-z_]+)["']/gu)].map(([, phase]) => phase),
  );
  assert.deepEqual(
    [...phaseLiterals].filter(
      (phase) =>
        !["idle", "waiting", "checking", "rejected", "failed", "complete", "unknown"].includes(phase),
    ),
    [],
  );
  assert.match(source, /from\s+["']\.\.\/\.\.\/lib\/wallet\/command-relay\.ts["']/u);
  assert.match(source, /signAndRelayCommand\(provider,\s*request,/u);
  assert.doesNotMatch(
    source,
    /\b(?:signCommand|relayCommandBody|createCommandNonce|createUnsignedCommand|readCurrentSession|readChainId|readSignerAddress)\(/u,
  );
  assert.match(source, /aria-live=["']polite["']/u);
  assert.match(source, /Sign with MetaMask/u);
  assert.match(source, /Sign again/u);
  assert.match(source, /unauthorized issuer/iu);
  assert.match(source, /expired/iu);
  assert.match(source, /idempotency key/iu);
  assert.match(source, /nothing was (?:sent or )?recorded/iu);
  assert.match(source, /already claimed by an earlier attempt/u);
  assert.doesNotMatch(source, /earlier command stands/u);
  assert.doesNotMatch(source, /\buseEffect\b/u);
  assert.doesNotMatch(source, /\b(?:console|localStorage|sessionStorage|setTimeout|setInterval|retry\()/u);
  assert.doesNotMatch(source, /\bfetch\(/u);
  assert.doesNotMatch(source, /0\.0\.\d+|HBAR|balance|on-chain success|created on Hedera/u);
});
}
