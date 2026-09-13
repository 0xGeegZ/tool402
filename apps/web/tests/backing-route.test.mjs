import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
  assert.match(flow, /import \{ isTool402MetaMaskConnector, useTool402Wallet, type Tool402WalletConnection \} from "\.\.\/wallet\/use-tool402-wallet"/);
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
  assert.equal((flow.match(/isSameBackingConnection\(connectionRef\.current, connection\)/g) ?? []).length, 2, "the current wallet is checked again after reservation and before sending");
  assert.doesNotMatch(flow, /process\.env|setTimeout|setInterval|sessionStorage|https?:\/\//);
  assert.match(flow, /localStorage/);
  assert.match(flow, /Attach recorded transaction/);
  assert.match(flow, /fetch\("\/api\/backing\/payment"/);
  assert.match(flow, /dashboardAddress/);
  assert.match(flow, /connection\.account === dashboardAddress/);
  assert.match(flow, /assessFundingBalance/);
  assert.match(flow, /Insufficient testnet HBAR/);
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
