import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import { encodeAbiParameters, encodeEventTopics, isAddress } from "viem";
import typescript from "typescript";

const require = createRequire(import.meta.url);
const factoryArtifact = require(
  "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json",
);
const sourceUrl = new URL("../src/lib/ats/stage-b-browser-provider-bridge.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const checksummedIssuer = "0xC89f87052c3e080B4A9b021d4930055031EF378E";
const factory = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const otherEmitter = "0x1111111111111111111111111111111111111111";
const bondAddress = "0x52908400098527886E0F7030069857D2E4169EE7";
const canonicalBondAddress = bondAddress.toLowerCase();
const transactionHash = `0x${"1".repeat(64)}`;
const timestamp = "1789430400.000000001";
const rawTransactionId = "0.0.9213391@1789430400.1";
const canonicalTransactionId = "0.0.9213391-1789430400-000000001";

function artifactParameter(parameter) {
  return {
    name: parameter.name,
    type: parameter.type,
    ...(parameter.components ? { components: parameter.components.map(artifactParameter) } : {}),
  };
}

function fakeProvider({
  chainId = "0x128",
  accounts = [checksummedIssuer],
  receipt = null,
  send = () => transactionHash,
} = {}) {
  const calls = [];
  return {
    calls,
    async request({ method, params = [] }) {
      calls.push({ method, params });
      if (method === "eth_chainId") return chainId;
      if (method === "eth_accounts") return accounts;
      if (method === "eth_sendTransaction") return send();
      if (method === "eth_getTransactionReceipt") return receipt;
      assert.fail(`unexpected provider request: ${method}`);
    },
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function responseQueue(entries) {
  const calls = [];
  return {
    calls,
    fetch: async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      const next = entries.shift();
      assert.ok(next, "unexpected Mirror request");
      return typeof next === "function" ? next() : next;
    },
  };
}

function controlledTimers() {
  const timers = [];
  return {
    timers,
    api: {
      set(callback, milliseconds) {
        const timer = { callback, milliseconds, cleared: false };
        timers.push(timer);
        return timer;
      },
      clear(timer) {
        timer.cleared = true;
      },
    },
    fire(timer) {
      assert.equal(timer.cleared, false, "the active deadline must not be cleared before its operation settles");
      timer.callback();
    },
  };
}

async function settlesBefore(promise, milliseconds = 100) {
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("operation did not settle")), milliseconds);
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    clearTimeout(timeout);
  }
}

async function waitsFor(condition, message) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (condition()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail(message);
}

async function withJsonParse(parse, operation) {
  const original = JSON.parse;
  JSON.parse = parse;
  try {
    return await operation();
  } finally {
    JSON.parse = original;
  }
}

function createBridge(api, provider, fetch, wait = async () => {}) {
  return api.createStageBBrowserProviderBridge({ provider, fetch, wait });
}

function createBondDeployedLog(factoryApi, projectionApi, emitter = factory, address = bondAddress) {
  const projection = projectionApi.createStageBAtsCreateExecutionProjection();
  const request = factoryApi.buildFactoryDeployBondRequest(
    projection.configuration,
    { issuerEvmAddress: projection.issuerEvmAddress },
  );
  const event = factoryArtifact.abi.find((entry) => entry.type === "event" && entry.name === "BondDeployed");
  assert.ok(event, "the official Factory artifact must expose BondDeployed");
  const nonIndexed = event.inputs.filter((input) => !input.indexed).map(artifactParameter);
  return {
    address: emitter,
    data: encodeAbiParameters(nonIndexed, [address, request.bondData, request.factoryRegulationData]),
    topics: encodeEventTopics({ abi: factoryArtifact.abi, eventName: "BondDeployed", args: { deployer: issuer } }),
  };
}

function mirrorContractResult(log, overrides = {}) {
  return {
    hash: transactionHash,
    chain_id: "0x128",
    result: "SUCCESS",
    status: "0x1",
    from: checksummedIssuer,
    to: factory,
    timestamp,
    logs: [log],
    ...overrides,
  };
}

function accessorBackedRecord(record, field, reads) {
  const value = record[field];
  const copy = { ...record };
  Object.defineProperty(copy, field, {
    configurable: true,
    enumerable: true,
    get() {
      reads.push(field);
      return value;
    },
  });
  return copy;
}

function nonEnumerableDataRecord(record, field) {
  const value = record[field];
  const copy = { ...record };
  Object.defineProperty(copy, field, {
    configurable: true,
    enumerable: false,
    value,
  });
  return copy;
}

