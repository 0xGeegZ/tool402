import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { encodeAbiParameters, encodeEventTopics } from "viem";

const require = createRequire(import.meta.url);
const sourceUrl = new URL("../src/lib/ats/factory-deploy-bond.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const factoryArtifact = require(
  "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json",
);
let api;

const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const factory = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const resolver = "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const defaultAdminRole = `0x${"0".repeat(64)}`;

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
    expectedTarget: factory,
    sdkPackage: "@hashgraph/asset-tokenization-sdk",
    sdkVersion: "8.0.0",
    sdkIntegrity: "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
    resolverHederaId: "0.0.9212226",
    resolverEvmAddress: resolver,
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
    parameters: {
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
      diamondOwnerAccount: issuer,
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
    },
    canonicalParametersHash: "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9",
    ...overrides,
  };
}

function expectedRequest(configuration = createConfiguration()) {
  const parameters = configuration.parameters;
  return {
    to: factory,
    bondData: {
      security: {
        resolver,
        maxSupply: parameters.numberOfUnits,
        resolverProxyConfiguration: { key: parameters.configId, version: parameters.configVersion },
        erc20MetadataInfo: {
          name: parameters.name,
          symbol: parameters.symbol,
          isin: parameters.isin,
          decimals: parameters.decimals,
        },
        rbacs: [{ role: defaultAdminRole, members: [issuer] }],
        externalPauses: parameters.externalPausesIds,
        externalControlLists: parameters.externalControlListsIds,
        externalKycLists: parameters.externalKycListsIds,
        compliance: zeroAddress,
        identityRegistry: zeroAddress,
        arePartitionsProtected: parameters.arePartitionsProtected,
        isMultiPartition: parameters.isMultiPartition,
        isControllable: parameters.isControllable,
        isWhiteList: parameters.isWhiteList,
        clearingActive: parameters.clearingActive,
        internalKycActivated: parameters.internalKycActivated,
        erc20VotesActivated: parameters.erc20VotesActivated,
      },
      bondDetails: {
        currency: parameters.currency,
        nominalValue: parameters.nominalValue,
        nominalValueDecimals: parameters.nominalValueDecimals,
        startingDate: parameters.startingDate,
        maturityDate: parameters.maturityDate,
      },
      proceedRecipients: parameters.proceedRecipientsIds,
      proceedRecipientsData: parameters.proceedRecipientsData,
    },
    factoryRegulationData: {
      regulationType: parameters.regulationType,
      regulationSubType: parameters.regulationSubType,
      additionalSecurityData: {
        countriesControlListType: parameters.isCountryControlListWhiteList,
        listOfCountries: parameters.countries,
        info: parameters.info,
      },
    },
  };
}

const configurationRequiredPaths = Object.freeze([
  ...Object.keys(createConfiguration()),
  ...Object.keys(createConfiguration().operationDescriptor).map((key) => `operationDescriptor.${key}`),
  ...Object.keys(createConfiguration().parameters).map((key) => `parameters.${key}`),
]);

function deleteRequiredPath(configuration, path) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  let target = configuration;
  for (const key of keys) target = target[key];
  delete target[lastKey];
}

function artifactParameter(parameter) {
  return {
    name: parameter.name,
    type: parameter.type,
    ...(parameter.components ? { components: parameter.components.map(artifactParameter) } : {}),
  };
}

test("requires the declared direct Factory source before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M44 direct Factory source: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) api = await import(sourceUrl.href);
});

implementedTest("maps every official deployBond tuple field from the accepted Stage-B/M42 values", () => {
  const configuration = createConfiguration();
  const request = api.buildFactoryDeployBondRequest(configuration, { issuerEvmAddress: issuer });

  assert.deepEqual(Object.keys(api).sort(), [
    "buildFactoryDeployBondRequest",
    "decodeBondDeployed",
    "encodeFactoryDeployBond",
    "normalizeHederaCandidateTransactionId",
  ]);
  assert.deepEqual(request, expectedRequest(configuration));
  assert.notStrictEqual(request.bondData.security.externalPauses, configuration.parameters.externalPausesIds);
  assert.notStrictEqual(request.bondData.proceedRecipients, configuration.parameters.proceedRecipientsIds);
  assert.equal(Object.isFrozen(request), true);
  assert.equal(Object.isFrozen(request.bondData), true);
  assert.equal(Object.isFrozen(request.bondData.security), true);
  assert.equal(Object.isFrozen(request.factoryRegulationData), true);
});

implementedTest("encodes the exact official deployBond selector without a handwritten ABI", () => {
  const request = api.buildFactoryDeployBondRequest(createConfiguration(), { issuerEvmAddress: issuer });
  const calldata = api.encodeFactoryDeployBond(request);
  const deployBond = factoryArtifact.abi.find((entry) => entry.type === "function" && entry.name === "deployBond");

  assert.ok(deployBond, "the official artifact must expose deployBond");
  assert.equal(calldata.slice(0, 10), "0x29002951");
  assert.equal(calldata.length, 3914, "the complete accepted tuple has 1,956 calldata bytes");
});

