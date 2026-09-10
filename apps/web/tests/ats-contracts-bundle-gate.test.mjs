import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
const factorySourcePath = join(appRoot, "src/lib/ats/factory-deploy-bond.ts");
const factorySourceExists = existsSync(factorySourcePath);
const implementedTest = factorySourceExists ? test : test.skip;

test("requires the declared direct Factory source before the browser gate can turn green", () => {
  assert.equal(factorySourceExists, true, `missing declared M44 direct Factory source: ${factorySourcePath}`);
});

implementedTest("pins only the official contracts artifact package and retains the existing viem version", async () => {
  const [manifestText, lockText, staticShell] = await Promise.all([
    readFile(join(appRoot, "package.json"), "utf8"),
    readFile(join(repositoryRoot, "package-lock.json"), "utf8"),
    readFile(join(appRoot, "tests/static-shell.test.mjs"), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const lock = JSON.parse(lockText);

  assert.equal(manifest.dependencies["@hashgraph/asset-tokenization-contracts"], "8.0.0");
  assert.equal(manifest.dependencies.viem, "2.56.1");
  assert.equal(manifest.dependencies["@hashgraph/asset-tokenization-sdk"], undefined);
  assert.equal(lock.packages["node_modules/@hashgraph/asset-tokenization-contracts"]?.version, "8.0.0");
  assert.equal(
    lock.packages["node_modules/@hashgraph/asset-tokenization-contracts"]?.integrity,
    "sha512-OGxFWfb0FTaQtRSqETDGBPdxakYt0L/L2A5OgVlBtBCqs/Pz74NTLpqzPw/QOnOnhWiLLo9wYCKNze7sz5B8iQ==",
  );
  assert.match(staticShell, /@hashgraph\/asset-tokenization-contracts/);
  assert.doesNotMatch(staticShell, /@hashgraph\/asset-tokenization-sdk/);
});

implementedTest("mounts one M49 action through the accepted Factory artifact and viem seam at the stage-three review step", async () => {
  const bridgePath = join(appRoot, "src/lib/ats/stage-b-browser-provider-bridge.ts");
  assert.equal(existsSync(bridgePath), true, `missing declared M49 bridge source: ${bridgePath}`);
  if (!existsSync(bridgePath)) return;
  const [action, stages, bridge] = await Promise.all([
    readFile(join(appRoot, "src/components/provider/deploy/ats-create-action.tsx"), "utf8"),
    readFile(join(appRoot, "src/components/provider/deploy/provider-deploy-stages.tsx"), "utf8"),
    readFile(bridgePath, "utf8"),
  ]);

  assert.match(action, /^"use client";/);
  assert.match(action, /stage-b-browser-provider-bridge/u);
  assert.match(action, /<Button\b[^>]*\bdata-ats-contracts-bundle=/);
  assert.equal((stages.match(/<AtsCreateAction\b/g) ?? []).length, 1);
  assert.match(stages, /index === 2 && substepIndex === 0 \? <AtsCreateAction\b/);
  assert.match(bridge, /factory-deploy-bond/u);
  assert.doesNotMatch(action, /(?:encodeFunctionData\s*\(|eth_sendTransaction|deployBond\s*\()/u);
  assert.doesNotMatch(action, /@hashgraph\/asset-tokenization-sdk/u);
  assert.doesNotMatch(action, /(?:WalletConnect|createWalletClient|createPublicClient|process\.env|import\.meta\.env)/u);
});

implementedTest("removes the SDK compatibility implementation instead of carrying it into Turbopack", async () => {
  const [config, legacySdkGate] = await Promise.all([
    readFile(join(appRoot, "next.config.ts"), "utf8"),
    existsSync(join(appRoot, "tests/ats-sdk-bundle-gate.test.mjs"))
      ? readFile(join(appRoot, "tests/ats-sdk-bundle-gate.test.mjs"), "utf8")
      : Promise.resolve(""),
  ]);

  for (const path of [
    "src/lib/ats/browser/dotenv-mock.ts",
    "src/lib/ats/browser/winston-mock.ts",
    "tests/ats-sdk-bundle-gate.test.mjs",
    "tests/create-bond-request.test.mjs",
    "tests/ats-client.test.mjs",
  ]) {
    assert.equal(existsSync(join(appRoot, path)), false, `historical SDK path must be removed: ${path}`);
  }
  assert.equal(legacySdkGate, "");
  assert.doesNotMatch(config, /resolveAlias|serverExternalPackages|dotenv|winston|bbs/i);
});