function assertMirrorRequestShape(calls) {
  assert.equal(calls.length, 4, "one unindexed first read then one complete three-read cycle");
  for (const { url, init } of calls) {
    assert.equal(url.origin, "https://testnet.mirrornode.hedera.com");
    assert.equal(init.method, "GET");
    assert.equal(init.credentials, "omit");
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal);
  }

  assert.equal(calls[0].url.pathname, `/api/v1/contracts/results/${transactionHash}`);
  assert.equal(calls[0].url.searchParams.get("nonce"), "0");
  assert.equal(calls[1].url.pathname, `/api/v1/contracts/results/${transactionHash}`);
  assert.equal(calls[1].url.searchParams.get("nonce"), "0");
  assert.equal(calls[2].url.pathname, "/api/v1/transactions");
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), {
    "account.id": "0.0.10430887",
    timestamp: `eq:${timestamp}`,
    transactiontype: "ETHEREUMTRANSACTION",
    limit: "100",
    order: "asc",
  });
  assert.equal(calls[3].url.pathname, `/api/v1/contracts/results/${rawTransactionId}`);
  assert.equal(calls[3].url.searchParams.get("nonce"), "0");
  assert.equal(calls.some(({ url }) => url.href.includes("untrusted.example")), false, "pagination links stay inert");
}

async function loadBridgeWithM44Spy(decodeBondDeployed, { parse = JSON.parse } = {}) {
  const source = readFileSync(sourcePath, "utf8");
  const { outputText } = typescript.transpileModule(source, {
    fileName: sourcePath,
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
    },
  });
  const module = { exports: {} };
  const projection = Object.freeze({
    configuration: Object.freeze({ canonicalParametersHash: "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9" }),
    issuerEvmAddress: issuer,
    issuerHederaAccountId: "0.0.10430887",
    mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1/",
  });
  const factoryApi = {
    buildFactoryDeployBondRequest() { return Object.freeze({ to: factory }); },
    encodeFactoryDeployBond() { return "0x1234"; },
    decodeBondDeployed,
    normalizeHederaCandidateTransactionId(value) { return value; },
  };
  const actualViem = await import("viem");
  const imports = {
    "./stage-b-ats-create-canonical-identity": {
      STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH: "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9",
    },
    "./stage-b-ats-create-canonical-identity.ts": {
      STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH: "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9",
    },
    "./stage-b-ats-create-execution-projection": {
      createStageBAtsCreateExecutionProjection() { return projection; },
    },
    "./stage-b-ats-create-execution-projection.ts": {
      createStageBAtsCreateExecutionProjection() { return projection; },
    },
    "./factory-deploy-bond": factoryApi,
    "./factory-deploy-bond.ts": factoryApi,
    viem: actualViem,
  };
  runInNewContext(outputText, {
    exports: module.exports,
    require(specifier) {
      assert.ok(Object.hasOwn(imports, specifier), `unexpected bridge import: ${specifier}`);
      return imports[specifier];
    },
    module,
    AbortSignal,
    URL,
    Promise,
    Object,
    Array,
    Error,
    TypeError,
    RegExp,
    Number,
    String,
    JSON: { parse, stringify: JSON.stringify },
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    setTimeout,
    clearTimeout,
  }, { filename: sourcePath });
  return module.exports;
}

test("requires the declared M49 browser/provider bridge source before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared M49 source module: ${sourcePath}`);
});

test("uses a valid strict EIP-55 signer fixture for the browser boundary", () => {
  assert.equal(isAddress(checksummedIssuer, { strict: true }), true);
});

let api;
let factoryApi;
let projectionApi;

test.before(async () => {
  if (!sourceExists) return;
  [api, factoryApi, projectionApi] = await Promise.all([
    import(sourceUrl.href),
    import("../src/lib/ats/factory-deploy-bond.ts"),
    import("../src/lib/ats/stage-b-ats-create-execution-projection.ts"),
  ]);
});

