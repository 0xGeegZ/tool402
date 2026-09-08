import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

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
