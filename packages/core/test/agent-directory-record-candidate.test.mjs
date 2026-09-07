import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL("../src/agent-directory-record-candidate.ts", import.meta.url);
const barrelUrl = new URL("../src/index.ts", import.meta.url);
let parseAgentDirectoryRecordCandidate;

test.before(async () => {
  ({ parseAgentDirectoryRecordCandidate } = await import(sourceUrl.href));
});

const candidate = (overrides = {}) => ({
  schemaVersion: 1,
  serviceId: "service_42",
  serviceSlug: "riskscan",
  offeringPublicId: "offering_42",
  offeringVersion: 1,
  capabilities: ["evm-contract-risk-signals"],
  x402Endpoint: "https://api.example.test/riskscan",
  paymentProtocol: "x402",
  paymentNetwork: "hedera-testnet",
  asset: "HBAR",
  advertisedTiers: ["quick", "standard"],
  issuerRevenueAccount: "0.0.123",
  clearingAccount: "0.0.456",
  status: "active",
  publishedAt: "2026-09-07T00:00:00.000Z",
  ...overrides,
});

function assertInputError(input) {
  assert.throws(
    () => parseAgentDirectoryRecordCandidate(input),
    (error) => error instanceof RangeError || error instanceof TypeError,
  );
}

function withPrototype(prototype, values) {
  return Object.assign(Object.create(prototype), values);
}

function urlOfLength(length) {
  const prefix = "https://example.test/";
  return `${prefix}${"a".repeat(length - prefix.length)}`;
}

test("parses the exact candidate into a frozen detached snapshot", () => {
  const input = candidate();
  const parsed = parseAgentDirectoryRecordCandidate(input);

  assert.deepEqual(parsed, {
    ...input,
    capabilities: ["evm-contract-risk-signals"],
    advertisedTiers: ["quick", "standard"],
  });
  assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.capabilities), true);
  assert.equal(Object.isFrozen(parsed.advertisedTiers), true);
  assert.deepEqual(Object.keys(parsed).sort(), Object.keys(input).sort());
  assert.deepEqual(Reflect.ownKeys(parsed).sort(), Object.keys(input).sort());
  assert.notEqual(parsed, input);
  assert.notEqual(parsed.capabilities, input.capabilities);
  assert.notEqual(parsed.advertisedTiers, input.advertisedTiers);
});

test("parses descriptor-backed proxies without ordinary property reads", () => {
  const root = candidate();
  const counts = { root: 0, capabilities: 0, tiers: 0 };
  for (const [field, count] of [["capabilities", "capabilities"], ["advertisedTiers", "tiers"]]) {
    root[field] = new Proxy(root[field], {
      get(target, property, receiver) { counts[count] += 1; return Reflect.get(target, property, receiver); },
      ownKeys: Reflect.ownKeys,
      getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor,
      getPrototypeOf: Reflect.getPrototypeOf,
    });
  }
  const proxied = new Proxy(root, {
    get(target, property, receiver) { counts.root += 1; return Reflect.get(target, property, receiver); },
    ownKeys: Reflect.ownKeys,
    getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor,
    getPrototypeOf: Reflect.getPrototypeOf,
  });
  const parsed = parseAgentDirectoryRecordCandidate(proxied);
  assert.equal(parsed.x402Endpoint, "https://api.example.test/riskscan");
  assert.deepEqual(parsed.capabilities, ["evm-contract-risk-signals"]);
  assert.deepEqual(parsed.advertisedTiers, ["quick", "standard"]);
  assert.deepEqual(counts, { root: 0, capabilities: 0, tiers: 0 });
});

test("canonicalizes URLs, including the root path, and accepts optional webUrl", () => {
  const input = candidate({
    x402Endpoint: "https://api.example.test/riskscan?b=2&a=1",
    webUrl: "https://example.test",
  });
  const parsed = parseAgentDirectoryRecordCandidate(input);
  assert.equal(parsed.x402Endpoint, "https://api.example.test/riskscan?b=2&a=1");
  assert.equal(parsed.webUrl, "https://example.test/");
  assert.deepEqual(Reflect.ownKeys(parsed).sort(), Object.keys(input).sort());
});

test("canonicalizes an endpoint with no explicit path independently", () => {
  assert.equal(
    parseAgentDirectoryRecordCandidate(candidate({ x402Endpoint: "https://example.test" })).x402Endpoint,
    "https://example.test/",
  );
});

test("accepts each legal advertised tier tuple", () => {
  for (const advertisedTiers of [["quick"], ["standard"], ["quick", "standard"]]) {
    assert.deepEqual(
      parseAgentDirectoryRecordCandidate(candidate({ advertisedTiers })).advertisedTiers,
      advertisedTiers,
    );
  }
});

