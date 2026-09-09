import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const sourceUrl = new URL("../src/lib/ats/create-bond-request.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const issuerEvmAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const canonicalParametersHash =
  "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const parameterKeys = Object.freeze([
  "name",
  "symbol",
  "isin",
  "decimals",
  "isWhiteList",
  "erc20VotesActivated",
  "isControllable",
  "arePartitionsProtected",
  "isMultiPartition",
  "clearingActive",
  "internalKycActivated",
  "externalPausesIds",
  "externalControlListsIds",
  "externalKycListsIds",
  "diamondOwnerAccount",
  "currency",
  "numberOfUnits",
  "nominalValue",
  "nominalValueDecimals",
  "startingDate",
  "maturityDate",
  "regulationType",
  "regulationSubType",
  "isCountryControlListWhiteList",
  "countries",
  "info",
  "configId",
  "configVersion",
  "proceedRecipientsIds",
  "proceedRecipientsData",
]);

const expectedParameters = Object.freeze({
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
  externalPausesIds: Object.freeze([]),
  externalControlListsIds: Object.freeze([]),
  externalKycListsIds: Object.freeze([]),
  diamondOwnerAccount: issuerEvmAddress,
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
  proceedRecipientsIds: Object.freeze([]),
  proceedRecipientsData: Object.freeze([]),
});

const sentinelIssuerEvmAddress = "0x1111111111111111111111111111111111";
const sentinelParameters = Object.freeze({
  name: "Sentinel Tool402 Revenue Note",
  symbol: "S402RN",
  isin: "XS402SENT01",
  decimals: 7,
  isWhiteList: false,
  erc20VotesActivated: true,
  isControllable: true,
  arePartitionsProtected: true,
  isMultiPartition: true,
  clearingActive: true,
  internalKycActivated: true,
  externalPausesIds: Object.freeze(["sentinel-pause"]),
  externalControlListsIds: Object.freeze(["sentinel-control-list"]),
  externalKycListsIds: Object.freeze(["sentinel-kyc-list"]),
  diamondOwnerAccount: sentinelIssuerEvmAddress,
  currency: "0x455552",
  numberOfUnits: "1001",
  nominalValue: "2",
  nominalValueDecimals: 6,
  startingDate: "1789430401",
  maturityDate: "1798675201",
  regulationType: 2,
  regulationSubType: 1,
  isCountryControlListWhiteList: true,
  countries: "FR,BE",
  info: "Sentinel test-only parameters.",
  configId: "0x0000000000000000000000000000000000000000000000000000000000000003",
  configVersion: 2,
  proceedRecipientsIds: Object.freeze(["sentinel-recipient"]),
  proceedRecipientsData: Object.freeze(["0x1234"]),
});

function createParameters(overrides = {}) {
  return {
    ...expectedParameters,
    externalPausesIds: [...expectedParameters.externalPausesIds],
    externalControlListsIds: [...expectedParameters.externalControlListsIds],
    externalKycListsIds: [...expectedParameters.externalKycListsIds],
    proceedRecipientsIds: [...expectedParameters.proceedRecipientsIds],
    proceedRecipientsData: [...expectedParameters.proceedRecipientsData],
    ...overrides,
  };
}

function createOperationDescriptor(overrides = {}) {
  return {
    sdkPackage: "@hashgraph/asset-tokenization-sdk",
    sdkVersion: "8.0.0",
    creationFamily: "BOND_STANDARD",
    requestExport: "CreateBondRequest",
    requestConstructor: "new CreateBondRequest",
    methodExport: "Bond",
    method: "create",
    targetContractRole: "FACTORY_PROXY",
    factoryHederaId: "0.0.9213391",
    resolverHederaId: "0.0.9212226",
    mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
    rpcNodeBaseUrl: "https://testnet.hashio.io/api",
    configId: expectedParameters.configId,
    configVersion: 1,
    omittedOptionalFields: ["complianceId", "identityRegistryId"],
    ...overrides,
  };
}