implementedTest("rejects a wrong wallet chain before any send, receipt, or Mirror request", async () => {
  const provider = fakeProvider({ chainId: "0x127" });
  const mirror = responseQueue([]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.equal(outcome.kind, "rejected");
  assert.deepEqual(provider.calls.map(({ method }) => method), ["eth_chainId"]);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("rejects a valid but unauthorized wallet account before a send", async () => {
  const provider = fakeProvider({ accounts: ["0x1111111111111111111111111111111111111111"] });
  const mirror = responseQueue([]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.equal(outcome.kind, "rejected");
  assert.deepEqual(provider.calls.map(({ method }) => method), ["eth_chainId", "eth_accounts"]);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("accepts the fixed issuer once among other valid MetaMask accounts", async () => {
  const provider = fakeProvider({
    accounts: [
      checksummedIssuer,
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
    ],
  });
  const mirror = responseQueue([]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.equal(outcome.kind, "submission_unknown");
  assert.deepEqual(provider.calls.map(({ method }) => method).slice(0, 3), ["eth_chainId", "eth_accounts", "eth_sendTransaction"]);
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
  assert.equal(provider.calls.find(({ method }) => method === "eth_sendTransaction")?.params[0].from, issuer);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("retains the MetaMask hash when bounded verification is unknown", async () => {
  const provider = fakeProvider({ receipt: null });
  const mirror = responseQueue([]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.deepEqual(outcome, { kind: "submission_unknown", transactionHash });
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("rejects duplicate issuer entries before a send", async () => {
  const provider = fakeProvider({ accounts: [checksummedIssuer, issuer] });
  const mirror = responseQueue([]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.equal(outcome.kind, "rejected");
  assert.deepEqual(provider.calls.map(({ method }) => method), ["eth_chainId", "eth_accounts"]);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("rejects a malformed account entry before a send", async () => {
  const provider = fakeProvider({ accounts: [checksummedIssuer, "not-an-address"] });
  const mirror = responseQueue([]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.equal(outcome.kind, "rejected");
  assert.deepEqual(provider.calls.map(({ method }) => method), ["eth_chainId", "eth_accounts"]);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("normalizes a valid EIP-55 account and releases only a pre-hash rejection for a later explicit click", async () => {
  let sends = 0;
  const provider = fakeProvider({
    send() {
      sends += 1;
      if (sends === 1) throw Object.assign(new Error("wallet rejected"), { code: 4001 });
      return transactionHash;
    },
  });
  const mirror = responseQueue([]);
  const bridge = createBridge(api, provider, mirror.fetch);

  const rejected = await bridge.execute();
  const afterExplicitRetry = await bridge.execute();
  const sendCalls = provider.calls.filter(({ method }) => method === "eth_sendTransaction");

  assert.equal(rejected.kind, "rejected");
  assert.equal(afterExplicitRetry.kind, "submission_unknown");
  assert.equal(sendCalls.length, 2, "only an explicit post-rejection click can request another send");
  assert.deepEqual(sendCalls[1].params, [{
    from: issuer,
    to: factory,
    data: sendCalls[1].params[0].data,
    value: "0x0",
  }]);
  assert.match(sendCalls[1].params[0].data, /^0x[0-9a-f]+$/u);
  assert.equal(
    provider.calls.filter(({ method }) => method === "eth_getTransactionReceipt").length,
    5,
    "a missing receipt gets the fixed five observations and no more",
  );
  assert.equal(mirror.calls.length, 0);
});

implementedTest("latches a non-user-rejection send failure as outcome-unknown without a second send", async () => {
  let sends = 0;
  const provider = fakeProvider({
    send() {
      sends += 1;
      throw Object.assign(new Error("provider transport failed"), { code: -32000 });
    },
  });
  const mirror = responseQueue([]);
  const bridge = createBridge(api, provider, mirror.fetch);

  const first = await bridge.execute();
  const later = await bridge.execute();

  assert.equal(first.kind, "submission_unknown");
  assert.equal(later.kind, "submission_unknown");
  assert.equal(sends, 1);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("keeps all five receipt observations inside the fixed five-second window", async () => {
  const provider = fakeProvider({ receipt: null });
  const mirror = responseQueue([]);
  const waits = [];
  const bridge = createBridge(api, provider, mirror.fetch, async (milliseconds) => {
    waits.push(milliseconds);
  });

  const outcome = await bridge.execute();

  assert.equal(outcome.kind, "submission_unknown");
  assert.equal(provider.calls.filter(({ method }) => method === "eth_getTransactionReceipt").length, 5);
  assert.equal(waits.length, 4, "only the four gaps between five receipt observations may wait");
  assert.ok(waits.every((milliseconds) => Number.isInteger(milliseconds) && milliseconds > 0));
  assert.ok(waits.reduce((total, milliseconds) => total + milliseconds, 0) <= 5000);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("bounds a hung receipt to the injected receipt deadline and ignores its late resolution", async () => {
  let resolveReceipt;
  const provider = fakeProvider({
    receipt: new Promise((resolve) => { resolveReceipt = resolve; }),
  });
  const mirror = responseQueue([]);
  const deadlines = controlledTimers();
  const bridge = api.createStageBBrowserProviderBridge({
    provider,
    fetch: mirror.fetch,
    wait: async () => {},
    timers: deadlines.api,
  });

  const pending = bridge.execute();
  await waitsFor(
    () => provider.calls.filter(({ method }) => method === "eth_getTransactionReceipt").length === 1,
    "the first bounded receipt observation was not issued",
  );
  const receiptDeadline = deadlines.timers.find(({ milliseconds, cleared }) => !cleared && milliseconds > 0 && milliseconds <= 5000);
  assert.ok(receiptDeadline, "the receipt observation must retain one five-second deadline");
  deadlines.fire(receiptDeadline);

  const outcome = await settlesBefore(pending);
  resolveReceipt({ transactionHash, status: "0x1", to: factory, logs: [createBondDeployedLog(factoryApi, projectionApi)] });
  await Promise.resolve();

  assert.equal(outcome.kind, "submission_unknown");
  assert.equal(mirror.calls.length, 0, "a late receipt cannot begin Mirror correlation");
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
});

implementedTest("takes its invocation lock before the first await so same-tick clicks cannot race a second send", async () => {
  let resolveReceipt;
  const provider = fakeProvider({
    receipt: new Promise((resolve) => { resolveReceipt = resolve; }),
  });
  const mirror = responseQueue([]);
  const bridge = createBridge(api, provider, mirror.fetch);

  const first = bridge.execute();
  const sameTick = bridge.execute();
  for (let tick = 0; tick < 4 && provider.calls.filter(({ method }) => method === "eth_sendTransaction").length === 0; tick += 1) {
    await Promise.resolve();
  }
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);

  resolveReceipt(null);
  const [firstOutcome, sameTickOutcome] = await Promise.all([first, sameTick]);
  assert.equal(firstOutcome.kind, "submission_unknown");
  assert.notEqual(sameTickOutcome.kind, "candidate");
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
});

implementedTest("correlates a bounded, fake-only Mirror candidate and never follows its pagination link", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const waitCalls = [];
  const mirror = responseQueue([
    new Response("", { status: 404 }),
    jsonResponse(mirrorContractResult(log)),
    jsonResponse({
      transactions: [{
        name: "ETHEREUMTRANSACTION",
        result: "SUCCESS",
        nonce: 0,
        consensus_timestamp: timestamp,
        transaction_id: rawTransactionId,
      }],
      links: { next: "https://untrusted.example/next" },
    }),
    jsonResponse(mirrorContractResult(log)),
  ]);

  const originalGlobalFetch = globalThis.fetch;
  let globalFetchCalls = 0;
  globalThis.fetch = async () => {
    globalFetchCalls += 1;
    throw new Error("M49 must use only its injected fetch");
  };
  let outcome;
  try {
    outcome = await createBridge(api, provider, mirror.fetch, async (...arguments_) => {
      waitCalls.push(arguments_);
    }).execute();
  } finally {
    globalThis.fetch = originalGlobalFetch;
  }

  assert.deepEqual(outcome, {
    kind: "candidate",
    candidate: { transactionId: canonicalTransactionId, evmAddress: canonicalBondAddress },
  });
  assertMirrorRequestShape(mirror.calls);
  assert.equal(globalFetchCalls, 0, "the injected fake is the only Mirror transport");
  assert.equal(waitCalls.length, 1, "only the unindexed ContractResult permits a bounded wait");
  assert.deepEqual(waitCalls, [[2000]], "Mirror polling uses its own bounded cycle delay");
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
  assert.equal(Object.hasOwn(outcome, "attach"), false);
});

implementedTest("selects one Factory BondDeployed event among unrelated receipt and Mirror logs", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const unrelatedLog = { address: otherEmitter, data: "0x", topics: [] };
  const logs = [unrelatedLog, log, unrelatedLog];
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs },
  });
  const mirror = responseQueue([
    new Response("", { status: 404 }),
    jsonResponse(mirrorContractResult(log, { logs })),
    jsonResponse({
      transactions: [{
        name: "ETHEREUMTRANSACTION",
        result: "SUCCESS",
        nonce: 0,
        consensus_timestamp: timestamp,
        transaction_id: rawTransactionId,
      }],
    }),
    jsonResponse(mirrorContractResult(log, { logs })),
  ]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.deepEqual(outcome, {
    kind: "candidate",
    candidate: { transactionId: canonicalTransactionId, evmAddress: canonicalBondAddress },
  });
  assertMirrorRequestShape(mirror.calls);
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
});

implementedTest("recovers a corroborated candidate from an explicit public hash without using the provider", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const provider = fakeProvider();
  const mirror = responseQueue([
    new Response("", { status: 404 }),
    jsonResponse(mirrorContractResult(log)),
    jsonResponse({
      transactions: [{
        name: "ETHEREUMTRANSACTION",
        result: "SUCCESS",
        nonce: 0,
        consensus_timestamp: timestamp,
        transaction_id: rawTransactionId,
      }],
    }),
    jsonResponse(mirrorContractResult(log)),
  ]);

  const outcome = await createBridge(api, provider, mirror.fetch).recover(transactionHash);

  assert.deepEqual(outcome, {
    kind: "candidate",
    candidate: { transactionId: canonicalTransactionId, evmAddress: canonicalBondAddress },
  });
  assert.deepEqual(provider.calls, [], "public recovery must not read or send through MetaMask");
  assertMirrorRequestShape(mirror.calls);
});

implementedTest("rejects non-canonical public hashes before any provider or Mirror read", async () => {
  const provider = fakeProvider();
  const mirror = responseQueue([]);

  for (const invalidHash of [
    ` ${transactionHash}`,
    `${transactionHash} `,
    transactionHash.toUpperCase(),
    transactionHash.slice(0, -1),
  ]) {
    const outcome = await createBridge(api, provider, mirror.fetch).recover(invalidHash);
    assert.deepEqual(outcome, { kind: "submission_unknown" });
  }

  assert.deepEqual(provider.calls, []);
  assert.deepEqual(mirror.calls, []);
});

implementedTest("recovers a confirmed Hedera long-zero issuer result", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const mirrorIssuer = "0x00000000000000000000000000000000009f29a7";
  const firstResult = mirrorContractResult(log, { from: mirrorIssuer });
  const provider = fakeProvider();
  const mirror = responseQueue([
    jsonResponse(firstResult),
    jsonResponse({
      transactions: [{
        name: "ETHEREUMTRANSACTION",
        result: "SUCCESS",
        nonce: 0,
        consensus_timestamp: timestamp,
        transaction_id: rawTransactionId,
      }],
    }),
    jsonResponse(firstResult),
  ]);

  const outcome = await createBridge(api, provider, mirror.fetch).recover(transactionHash);

  assert.deepEqual(outcome, {
    kind: "candidate",
    candidate: { transactionId: canonicalTransactionId, evmAddress: canonicalBondAddress },
  });
  assert.deepEqual(provider.calls, []);
});

implementedTest("returns no candidate for an absent public transaction without using MetaMask", async () => {
  const provider = fakeProvider();
  const mirror = responseQueue([
    new Response("", { status: 404 }),
    new Response("", { status: 404 }),
    new Response("", { status: 404 }),
  ]);
  const waits = [];

  const outcome = await createBridge(api, provider, mirror.fetch, async (milliseconds) => { waits.push(milliseconds); }).recover(transactionHash);

  assert.deepEqual(outcome, { kind: "submission_unknown", transactionHash });
  assert.deepEqual(provider.calls, []);
  assert.equal(mirror.calls.length, 3, "an absent public transaction uses every bounded Mirror observation");
  assert.deepEqual(waits, [2000, 2000], "only the first two absent observations wait before the final result");
});

implementedTest("bounds all Mirror cycles to one five-second deadline through the injected timing seam", async () => {
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [createBondDeployedLog(factoryApi, projectionApi)] },
  });
  let now = 0;
  const mirror = responseQueue([() => {
    now = 4800;
    return new Response("", { status: 404 });
  }]);
  const waits = [];
  const bridge = api.createStageBBrowserProviderBridge({
    provider,
    fetch: mirror.fetch,
    now: () => now,
    wait: async (milliseconds) => {
      waits.push(milliseconds);
      now += milliseconds;
    },
  });

  const outcome = await bridge.execute();

  assert.equal(outcome.kind, "submission_unknown");
  assert.deepEqual(waits, [200], "the final wait is clipped to the shared five-second deadline");
  assert.equal(now, 5000);
  assert.equal(mirror.calls.length, 1, "no post-deadline Mirror request is issued");
});

implementedTest("keeps the one remaining Mirror deadline armed through a headers-first stalled body", async () => {
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [createBondDeployedLog(factoryApi, projectionApi)] },
  });
  const deadlines = controlledTimers();
  let bodyReadStarted = false;
  let bodyCancelled = false;
  const mirror = responseQueue([{
    status: 200,
    headers: { get: () => "application/json" },
    body: new ReadableStream({
      pull() {
        bodyReadStarted = true;
        return new Promise(() => {});
      },
      cancel() {
        bodyCancelled = true;
      },
    }),
  }]);
  const bridge = api.createStageBBrowserProviderBridge({
    provider,
    fetch: mirror.fetch,
    wait: async () => {},
    timers: deadlines.api,
  });

  const pending = bridge.execute();
  await waitsFor(() => bodyReadStarted, "the JSON body must be consumed under the Mirror deadline");
  const mirrorDeadline = deadlines.timers.find(({ milliseconds, cleared }) => !cleared && milliseconds > 0 && milliseconds <= 5000);
  assert.ok(mirrorDeadline, "the one active Mirror deadline must remain available after response headers");
  deadlines.fire(mirrorDeadline);

  const outcome = await settlesBefore(pending);
  await waitsFor(() => bodyCancelled, "an aborted stalled body must be cancelled");

  assert.equal(outcome.kind, "submission_unknown");
  assert.equal(mirror.calls.length, 1, "a timed-out body cannot advance the read cycle");
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
});

implementedTest("rejects or ignores caller-supplied routing and transaction overrides while retaining the fixed send", async () => {
  const provider = fakeProvider();
  const mirror = responseQueue([]);
  const overrides = {
    configuration: { expectedTarget: otherEmitter },
    issuerEvmAddress: otherEmitter,
    factory: otherEmitter,
    mirrorNodeBaseUrl: "https://untrusted.example/api/v1/",
    calldata: "0xdeadbeef",
    candidate: { transactionId: "0.0.1-1-000000001", evmAddress: otherEmitter },
    receipt: { status: "0x1" },
  };
  let bridge;
  try {
    bridge = api.createStageBBrowserProviderBridge({
      provider,
      fetch: mirror.fetch,
      wait: async () => {},
      ...overrides,
    });
  } catch (error) {
    assert.ok(error instanceof TypeError, "a closed bridge may reject surplus caller controls");
    return;
  }

  const outcome = await bridge.execute();
  const send = provider.calls.find(({ method }) => method === "eth_sendTransaction");

  assert.equal(outcome.kind, "submission_unknown");
  assert.deepEqual(send?.params, [{
    from: issuer,
    to: factory,
    data: send?.params[0].data,
    value: "0x0",
  }]);
  assert.equal(mirror.calls.length, 0);
});

implementedTest("rejects a non-Factory BondDeployed emitter before any Mirror read and latches the post-hash session", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi, otherEmitter);
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const mirror = responseQueue([]);
  const bridge = createBridge(api, provider, mirror.fetch);

  const first = await bridge.execute();
  const later = await bridge.execute();

  assert.equal(first.kind, "submission_unknown");
  assert.equal(later.kind, "submission_unknown");
  assert.equal(mirror.calls.length, 0, "emitter validation happens before M44 decoding and Mirror reads");
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
});

implementedTest("validates a Factory event emitter before it can hand a valid-looking log to M44 decoding", async () => {
  let decoded = false;
  const spyApi = await loadBridgeWithM44Spy(() => {
    decoded = true;
    throw new Error("M44 must never receive a non-Factory event");
  });
  const log = createBondDeployedLog(factoryApi, projectionApi, otherEmitter);
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const mirror = responseQueue([]);

  const outcome = await createBridge(spyApi, provider, mirror.fetch).execute();

  assert.equal(outcome.kind, "submission_unknown");
  assert.equal(decoded, false, "the emitter check precedes M44 decodeBondDeployed");
  assert.equal(mirror.calls.length, 0);
});

implementedTest("rejects an accessor-backed Mirror ContractResult field before Factory decoding or a second read", async () => {
  const reads = [];
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const hostile = accessorBackedRecord(mirrorContractResult(log), "hash", reads);
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const mirror = responseQueue([jsonResponse({ ignored: true })]);

  const outcome = await withJsonParse(() => hostile, () => createBridge(api, provider, mirror.fetch).execute());

  assert.equal(outcome.kind, "submission_unknown");
  assert.deepEqual(reads, [], "an accessor-backed Mirror field must not be invoked");
  assert.equal(mirror.calls.length, 1, "descriptor rejection precedes the next Mirror read");
});

implementedTest("rejects an inherited Mirror ContractResult field before Factory decoding", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const hostile = mirrorContractResult(log);
  delete hostile.chain_id;
  const inherited = Object.getOwnPropertyDescriptor(Object.prototype, "chain_id");
  Object.defineProperty(Object.prototype, "chain_id", {
    configurable: true,
    enumerable: true,
    value: "0x128",
  });
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const mirror = responseQueue([jsonResponse({ ignored: true })]);

  try {
    const outcome = await withJsonParse(() => hostile, () => createBridge(api, provider, mirror.fetch).execute());
    assert.equal(outcome.kind, "submission_unknown");
    assert.equal(mirror.calls.length, 1);
  } finally {
    if (inherited === undefined) {
      delete Object.prototype.chain_id;
    } else {
      Object.defineProperty(Object.prototype, "chain_id", inherited);
    }
  }
});

implementedTest("rejects an accessor-backed Mirror log field before it can reach M44", async () => {
  const reads = [];
  const hostileLog = accessorBackedRecord(createBondDeployedLog(factoryApi, projectionApi), "address", reads);
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [createBondDeployedLog(factoryApi, projectionApi)] },
  });
  const mirror = responseQueue([jsonResponse({ ignored: true })]);

  const outcome = await withJsonParse(
    () => mirrorContractResult(hostileLog),
    () => createBridge(api, provider, mirror.fetch).execute(),
  );

  assert.equal(outcome.kind, "submission_unknown");
  assert.deepEqual(reads, [], "an accessor-backed log field must not be invoked");
  assert.equal(mirror.calls.length, 1);
});

implementedTest("rejects a non-enumerable Mirror transactions envelope before a final ContractResult read", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const hostileEnvelope = nonEnumerableDataRecord({ transactions: [{
    name: "ETHEREUMTRANSACTION",
    result: "SUCCESS",
    nonce: 0,
    consensus_timestamp: timestamp,
    transaction_id: rawTransactionId,
  }] }, "transactions");
  const documents = [mirrorContractResult(log), hostileEnvelope];
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const mirror = responseQueue([jsonResponse({ ignored: true }), jsonResponse({ ignored: true })]);

  const outcome = await withJsonParse(() => documents.shift(), () => createBridge(api, provider, mirror.fetch).execute());

  assert.equal(outcome.kind, "submission_unknown");
  assert.equal(mirror.calls.length, 2, "a non-enumerable transactions field cannot advance to the final read");
});

implementedTest("rejects an accessor-backed Mirror transaction entry before it can create a final URL", async () => {
  const reads = [];
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const hostileTransaction = accessorBackedRecord({
    name: "ETHEREUMTRANSACTION",
    result: "SUCCESS",
    nonce: 0,
    consensus_timestamp: timestamp,
    transaction_id: rawTransactionId,
  }, "transaction_id", reads);
  const documents = [mirrorContractResult(log), { transactions: [hostileTransaction] }];
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const mirror = responseQueue([jsonResponse({ ignored: true }), jsonResponse({ ignored: true })]);

  const outcome = await withJsonParse(() => documents.shift(), () => createBridge(api, provider, mirror.fetch).execute());

  assert.equal(outcome.kind, "submission_unknown");
  assert.deepEqual(reads, [], "an accessor-backed transaction id must not be invoked");
  assert.equal(mirror.calls.length, 2, "an unsafe transaction id cannot create a final URL");
});

implementedTest("treats ambiguous Mirror transaction records as terminal with no candidate or resend", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
  });
  const mirror = responseQueue([
    jsonResponse(mirrorContractResult(log)),
    jsonResponse({
      transactions: [
        { name: "ETHEREUMTRANSACTION", result: "SUCCESS", nonce: 0, consensus_timestamp: timestamp, transaction_id: rawTransactionId },
        { name: "ETHEREUMTRANSACTION", result: "SUCCESS", nonce: 0, consensus_timestamp: timestamp, transaction_id: rawTransactionId },
      ],
    }),
  ]);
  const bridge = createBridge(api, provider, mirror.fetch);

  const first = await bridge.execute();
  const later = await bridge.execute();

  assert.equal(first.kind, "submission_unknown");
  assert.equal(later.kind, "submission_unknown");
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
  assert.equal(mirror.calls.length, 2);
});