test("accepts the exact 96-code-unit account boundary", () => {
  const account = `0.0.${"1".repeat(92)}`;
  const parsed = parseAgentDirectoryRecordCandidate(candidate({
    issuerRevenueAccount: account,
    clearingAccount: account,
  }));
  assert.equal(parsed.issuerRevenueAccount, account);
  assert.equal(parsed.clearingAccount, account);
});

test("accepts exact ID and version upper bounds", () => {
  const id = "a".repeat(96);
  const parsed = parseAgentDirectoryRecordCandidate(candidate({
    serviceId: id,
    offeringPublicId: id,
    offeringVersion: Number.MAX_SAFE_INTEGER,
  }));
  assert.equal(parsed.serviceId, id);
  assert.equal(parsed.offeringPublicId, id);
  assert.equal(parsed.offeringVersion, Number.MAX_SAFE_INTEGER);
});

test("accepts exact 2,048-code-unit HTTPS URLs", () => {
  const parsed = parseAgentDirectoryRecordCandidate(candidate({
    x402Endpoint: urlOfLength(2048),
    webUrl: urlOfLength(2048),
  }));
  assert.equal(parsed.x402Endpoint.length, 2048);
  assert.equal(parsed.webUrl.length, 2048);
});

test("isolates caller mutation and repeated parses", () => {
  const input = candidate();
  const first = parseAgentDirectoryRecordCandidate(input);
  const second = parseAgentDirectoryRecordCandidate(input);
  input.serviceId = "changed";
  input.capabilities[0] = "changed";
  input.advertisedTiers.pop();
  assert.equal(first.serviceId, "service_42");
  assert.deepEqual(first.capabilities, ["evm-contract-risk-signals"]);
  assert.deepEqual(first.advertisedTiers, ["quick", "standard"]);
  assert.notEqual(first.capabilities, second.capabilities);
  assert.notEqual(first.advertisedTiers, second.advertisedTiers);
});

test("rejects non-ordinary, closed, or accessor-backed records without invoking getters", () => {
  const getterCalls = [];
  const accessor = candidate();
  Object.defineProperty(accessor, "serviceId", {
    enumerable: true,
    get() {
      getterCalls.push("serviceId");
      return "service_42";
    },
  });
  const inherited = Object.create(candidate());
  const customPrototype = withPrototype({ marker: true }, candidate());
  const symbolRecord = candidate();
  symbolRecord[Symbol("extra")] = true;
  const nonenumerable = candidate();
  Object.defineProperty(nonenumerable, "extra", { value: true });
  const unknown = candidate({ extra: true });
  const missing = candidate();
  delete missing.asset;
  for (const value of [null, undefined, 42, "record", [], inherited, customPrototype, symbolRecord, nonenumerable, unknown, missing, accessor]) {
    assertInputError(value);
  }
  assert.deepEqual(getterCalls, []);
});

test("rejects every required root accessor without invoking any getter", () => {
  const fields = Object.keys(candidate());
  for (const field of fields) {
    const input = candidate();
    let getterCalls = 0;
    const value = input[field];
    Object.defineProperty(input, field, {
      enumerable: true,
      get() { getterCalls += 1; return value; },
    });
    assertInputError(input);
    assert.equal(getterCalls, 0, `${field} getter must not be invoked`);
  }
  const optional = candidate({ webUrl: "https://example.test" });
  let webUrlCalls = 0;
  Object.defineProperty(optional, "webUrl", { enumerable: true, get() { webUrlCalls += 1; return "https://example.test"; } });
  assertInputError(optional);
  assert.equal(webUrlCalls, 0);
});

test("rejects each expected nonenumerable root descriptor", () => {
  for (const field of Object.keys(candidate())) {
    const input = candidate();
    Object.defineProperty(input, field, { enumerable: false, value: input[field], writable: true, configurable: true });
    assertInputError(input);
  }
  const optional = candidate({ webUrl: "https://example.test" });
  Object.defineProperty(optional, "webUrl", { enumerable: false, value: optional.webUrl, writable: true, configurable: true });
  assertInputError(optional);
});

