import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const commandUrl = new URL("../src/lib/wallet/tool402-command.ts", import.meta.url);
const relayUrl = new URL("../src/lib/wallet/command-relay.ts", import.meta.url);

test("keeps command signing behind a typed-data signer and current Wagmi context", async () => {
  const [command, relay] = await Promise.all([
    readFile(commandUrl, "utf8"),
    readFile(relayUrl, "utf8"),
  ]);

  assert.doesNotMatch(command, /metamask-provider|Eip1193Provider|eth_signTypedData_v4/u);
  assert.match(command, /export\s+type\s+Tool402TypedDataSigner/u);
  assert.match(command, /signCommand\(\s*command:\s*UnsignedTool402Command\s*,\s*signTypedData:\s*Tool402TypedDataSigner/u);
  assert.doesNotMatch(relay, /metamask-provider|wallet-state|Eip1193Provider|readCurrentSession/u);
  assert.match(relay, /export\s+interface\s+WalletActionContext/u);
  assert.match(relay, /readCurrentContext/u);
  assert.match(relay, /signTypedData/u);
});

test("declares the command and relay modules under test", () => {
  assert.match(fileURLToPath(commandUrl), /tool402-command\.ts$/u);
  assert.match(fileURLToPath(relayUrl), /command-relay\.ts$/u);
});