implementedTest("fails closed on every malformed first Mirror result without candidate attachment or a resend", async () => {
  const log = createBondDeployedLog(factoryApi, projectionApi);
  const oversizedBody = "x".repeat(1024 * 1024 + 1);
  const vectors = [
    ["wrong hash", () => jsonResponse(mirrorContractResult(log, { hash: `0x${"2".repeat(64)}` }))],
    ["wrong chain", () => jsonResponse(mirrorContractResult(log, { chain_id: "0x127" }))],
    ["failed result", () => jsonResponse(mirrorContractResult(log, { result: "FAIL" }))],
    ["failed status", () => jsonResponse(mirrorContractResult(log, { status: "0x0" }))],
    ["wrong from", () => jsonResponse(mirrorContractResult(log, { from: otherEmitter }))],
    ["wrong to", () => jsonResponse(mirrorContractResult(log, { to: otherEmitter }))],
    ["noncanonical timestamp", () => jsonResponse(mirrorContractResult(log, { timestamp: "1789430400.1" }))],
    ["ambiguous event", () => jsonResponse(mirrorContractResult(log, { logs: [log, log] }))],
    ["wrong content type", () => new Response(JSON.stringify(mirrorContractResult(log)), {
      status: 200,
      headers: { "content-type": "text/plain" },
    })],
    ["unexpected status", () => new Response("", { status: 500 })],
    ["oversized body", () => new Response(oversizedBody, {
      status: 200,
      headers: { "content-type": "application/json" },
    })],
  ];

  for (const [name, makeResponse] of vectors) {
    const provider = fakeProvider({
      receipt: { transactionHash, status: "0x1", to: factory, logs: [log] },
    });
    const mirror = responseQueue([makeResponse]);
    const bridge = createBridge(api, provider, mirror.fetch);

    const first = await bridge.execute();
    const later = await bridge.execute();

    assert.equal(first.kind, "submission_unknown", name);
    assert.equal(later.kind, "submission_unknown", name);
    assert.equal(Object.hasOwn(first, "candidate"), false, name);
    assert.equal(Object.hasOwn(first, "attach"), false, name);
    assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1, name);

    const recoveryProvider = fakeProvider();
    const recoveryMirror = responseQueue([makeResponse()]);
    const recovered = await createBridge(api, recoveryProvider, recoveryMirror.fetch).recover(transactionHash);

    assert.equal(recovered.kind, "submission_unknown", `${name}: public recovery`);
    assert.equal(Object.hasOwn(recovered, "candidate"), false, `${name}: public recovery`);
    assert.deepEqual(recoveryProvider.calls, [], `${name}: recovery must not use MetaMask`);
  }
});