function createConfiguration(overrides = {}) {
  return {
    protocol: "tool402:ats-parameters:v1",
    network: "hedera:testnet",
    chainId: 296,
    subjectPublicId: "riskscan_revenue_note_demo",
    offeringVersion: "ats_demo_v1",
    registryRevision: "ats_sdk_8_0_0_testnet_v2",
    operationKind: "ATS_CREATE",
    targetKind: "EVM_ADDRESS",
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
    sdkPackage: "@hashgraph/asset-tokenization-sdk",
    sdkVersion: "8.0.0",
    sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
    resolverHederaId: "0.0.9212226",
    resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a",
    m20EconomicsBinding: "NONE",
    operationDescriptor: createOperationDescriptor(),
    parameters: createParameters(),
    canonicalParametersHash,
    ...overrides,
  };
}

function createContext(overrides = {}) {
  return {
    issuerEvmAddress,
    preparedAttemptId: "externalPrepareCommandAttempts:ats-create-demo",
    canonicalParametersHash,
    ...overrides,
  };
}

function getModuleSpecifiers(source, filePath) {
  const sourceFile = typescript.createSourceFile(
    filePath,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TS,
  );
  assert.equal(sourceFile.parseDiagnostics.length, 0, "builder source must parse without diagnostics");

  return sourceFile.statements.flatMap((statement) => {
    if (
      (typescript.isImportDeclaration(statement) || typescript.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      typescript.isStringLiteral(statement.moduleSpecifier)
    ) {
      return [statement.moduleSpecifier.text];
    }
    return [];
  });
}

function getRuntimeBoundaryViolations(source, filePath) {
  const sourceFile = typescript.createSourceFile(
    filePath,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TS,
  );
  const violations = [];

  function propertyName(node) {
    return typescript.isIdentifier(node.name) ? node.name.text : null;
  }

  function visit(node) {
    if (typescript.isCallExpression(node)) {
      if (node.expression.kind === typescript.SyntaxKind.ImportKeyword) {
        violations.push("dynamic import");
      }
      if (typescript.isIdentifier(node.expression) && ["require", "fetch"].includes(node.expression.text)) {
        violations.push(`${node.expression.text} call`);
      }
      if (typescript.isPropertyAccessExpression(node.expression)) {
        const receiver = node.expression.expression;
        const member = propertyName(node.expression);
        if (typescript.isIdentifier(receiver) && receiver.text === "Network" && ["init", "connect"].includes(member)) {
          violations.push(`Network.${member}`);
        }
        if (typescript.isIdentifier(receiver) && receiver.text === "Bond" && member === "create") {
          violations.push("Bond.create");
        }
      }
    }
    if (typescript.isNewExpression(node) && typescript.isIdentifier(node.expression)) {
      if (["CreateBondRequest", "WebSocket", "XMLHttpRequest", "EventSource"].includes(node.expression.text)) {
        violations.push(`new ${node.expression.text}`);
      }
    }
    if (
      typescript.isIdentifier(node) &&
      ["window", "globalThis", "ethereum", "navigator"].includes(node.text)
    ) {
      violations.push(node.text);
    }
    typescript.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

test("requires the declared M44 ATS request builder source module before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M44 source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("returns exactly the accepted detached frozen CreateBondRequest input", () => {
  const configuration = createConfiguration();
  const result = api.buildAtsCreateBondRequestInput(configuration, createContext());

  assert.deepEqual(Object.keys(api).sort(), ["buildAtsCreateBondRequestInput"]);
  assert.deepEqual(Reflect.ownKeys(result), parameterKeys);
  assert.deepEqual(result, expectedParameters);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.isFrozen(result), true);

  for (const field of [
    "externalPausesIds",
    "externalControlListsIds",
    "externalKycListsIds",
    "proceedRecipientsIds",
    "proceedRecipientsData",
  ]) {
    assert.notStrictEqual(result[field], configuration.parameters[field]);
    assert.equal(Object.isFrozen(result[field]), true);
  }

  assert.throws(() => {
    result.name = "Changed";
  }, TypeError);
  assert.throws(() => {
    result.externalPausesIds.push("unexpected");
  }, TypeError);

  configuration.parameters.name = "Changed after build";
  configuration.parameters.externalPausesIds.push("changed after build");
  assert.equal(result.name, expectedParameters.name);
  assert.deepEqual(result.externalPausesIds, []);
});

implementedTest("passes through all thirty supplied parameter values without defaults, coercion, or renaming", () => {
  const parameters = createParameters(sentinelParameters);
  const configuration = createConfiguration({ parameters });
  const result = api.buildAtsCreateBondRequestInput(
    configuration,
    createContext({ issuerEvmAddress: sentinelIssuerEvmAddress }),
  );

  assert.deepEqual(Reflect.ownKeys(result), parameterKeys);
  for (const key of parameterKeys) {
    assert.deepEqual(result[key], parameters[key], `must pass through ${key} verbatim`);
  }
  for (const key of [
    "externalPausesIds",
    "externalControlListsIds",
    "externalKycListsIds",
    "proceedRecipientsIds",
    "proceedRecipientsData",
  ]) {
    assert.notStrictEqual(result[key], parameters[key], `must detach ${key}`);
  }
});

implementedTest("rejects every fixed ATS routing value when it drifts", () => {
  const drifts = [
    ["network", (configuration) => ({ ...configuration, network: "hedera:mainnet" })],
    ["chainId", (configuration) => ({ ...configuration, chainId: 295 })],
    ["operationKind", (configuration) => ({ ...configuration, operationKind: "ATS_ISSUE" })],
    ["targetKind", (configuration) => ({ ...configuration, targetKind: "HEDERA_ID" })],
    ["registryRevision", (configuration) => ({ ...configuration, registryRevision: "ats_sdk_8_0_0_testnet_v1" })],
    ["expectedTarget", (configuration) => ({ ...configuration, expectedTarget: "0x0000000000000000000000000000000000000402" })],
    ["resolverHederaId", (configuration) => ({ ...configuration, resolverHederaId: "0.0.7707874" })],
    ["resolverEvmAddress", (configuration) => ({ ...configuration, resolverEvmAddress: "0xefef4cae9642631cfc6d997d6207ee48fa78fe42" })],
    ["operationDescriptor.factoryHederaId", (configuration) => ({
      ...configuration,
      operationDescriptor: createOperationDescriptor({ factoryHederaId: "0.0.7708432" }),
    })],
    ["operationDescriptor.resolverHederaId", (configuration) => ({
      ...configuration,
      operationDescriptor: createOperationDescriptor({ resolverHederaId: "0.0.7707874" }),
    })],
  ];

  for (const [field, drift] of drifts) {
    assert.throws(
      () => api.buildAtsCreateBondRequestInput(drift(createConfiguration()), createContext()),
      undefined,
      `must reject drift in ${field}`,
    );
  }
});

implementedTest("rejects noncanonical issuer and root hash bindings before returning a request", () => {
  const wrongOwner = createConfiguration({
    parameters: createParameters({ diamondOwnerAccount: "0x0000000000000000000000000000000000000402" }),
  });
  const malformedOwner = createConfiguration({
    parameters: createParameters({ diamondOwnerAccount: issuerEvmAddress.toUpperCase() }),
  });

  for (const [configuration, context] of [
    [wrongOwner, createContext()],
    [malformedOwner, createContext()],
    [createConfiguration(), createContext({ issuerEvmAddress: issuerEvmAddress.toUpperCase() })],
    [createConfiguration(), createContext({ canonicalParametersHash: "a".repeat(64) })],
    [createConfiguration({ canonicalParametersHash: "A".repeat(64) }), createContext()],
  ]) {
    assert.throws(() => api.buildAtsCreateBondRequestInput(configuration, context));
  }
});

implementedTest("rejects malformed, missing, or surplus prepared-attempt context before returning a request", () => {
  const missingPreparedAttemptId = createContext();
  delete missingPreparedAttemptId.preparedAttemptId;
  const extraContext = createContext({ unapproved: true });

  for (const context of [
    missingPreparedAttemptId,
    extraContext,
    createContext({ preparedAttemptId: "" }),
    createContext({ preparedAttemptId: " " }),
    createContext({ preparedAttemptId: 42 }),
    null,
    "externalPrepareCommandAttempts:ats-create-demo",
  ]) {
    assert.throws(() => api.buildAtsCreateBondRequestInput(createConfiguration(), context));
  }
});

implementedTest("rejects missing, surplus, accessor, hostile, and nonplain configuration inputs", () => {
  const missingParameter = createConfiguration();
  delete missingParameter.parameters.symbol;
  const missingRoot = createConfiguration();
  delete missingRoot.network;
  const missingDescriptor = createConfiguration();
  delete missingDescriptor.operationDescriptor.factoryHederaId;

  const extraParameter = createConfiguration({
    parameters: createParameters({ unapproved: true }),
  });
  const extraRoot = createConfiguration({ unapproved: true });
  const extraDescriptor = createConfiguration({
    operationDescriptor: createOperationDescriptor({ unapproved: true }),
  });

  let accessorReads = 0;
  const accessorParameter = createParameters();
  Object.defineProperty(accessorParameter, "name", {
    enumerable: true,
    configurable: true,
    get() {
      accessorReads += 1;
      return expectedParameters.name;
    },
  });
  const accessorRoot = createConfiguration();
  Object.defineProperty(accessorRoot, "network", {
    enumerable: true,
    configurable: true,
    get() {
      accessorReads += 1;
      return "hedera:testnet";
    },
  });
  const accessorDescriptor = createOperationDescriptor();
  Object.defineProperty(accessorDescriptor, "factoryHederaId", {
    enumerable: true,
    configurable: true,
    get() {
      accessorReads += 1;
      return "0.0.9213391";
    },
  });
  const hostileParameters = new Proxy(createParameters(), {
    ownKeys() {
      throw new Error("hostile ownKeys");
    },
  });
  const hostileRoot = new Proxy(createConfiguration(), {
    ownKeys() {
      throw new Error("hostile root ownKeys");
    },
  });
  const hostileDescriptor = new Proxy(createOperationDescriptor(), {
    ownKeys() {
      throw new Error("hostile descriptor ownKeys");
    },
  });
  const nonPlainParameters = Object.assign(
    new (class ParametersFacade {})(),
    createParameters(),
  );
  const nonPlainConfiguration = Object.assign(
    new (class ConfigurationFacade {})(),
    createConfiguration(),
  );
  const nonPlainDescriptor = Object.assign(
    new (class DescriptorFacade {})(),
    createOperationDescriptor(),
  );

  for (const configuration of [
    missingParameter,
    missingRoot,
    missingDescriptor,
    extraParameter,
    extraRoot,
    extraDescriptor,
    createConfiguration({ parameters: accessorParameter }),
    accessorRoot,
    createConfiguration({ operationDescriptor: accessorDescriptor }),
    createConfiguration({ parameters: hostileParameters }),
    hostileRoot,
    createConfiguration({ operationDescriptor: hostileDescriptor }),
    createConfiguration({ parameters: nonPlainParameters }),
    nonPlainConfiguration,
    createConfiguration({ operationDescriptor: nonPlainDescriptor }),
  ]) {
    assert.throws(() => api.buildAtsCreateBondRequestInput(configuration, createContext()));
  }
  assert.equal(accessorReads, 0);
});

implementedTest("keeps the pure builder independent from S16 and direct SDK, provider, or network loading", () => {
  const source = readFileSync(sourcePath, "utf8");
  const moduleSpecifiers = getModuleSpecifiers(source, sourcePath);
  const forbiddenConfigurationDependency = /(?:ats-create-configuration|stage-b-issuer-ats-create-authority|@tool402\/backend)/u;
  const forbiddenRuntimeModule = /(?:^|\/)(?:@hashgraph|viem|wagmi|walletconnect|@metamask|metamask-provider|ethers|web3|axios|convex|node:(?:http|https)|https?)(?:\/|\.|$)/iu;

  assert.equal(
    moduleSpecifiers.some((specifier) => forbiddenConfigurationDependency.test(specifier)),
    false,
    "the S16 display projection and private real-issuer configuration must never be M44 builder dependencies",
  );
  assert.equal(
    moduleSpecifiers.some((specifier) => forbiddenRuntimeModule.test(specifier)),
    false,
    "the pure builder must not load an SDK, wallet/provider, or network module",
  );
  assert.deepEqual(
    getRuntimeBoundaryViolations(source, sourcePath),
    [],
    "the pure builder must not load or reach an SDK, provider, or network boundary",
  );
});
