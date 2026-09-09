import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalizeRequirements } from "@tool402/core";
import typescript from "typescript";
import { keccak256, stringToHex } from "viem";

const sourceUrl = new URL(
  "../src/ats/ats-create-configuration-v2.ts",
  import.meta.url,
);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const m35ModuleUrl = new URL(
  "../src/ats/local-unsigned-ats-create-configuration.ts",
  import.meta.url,
);
const expectedCanonicalParametersHash =
  "39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a";
const m35CanonicalParametersHash =
  "eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f";
const m35AcceptedFiles = [
  [
    new URL("../src/ats/local-unsigned-ats-create-configuration.ts", import.meta.url),
    "cd48e196b7d3b5eda319e05beaf7a6111afa55b3dd55578a18ed8ee908c837a4",
  ],
  [
    new URL("./local-unsigned-ats-create-configuration.test.mjs", import.meta.url),
    "630c81c8ab7d4ff8943bbc868e341b80bf1b372239a697ce5852cda1371b8c25",
  ],
];
const retarget = {
  registryRevision: "ats_sdk_8_0_0_testnet_v2",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  factoryHederaId: "0.0.9213391",
  resolverHederaId: "0.0.9212226",
  resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a",
};
let api;
let m35;

function preimageFor(configuration) {
  return {
    protocol: configuration.protocol,
    network: configuration.network,
    chainId: configuration.chainId,
    subjectPublicId: configuration.subjectPublicId,
    offeringVersion: configuration.offeringVersion,
    registryRevision: configuration.registryRevision,
    operationKind: configuration.operationKind,
    targetKind: configuration.targetKind,
    expectedTarget: configuration.expectedTarget,
    operationDescriptor: configuration.operationDescriptor,
    parameters: configuration.parameters,
  };
}

function retargetM35(configuration) {
  return {
    ...configuration,
    registryRevision: retarget.registryRevision,
    expectedTarget: retarget.expectedTarget,
    resolverHederaId: retarget.resolverHederaId,
    resolverEvmAddress: retarget.resolverEvmAddress,
    operationDescriptor: {
      ...configuration.operationDescriptor,
      factoryHederaId: retarget.factoryHederaId,
      resolverHederaId: retarget.resolverHederaId,
    },
    canonicalParametersHash: expectedCanonicalParametersHash,
  };
}

function assertFrozenProjection(projection) {
  for (const value of [
    projection,
    projection.operationDescriptor,
    projection.parameters,
    projection.operationDescriptor.omittedOptionalFields,
    projection.parameters.externalPausesIds,
    projection.parameters.externalControlListsIds,
    projection.parameters.externalKycListsIds,
    projection.parameters.proceedRecipientsIds,
    projection.parameters.proceedRecipientsData,
  ]) {
    assert.equal(Object.isFrozen(value), true);
  }
}

function assertDetachedProjection(first, second) {
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.operationDescriptor, second.operationDescriptor);
  assert.notStrictEqual(first.parameters, second.parameters);
  assert.notStrictEqual(
    first.operationDescriptor.omittedOptionalFields,
    second.operationDescriptor.omittedOptionalFields,
  );
  for (const field of [
    "externalPausesIds",
    "externalControlListsIds",
    "externalKycListsIds",
    "proceedRecipientsIds",
    "proceedRecipientsData",
  ]) {
    assert.notStrictEqual(first.parameters[field], second.parameters[field]);
  }
}

function assertClosedProjection(projection, expected) {
  assert.deepEqual(Reflect.ownKeys(projection), Reflect.ownKeys(expected));
  assert.deepEqual(
    Reflect.ownKeys(projection.operationDescriptor),
    Reflect.ownKeys(expected.operationDescriptor),
  );
  assert.deepEqual(
    Reflect.ownKeys(projection.parameters),
    Reflect.ownKeys(expected.parameters),
  );
}

function assertAcceptedFileHashes(files) {
  for (const [fileUrl, expectedHash] of files) {
    assert.equal(
      createHash("sha256").update(readFileSync(fileUrl)).digest("hex"),
      expectedHash,
    );
  }
}

