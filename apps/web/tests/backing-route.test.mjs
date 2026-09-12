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

test("renders one server route that hands the flow no projection of its own", async () => {
  const page = await readAppFile("src/app/explore/riskscan/back/page.tsx");

  assert.doesNotMatch(page, /["']use client["']|\bfetch\s*\(|process\.env|readProviderProjections|offering-projection/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /import \{ BackingFlow \} from "[./]+\/components\/backing\/backing-flow"/);
  assert.match(page, /<BackingFlow projection=\{null\} \/>/);
  assert.equal((page.match(/<Link\b/g) ?? []).length, 1);
  assert.equal((page.match(/href=/g) ?? []).length, 1);
  assert.match(page, /<Link\s+href="\/explore\/riskscan"[\s\S]*?>\s*Back to RiskScan\s*<\/Link>/);
});

test("consumes the shared wallet session, signature dialog, and relay without a second copy of any", async () => {
  const flow = await readAppFile("src/components/backing/backing-flow.tsx");

  assert.match(flow, /^["']use client["'];/);
  assert.match(flow, /import \{ connectedWalletSession, useWalletSession, type WalletSession \} from "\.\.\/wallet\/wallet-session"/);
  assert.match(flow, /import \{ SignatureDialog, type SignatureResult \} from "\.\.\/wallet\/signature-dialog"/);
  assert.equal((flow.match(/useWalletSession\(\)/g) ?? []).length, 1);
  assert.equal((flow.match(/<SignatureDialog\b/g) ?? []).length, 1);
  assert.doesNotMatch(flow, /approvedIssuerAddress|canonicalSignerAddress/);
  assert.doesNotMatch(flow, /discoverMetaMaskProvider|eth_requestAccounts|wallet_switchEthereumChain|eth_signTypedData|signCommand|createUnsignedCommand|relayCommandBody|\/api\/commands|createCommandNonce|keccak/);
  assert.equal((flow.match(/eth_sendTransaction/g) ?? []).length, 0);
  assert.match(flow, /transferRequest\(/);
  assert.doesNotMatch(flow, /\bfetch\s*\(|process\.env|setTimeout|setInterval|localStorage|sessionStorage|https?:\/\/|href=/);
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
  assert.match(flow, /name="acknowledgement"/);
  assert.match(flow, /aria-live="polite"/);
  assert.match(flow, /disabled=\{/);

  assert.doesNotMatch(sources, /Units you hold|View verified evidence|Live testnet|\(sample\)|sample|simulat|hashscan|units remain|raised|funded|balance|0\.0\.\d/i);
  assert.doesNotMatch(sources, /Connected\b/);
  assert.doesNotMatch(sources, /\b(?:paid|settled|verified|allocated|(?<!aria-)live)\b(?! only| record)/i);
  assert.doesNotMatch(flow, /attachCandidate|attach/i);
});
