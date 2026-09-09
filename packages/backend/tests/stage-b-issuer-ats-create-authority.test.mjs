import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalizeRequirements } from "@tool402/core";
import typescript from "typescript";
import { keccak256, stringToHex } from "viem";

const sourceUrl = new URL(
  "../src/ats/stage-b-issuer-ats-create-authority.ts",
  import.meta.url,
);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const m37ModuleUrl = new URL(
  "../src/ats/stage-a-real-issuer-ats-create-authority.ts",
  import.meta.url,
);
const expectedCanonicalParametersHash =
  "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const m37CanonicalParametersHash =
  "d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250";
const m37AcceptedFiles = [
  [
    new URL("../src/ats/stage-a-real-issuer-ats-create-authority.ts", import.meta.url),
    "1349a73dc62b9f44c6cede89d535093c3c9145f9ad6f2a774bb753e3c9606393",
  ],
  [
    new URL("./stage-a-real-issuer-ats-create-authority.test.mjs", import.meta.url),
    "ec2fc457230b22fc386df82f72c8da71467a4984b27f22433d9ffdefbb19ff69",
  ],
];
const realIssuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const retarget = {
  registryRevision: "ats_sdk_8_0_0_testnet_v2",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  factoryHederaId: "0.0.9213391",
  resolverHederaId: "0.0.9212226",
  resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a",
};
let api;
let m37;

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

function retargetStageA(projection) {
  const atsCreateConfiguration = {
    ...projection.atsCreateConfiguration,
    registryRevision: retarget.registryRevision,
    expectedTarget: retarget.expectedTarget,
    resolverHederaId: retarget.resolverHederaId,
    resolverEvmAddress: retarget.resolverEvmAddress,
    operationDescriptor: {
      ...projection.atsCreateConfiguration.operationDescriptor,
      factoryHederaId: retarget.factoryHederaId,
      resolverHederaId: retarget.resolverHederaId,
    },
    canonicalParametersHash: expectedCanonicalParametersHash,
  };
  return {
    plannedCommandAuthority: projection.plannedCommandAuthority,
    atsCreateConfiguration,
    canonicalPreimage: preimageFor(atsCreateConfiguration),
    canonicalParametersHash: expectedCanonicalParametersHash,
  };
}

function arraysFor(configuration) {
  return [
    configuration.operationDescriptor.omittedOptionalFields,
    configuration.parameters.externalPausesIds,
    configuration.parameters.externalControlListsIds,
    configuration.parameters.externalKycListsIds,
    configuration.parameters.proceedRecipientsIds,
    configuration.parameters.proceedRecipientsData,
  ];
}

function assertFrozenProjection(projection) {
  for (const value of [
    projection,
    projection.plannedCommandAuthority,
    projection.plannedCommandAuthority.ownedSubjectPublicIds,
    projection.atsCreateConfiguration,
    projection.atsCreateConfiguration.operationDescriptor,
    projection.atsCreateConfiguration.parameters,
    projection.canonicalPreimage,
    projection.canonicalPreimage.operationDescriptor,
    projection.canonicalPreimage.parameters,
    ...arraysFor(projection.atsCreateConfiguration),
    ...arraysFor(projection.canonicalPreimage),
  ]) {
    assert.equal(Object.isFrozen(value), true);
  }
}

function assertDetachedProjection(first, second) {
  assert.notStrictEqual(first, second);
  for (const field of [
    "plannedCommandAuthority",
    "atsCreateConfiguration",
    "canonicalPreimage",
  ]) {
    assert.notStrictEqual(first[field], second[field]);
  }
  for (const configurationField of [
    "atsCreateConfiguration",
    "canonicalPreimage",
  ]) {
    const firstConfiguration = first[configurationField];
    const secondConfiguration = second[configurationField];
    assert.notStrictEqual(
      firstConfiguration.operationDescriptor,
      secondConfiguration.operationDescriptor,
    );
    assert.notStrictEqual(firstConfiguration.parameters, secondConfiguration.parameters);
    for (const [firstArray, secondArray] of arraysFor(firstConfiguration).map(
      (firstArray, index) => [firstArray, arraysFor(secondConfiguration)[index]],
    )) {
      assert.notStrictEqual(firstArray, secondArray);
    }
  }
  assert.notStrictEqual(
    first.plannedCommandAuthority.ownedSubjectPublicIds,
    second.plannedCommandAuthority.ownedSubjectPublicIds,
  );
}