implementedTest("rejects an invalid returned Mirror transaction id and a final event/address mismatch without a candidate", async () => {
  const receiptLog = createBondDeployedLog(factoryApi, projectionApi);
  const differentFinalLog = createBondDeployedLog(
    factoryApi,
    projectionApi,
    factory,
    "0x1111111111111111111111111111111111111111",
  );
  const vectors = [
    ["invalid returned id", () => [
      jsonResponse(mirrorContractResult(receiptLog)),
      jsonResponse({ transactions: [{
        name: "ETHEREUMTRANSACTION", result: "SUCCESS", nonce: 0,
        consensus_timestamp: timestamp, transaction_id: "not-a-hedera-id",
      }] }),
    ]],
    ["final decoded address mismatch", () => [
      jsonResponse(mirrorContractResult(receiptLog)),
      jsonResponse({ transactions: [{
        name: "ETHEREUMTRANSACTION", result: "SUCCESS", nonce: 0,
        consensus_timestamp: timestamp, transaction_id: rawTransactionId,
      }] }),
      jsonResponse(mirrorContractResult(differentFinalLog)),
    ]],
  ];

  for (const [name, makeResponses] of vectors) {
    const provider = fakeProvider({
      receipt: { transactionHash, status: "0x1", to: factory, logs: [receiptLog] },
    });
    const mirror = responseQueue(makeResponses());
    const bridge = createBridge(api, provider, mirror.fetch);

    const outcome = await bridge.execute();

    assert.equal(outcome.kind, "submission_unknown", name);
    assert.equal(Object.hasOwn(outcome, "candidate"), false, name);
    assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1, name);

    const recoveryProvider = fakeProvider();
    const recoveryMirror = responseQueue(makeResponses());
    const recovered = await createBridge(api, recoveryProvider, recoveryMirror.fetch).recover(transactionHash);

    assert.equal(recovered.kind, "submission_unknown", `${name}: public recovery`);
    assert.equal(Object.hasOwn(recovered, "candidate"), false, `${name}: public recovery`);
    assert.deepEqual(recoveryProvider.calls, [], `${name}: recovery must not use MetaMask`);
  }
});