function assertPrivateStaticSource(source, filename) {
  const sourceFile = typescript.createSourceFile(
    filename,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TS,
  );
  assert.deepEqual(sourceFile.parseDiagnostics, []);

  const prohibitedIndirection = [];
  const inspectNode = (node) => {
    if (
      (typescript.isCallExpression(node)
        && node.expression.kind === typescript.SyntaxKind.ImportKeyword)
      || (typescript.isMetaProperty(node)
        && node.keywordToken === typescript.SyntaxKind.ImportKeyword)
      || ((typescript.isIdentifier(node) || typescript.isStringLiteral(node))
        && (node.text === "eval" || node.text === "Function"))
    ) {
      prohibitedIndirection.push(node.text ?? typescript.SyntaxKind[node.kind]);
    }
    typescript.forEachChild(node, inspectNode);
  };
  typescript.forEachChild(sourceFile, inspectNode);
  assert.deepEqual(prohibitedIndirection, []);

  const specifiers = [];
  for (const statement of sourceFile.statements) {
    assert.equal(typescript.isImportEqualsDeclaration(statement), false);
    if (
      (typescript.isImportDeclaration(statement)
        || typescript.isExportDeclaration(statement))
      && statement.moduleSpecifier !== undefined
    ) {
      assert.equal(typescript.isStringLiteral(statement.moduleSpecifier), true);
      specifiers.push({
        kind: typescript.isImportDeclaration(statement) ? "import" : "export",
        specifier: statement.moduleSpecifier.text,
      });
    }
  }
  assert.deepEqual(specifiers, [
    { kind: "import", specifier: "@tool402/core" },
    { kind: "import", specifier: "viem" },
  ]);
  assert.doesNotMatch(
    source,
    /\brequire\s*\(|\bNetwork\s*\.\s*(?:init|connect)\s*\(|\bnew\s+CreateBondRequest\s*\(|\bBond\s*\.\s*create\s*\(|\b(?:window|ethereum|MetaMask|wagmi|WalletConnect|createWalletClient|createPublicClient|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|Date|performance|setTimeout|setInterval|process|commandAuthorities|ats_prepare_authority|external_prepare_command_admission|convex)\b/u,
  );
}

function assertNoAtsSdkDependency() {
  for (const packageUrl of [
    new URL("../package.json", import.meta.url),
    new URL("../../../package.json", import.meta.url),
  ]) {
    const packageJson = JSON.parse(readFileSync(packageUrl, "utf8"));
    for (const section of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      assert.equal(
        packageJson[section]?.["@hashgraph/asset-tokenization-sdk"],
        undefined,
      );
    }
  }
}

test("requires the declared ATS_CREATE configuration V2 source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    [api, m35] = await Promise.all([
      import(sourceUrl.href),
      import(m35ModuleUrl.href),
    ]);
  }
});

implementedTest("returns only the exact retargeted synthetic projection and transcribed digest", () => {
  assert.deepEqual(Object.keys(api).sort(), ["createAtsCreateConfigurationV2"]);

  const projection = api.createAtsCreateConfigurationV2();
  const expected = retargetM35(m35.createLocalUnsignedAtsCreateConfiguration());
  assert.deepEqual(projection, expected);
  assertClosedProjection(projection, expected);
  assert.deepEqual(
    Reflect.ownKeys(preimageFor(projection)),
    [
      "protocol",
      "network",
      "chainId",
      "subjectPublicId",
      "offeringVersion",
      "registryRevision",
      "operationKind",
      "targetKind",
      "expectedTarget",
      "operationDescriptor",
      "parameters",
    ],
  );
  assert.equal(
    keccak256(stringToHex(canonicalizeRequirements(preimageFor(projection)))).slice(2),
    expectedCanonicalParametersHash,
  );
  assert.equal(projection.canonicalParametersHash, expectedCanonicalParametersHash);
  assert.match(projection.canonicalParametersHash, /^[0-9a-f]{64}$/u);
  assert.notEqual(projection.canonicalParametersHash, m35CanonicalParametersHash);
});

implementedTest("returns fresh, fully frozen V2 data on every call", () => {
  const first = api.createAtsCreateConfigurationV2();
  const second = api.createAtsCreateConfigurationV2();

  assert.deepEqual(first, second);
  assertDetachedProjection(first, second);
  assertFrozenProjection(first);
  assertFrozenProjection(second);
  assert.throws(() => {
    first.parameters.name = "changed";
  }, TypeError);
  assert.throws(() => {
    first.operationDescriptor.omittedOptionalFields.push("unexpected");
  }, TypeError);
});

implementedTest("preserves M35 and keeps the V2 helper private and capability-free", () => {
  const acceptedM35 = m35.createLocalUnsignedAtsCreateConfiguration();
  assert.equal(acceptedM35.registryRevision, "ats_sdk_8_0_0_testnet_v1");
  assert.equal(acceptedM35.expectedTarget, "0x5fa65ca30d1984701f10476664327f97c864a9d3");
  assert.equal(acceptedM35.operationDescriptor.factoryHederaId, "0.0.7708432");
  assert.equal(acceptedM35.resolverHederaId, "0.0.7707874");
  assert.equal(acceptedM35.resolverEvmAddress, "0xefef4cae9642631cfc6d997d6207ee48fa78fe42");
  assert.equal(acceptedM35.canonicalParametersHash, m35CanonicalParametersHash);
  assertAcceptedFileHashes(m35AcceptedFiles);

  assertPrivateStaticSource(readFileSync(sourceUrl, "utf8"), "ats-create-configuration-v2.ts");
  assertNoAtsSdkDependency();
  const backendPublicBarrel = readFileSync(
    new URL("../src/index.ts", import.meta.url),
    "utf8",
  );
  const m32Source = readFileSync(
    new URL("../convex/external_prepare_command_admission.ts", import.meta.url),
    "utf8",
  );
  const m33Source = readFileSync(
    new URL("../convex/ats_prepare_authority.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(backendPublicBarrel, /ats-create-configuration-v2/u);
  assert.doesNotMatch(m32Source, /ats-create-configuration-v2/u);
  assert.doesNotMatch(m33Source, /ats-create-configuration-v2/u);
});