function assertClosedProjection(projection, expected) {
  for (const [actual, expectedValue] of [
    [projection, expected],
    [projection.plannedCommandAuthority, expected.plannedCommandAuthority],
    [projection.atsCreateConfiguration, expected.atsCreateConfiguration],
    [
      projection.atsCreateConfiguration.operationDescriptor,
      expected.atsCreateConfiguration.operationDescriptor,
    ],
    [projection.atsCreateConfiguration.parameters, expected.atsCreateConfiguration.parameters],
    [projection.canonicalPreimage, expected.canonicalPreimage],
    [
      projection.canonicalPreimage.operationDescriptor,
      expected.canonicalPreimage.operationDescriptor,
    ],
    [projection.canonicalPreimage.parameters, expected.canonicalPreimage.parameters],
  ]) {
    assert.deepEqual(Reflect.ownKeys(actual), Reflect.ownKeys(expectedValue));
  }
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

test("requires the declared Stage B issuer ATS_CREATE authority source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    [api, m37] = await Promise.all([
      import(sourceUrl.href),
      import(m37ModuleUrl.href),
    ]);
  }
});

implementedTest("returns the exact retargeted real-issuer authority and verified preimage", () => {
  assert.deepEqual(Object.keys(api).sort(), ["createStageBIssuerAtsCreateAuthority"]);

  const projection = api.createStageBIssuerAtsCreateAuthority();
  const expected = retargetStageA(m37.createStageARealIssuerAtsCreateAuthority());
  assert.deepEqual(projection, expected);
  assertClosedProjection(projection, expected);
  assert.deepEqual(Reflect.ownKeys(projection.canonicalPreimage), [
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
  ]);
  assert.equal(
    keccak256(
      stringToHex(canonicalizeRequirements(projection.canonicalPreimage)),
    ).slice(2),
    expectedCanonicalParametersHash,
  );
  assert.equal(projection.canonicalParametersHash, expectedCanonicalParametersHash);
  assert.equal(
    projection.atsCreateConfiguration.canonicalParametersHash,
    expectedCanonicalParametersHash,
  );
  assert.match(projection.canonicalParametersHash, /^[0-9a-f]{64}$/u);
  assert.notEqual(projection.canonicalParametersHash, m37CanonicalParametersHash);
  assert.equal(projection.plannedCommandAuthority.canonicalSignerAddress, realIssuer);
  assert.equal(
    projection.plannedCommandAuthority.canonicalSignerAddress,
    projection.atsCreateConfiguration.parameters.diamondOwnerAccount,
  );
});

implementedTest("returns fresh, fully frozen Stage B data on every call", () => {
  const first = api.createStageBIssuerAtsCreateAuthority();
  const second = api.createStageBIssuerAtsCreateAuthority();

  assert.deepEqual(first, second);
  assertDetachedProjection(first, second);
  assertFrozenProjection(first);
  assertFrozenProjection(second);
  assert.throws(() => {
    first.plannedCommandAuthority.role = "BACKER";
  }, TypeError);
  assert.throws(() => {
    first.canonicalPreimage.parameters.name = "changed";
  }, TypeError);
});

implementedTest("preserves M37, leaves M33 zero-enabled, and keeps Stage B private", () => {
  const acceptedM37 = m37.createStageARealIssuerAtsCreateAuthority();
  assert.equal(
    acceptedM37.plannedCommandAuthority.canonicalSignerAddress,
    realIssuer,
  );
  assert.equal(
    acceptedM37.plannedCommandAuthority.canonicalSignerAddress,
    acceptedM37.atsCreateConfiguration.parameters.diamondOwnerAccount,
  );
  assert.equal(acceptedM37.atsCreateConfiguration.registryRevision, "ats_sdk_8_0_0_testnet_v1");
  assert.equal(acceptedM37.atsCreateConfiguration.expectedTarget, "0x5fa65ca30d1984701f10476664327f97c864a9d3");
  assert.equal(acceptedM37.atsCreateConfiguration.operationDescriptor.factoryHederaId, "0.0.7708432");
  assert.equal(acceptedM37.atsCreateConfiguration.resolverHederaId, "0.0.7707874");
  assert.equal(acceptedM37.atsCreateConfiguration.resolverEvmAddress, "0xefef4cae9642631cfc6d997d6207ee48fa78fe42");
  assert.equal(acceptedM37.atsCreateConfiguration.canonicalParametersHash, m37CanonicalParametersHash);
  assertAcceptedFileHashes(m37AcceptedFiles);

  assertPrivateStaticSource(readFileSync(sourceUrl, "utf8"), "stage-b-issuer-ats-create-authority.ts");
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
  assert.doesNotMatch(backendPublicBarrel, /stage-b-issuer-ats-create-authority/u);
  assert.doesNotMatch(m32Source, /stage-b-issuer-ats-create-authority/u);
  assert.doesNotMatch(m33Source, /stage-b-issuer-ats-create-authority/u);
  assert.match(
    m33Source,
    /currentManifest:\s*readonly unknown\[\]\s*=\s*Object\.freeze\(\[\]\)/u,
  );
});
