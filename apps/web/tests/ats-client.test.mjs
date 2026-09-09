import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const sourceUrl = new URL("../src/lib/ats/ats-client.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const actionSourceUrl = new URL("../src/components/provider/deploy/ats-create-action.tsx", import.meta.url);
const actionSourcePath = fileURLToPath(actionSourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const issuerEvmAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const canonicalParametersHash =
  "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const expectedTarget = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const metaMaskSelector = "Metamask";
const expectedCandidate = Object.freeze({
  kind: "candidate",
  transactionId: "0.0.9213391@1789430400.000000001",
  evmAddress: "0x1111111111111111111111111111111111111111",
});

function createParameters(overrides = {}) {
  return {
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
    proceedRecipientsIds: [],
    proceedRecipientsData: [],
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
    expectedTarget,
    sdkPackage: "@hashgraph/asset-tokenization-sdk",
    sdkVersion: "8.0.0",
    sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
    resolverHederaId: "0.0.9212226",
    resolverEvmAddress: "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a",
    m20EconomicsBinding: "NONE",
    operationDescriptor: {
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
      configId: "0x0000000000000000000000000000000000000000000000000000000000000002",
      configVersion: 1,
      omittedOptionalFields: ["complianceId", "identityRegistryId"],
    },
    parameters: createParameters(),
    canonicalParametersHash,
    ...overrides,
  };
}

function createWallet(overrides = {}) {
  return {
    status: "connected",
    chainIdHex: "0x128",
    signerAddress: issuerEvmAddress,
    ...overrides,
  };
}

function createPreparedAttempt(overrides = {}) {
  return {
    attemptId: "externalPrepareCommandAttempts:ats-create-demo",
    state: "PREPARED",
    operationKind: "ATS_CREATE",
    expectedTarget,
    canonicalParametersHash,
    ...overrides,
  };
}

function createSeams(overrides = {}) {
  const calls = [];
  const networkOverrides = overrides.network ?? {};
  const bondOverrides = overrides.bond ?? {};
  const record = (method, args) => calls.push({ method, args });
  const network = {
    async init(...args) {
      record("network.init", args);
      return networkOverrides.init?.(...args);
    },
    async connect(...args) {
      record("network.connect", args);
      return networkOverrides.connect?.(...args);
    },
  };
  const bond = {
    async create(...args) {
      record("bond.create", args);
      return bondOverrides.create?.(...args) ?? {
        transactionId: "0.0.9213391@1789430400.000000001",
        security: { evmAddress: "0x1111111111111111111111111111111111111111" },
      };
    },
  };
  const createRequest = (...args) => {
    record("createRequest", args);
    return overrides.createRequest?.(...args) ?? Object.freeze({ input: args[0] });
  };
  return { calls, network, bond, createRequest };
}

function createClient(seams = createSeams()) {
  return {
    seams,
    client: api.createAtsIssuerClient({
      network: seams.network,
      bond: seams.bond,
      createRequest: seams.createRequest,
    }),
  };
}

function requestInput(overrides = {}) {
  return {
    configuration: createConfiguration(),
    wallet: createWallet(),
    preparedAttempt: createPreparedAttempt(),
    ...overrides,
  };
}

function assertNoSeamCall(seams) {
  assert.deepEqual(seams.calls, []);
}

function createDeferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function waitFor(assertion, message) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (assertion()) return;
    await Promise.resolve();
  }
  assert.fail(message);
}

