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

implementedTest("mounts one disabled Factory artifact plus viem client graph at the stage-three review step", async () => {
  const [action, stages] = await Promise.all([
    readFile(join(appRoot, "src/components/provider/deploy/ats-create-action.tsx"), "utf8"),
    readFile(join(appRoot, "src/components/provider/deploy/provider-deploy-stages.tsx"), "utf8"),
  ]);

  assert.match(action, /^"use client";/);
  assert.match(action, /@hashgraph\/asset-tokenization-contracts\/artifacts\/contracts\/factory\/Factory\.sol\/Factory\.json/);
  assert.match(action, /from "viem"/);
  assert.match(action, /<Button\b[^>]*\bdisabled\b[^>]*\bdata-ats-contracts-bundle=/);
  assert.equal((stages.match(/<AtsCreateAction\b/g) ?? []).length, 1);
  assert.match(stages, /index === 2 && substepIndex === 0 \? <AtsCreateAction\b/);
  assert.doesNotMatch(action, /(?:onClick|encodeFunctionData\s*\(|wallet|provider|configuration|transaction|deployBond\s*\()/i);
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
