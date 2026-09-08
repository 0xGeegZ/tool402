import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalizeRequirements } from "@tool402/core";
import typescript from "typescript";
import { keccak256, stringToHex } from "viem";

const realIssuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const syntheticIssuer = "0x0000000000000000000000000000000000000402";
const expectedCanonicalParametersHash =
  "d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250";
const m35CanonicalParametersHash =
  "eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f";
const sourceUrl = new URL(
  "../src/ats/stage-a-real-issuer-ats-create-authority.ts",
  import.meta.url,
);
const authorityModule = await import(sourceUrl.href);
const m35Module = await import(
  new URL(
    "../src/ats/local-unsigned-ats-create-configuration.ts",
    import.meta.url,
  ).href,
);

const expectedPlannedCommandAuthority = {
  chainId: 296,
  canonicalSignerAddress: realIssuer,
  principalPublicId: "tool402_ats_issuer_testnet_v1",
  role: "ISSUER",
  ownedSubjectPublicIds: ["riskscan_revenue_note_demo"],
  authorityVersion: "ats_issuer_testnet_v1",
  enabled: true,
};
const expectedOperationDescriptor = {
  sdkPackage: "@hashgraph/asset-tokenization-sdk",
  sdkVersion: "8.0.0",
  creationFamily: "BOND_STANDARD",
  requestExport: "CreateBondRequest",
  requestConstructor: "new CreateBondRequest",
  methodExport: "Bond",
  method: "create",
  targetContractRole: "FACTORY_PROXY",
  factoryHederaId: "0.0.7708432",
  resolverHederaId: "0.0.7707874",
  mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
  rpcNodeBaseUrl: "https://testnet.hashio.io/api",
  configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
  configVersion: 1,
  omittedOptionalFields: ["complianceId", "identityRegistryId"],
};
const expectedParameters = {
  name: "Tool402 RiskScan Revenue Note Demo",
  symbol: "T402RN",
  isin: "XS402RISKN02",
  decimals: 0,
  isWhiteList: true,
  erc20VotesActivated: false,
  isControllable: false,
  arePartitionsProtected: false,
  isMultiPartition: false,
  clearingActive: false,
  internalKycActivated: false,
  externalPausesIds: [],
  externalControlListsIds: [],
  externalKycListsIds: [],
  diamondOwnerAccount: realIssuer,
  currency: "0x555344",
  numberOfUnits: "1000",
  nominalValue: "1",
  nominalValueDecimals: 0,
  startingDate: "1789430400",
  maturityDate: "1798675200",
  regulationType: 1,
  regulationSubType: 0,
  isCountryControlListWhiteList: false,
  countries: "",
  info: "Tool402 testnet demo revenue note; no real-world investment or return claim.",
  configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
  configVersion: 1,
  proceedRecipientsIds: [],
  proceedRecipientsData: [],
};
const expectedAtsCreateConfiguration = {
  protocol: "tool402:ats-parameters:v1",
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  offeringVersion: "ats_demo_v1",
  registryRevision: "ats_sdk_8_0_0_testnet_v1",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0x5fa65ca30d1984701f10476664327f97c864a9d3",
  sdkPackage: "@hashgraph/asset-tokenization-sdk",
  sdkVersion: "8.0.0",
  sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
  resolverHederaId: "0.0.7707874",
  resolverEvmAddress: "0xefef4cae9642631cfc6d997d6207ee48fa78fe42",
  m20EconomicsBinding: "NONE",
  operationDescriptor: expectedOperationDescriptor,
  parameters: expectedParameters,
  canonicalParametersHash: expectedCanonicalParametersHash,
};

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