function getModuleSpecifiers(source, filePath) {
  const sourceFile = typescript.createSourceFile(
    filePath,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    filePath.endsWith(".tsx") ? typescript.ScriptKind.TSX : typescript.ScriptKind.TS,
  );
  assert.deepEqual(sourceFile.parseDiagnostics, [], `${filePath} must parse without diagnostics`);

  const specifiers = [];
  function visit(node) {
    if (
      (typescript.isImportDeclaration(node) || typescript.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      typescript.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      typescript.isCallExpression(node) &&
      node.expression.kind === typescript.SyntaxKind.ImportKeyword
    ) {
      specifiers.push("<dynamic-import>");
    }
    if (typescript.isCallExpression(node) && typescript.isIdentifier(node.expression) && node.expression.text === "require") {
      specifiers.push("<require>");
    }
    typescript.forEachChild(node, visit);
  }
  visit(sourceFile);
  return specifiers;
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
      ["window", "globalThis", "ethereum", "navigator", "SupportedWallets"].includes(node.text)
    ) {
      violations.push(node.text);
    }
    typescript.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function getActionBoundaryViolations(source, filePath) {
  const sourceFile = typescript.createSourceFile(
    filePath,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TSX,
  );
  const violations = [];

  function visit(node) {
    if (typescript.isCallExpression(node)) {
      if (node.expression.kind === typescript.SyntaxKind.ImportKeyword) {
        violations.push("dynamic import");
      }
      if (typescript.isIdentifier(node.expression) && ["require", "fetch"].includes(node.expression.text)) {
        violations.push(`${node.expression.text} call`);
      }
    }
    if (typescript.isNewExpression(node) && typescript.isIdentifier(node.expression)) {
      if (["WebSocket", "XMLHttpRequest", "EventSource"].includes(node.expression.text)) {
        violations.push(`new ${node.expression.text}`);
      }
    }
    if (
      typescript.isIdentifier(node) &&
      ["window", "globalThis", "ethereum", "navigator", "localStorage", "sessionStorage"].includes(node.text)
    ) {
      violations.push(node.text);
    }
    typescript.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

test("requires the declared M44 ATS client source module before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M44 source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("rejects malformed injected seams synchronously before any client action", () => {
  for (const seams of [
    { network: null, bond: { create() {} }, createRequest() {} },
    { network: { init() {} }, bond: { create() {} }, createRequest() {} },
    { network: { init() {}, connect() {} }, bond: {}, createRequest() {} },
    { network: { init() {}, connect() {} }, bond: { create() {} }, createRequest: null },
  ]) {
    assert.throws(() => api.createAtsIssuerClient(seams), TypeError);
  }
});

implementedTest("returns configuration_invalid before touching a wallet or injected seam", async () => {
  const { client, seams } = createClient();
  const result = await client.createRevenueNote(requestInput({
    configuration: createConfiguration({ network: "hedera:mainnet" }),
  }));

  assert.deepEqual(result, { kind: "configuration_invalid" });
  assertNoSeamCall(seams);
});

implementedTest("returns wallet_not_ready before every injected seam when connection state or chain is invalid", async () => {
  for (const wallet of [
    createWallet({ status: "disconnected" }),
    createWallet({ chainIdHex: "0x1" }),
  ]) {
    const { client, seams } = createClient();
    assert.deepEqual(
      await client.createRevenueNote(requestInput({ wallet })),
      { kind: "wallet_not_ready" },
    );
    assertNoSeamCall(seams);
  }
});

implementedTest("returns signer_not_issuer before every injected seam for a non-owner wallet", async () => {
  const { client, seams } = createClient();
  const result = await client.createRevenueNote(requestInput({
    wallet: createWallet({ signerAddress: "0x0000000000000000000000000000000000000402" }),
  }));

  assert.deepEqual(result, { kind: "signer_not_issuer" });
  assertNoSeamCall(seams);
});

implementedTest("returns attempt_not_prepared before every injected seam for each rejected durable attempt field", async () => {
  for (const preparedAttempt of [
    createPreparedAttempt({ state: "PENDING" }),
    createPreparedAttempt({ operationKind: "ATS_ISSUE" }),
    createPreparedAttempt({ expectedTarget: "0x0000000000000000000000000000000000000402" }),
    createPreparedAttempt({ canonicalParametersHash: "a".repeat(64) }),
  ]) {
    const { client, seams } = createClient();
    assert.deepEqual(
      await client.createRevenueNote(requestInput({ preparedAttempt })),
      { kind: "attempt_not_prepared" },
    );
    assertNoSeamCall(seams);
  }
});

implementedTest("maps initialization and connection failures without constructing or submitting a request", async () => {
  const initialization = createSeams({
    network: {
      async init() {
        throw new Error("initialization failed");
      },
    },
  });
  const initializationClient = createClient(initialization).client;
  assert.deepEqual(
    await initializationClient.createRevenueNote(requestInput()),
    { kind: "initialization_failed" },
  );
  assert.deepEqual(initialization.calls.map((call) => call.method), ["network.init"]);

  const connection = createSeams({
    network: {
      async connect() {
        throw new Error("connection failed");
      },
    },
  });
  const connectionClient = createClient(connection).client;
  assert.deepEqual(
    await connectionClient.createRevenueNote(requestInput()),
    { kind: "connect_failed" },
  );
  assert.deepEqual(connection.calls.map((call) => call.method), ["network.init", "network.connect"]);
});

implementedTest("creates one request and one candidate only after all local gates pass", async () => {
  const configuration = createConfiguration();
  const builtRequest = Object.freeze({ kind: "constructed-create-bond-request" });
  const seams = createSeams({
    createRequest(input) {
      assert.deepEqual(input, createParameters());
      assert.notStrictEqual(input, configuration.parameters, "must receive the detached builder product");
      assert.equal(Object.isFrozen(input), true, "must receive the frozen builder product");
      for (const field of [
        "externalPausesIds",
        "externalControlListsIds",
        "externalKycListsIds",
        "proceedRecipientsIds",
        "proceedRecipientsData",
      ]) {
        assert.notStrictEqual(input[field], configuration.parameters[field], `must detach ${field}`);
        assert.equal(Object.isFrozen(input[field]), true, `must freeze ${field}`);
      }
      return builtRequest;
    },
  });
  const { client } = createClient(seams);
  const result = await client.createRevenueNote(requestInput({ configuration }));

  assert.deepEqual(result, expectedCandidate);
  assert.deepEqual(seams.calls, [
    { method: "network.init", args: [configuration] },
    { method: "network.connect", args: [metaMaskSelector] },
    { method: "createRequest", args: [createParameters()] },
    { method: "bond.create", args: [builtRequest] },
  ]);
  assert.strictEqual(seams.calls[0].args[0], configuration);
  assert.strictEqual(seams.calls[3].args[0], builtRequest);
});

implementedTest("never retries a rejected submission for the same prepared attempt", async () => {
  const seams = createSeams({
    bond: {
      async create() {
        throw new Error("wallet rejected");
      },
    },
  });
  const { client } = createClient(seams);
  const firstInput = requestInput();
  const repeatInput = requestInput();

  assert.deepEqual(await client.createRevenueNote(firstInput), { kind: "rejected" });
  assert.deepEqual(await client.createRevenueNote(repeatInput), { kind: "rejected" });
  assert.deepEqual(seams.calls.map((call) => call.method), [
    "network.init",
    "network.connect",
    "createRequest",
    "bond.create",
  ]);
});

implementedTest("returns a completed candidate without resubmitting the same prepared attempt", async () => {
  const { client, seams } = createClient();
  const firstInput = requestInput();
  const repeatInput = requestInput();

  const first = await client.createRevenueNote(firstInput);
  const repeat = await client.createRevenueNote(repeatInput);

  assert.deepEqual(first, expectedCandidate);
  assert.deepEqual(repeat, expectedCandidate);
  assert.deepEqual(seams.calls.map((call) => call.method), [
    "network.init",
    "network.connect",
    "createRequest",
    "bond.create",
  ]);
});

implementedTest("shares one in-flight submission across concurrent callers of the same prepared attempt", async () => {
  const deferred = createDeferred();
  const seams = createSeams({
    bond: {
      create() {
        return deferred.promise;
      },
    },
  });
  const { client } = createClient(seams);
  const firstInput = requestInput();
  const repeatInput = requestInput();

  const first = client.createRevenueNote(firstInput);
  await waitFor(
    () => seams.calls.filter((call) => call.method === "bond.create").length === 1,
    "the first caller must reach the one permitted bond submission",
  );
  const repeat = client.createRevenueNote(repeatInput);
  await Promise.resolve();

  assert.equal(
    seams.calls.filter((call) => call.method === "bond.create").length,
    1,
    "concurrent callers must share the one in-flight submission",
  );
  deferred.resolve({
    transactionId: "0.0.9213391@1789430400.000000001",
    security: { evmAddress: "0x1111111111111111111111111111111111111111" },
  });
  const [firstResult, repeatResult] = await Promise.all([first, repeat]);

  assert.deepEqual(firstResult, expectedCandidate);
  assert.deepEqual(repeatResult, expectedCandidate);
  assert.deepEqual(seams.calls.map((call) => call.method), [
    "network.init",
    "network.connect",
    "createRequest",
    "bond.create",
  ]);
});

implementedTest("maps malformed SDK results to submission_unknown rather than a candidate", async () => {
  for (const response of [
    {},
    { transactionId: "0.1.1@1.1", security: { evmAddress: "0x1111111111111111111111111111111111111111" } },
    { transactionId: "0.0.1@1.1", security: { evmAddress: "0x1111111111111111111111111111111111111111".toUpperCase() } },
    { transactionId: "not-a-hedera-transaction", security: { evmAddress: "0x1111111111111111111111111111111111111111" } },
  ]) {
    const { client, seams } = createClient(createSeams({
      bond: { async create() { return response; } },
    }));
    const first = await client.createRevenueNote(requestInput());
    const repeat = await client.createRevenueNote(requestInput());

    assert.deepEqual(first, { kind: "submission_unknown" });
    assert.deepEqual(repeat, first);
    assert.deepEqual(seams.calls.map((call) => call.method), [
      "network.init",
      "network.connect",
      "createRequest",
      "bond.create",
    ]);
  }
});

implementedTest("keeps M44 test-loaded modules off the S16 display literal and direct SDK, provider, or network boundaries", () => {
  assert.equal(
    existsSync(actionSourcePath),
    true,
    `missing declared M44 client-island source module: ${actionSourcePath}`,
  );
  const clientSource = readFileSync(sourcePath, "utf8");
  const actionSource = readFileSync(actionSourcePath, "utf8");
  const clientModuleSpecifiers = getModuleSpecifiers(clientSource, sourcePath);
  const actionModuleSpecifiers = getModuleSpecifiers(actionSource, actionSourcePath);
  const forbiddenConfigurationDependency = /(?:ats-create-configuration|stage-b-issuer-ats-create-authority|@tool402\/backend)/u;
  const directRuntimeModule = /(?:^|\/)(?:@hashgraph|viem|wagmi|walletconnect|@metamask|metamask-provider|ethers|web3|axios|convex|node:(?:http|https)|https?)(?:\/|\.|$)/iu;
  const actionForbiddenRuntimeModule = /(?:^|\/)(?:viem|wagmi|walletconnect|metamask-provider|ethers|web3|@metamask|axios|convex|node:(?:http|https)|https?)(?:\/|\.|$)/iu;

  assert.equal(
    clientModuleSpecifiers.some((specifier) => forbiddenConfigurationDependency.test(specifier)),
    false,
    "the injected M44 client must never import an S16 display or private real-issuer configuration",
  );
  assert.equal(
    actionModuleSpecifiers.some((specifier) => forbiddenConfigurationDependency.test(specifier)),
    false,
    "the M44 action must never import an S16 display or private real-issuer configuration",
  );
  assert.equal(
    clientModuleSpecifiers.some((specifier) => directRuntimeModule.test(specifier)),
    false,
    "the injected M44 client must not load SDK, provider, or network modules directly",
  );
  assert.equal(
    clientModuleSpecifiers.includes("<dynamic-import>") || clientModuleSpecifiers.includes("<require>"),
    false,
    "the injected M44 client must not load a runtime boundary indirectly",
  );
  assert.equal(
    clientModuleSpecifiers.some((specifier) => /(?:^|\/)create-bond-request(?:\.ts)?$/u.test(specifier)),
    true,
    "the injected M44 client must obtain its request input from the declared pure builder",
  );
  assert.deepEqual(
    actionModuleSpecifiers.filter((specifier) => specifier === "@hashgraph/asset-tokenization-sdk"),
    ["@hashgraph/asset-tokenization-sdk"],
    "only the declared client island imports the official ATS SDK",
  );
  assert.equal(
    actionModuleSpecifiers.some(
      (specifier) => specifier.startsWith("@hashgraph/") && specifier !== "@hashgraph/asset-tokenization-sdk",
    ),
    false,
    "the M44 action must not load an additional Hashgraph SDK or provider package",
  );
  assert.equal(
    actionModuleSpecifiers.some((specifier) => actionForbiddenRuntimeModule.test(specifier)),
    false,
    "the M44 action must not import a second provider or network runtime",
  );
  assert.equal(
    actionModuleSpecifiers.includes("<dynamic-import>") || actionModuleSpecifiers.includes("<require>"),
    false,
    "the M44 action must not load a provider or network boundary indirectly",
  );
  assert.deepEqual(
    getRuntimeBoundaryViolations(clientSource, sourcePath),
    [],
    "the injected M44 client must use only supplied seams",
  );
  assert.deepEqual(
    getActionBoundaryViolations(actionSource, actionSourcePath),
    [],
    "the M44 action must leave ambient provider and network access to the sanctioned SDK seam",
  );
});