test("rejects reflection failures and hostile or malformed nested arrays", () => {
  const ownKeysFailure = new Proxy(candidate(), {
    ownKeys() { throw new Error("ownKeys reflection failed"); },
  });
  const descriptorFailure = new Proxy(candidate(), {
    getOwnPropertyDescriptor() { throw new Error("descriptor reflection failed"); },
  });
  const prototypeFailure = new Proxy(candidate(), {
    getPrototypeOf() { throw new Error("prototype reflection failed"); },
  });
  for (const value of [ownKeysFailure, descriptorFailure, prototypeFailure]) assertInputError(value);

  const customCapabilities = ["evm-contract-risk-signals"];
  Object.setPrototypeOf(customCapabilities, { custom: true });
  const customTiers = ["quick"];
  Object.setPrototypeOf(customTiers, { custom: true });
  const capabilitiesHole = [];
  capabilitiesHole.length = 1;
  const tiersExtra = ["quick"];
  tiersExtra.extra = true;
  const arrayCases = [
    ["capabilities", []],
    ["capabilities", capabilitiesHole],
    ["capabilities", ["evm-contract-risk-signals", "extra"]],
    ["capabilities", Object.assign(["evm-contract-risk-signals"], { extra: true })],
    ["capabilities", customCapabilities],
    ["capabilities", ["wrong"]],
    ["advertisedTiers", []],
    ["advertisedTiers", tiersExtra],
    ["advertisedTiers", ["quick", "quick"]],
    ["advertisedTiers", ["standard", "quick"]],
    ["advertisedTiers", ["unknown"]],
    ["advertisedTiers", [, "quick"]],
    ["advertisedTiers", customTiers],
  ];
  for (const [field, value] of arrayCases) assertInputError(candidate({ [field]: value }));
  for (const [field, indexes] of [["capabilities", [0]], ["advertisedTiers", [0, 1]]]) {
    const baseline = field === "capabilities" ? ["evm-contract-risk-signals"] : ["quick", "standard"];
    for (const index of indexes) {
      const getterArray = baseline.slice();
      let getterCalls = 0;
      const value = getterArray[index];
      Object.defineProperty(getterArray, String(index), {
        enumerable: true,
        get() { getterCalls += 1; return value; },
      });
      assertInputError(candidate({ [field]: getterArray }));
      assert.equal(getterCalls, 0, `${field}[${index}] getter must not be invoked`);
    }
  }
  for (const field of ["capabilities", "advertisedTiers"]) {
    const legal = field === "capabilities" ? ["evm-contract-risk-signals"] : ["quick", "standard"];
    for (const [extra, enumerable] of [
      ["extra-enumerable", true],
      ["extra-hidden", false],
      [Symbol("extra-enumerable"), true],
      [Symbol("extra-hidden"), false],
    ]) {
      const value = legal.slice();
      Object.defineProperty(value, extra, { enumerable, value: true });
      assertInputError(candidate({ [field]: value }));
    }
    const hiddenIndex = legal.slice();
    Object.defineProperty(hiddenIndex, "0", { enumerable: false, value: legal[0] });
    assertInputError(candidate({ [field]: hiddenIndex }));
    for (const index of legal.keys()) {
      const hidden = legal.slice();
      Object.defineProperty(hidden, String(index), { enumerable: false, value: legal[index] });
      assertInputError(candidate({ [field]: hidden }));
    }
    for (const trap of ["getPrototypeOf", "ownKeys", "getOwnPropertyDescriptor"]) {
      const proxied = new Proxy(legal.slice(), { [trap]() { throw new Error(`${field} ${trap} trap`); } });
      assertInputError(candidate({ [field]: proxied }));
    }
  }
});

test("does not coerce counted primitive-like sentinels", () => {
  const values = candidate();
  const fields = Object.keys(values);
  for (const field of fields) {
    const counts = { toString: 0, valueOf: 0, primitive: 0 };
    const sentinel = {
      toString() { counts.toString += 1; return String(values[field]); },
      valueOf() { counts.valueOf += 1; return values[field]; },
      [Symbol.toPrimitive]() { counts.primitive += 1; return values[field]; },
    };
    assertInputError(candidate({ [field]: sentinel }));
    assert.deepEqual(counts, { toString: 0, valueOf: 0, primitive: 0 }, `${field} must not be coerced`);
  }
  const webCounts = { toString: 0, valueOf: 0, primitive: 0 };
  const webSentinel = {
    toString() { webCounts.toString += 1; return "https://example.test"; },
    valueOf() { webCounts.valueOf += 1; return "https://example.test"; },
    [Symbol.toPrimitive]() { webCounts.primitive += 1; return "https://example.test"; },
  };
  assertInputError(candidate({ webUrl: webSentinel }));
  assert.deepEqual(webCounts, { toString: 0, valueOf: 0, primitive: 0 }, "webUrl must not be coerced");
  for (const [field, indexes] of [["capabilities", [0]], ["advertisedTiers", [0, 1]]]) {
    for (const index of indexes) {
      const array = values[field].slice();
      const counts = { toString: 0, valueOf: 0, primitive: 0 };
      const lexical = array[index];
      array[index] = {
        toString() { counts.toString += 1; return lexical; },
        valueOf() { counts.valueOf += 1; return lexical; },
        [Symbol.toPrimitive]() { counts.primitive += 1; return lexical; },
      };
      assertInputError(candidate({ [field]: array }));
      assert.deepEqual(counts, { toString: 0, valueOf: 0, primitive: 0 }, `${field}[${index}] must not be coerced`);
    }
  }
});

