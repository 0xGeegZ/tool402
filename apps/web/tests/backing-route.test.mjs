import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePaths = [
  "src/app/explore/riskscan/back/page.tsx",
  "src/components/backing/backing-flow.tsx",
  "src/components/backing/backing-presentation.ts",
  "src/components/backing/backing-state.ts",
  "src/components/backing/backing-step-rail.tsx",
];

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== "object" || !("props" in node)) return [];
  return [node, ...elements(node.props.children)];
}

async function backingHarness({ stored = new Map(), payment, response }) {
  const flowPath = join(appRoot, "src/components/backing/backing-flow.tsx");
  const slots = [];
  const fetchCalls = [];
  let cursor = 0;
  let sends = 0;
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const walletConnection = { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" }, generation: 1 };
  const storage = {
    getItem(key) { return stored.get(key) ?? null; },
    setItem(key, value) { stored.set(key, value); },
    removeItem(key) { stored.delete(key); },
  };
  const offering = {
    terms: { version: "v1", minimumPurchaseUnits: 1n, maximumNoteUnits: 10n, noteUnitPriceTinybars: 10n, payoutCapTinybars: 20n, reserveShareBps: 100n },
    maturityAt: "2026-12-31T00:00:00.000Z",
  };
  const imports = {
    react: {
      useRef(initial) {
        const index = cursor++;
        if (!(index in slots)) {
          let current = initial;
          slots[index] = {};
          Object.defineProperty(slots[index], "current", {
            get() { return current; },
            set(value) { current = value; },
          });
        }
        return slots[index];
      },
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
      },
      useEffect(effect) { effect(); },
    },
    "react/jsx-runtime": jsxRuntime,
    wagmi: {
      usePublicClient: () => ({ getBalance: async () => 0n, estimateGas: async () => 0n, getGasPrice: async () => 0n }),
      useSendTransaction: () => ({ mutateAsync: async () => { sends += 1; throw new Error("a legacy recovery must never send"); } }),
    },
    "next/link": "Link",
    "../../lib/hashscan-links.ts": { hashscanTransactionUrl: () => null },
    "../../lib/wallet/wallet-error.ts": { isUserRejectedWalletRequest: () => false },
    "../ui/badge": { Badge: "Badge" },
    "../ui/button": { Button: "Button" },
    "../ui/card": { Card: "Card", CardContent: "CardContent", CardDescription: "CardDescription", CardHeader: "CardHeader", CardTitle: "CardTitle" },
    "../ui/detail-list": { DetailList: "DetailList" },
    "../ui/status": { StatusRegion: "StatusRegion" },
    "../wallet/signature-dialog": { SignatureDialog: "SignatureDialog" },
    "../wallet/wallet-connect": { WalletIsland: "WalletIsland" },
    "../wallet/use-tool402-wallet": {
      useTool402Wallet: () => ({ resolved: true, connection: walletConnection }),
      connectedTool402Wallet: (connection, resolved) => resolved && connection.status === "connected" ? connection : null,
    },
    "./backing-presentation": { presetUnits: () => [1n], railPosition: () => ({}) },
    "./backing-state": {
      backingLifecycleLabels: { choosing: "choosing", prepared: "prepared", payment_submitted: "payment_submitted", payment_outcome_unknown: "payment_outcome_unknown", refused: "refused", allocation_pending: "allocation_pending", complete: "complete", offering_unavailable: "offering_unavailable" },
      createBackingIntent: () => { throw new Error("not used by recovery"); },
      createFrozenBackingIntent: () => { throw new Error("not used by recovery"); },
      createRecoveredBackingIntent: () => { throw new Error("not used by recovery"); },
      formatHbar: (value) => `${value.toString()} HBAR`,
      formatShare: (value) => value.toString(),
      isCurrentBackingIntent: () => true,
      paymentTinybars: () => 10n,
      readBackingOffering: () => offering,
      transferRequest: () => ({}),
      validateUnits: () => ({ ok: true, units: 1n }),
      viewAfterSignature: () => ({ kind: "choosing" }),
      viewAfterTransfer: () => ({ kind: "choosing" }),
      viewForRecoveredPendingPayment: () => ({ kind: "choosing" }),
    },
    "./backing-step-rail": { BackingStepRail: "BackingStepRail" },
    "./backing-balance": { assessFundingBalance: async () => "UNAVAILABLE" },
  };
  const { outputText } = typescript.transpileModule(await readFile(flowPath, "utf8"), {
    fileName: flowPath,
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS, jsx: typescript.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    require(specifier) {
      assert.ok(Object.hasOwn(imports, specifier), `unexpected backing-flow import: ${specifier}`);
      return imports[specifier];
    },
    window: { localStorage: storage },
    fetchCalls,
    responseOk: response.ok,
    responseText: JSON.stringify(response.body),
    Promise,
    Object,
    Array,
    BigInt,
    Error,
    JSON,
  };
  context.fetch = runInNewContext("async (...input) => { fetchCalls.push(input); return { ok: responseOk, json: async () => JSON.parse(responseText) }; }", context);
  runInNewContext(outputText, context, { filename: flowPath });
  return {
    render() {
      cursor = 0;
      const first = module.exports.BackingFlow({ projection: {}, initialPayment: payment, dashboardAddress: address });
      cursor = 0;
      first.type(first.props);
      cursor = 0;
      const settled = module.exports.BackingFlow({ projection: {}, initialPayment: payment, dashboardAddress: address });
      cursor = 0;
      return settled.type(settled.props);
    },
    fetchCalls: () => fetchCalls,
    sends: () => sends,
    stored: () => new Map(stored),
  };
}

test("declares exactly the five backing source paths", () => {
  assert.deepEqual(sourcePaths.map((path) => existsSync(join(appRoot, path))), [true, true, true, true, true]);
});

test("loads one server-owned RiskScan backing projection before rendering the flow", async () => {
  const page = await readAppFile("src/app/explore/riskscan/back/page.tsx");

  assert.doesNotMatch(page, /["']use client["']|\bfetch\s*\(|TOOL402_FUNDING_EVM_ADDRESS/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /import \{ BackingFlow \} from "[./]+\/components\/backing\/backing-flow"/);
  assert.match(page, /loadRiskScanBackingProjection\(process\.env, globalThis\.fetch\)/);
  assert.match(page, /<Suspense fallback=\{<BackingFlow projection=\{null\} \/>\}>/);
  assert.match(page, /<BackingFlow projection=\{projection\} dashboardAddress=\{session\?\.address \?\? null\} initialPayment=\{payment\} \/>/);
  assert.equal((page.match(/<Link\b/g) ?? []).length, 1);
  assert.equal((page.match(/href=/g) ?? []).length, 1);
  assert.match(page, /<Link\s+href="\/explore\/riskscan"[\s\S]*?>\s*Back to RiskScan\s*<\/Link>/);
});

test("uses the Wagmi wallet context, signature dialog, and relay without a second copy of any", async () => {
  const flow = await readAppFile("src/components/backing/backing-flow.tsx");

  assert.match(flow, /^["']use client["'];/);
  assert.match(flow, /import \{ connectedTool402Wallet, useTool402Wallet, type Tool402WalletConnection \} from "\.\.\/wallet\/use-tool402-wallet"/);
  assert.match(flow, /useSendTransaction\(\{ mutation: \{ retry: false \} \}\)/);
  assert.match(flow, /import \{ SignatureDialog, type SignatureResult \} from "\.\.\/wallet\/signature-dialog"/);
  assert.equal((flow.match(/useTool402Wallet\(\)/g) ?? []).length, 1);
  assert.equal((flow.match(/<SignatureDialog\b/g) ?? []).length, 1);
  assert.match(flow, /useRef/);
  assert.match(flow, /isCurrentBackingIntent/);
  assert.match(flow, /sendingRef\.current/);
  assert.equal((flow.match(/<BackingStepRail\b/g) ?? []).length, 1);
  assert.equal((flow.match(/<WalletIsland\b/g) ?? []).length, 1);
  assert.match(flow, /import \{ presetUnits, railPosition \} from "\.\/backing-presentation"/);
  assert.match(flow, /import \{ BackingStepRail \} from "\.\/backing-step-rail"/);
  assert.doesNotMatch(flow, /approvedIssuerAddress/);
  assert.doesNotMatch(flow, /wallet-session|wallet-state|metamask-provider|discoverMetaMaskProvider|eth_requestAccounts|wallet_switchEthereumChain|eth_signTypedData|signCommand|createUnsignedCommand|relayCommandBody|\/api\/commands|createCommandNonce|keccak/);
  assert.equal((flow.match(/eth_sendTransaction/g) ?? []).length, 0);
  assert.match(flow, /transferRequest\(view\)/);
  assert.match(flow, /account: connection\.account/);
  assert.match(flow, /chainId: 296/);
  assert.equal((flow.match(/isSameBackingConnection\(connectionRef\.current, connection\)/g) ?? []).length, 3, "the current wallet is checked before and after reservation and before sending");
  assert.doesNotMatch(flow, /process\.env|setTimeout|setInterval|sessionStorage|https?:\/\//);
  assert.match(flow, /localStorage/);
  assert.match(flow, /Attach recorded transaction/);
  assert.match(flow, /fetch\("\/api\/backing\/payment"/);
  assert.match(flow, /dashboardAddress/);
  assert.match(flow, /connection\.account === dashboardAddress/);
  assert.match(flow, /assessFundingBalance/);
  assert.match(flow, /Insufficient testnet HBAR/);
  assert.doesNotMatch(flow, /pending-attachment-v1|legacyPending|Verify legacy recorded transaction/);
});

test("recovers legacy evidence for a prepared payment without signing or sending, while retaining it on rejection", async () => {
  const attemptPublicId = "CCCCCCCCCCCCCCCCCCCCCg";
  const transactionHash = `0x${"1".repeat(64)}`;
  const parameters = { offeringPublicId: "riskscan", units: "1", tinybars: "10", purchaseIntentId: attemptPublicId };
  const legacyKey = "tool402-backing-pending-attachment-v1";
  const initialPayment = { status: "PREPARED", transactionHash: null, tinybars: "10" };
  const confirmed = { ok: true, body: { status: "CONFIRMED", transactionHash, tinybars: "10" } };
  const success = await backingHarness({
    stored: new Map([[legacyKey, JSON.stringify({ intent: { idempotencyKey: attemptPublicId, parameters }, transactionHash })]]),
    payment: initialPayment,
    response: confirmed,
  });

  let tree = success.render();
  let recovery = elements(tree).find((element) => element.type === "Button" && element.props.children === "Check legacy recorded transaction");
  assert.ok(recovery, "a prepared reservation with only v1 evidence offers explicit recovery");
  recovery.props.onClick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(success.sends(), 0, "recovery never signs or sends a transaction");
  assert.equal(success.fetchCalls().length, 1);
  assert.equal(success.fetchCalls()[0][0], "/api/backing/payment");
  assert.deepEqual(JSON.parse(success.fetchCalls()[0][1].body), { attemptPublicId, transactionHash, parameters });
  tree = success.render();
  assert.equal(success.stored().has(legacyKey), false, "only backend-admitted evidence is cleaned up");
  assert.ok(elements(tree).some((element) => element.props.children === "Payment confirmed on Hedera Testnet for 10 HBAR. Allocation still needs the issuer's separate signature."));

  const rejection = await backingHarness({
    stored: new Map([[legacyKey, JSON.stringify({ intent: { idempotencyKey: attemptPublicId, parameters }, transactionHash })]]),
    payment: initialPayment,
    response: { ok: false, body: { outcome: "rejected" } },
  });
  tree = rejection.render();
  recovery = elements(tree).find((element) => element.type === "Button" && element.props.children === "Check legacy recorded transaction");
  assert.ok(recovery);
  recovery.props.onClick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rejection.sends(), 0);
  assert.equal(rejection.stored().has(legacyKey), true, "a rejected verification retains the original legacy record");
  tree = rejection.render();
  assert.ok(elements(tree).some((element) => element.props.children === "The legacy transaction was not admitted for this signed dashboard wallet. Nothing was sent and its local evidence was retained."));
});

test("renders the fixed copy and none of the canvas's sample or simulation content", async () => {
  const flow = await readAppFile("src/components/backing/backing-flow.tsx");
  const state = await readAppFile("src/components/backing/backing-state.ts");
  const sources = `${flow}\n${state}`;

  assert.match(flow, /No offering is available to back on this host\. Nothing was requested, signed, or sent\./);
  assert.match(flow, /Two confirmations: one signature, one HBAR transfer\./);
  assert.match(flow, /Units requested/);
  assert.match(sources, /of qualifying usage revenue funds capped distributions under the offering terms\. This is not a projected return\. No payout amount or timeline is promised\./);
  assert.match(sources, /I understand this is a testnet experiment with no real funds, that units are allocated only after the issuer signs, and that the payout cap is/);
  assert.match(flow, /name="units"/);
  assert.doesNotMatch(flow, /role="radiogroup"|Amount presets/);
  assert.match(flow, /name="acknowledgement"/);
  assert.match(flow, /aria-live="polite"/);
  assert.match(flow, /disabled=\{/);
  assert.match(flow, /Payment submitted — allocation pending\./);

  assert.doesNotMatch(sources, /Units you hold|View verified evidence|Live testnet|\(sample\)|sample|simulat|units remain|raised|funded|0\.0\.\d/i);
  assert.match(flow, /Payment confirmed on Hedera Testnet/);
  assert.match(flow, /View on HashScan/);
  assert.doesNotMatch(sources, /Connected\b/);
  assert.doesNotMatch(sources, /\b(?:paid|settled|verified|allocated|(?<!aria-)live)\b(?! only| record)/i);
  assert.doesNotMatch(flow, /attachCandidate/u);
});