function staticModuleSpecifiers(source) {
  const sourceFile = typescript.createSourceFile(
    "stage-a-real-issuer-ats-create-authority.ts",
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TS,
  );
  assert.deepEqual(sourceFile.parseDiagnostics, []);

  const dynamicOrMetaImportNodes = [];
  const inspectNode = (node) => {
    if (
      (typescript.isCallExpression(node)
        && node.expression.kind === typescript.SyntaxKind.ImportKeyword)
      || (typescript.isMetaProperty(node)
        && node.keywordToken === typescript.SyntaxKind.ImportKeyword)
    ) {
      dynamicOrMetaImportNodes.push(typescript.SyntaxKind[node.kind]);
    }
    typescript.forEachChild(node, inspectNode);
  };
  typescript.forEachChild(sourceFile, inspectNode);
  assert.deepEqual(dynamicOrMetaImportNodes, []);

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

  return specifiers;
}

test("exports only the private Stage A authority integrity helper", () => {
  assert.deepEqual(Object.keys(authorityModule).sort(), [
    "createStageARealIssuerAtsCreateAuthority",
  ]);
});

test("returns the exact planned authority and closed real-owner configuration", () => {
  const projection =
    authorityModule.createStageARealIssuerAtsCreateAuthority();

  assert.deepEqual(projection, {
    plannedCommandAuthority: expectedPlannedCommandAuthority,
    atsCreateConfiguration: expectedAtsCreateConfiguration,
  });
  assert.deepEqual(Reflect.ownKeys(projection), [
    "plannedCommandAuthority",
    "atsCreateConfiguration",
  ]);
  assert.deepEqual(
    Reflect.ownKeys(projection.plannedCommandAuthority),
    Object.keys(expectedPlannedCommandAuthority),
  );
  assert.deepEqual(
    Reflect.ownKeys(projection.atsCreateConfiguration),
    Object.keys(expectedAtsCreateConfiguration),
  );
  assert.deepEqual(
    Reflect.ownKeys(projection.atsCreateConfiguration.operationDescriptor),
    Object.keys(expectedOperationDescriptor),
  );
  assert.deepEqual(
    Reflect.ownKeys(projection.atsCreateConfiguration.parameters),
    Object.keys(expectedParameters),
  );
  assert.equal(
    projection.plannedCommandAuthority.canonicalSignerAddress,
    projection.atsCreateConfiguration.parameters.diamondOwnerAccount,
  );
  assert.equal(
    keccak256(
      stringToHex(canonicalizeRequirements(preimageFor(projection.atsCreateConfiguration))),
    ).slice(2),
    expectedCanonicalParametersHash,
  );
});

test("changes only the M33-preimage owner from the accepted M35 configuration", () => {
  const projection =
    authorityModule.createStageARealIssuerAtsCreateAuthority();
  const m35Configuration =
    m35Module.createLocalUnsignedAtsCreateConfiguration();
  const stageAPreimage = preimageFor(projection.atsCreateConfiguration);
  const m35Preimage = preimageFor(m35Configuration);
  const { diamondOwnerAccount: stageAOwner, ...stageARemainingParameters } =
    stageAPreimage.parameters;
  const { diamondOwnerAccount: m35Owner, ...m35RemainingParameters } =
    m35Preimage.parameters;

  assert.equal(stageAOwner, realIssuer);
  assert.equal(m35Owner, syntheticIssuer);
  assert.deepEqual(stageARemainingParameters, m35RemainingParameters);
  assert.deepEqual(
    { ...stageAPreimage, parameters: stageARemainingParameters },
    { ...m35Preimage, parameters: m35RemainingParameters },
  );
  assert.equal(
    m35Configuration.canonicalParametersHash,
    m35CanonicalParametersHash,
  );
  assert.notEqual(
    projection.atsCreateConfiguration.canonicalParametersHash,
    m35CanonicalParametersHash,
  );
  assert.doesNotMatch(JSON.stringify(projection), new RegExp(syntheticIssuer, "u"));
});