implementedTest("validates a returned Mirror transaction id before it can contribute to a final URL path", async () => {
  const receiptLog = createBondDeployedLog(factoryApi, projectionApi);
  const provider = fakeProvider({
    receipt: { transactionHash, status: "0x1", to: factory, logs: [receiptLog] },
  });
  const mirror = responseQueue([
    jsonResponse(mirrorContractResult(receiptLog)),
    jsonResponse({ transactions: [{
      name: "ETHEREUMTRANSACTION",
      result: "SUCCESS",
      nonce: 0,
      consensus_timestamp: timestamp,
      transaction_id: "../../accounts",
    }] }),
  ]);

  const outcome = await createBridge(api, provider, mirror.fetch).execute();

  assert.equal(outcome.kind, "submission_unknown");
  assert.equal(mirror.calls.length, 2, "an invalid id must be rejected before any final ContractResult URL is constructed");
  assert.equal(mirror.calls.some(({ url }) => url.pathname.includes("accounts")), false);
  assert.equal(provider.calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
});

implementedTest("contains the closed receipt, Factory-emitter, and bounded Mirror boundary without browser/global capability", () => {
  const source = readFileSync(sourcePath, "utf8");

  for (const requiredBoundary of [
    "eth_getTransactionReceipt",
    "decodeBondDeployed",
    "normalizeHederaCandidateTransactionId",
  ]) assert.equal(source.includes(requiredBoundary), true, `missing boundary: ${requiredBoundary}`);

  assert.doesNotMatch(source, /(?:window|globalThis\.fetch|localStorage|sessionStorage|indexedDB|process\.env|import\.meta\.env|setInterval|WalletConnect|createWalletClient|createPublicClient)/u);
});
