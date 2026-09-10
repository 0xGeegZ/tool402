import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL(
  "../src/lib/ats/stage-b-ats-create-command-projection.ts",
  import.meta.url,
);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const realCanonicalParametersHash =
  "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const syntheticDisplayCanonicalParametersHash =
  "39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a";
const expectedProjection = Object.freeze({
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  operationKind: "ATS_CREATE",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  canonicalParametersHash: realCanonicalParametersHash,
});
let moduleExports;
let stageBAtsCreateCommandProjection;

test("requires the declared public M47 Stage-B command projection source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (!sourceExists) return;
  const module = await import(sourceUrl.href);
  ({ stageBAtsCreateCommandProjection } = module);
  moduleExports = Object.keys(module);
});

implementedTest("imports exactly the frozen six-field real M42 public command projection", () => {
  assert.deepEqual(moduleExports.sort(), ["stageBAtsCreateCommandProjection"]);
  const projection = stageBAtsCreateCommandProjection;
  assert.deepEqual(Reflect.ownKeys(projection), Reflect.ownKeys(expectedProjection));
  assert.deepEqual(projection, expectedProjection);
  assert.equal(Object.isFrozen(projection), true);
  assert.throws(() => {
    projection.network = "hedera:mainnet";
  }, TypeError);
  assert.equal(projection.canonicalParametersHash, realCanonicalParametersHash);
  assert.notEqual(projection.canonicalParametersHash, syntheticDisplayCanonicalParametersHash);
});

implementedTest("contains no owner, authority, SDK, descriptor, parameter, or provider value", () => {
  const projection = stageBAtsCreateCommandProjection;
  for (const field of [
    "diamondOwnerAccount",
    "plannedCommandAuthority",
    "canonicalSignerAddress",
    "principalPublicId",
    "role",
    "authorityVersion",
    "sdkPackage",
    "sdkVersion",
    "sdkIntegrity",
    "operationDescriptor",
    "parameters",
    "resolverHederaId",
    "resolverEvmAddress",
  ]) assert.equal(Object.hasOwn(projection, field), false, field);
  assert.doesNotMatch(
    JSON.stringify(projection),
    /(?:0xc89f87052c3e080b4a9b021d4930055031ef378e|tool402_ats_issuer_testnet_v1|ats_issuer_testnet_v1|39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a)/u,
  );
  assert.equal(Object.values(projection).every((value) => value === null || typeof value !== "object"), true);
});

implementedTest("keeps the browser projection inert and free of configuration, provider, or network authority", () => {
  const source = readFileSync(sourceUrl, "utf8");
  const moduleLoaderTrivia = String.raw`(?:\s|/\*[\s\S]*?\*/|//[^\r\n])*`;
  assert.doesNotMatch(source, new RegExp(String.raw`^\s*import\b${moduleLoaderTrivia}(?:["'{*]|[A-Za-z_$])`, "mu"));
  assert.doesNotMatch(source, new RegExp(String.raw`\bimport\b${moduleLoaderTrivia}\(`, "u"));
  assert.doesNotMatch(source, new RegExp(String.raw`\brequire\b${moduleLoaderTrivia}\(`, "u"));
  assert.doesNotMatch(
    source,
    /\b(?:process\s*\.\s*env|import\.meta\.env|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|window|ethereum|MetaMask|wagmi|WalletConnect|createWalletClient|createPublicClient|@hashgraph|convex|operationDescriptor|diamondOwnerAccount|plannedCommandAuthority|principalPublicId|authorityVersion|sdk(?:Package|Version|Integrity)|resolver(?:HederaId|EvmAddress))\b/u,
  );
});
