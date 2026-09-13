import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const balancePath = "src/lib/wallet/wallet-balance.ts";
const balanceExists = existsSync(join(appRoot, balancePath));
const implementedTest = balanceExists ? test : test.skip;
const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function recordingProvider(answer) {
  const calls = [];
  return {
    calls,
    provider: {
      async request(payload) {
        calls.push(payload);
        if (answer instanceof Error) throw answer;
        return answer;
      },
    },
  };
}

test("requires the declared UI-S37 balance module", () => {
  assert.equal(balanceExists, true, `missing declared source path: ${balancePath}`);
});

implementedTest("reads the native balance with exactly one eth_getBalance call", async () => {
  const { readHbarBalance } = await import("../src/lib/wallet/wallet-balance.ts");
  const fake = recordingProvider("0xde0b6b3a7640000");

  const answer = await readHbarBalance(fake.provider, address);

  assert.equal(answer, "0xde0b6b3a7640000");
  assert.deepEqual(fake.calls, [{ method: "eth_getBalance", params: [address, "latest"] }]);
});

implementedTest("rejects an answer that is not a 0x-prefixed hex quantity", async () => {
  const { readHbarBalance } = await import("../src/lib/wallet/wallet-balance.ts");

  for (const answer of [null, undefined, 1, "1000", "0x", "0xzz", {}]) {
    const fake = recordingProvider(answer);
    await assert.rejects(() => readHbarBalance(fake.provider, address));
    assert.equal(fake.calls.length, 1, "a malformed answer still costs exactly one call");
  }
});

implementedTest("propagates a rejected provider request as-is", async () => {
  const { readHbarBalance } = await import("../src/lib/wallet/wallet-balance.ts");
  const refusal = new Error("user rejected");
  const fake = recordingProvider(refusal);

  await assert.rejects(() => readHbarBalance(fake.provider, address), (error) => error === refusal);
});

implementedTest("formats weibar through the shared tinybar HBAR formatter with BigInt only", async () => {
  const { formatHbar } = await import("../src/lib/wallet/wallet-balance.ts");
  const source = await readAppFile(balancePath);

  assert.equal(formatHbar("0x0"), "0 HBAR");
  assert.equal(formatHbar("0xde0b6b3a7640000"), "1 HBAR");
  assert.equal(formatHbar("0x11355d6e217bffff"), "1.23999999 HBAR");
  assert.equal(formatHbar("0x42ecf6330552400000"), "1,234.56 HBAR");

  assert.match(source, /from\s+["']\.\.\/hbar-format\.ts["']/u, "the module owns no second HBAR formatter");
  assert.match(source, /export async function readHbarBalance\(/u);
  assert.match(source, /export function formatHbar\(/u);
  assert.match(source, /\bBigInt\b|\d+n\b/u);
  assert.doesNotMatch(source, /\bimport .*\breact\b/u, "the balance module imports no React");
  assert.doesNotMatch(source, /parseFloat|Number\(|toFixed|Math\./u, "weibar never touches floating point");
  assert.doesNotMatch(source, /\bfetch\b|mirror|viem|setInterval|setTimeout/u);
});

implementedTest("wires one guarded balance read into the session and renders the badge contract", async () => {
  const session = await readAppFile("src/components/wallet/wallet-session.tsx");
  const island = await readAppFile("src/components/wallet/wallet-connect.tsx");

  assert.match(session, /import\s*\{[^}]*\breadHbarBalance\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/lib\/wallet\/wallet-balance\.ts["']/u);
  assert.equal([...session.matchAll(/readHbarBalance\(/gu)].length, 1, "the session reads the balance from exactly one call site");
  assert.match(session, /state\.kind === "connected" \|\| state\.kind === "not_issuer"/u, "the read is guarded by a settled connected or not_issuer kind");
  assert.match(session, /\}, \[provider, balanceAddress\]\);/u, "the read follows account and chain changes, nothing else");
  assert.doesNotMatch(session, /setInterval|setTimeout/u, "the balance never refreshes on a timer");
  assert.doesNotMatch(session, /\bfetch\b|mirror|viem/u);
  assert.doesNotMatch(island, /setInterval|setTimeout|\buseState\b|\buseEffect\b|\buseRef\b/u, "the badge holds no balance state of its own");
  assert.match(island, / · /u, "the badge separates the address from the balance");
  assert.match(island, /balance unavailable/u);
  assert.match(island, /HBAR on Hedera Testnet/u);
});