test("rejects wrong literals, IDs, versions, accounts, dates, and URLs", () => {
  for (const [field, values] of [
    ["schemaVersion", [0, 2, "1", NaN]],
    ["serviceSlug", ["risk-scan", "RISkscan"]],
    ["paymentProtocol", ["x402 ", "http"]],
    ["paymentNetwork", ["hedera-mainnet"]],
    ["asset", ["hbar"]],
    ["status", ["inactive"]],
    ["serviceId", ["", "a".repeat(97), "bad id", "é"]],
    ["offeringPublicId", ["", "a".repeat(97), "bad.id"]],
    ["offeringVersion", [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1"]],
    ["issuerRevenueAccount", ["0.0.01", "0.0.1.2", `0.0.${"1".repeat(93)}`]],
    ["clearingAccount", ["0.0.", "0.0.1.0", `0.0.${"1".repeat(93)}`]],
    ["publishedAt", ["2026-02-29T00:00:00.000Z", "2026-09-07T00:00:00Z", "2026-09-07T25:00:00.000Z", "not-a-date"]],
    ["x402Endpoint", ["", "http://example.test", "https://example.test#", "https://example.test#fragment", "https://example.test/#", "https://example.test/#fragment", "https://user:pass@example.test", " https://example.test", "https://example.test/ ", urlOfLength(2049)]],
    ["webUrl", [undefined, "", " http://example.test", "http://example.test", "https://example.test#", "https://example.test#fragment", "https://example.test/#", "https://example.test/#fragment", "https://user:pass@example.test", "https://example.test ", urlOfLength(2049)]],
  ]) {
    for (const value of values) assertInputError(candidate({ [field]: value }));
  }
  assertInputError(candidate({ webUrl: "https://example.test#fragment" }));
});

test("has the planned pure-source boundary once the parser exists", async () => {
  const source = await readFile(sourceUrl, "utf8");
  for (const prohibited of ["fetch", "process.env", "JSON.parse", "convex", "storage", "Date.now"]) {
    assert.equal(source.includes(prohibited), false, `source must not contain ${prohibited}`);
  }
  assert.doesNotMatch(source, /(?:from|import)\s*["'][^"']*(?:ats|provider|agent)[^"']*["']/iu);
  assert.doesNotMatch(source, /\bimport\s*\(/u);
  const staticImports = [...source.matchAll(/\bimport\s+(?!\s*\()(?:(?:type\s+)?[\s\S]*?\s+from\s+)?["']([^"']+)["']/gu)].map((match) => match[1]);
  assert.ok(staticImports.length >= 1);
  assert.deepEqual(staticImports, staticImports.map(() => "./value.ts"));
});

test("accepts one-character and mixed-case identifier grammar representatives", () => {
  for (const field of ["serviceId", "offeringPublicId"]) {
    assert.equal(parseAgentDirectoryRecordCandidate(candidate({ [field]: "A" }))[field], "A");
    const mixed = "Aa09_-";
    assert.equal(parseAgentDirectoryRecordCandidate(candidate({ [field]: mixed }))[field], mixed);
  }
});

test("exposes exactly the candidate parser and types through the Core barrel", async () => {
  const source = await readFile(barrelUrl, "utf8");
  const declarations = [...source.matchAll(
    /export\s+(type\s+)?\{([^}]+)\}\s+from\s+["']\.\/agent-directory-record-candidate\.ts["']/gu,
  )].map((match) => ({ typeOnly: Boolean(match[1]), names: match[2].split(",").map((name) => name.trim().replace(/^type\s+/u, "")).filter(Boolean).sort() }));
  assert.equal(declarations.length, 2);
  assert.deepEqual(declarations.filter((declaration) => !declaration.typeOnly).map((declaration) => declaration.names), [["parseAgentDirectoryRecordCandidate"]]);
  assert.deepEqual(declarations.filter((declaration) => declaration.typeOnly).map((declaration) => declaration.names), [["AdvertisedDirectoryTiers", "AgentDirectoryRecordCandidate", "DirectoryCapability", "DirectoryTier"]]);
  assert.doesNotMatch(source, /export\s+(?:\*|\{\s*\*|default)\s+[^;]*agent-directory-record-candidate\.ts/iu);
});