implementedTest("rejects every fixed routing, issuer, and zero-address compatibility drift", () => {
  const cases = [
    createConfiguration({ network: "hedera:mainnet" }),
    createConfiguration({ chainId: 295 }),
    createConfiguration({ operationKind: "ATS_ISSUE" }),
    createConfiguration({ expectedTarget: zeroAddress }),
    createConfiguration({ expectedTarget: "0x1111111111111111111111111111111111111111" }),
    createConfiguration({ resolverEvmAddress: zeroAddress }),
    createConfiguration({ resolverEvmAddress: "0x1111111111111111111111111111111111111111" }),
    createConfiguration({ operationDescriptor: { ...createConfiguration().operationDescriptor, factoryHederaId: "0.0.1" } }),
    createConfiguration({ parameters: { ...createConfiguration().parameters, diamondOwnerAccount: zeroAddress } }),
    createConfiguration({ parameters: { ...createConfiguration().parameters, diamondOwnerAccount: "0x1111111111111111111111111111111111111111" } }),
    createConfiguration({ parameters: { ...createConfiguration().parameters, configVersion: 2 } }),
  ];

  for (const configuration of cases) {
    assert.throws(() => api.buildFactoryDeployBondRequest(configuration, { issuerEvmAddress: issuer }));
  }
  assert.throws(() => api.buildFactoryDeployBondRequest(createConfiguration(), { issuerEvmAddress: zeroAddress }));
  assert.throws(() => api.buildFactoryDeployBondRequest(createConfiguration(), { issuerEvmAddress: "0x1111111111111111111111111111111111111111" }));
});

implementedTest("rejects every missing or surplus accepted configuration field before encoding", () => {
  for (const path of configurationRequiredPaths) {
    const configuration = structuredClone(createConfiguration());
    deleteRequiredPath(configuration, path);
    assert.throws(
      () => api.buildFactoryDeployBondRequest(configuration, { issuerEvmAddress: issuer }),
      undefined,
      `must reject a missing ${path}`,
    );
  }

  for (const mutate of [
    (configuration) => { configuration.unapproved = true; },
    (configuration) => { configuration.operationDescriptor.unapproved = true; },
    (configuration) => { configuration.parameters.unapproved = true; },
  ]) {
    const configuration = structuredClone(createConfiguration());
    mutate(configuration);
    assert.throws(() => api.buildFactoryDeployBondRequest(configuration, { issuerEvmAddress: issuer }));
  }
});

implementedTest("decodes the official BondDeployed event from artifact-derived topics and data", () => {
  const request = api.buildFactoryDeployBondRequest(createConfiguration(), { issuerEvmAddress: issuer });
  const event = factoryArtifact.abi.find((entry) => entry.type === "event" && entry.name === "BondDeployed");
  assert.ok(event, "the official artifact must expose BondDeployed");
  const deployedBond = "0x1111111111111111111111111111111111111111";
  const nonIndexed = event.inputs.filter((input) => !input.indexed).map(artifactParameter);
  const data = encodeAbiParameters(nonIndexed, [deployedBond, request.bondData, request.factoryRegulationData]);
  const topics = encodeEventTopics({ abi: factoryArtifact.abi, eventName: "BondDeployed", args: { deployer: issuer } });

  assert.deepEqual(api.decodeBondDeployed({ data, topics }), { evmAddress: deployedBond });
  assert.throws(() => api.decodeBondDeployed({ data: "0x", topics: [] }));
});

implementedTest("normalizes only valid candidate ids to the HI-007 mirror wire form", () => {
  assert.equal(
    api.normalizeHederaCandidateTransactionId("0.0.9213391@1789430400.1"),
    "0.0.9213391-1789430400-000000001",
  );
  assert.equal(
    api.normalizeHederaCandidateTransactionId("0.0.9213391-1789430400-000000001"),
    "0.0.9213391-1789430400-000000001",
  );
  for (const value of ["0.0.1@1.0000000000", "0.0.1@1.-1", "0.1.1@1.1", "unknown"]) {
    assert.throws(() => api.normalizeHederaCandidateTransactionId(value));
  }
});

implementedTest("uses only the direct official artifact and viem in the local seam", () => {
  const source = readFileSync(sourcePath, "utf8");
  assert.match(
    source,
    /@hashgraph\/asset-tokenization-contracts\/artifacts\/contracts\/factory\/Factory\.sol\/Factory\.json/,
  );
  assert.match(source, /from "viem"/);
  assert.match(source, /with\s*\{\s*type:\s*"json"\s*\}/);
  assert.match(source, /encodeFunctionData\(\{\s*abi:\s*factoryArtifact\.abi/s);
  assert.match(source, /decodeEventLog\(\{\s*abi:\s*factoryArtifact\.abi/s);
  assert.doesNotMatch(source, /(?:const|let|var)\s+\w*abi\w*\s*=/i);
  assert.doesNotMatch(
    source,
    /@hashgraph\/asset-tokenization-sdk|dotenv|winston|bbs|hardhat|wallet|provider|fetch\s*\(|deployBond\s*\(/i,
  );
});
