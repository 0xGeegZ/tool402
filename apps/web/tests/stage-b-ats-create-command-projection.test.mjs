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
const moduleLoaderTrivia = String.raw`(?:\s|/\*[\s\S]*?\*/|//[^\r\n]*)*`;
const staticModuleLoader = new RegExp(
  String.raw`\bimport\b${moduleLoaderTrivia}(?:["'{*]|[A-Za-z_$])`,
  "mu",
);
const dynamicModuleLoader = new RegExp(
  String.raw`\bimport\b${moduleLoaderTrivia}\(`,
  "u",
);
const requireModuleLoader = new RegExp(
  String.raw`\brequire\b${moduleLoaderTrivia}\(`,
  "u",
);
let moduleExports;
let stageBAtsCreateCommandProjection;

function maskNonCodeLexemes(source) {
  return source.replace(
    /\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/gu,
    (lexeme) => {
      const isQuotedLiteral = lexeme.startsWith('"') || lexeme.startsWith("'");
      const openingQuote = isQuotedLiteral ? lexeme[0] : "";
      const body = isQuotedLiteral ? lexeme.slice(1, -1) : lexeme;
      return `${openingQuote}${body.replace(/[^\r\n]/gu, " ")}${openingQuote}`;
    },
  );
}

function assertNoPrivateModuleLoader(source) {
  const code = maskNonCodeLexemes(source.replace(
    /import\s*\{\s*STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH\s*\}\s*from\s*["']\.\/stage-b-ats-create-canonical-identity\.ts["'];?/u,
    "",
  ));
  assert.doesNotMatch(code, staticModuleLoader);
  assert.doesNotMatch(code, dynamicModuleLoader);
  assert.doesNotMatch(code, requireModuleLoader);
}

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
  assert.match(
    source,
    /import\s*\{\s*STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH\s*\}\s*from\s*["']\.\/stage-b-ats-create-canonical-identity\.ts["']/u,
  );
  assertNoPrivateModuleLoader(source);
  assert.doesNotMatch(
    source,
    /\b(?:process\s*\.\s*env|import\.meta\.env|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|window|ethereum|MetaMask|wagmi|WalletConnect|createWalletClient|createPublicClient|@hashgraph|convex|operationDescriptor|diamondOwnerAccount|plannedCommandAuthority|principalPublicId|authorityVersion|sdk(?:Package|Version|Integrity)|resolver(?:HederaId|EvmAddress))\b/u,
  );
});

test("private-loader guard rejects static, dynamic, and require mutations across comment separators", () => {
  const mutations = [
    [
      "same-line static import after preceding JavaScript",
      'const inert = 1; import { value } from "private";',
    ],
    ["normal static import", 'import { value } from "private";'],
    ["side-effect static import", 'import "private";'],
    ["block-comment static import", 'import /* private loader */ { value } from "private";'],
    [
      "line-comment static import",
      'import // arbitrary same-line loader commentary\n{ value } from "private";',
    ],
    ["normal dynamic import", 'import("private");'],
    ["block-comment dynamic import", 'import /* private loader */ ("private");'],
    [
      "line-comment dynamic import",
      'import // arbitrary same-line loader commentary\n("private");',
    ],
    ["normal require", 'require("private");'],
    ["block-comment require", 'require /* private loader */ ("private");'],
    [
      "line-comment require",
      'require // arbitrary same-line loader commentary\n("private");',
    ],
  ];

  for (const [name, mutatedSource] of mutations) {
    assert.throws(() => assertNoPrivateModuleLoader(mutatedSource), undefined, name);
  }
});

test("private-loader guard ignores loader-looking documentation and string literals", () => {
  const benignSources = [
    ["line-comment documentation", "// import harmless documentation\nexport const value = 1;"],
    ["block-comment documentation", "/* import harmless documentation */\nexport const value = 1;"],
    ["quoted import documentation", 'const note = "import harmless documentation";'],
    ["quoted require documentation", 'const note = "require(\'private\')";'],
    ["quoted dynamic-import documentation", 'const note = "import(\'private\')";'],
  ];

  for (const [name, benignSource] of benignSources) {
    assert.doesNotThrow(() => assertNoPrivateModuleLoader(benignSource), name);
  }
});