test("returns fresh fully frozen authority and configuration data on every call", () => {
  const first = authorityModule.createStageARealIssuerAtsCreateAuthority();
  const second = authorityModule.createStageARealIssuerAtsCreateAuthority();

  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(
    first.plannedCommandAuthority,
    second.plannedCommandAuthority,
  );
  assert.notStrictEqual(first.atsCreateConfiguration, second.atsCreateConfiguration);
  assert.notStrictEqual(
    first.atsCreateConfiguration.operationDescriptor,
    second.atsCreateConfiguration.operationDescriptor,
  );
  assert.notStrictEqual(
    first.atsCreateConfiguration.parameters,
    second.atsCreateConfiguration.parameters,
  );

  for (const projection of [first, second]) {
    const { plannedCommandAuthority, atsCreateConfiguration } = projection;
    assert.equal(Object.isFrozen(projection), true);
    assert.equal(Object.isFrozen(plannedCommandAuthority), true);
    assert.equal(Object.isFrozen(plannedCommandAuthority.ownedSubjectPublicIds), true);
    assert.equal(Object.isFrozen(atsCreateConfiguration), true);
    assert.equal(Object.isFrozen(atsCreateConfiguration.operationDescriptor), true);
    assert.equal(Object.isFrozen(atsCreateConfiguration.parameters), true);
    for (const values of [
      atsCreateConfiguration.operationDescriptor.omittedOptionalFields,
      atsCreateConfiguration.parameters.externalPausesIds,
      atsCreateConfiguration.parameters.externalControlListsIds,
      atsCreateConfiguration.parameters.externalKycListsIds,
      atsCreateConfiguration.parameters.proceedRecipientsIds,
      atsCreateConfiguration.parameters.proceedRecipientsData,
    ]) {
      assert.equal(Object.isFrozen(values), true);
    }
  }

  assert.notStrictEqual(
    first.plannedCommandAuthority.ownedSubjectPublicIds,
    second.plannedCommandAuthority.ownedSubjectPublicIds,
  );
  assert.notStrictEqual(
    first.atsCreateConfiguration.operationDescriptor.omittedOptionalFields,
    second.atsCreateConfiguration.operationDescriptor.omittedOptionalFields,
  );
  for (const field of [
    "externalPausesIds",
    "externalControlListsIds",
    "externalKycListsIds",
    "proceedRecipientsIds",
    "proceedRecipientsData",
  ]) {
    assert.notStrictEqual(
      first.atsCreateConfiguration.parameters[field],
      second.atsCreateConfiguration.parameters[field],
    );
  }
  assert.throws(() => {
    first.plannedCommandAuthority.role = "BACKER";
  }, TypeError);
});

test("keeps the helper private and free of authority or execution capabilities", () => {
  const source = readFileSync(sourceUrl, "utf8");
  const backendPackage = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const rootPackage = JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
  );
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

  assert.deepEqual(staticModuleSpecifiers(source), [
    { kind: "import", specifier: "@tool402/core" },
    { kind: "import", specifier: "viem" },
  ]);
  assert.doesNotMatch(
    source,
    /\brequire\s*\(|\bNetwork\s*\.\s*(?:init|connect)\s*\(|\bnew\s+CreateBondRequest\s*\(|\bBond\s*\.\s*create\s*\(|\b(?:window|ethereum|MetaMask|wagmi|WalletConnect|createWalletClient|createPublicClient|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|Date|performance|setTimeout|setInterval|process|commandAuthorities|ats_prepare_authority|external_prepare_command_admission|convex)\b/u,
  );
  for (const packageJson of [backendPackage, rootPackage]) {
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
  assert.deepEqual(backendPackage.exports, { ".": "./src/index.ts" });
  assert.doesNotMatch(
    backendPublicBarrel,
    /stage-a-real-issuer-ats-create-authority/u,
  );
  assert.doesNotMatch(m32Source, /stage-a-real-issuer-ats-create-authority/u);
  assert.doesNotMatch(m33Source, /stage-a-real-issuer-ats-create-authority/u);
  assert.match(m33Source, /currentManifest:\s*readonly unknown\[\]\s*=\s*Object\.freeze\(\[\]\)/u);
});
