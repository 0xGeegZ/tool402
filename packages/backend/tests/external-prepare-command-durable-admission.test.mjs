import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { keccak256, stringToHex } from "viem";

import { createProviderToolAtsConfiguration } from "../src/ats/provider-tool-ats-configuration.ts";

const moduleUrl = new URL("../convex/external_prepare_command_admission.ts", import.meta.url);
const atomicMutationSourceDeclared = readFileSync(moduleUrl, "utf8").includes(
  "admitAtsCreateAndMarkAssetPending",
);
const atomicTest = atomicMutationSourceDeclared ? test : test.skip;

function registeredMutationSource(name, nextName) {
  const source = readFileSync(moduleUrl, "utf8");
  const start = source.indexOf(`export const ${name}`);
  assert.notEqual(start, -1, `missing registered mutation source: ${name}`);
  const end = nextName === undefined ? source.length : source.indexOf(`export const ${nextName}`, start + 1);
  assert.notEqual(end, -1, `missing following registered mutation source: ${nextName}`);
  return source.slice(start, end);
}
const signer = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const now = Date.parse("2026-09-07T19:00:30.000Z");
const attemptId = "externalPrepareCommandAttempts:accepted";
const payloadHash = "0xfe32ed7989dfa94699ffc6529b4f5c6214721ef63d4f1a2d08f028366fe19b18";
const realM42CanonicalParametersHash = "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const realM42Signer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const contextKeys = ["version", "type", "chainId", "canonicalSignerAddress", "principalPublicId", "role", "authorityVersion", "payloadHash"];
const payloadKeys = ["operationKind", "subjectPublicId", "network", "chainId", "expectedTarget", "canonicalParametersHash", "idempotencyKey", "expiresAt"];
const operations = ["ATS_CREATE", "ATS_CONTROL_LIST", "ATS_ISSUE", "ATS_TRANSFER", "ATS_COUPON", "HEDERA_FUNDING"];
const atsOperations = operations.filter((operationKind) => operationKind.startsWith("ATS_"));
const pick = (input, keys) => Object.fromEntries(keys.map((key) => [key, input[key]]));
const hashPayload = (payload) => keccak256(stringToHex(JSON.stringify(pick(payload, [...payloadKeys].sort()))));

function input(overrides = {}) {
  return {
    version: 1, type: "external.prepare", chainId: 296, canonicalSignerAddress: signer,
    nonce: "AAAAAAAAAAAAAAAAAAAAAA", issuedAt: "2026-09-07T19:00:00.000Z", expiresAt: "2026-09-07T19:04:00.000Z",
    payloadHash, replayIdentity: `tool402:wallet-command:v1:296:${signer}:AAAAAAAAAAAAAAAAAAAAAA`,
    principalPublicId: "principal_42", role: "BACKER", authorityVersion: "authority_v1",
    payload: {
      operationKind: "HEDERA_FUNDING", subjectPublicId: "subject_42", network: "hedera:testnet", chainId: 296,
      expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", canonicalParametersHash: "a".repeat(64),
      idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA", expiresAt: "2026-09-07T19:04:00.000Z",
    },
    ...overrides,
  };
}

function withPayload(changes) {
  const args = input();
  args.payload = { ...args.payload, ...changes };
  args.payloadHash = hashPayload(args.payload);
  args.expiresAt = args.payload.expiresAt;
  return args;
}

function m47AtsCreateInput() {
  const args = input({
    canonicalSignerAddress: realM42Signer,
    principalPublicId: "tool402_ats_issuer_testnet_v1",
    role: "ISSUER",
    authorityVersion: "ats_issuer_testnet_v1",
  });
  args.replayIdentity = `tool402:wallet-command:v1:296:${args.canonicalSignerAddress}:${args.nonce}`;
  args.payload = {
    operationKind: "ATS_CREATE",
    subjectPublicId: "riskscan_revenue_note_demo",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
    canonicalParametersHash: realM42CanonicalParametersHash,
    idempotencyKey: args.nonce,
    expiresAt: args.expiresAt,
  };
  args.payloadHash = hashPayload(args.payload);
  return args;
}

function withM47Payload(changes) {
  const args = m47AtsCreateInput();
  args.payload = { ...args.payload, ...changes };
  args.payloadHash = hashPayload(args.payload);
  args.expiresAt = args.payload.expiresAt;
  return args;
}

function withM47Context(changes) {
  const args = m47AtsCreateInput();
  Object.assign(args, changes);
  args.replayIdentity = `tool402:wallet-command:v1:296:${args.canonicalSignerAddress}:${args.nonce}`;
  return args;
}

function authority(args = input()) {
  return {
    _id: "commandAuthorities:current", _creationTime: now - 1000,
    ...pick(args, ["principalPublicId", "canonicalSignerAddress", "chainId", "role", "authorityVersion"]),
    ownedSubjectPublicIds: args.role === "ISSUER" ? [args.payload.subjectPublicId] : [], enabled: true,
  };
}

function attempt(args = input()) {
  return { _id: attemptId, _creationTime: now - 500, ...pick(args, contextKeys), ...args.payload, state: "PREPARED", acceptedAt: 1n };
}

function claim(overrides = {}) {
  return {
    _id: "externalPrepareCommandReplayClaims:existing", _creationTime: now - 500,
    replayIdentity: input().replayIdentity, outcome: "NEW", attemptId, claimedAt: 1n, ...overrides,
  };
}

function selectedAtsCreateInput(suffix, nonce = "CCCCCCCCCCCCCCCCCCCCCg") {
  const args = m47AtsCreateInput();
  const toolPublicId = `tool_${suffix}`;
  const configuration = createProviderToolAtsConfiguration({
    toolPublicId,
    subjectPublicId: toolPublicId,
    title: "RiskScan Revenue Note",
    canonicalSignerAddress: args.canonicalSignerAddress,
  });
  args.nonce = nonce;
  args.replayIdentity = `tool402:wallet-command:v1:296:${args.canonicalSignerAddress}:${nonce}`;
  args.payload = {
    ...args.payload,
    subjectPublicId: toolPublicId,
    expectedTarget: configuration.atsCreateConfiguration.expectedTarget,
    canonicalParametersHash: configuration.canonicalParametersHash,
    idempotencyKey: nonce,
  };
  args.payloadHash = hashPayload(args.payload);
  return args;
}

function selectedProviderTool(args, suffix = args.payload.subjectPublicId.slice("tool_".length)) {
  const toolPublicId = `tool_${suffix}`;
  return {
    _id: `providerTools:${suffix}`,
    _creationTime: now - 1_000,
    toolPublicId,
    subjectPublicId: toolPublicId,
    offeringPublicId: `offering_${suffix}`,
    serviceId: toolPublicId,
    serviceSlug: `tool-${suffix}`,
    canonicalSignerAddress: args.canonicalSignerAddress,
    chainId: 296,
    principalPublicId: args.principalPublicId,
    authorityVersion: args.authorityVersion,
    requestId: "00000000-0000-4000-8000-000000000000",
    offeringVersion: 1,
    directoryVersion: 1,
    createdAt: 1n,
  };
}

function selectedOffering(args, suffix, overrides = {}) {
  return {
    _id: `offerings:${suffix}`,
    _creationTime: now - 1_000,
    offeringPublicId: `offering_${suffix}`,
    subjectPublicId: `tool_${suffix}`,
    canonicalSignerAddress: args.canonicalSignerAddress,
    principalPublicId: args.principalPublicId,
    authorityVersion: args.authorityVersion,
    payloadHash: `0x${"d".repeat(64)}`,
    idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBQ",
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    version: 1,
    acceptedAt: 1n,
    updatedAt: 1n,
    definition: {
      schemaVersion: 1,
      terms: {
        version: "riskscan-revenue-note-v1",
        fundingTargetTinybars: "1000",
        noteUnitPriceTinybars: "10",
        maximumNoteUnits: "100",
        minimumPurchaseUnits: "1",
        reserveShareBps: "2000",
        issuerShareBps: "8000",
        platformFeeBps: "0",
        payoutCapTinybars: "1500",
      },
      maturityAt: "2026-12-31T00:00:00.000Z",
      qualifyingResource: "riskscan.quick",
    },
    narrative: {
      title: "RiskScan Revenue Note",
      customerProblem: "Teams need a bounded signal before an EVM contract interaction.",
      customerUseCases: ["Inspect a contract before use"],
      useOfFunds: ["Maintain the RiskScan service"],
      risks: ["Testnet-only demonstration"],
    },
    state: "DRAFT",
    ...overrides,
  };
}

function selectedAtomicDatabase({
  args,
  offerings,
  providerTools = [selectedProviderTool(args)],
  claims = [],
  attempts = [],
}) {
  const rows = {
    commandAuthorities: [authority(args)],
    providerTools: structuredClone(providerTools),
    offerings: structuredClone(offerings),
    externalPrepareCommandReplayClaims: structuredClone(claims),
    externalPrepareCommandAttempts: structuredClone(attempts),
  };
  const writes = [];
  const forbidden = () => { throw new Error("unexpected database or external operation"); };
  const db = {
    query(table) {
      assert.ok(Object.hasOwn(rows, table), `unexpected table: ${table}`);
      return {
        withIndex(_index, select) {
          const filters = [];
          const range = {
            eq(field, value) {
              filters.push([field, value]);
              return range;
            },
          };
          select(range);
          return {
            async take(limit) {
              assert.equal(limit, 2);
              return rows[table]
                .filter((row) => filters.every(([field, value]) => row[field] === value))
                .slice(0, limit);
            },
          };
        },
      };
    },
    async insert(table, document) {
      assert.ok([
        "externalPrepareCommandAttempts",
        "externalPrepareCommandReplayClaims",
      ].includes(table));
      const id = table === "externalPrepareCommandAttempts"
        ? "externalPrepareCommandAttempts:selected"
        : `externalPrepareCommandReplayClaims:${rows[table].length}`;
      const stored = { ...structuredClone(document), _id: id, _creationTime: now };
      rows[table].push(stored);
      writes.push({ kind: "insert", table, id, document: structuredClone(document) });
      return id;
    },
    async get(id) {
      return Object.values(rows).flat().find((row) => row._id === id) ?? null;
    },
    async patch(id, document) {
      const stored = rows.offerings.find((row) => row._id === id);
      assert.notEqual(stored, undefined, `missing offering: ${id}`);
      Object.assign(stored, structuredClone(document));
      writes.push({ kind: "patch", id, document: structuredClone(document) });
    },
    replace: forbidden,
    delete: forbidden,
  };
  return {
    rows,
    writes,
    ctx: {
      db,
      runAction: forbidden,
      runMutation: forbidden,
      runQuery: forbidden,
      scheduler: { runAfter: forbidden, runAt: forbidden },
    },
  };
}

// The double preserves inserts so a second real handler invocation observes durable replay.
function database({ authorities = [authority()], claims = [], attempts = [] } = {}) {
  const rows = { commandAuthorities: [...authorities], externalPrepareCommandReplayClaims: [...claims], externalPrepareCommandAttempts: [...attempts] };
  const reads = [];
  const writes = [];
  const accesses = [];
  const forbidden = () => { accesses.push("forbidden"); throw new Error("unexpected database or external operation"); };
  const db = {
    query(table) {
      accesses.push(table);
      assert.ok(Object.hasOwn(rows, table));
      return {
        withIndex(index, select) {
          const filters = [];
          const range = { eq(field, value) { filters.push([field, value]); return range; } };
          select(range);
          return { async take(limit) {
            assert.equal(limit, 2);
            reads.push({ table, index, filters, limit });
            // Return controlled index candidates, including corrupt rows the handler must reject.
            return rows[table].slice(0, limit);
          } };
        },
      };
    },
    async insert(table, document) {
      accesses.push(table);
      assert.ok(["externalPrepareCommandAttempts", "externalPrepareCommandReplayClaims"].includes(table));
      const id = table === "externalPrepareCommandAttempts" ? attemptId : `externalPrepareCommandReplayClaims:${writes.length}`;
      writes.push({ table, document: structuredClone(document) });
      rows[table].push({ ...structuredClone(document), _id: id, _creationTime: now });
      return id;
    },
    get: forbidden, patch: forbidden, replace: forbidden, delete: forbidden,
  };
  return { reads, writes, accesses, ctx: {
    db, runAction: forbidden, runMutation: forbidden, runQuery: forbidden,
    scheduler: { runAfter: forbidden, runAt: forbidden },
  } };
}

function lookups(args = input()) {
  return [
    { table: "commandAuthorities", index: "by_chain_id_and_canonical_signer_address", filters: [["chainId", 296], ["canonicalSignerAddress", args.canonicalSignerAddress]], limit: 2 },
    { table: "externalPrepareCommandReplayClaims", index: "by_replay_identity", filters: [["replayIdentity", args.replayIdentity]], limit: 2 },
    { table: "externalPrepareCommandAttempts", index: "by_idempotency_key", filters: [["idempotencyKey", args.payload.idempotencyKey]], limit: 2 },
  ];
}

async function loadMutation(t, clock = now) {
  t.mock.timers.enable({ apis: ["Date"], now: clock });
  const admissions = await import(moduleUrl);
  assert.equal(
    typeof admissions.admitExternalPrepareCommand,
    "function",
    "generic M32 admission must remain a registered internal mutation",
  );
  return admissions.admitExternalPrepareCommand;
}

const string = { type: "string" };
const literal = (value) => ({ type: "literal", value });
const union = (...values) => ({ type: "union", value: values.map(literal) });
const object = (fields) => ({ type: "object", value: Object.fromEntries(Object.entries(fields).map(([key, fieldType]) => [key, { fieldType, optional: false }])) });
const payloadValidator = object({ operationKind: union(...operations), subjectPublicId: string, network: literal("hedera:testnet"), chainId: literal(296), expectedTarget: string, canonicalParametersHash: string, idempotencyKey: string, expiresAt: string });

test("registers the generic internal mutation with exact closed args and result arms", async (t) => {
  const mutation = await loadMutation(t);
  assert.equal(mutation.isInternal, true);
  assert.equal(mutation.isMutation, true);
  for (const flag of ["isPublic", "isQuery", "isAction"]) assert.equal(mutation[flag], undefined);
  assert.deepEqual(JSON.parse(mutation.exportArgs()), object({
    version: literal(1), type: literal("external.prepare"), chainId: literal(296), canonicalSignerAddress: string,
    nonce: string, issuedAt: string, expiresAt: string, payloadHash: string, replayIdentity: string,
    principalPublicId: string, role: union("ISSUER", "BACKER"), authorityVersion: string, payload: payloadValidator,
  }));
  const returns = JSON.parse(mutation.exportReturns());
  assert.equal(returns.type, "union");
  assert.deepEqual(returns.value.sort((a, b) => a.value.status.fieldType.value.localeCompare(b.value.status.fieldType.value)), [
    object({ status: literal("COMMAND_REPLAYED") }),
    object({ status: literal("IDEMPOTENCY_CONFLICT") }),
    object({ status: literal("IDEMPOTENCY_REPLAYED"), attemptId: { type: "id", tableName: "externalPrepareCommandAttempts" }, state: literal("PREPARED") }),
    object({ status: literal("NEW"), attemptId: { type: "id", tableName: "externalPrepareCommandAttempts" }, state: literal("PREPARED") }),
  ]);
});

test("rejects malformed serialized command and detached M26 fields before all database access", async (t) => {
  const mutation = await loadMutation(t);
  const cases = [["null command", null], ["array command", []], ["empty command", {}]];
  for (const key of Object.keys(input())) { const value = input(); delete value[key]; cases.push([`missing command.${key}`, value]); }
  for (const [key, values] of Object.entries({
    version: [2, "1"], type: ["external.execute"], chainId: [295, "296"],
    canonicalSignerAddress: [signer.toUpperCase(), "0xabc"], nonce: ["", "A".repeat(21), "A".repeat(21) + "B"],
    issuedAt: ["2026-09-07T19:00:00Z", "2026-02-30T19:00:00.000Z"], expiresAt: ["2026-09-07T19:04:00Z"],
    payloadHash: [payloadHash.toUpperCase(), "0x" + "b".repeat(64)], replayIdentity: ["wrong", input().replayIdentity + "x"],
    principalPublicId: ["", null], authorityVersion: ["", null], role: ["ADMIN", "issuer"],
  })) for (const value of values) cases.push([`invalid command.${key}: ${JSON.stringify(value)}`, input({ [key]: value })]);
  for (const key of ["now", "serverNow", "signature", "rawBody", "capability", "state"]) cases.push([`unexpected command.${key}`, input({ [key]: "unexpected" })]);
  for (const [key, value] of Object.entries({ operationKind: "ATS_UNKNOWN", subjectPublicId: "", network: "hedera:mainnet", chainId: 295, expectedTarget: "arbitrary-target", canonicalParametersHash: "A".repeat(64), idempotencyKey: "short", expiresAt: "2026-09-07T19:04:00Z", extra: true })) {
    cases.push([`malformed payload.${key} with original hash`, input({ payload: { ...input().payload, [key]: value } })]);
  }
  for (const key of payloadKeys) { const value = input(); delete value.payload[key]; cases.push([`missing payload.${key}`, value]); }
  cases.push(["null payload", input({ payload: null })], ["array payload", input({ payload: [] })]);
  cases.push(["nonce differs from replay identity", input({ nonce: "QQQQQQQQQQQQQQQQQQQQQQ" })]);
  cases.push(["replay identity signer mismatch", input({ replayIdentity: `tool402:wallet-command:v1:296:0x${"c".repeat(40)}:AAAAAAAAAAAAAAAAAAAAAA` })]);
  cases.push(["replay identity nonce mismatch", input({ replayIdentity: `tool402:wallet-command:v1:296:${signer}:QQQQQQQQQQQQQQQQQQQQQQ` })]);
  // Each valid field still participates in the detached hash; a stale hash cannot bind it.
  for (const [key, value] of Object.entries({ operationKind: "ATS_ISSUE", subjectPublicId: "subject_43", expectedTarget: "0.0.456", canonicalParametersHash: "b".repeat(64), idempotencyKey: "QQQQQQQQQQQQQQQQQQQQQQ", expiresAt: "2026-09-07T19:03:00.000Z" })) {
    cases.push([`valid changed payload.${key} with stale hash`, input({ payload: { ...input().payload, [key]: value } })]);
  }
  cases.push(["canonical expiry mismatch with recomputed payload hash", { ...withPayload({ expiresAt: "2026-09-07T19:03:00.000Z" }), expiresAt: input().expiresAt }]);
  for (const [name, args] of cases) {
    const db = database();
    await assert.rejects(() => mutation._handler(db.ctx, args), undefined, name);
    assert.deepEqual(db.accesses, [], `${name}: must never touch db`);
  }
  // Matching hashes isolate M26 semantic validation from stale-hash rejection above.
  for (const [key, value] of Object.entries({ operationKind: "ATS_UNKNOWN", subjectPublicId: "", expectedTarget: "arbitrary-target", canonicalParametersHash: "A".repeat(64), idempotencyKey: "short" })) {
    const name = `malformed payload.${key} with independently recomputed hash`;
    const args = withPayload({ [key]: value });
    const db = database();
    await assert.rejects(() => mutation._handler(db.ctx, args), undefined, name);
    assert.deepEqual(db.accesses, [], `${name}: must never touch db`);
  }
});

test("enforces expiry ordering, 300-second lifetime and 60-second future skew before lookup", async (t) => {
  const mutation = await loadMutation(t);
  for (const [name, args] of [
    ["issuedAt equals expiresAt", input({ issuedAt: input().expiresAt })],
    ["issuedAt follows expiresAt", input({ issuedAt: "2026-09-07T19:04:00.001Z" })],
    ["lifetime exceeds 300 seconds", input({ issuedAt: "2026-09-07T18:58:59.999Z" })],
    ["issuedAt exceeds future-skew allowance", input({ issuedAt: "2026-09-07T19:01:30.001Z" })],
  ]) {
    const db = database();
    await assert.rejects(() => mutation._handler(db.ctx, args), undefined, name);
    assert.deepEqual(db.accesses, [], name);
  }
  t.mock.timers.setTime(Date.parse(input().expiresAt) + 1);
  const db = database();
  await assert.rejects(() => mutation._handler(db.ctx, input()));
  assert.deepEqual(db.accesses, []);
});

test("accepts inclusive expiry and future-skew boundaries and the exact maximum lifetime", async (t) => {
  const mutation = await loadMutation(t);
  for (const [clock, args] of [
    [Date.parse(input().expiresAt), input()],
    [now, input({ issuedAt: "2026-09-07T19:01:30.000Z" })],
    [now, input({ issuedAt: "2026-09-07T18:59:00.000Z" })],
    [now, input({ payload: Object.fromEntries(Object.entries(input().payload).reverse()) })],
  ]) {
    t.mock.timers.setTime(clock);
    assert.deepEqual(await mutation._handler(database().ctx, args), { status: "NEW", attemptId, state: "PREPARED" });
  }
});

test("rechecks exactly one current enabled funding authority before replay or idempotency", async (t) => {
  const mutation = await loadMutation(t);
  const invalid = [["absent authority", []], ["duplicate authority", [authority(), authority()]], ["null authority", [null]], ["array authority", [[]]]];
  for (const [key, value] of Object.entries({ enabled: false, principalPublicId: "principal_other", role: "ISSUER", authorityVersion: "authority_v2", chainId: 295, canonicalSignerAddress: "0x" + "c".repeat(40) })) invalid.push([`invalid authority.${key}`, [{ ...authority(), [key]: value }]]);
  for (const key of Object.keys(authority()).filter((key) => !key.startsWith("_"))) { const row = authority(); delete row[key]; invalid.push([`missing authority.${key}`, [row]]); }
  invalid.push(["string authority.enabled", [{ ...authority(), enabled: "true" }]], ["non-string owned subject", [{ ...authority(), ownedSubjectPublicIds: ["subject_42", 4] }]]);
  for (const [name, authorities] of invalid) {
    const db = database({ authorities, claims: [claim()], attempts: [attempt()] });
    await assert.rejects(() => mutation._handler(db.ctx, input()), undefined, name);
    assert.deepEqual(db.reads, lookups().slice(0, 1), name);
    assert.deepEqual(db.writes, [], name);
    assert.deepEqual(db.accesses, ["commandAuthorities"], name);
  }
  const current = authority();
  const db = database({ authorities: [current] });
  assert.deepEqual(await mutation._handler(db.ctx, input()), { status: "NEW", attemptId, state: "PREPARED" });
  current.enabled = false;
  db.reads.length = 0;
  db.accesses.length = 0;
  await assert.rejects(() => mutation._handler(db.ctx, input()));
  assert.deepEqual(db.reads, lookups().slice(0, 1), "revocation takes precedence over the now-persisted replay claim");
  assert.equal(db.writes.length, 2);
  assert.deepEqual(db.accesses, ["commandAuthorities"], "revoked authority must not trigger any other boundary");
});

test("retains the historical ATS_CREATE M30 JCS payload-hash binding vector", () => {
  const atsCreatePayload = {
    ...input().payload,
    operationKind: "ATS_CREATE",
  };

  assert.equal(
    hashPayload(atsCreatePayload),
    "0x80e6aa5c7d520c43c2ae746b2a9459ab8e298b384703618a464a30378619422a",
  );
});

test("generic admission rejects every ATS operation, including ATS_CREATE, after current issuer authority and before durable state", async (t) => {
  const mutation = await loadMutation(t);
  for (const operationKind of atsOperations) {
    await t.test(operationKind, async () => {
      const args = withPayload({ operationKind });
      args.role = "ISSUER";
      const db = database({ authorities: [authority(args)] });
      await assert.rejects(
        mutation._handler(db.ctx, args),
        TypeError,
      );
      assert.deepEqual(db.reads, lookups(args).slice(0, 1));
      assert.deepEqual(db.writes, []);
    });
  }
});

test("keeps HEDERA_FUNDING on the enabled BACKER durable path", async (t) => {
  const mutation = await loadMutation(t);
  const args = input();
  const current = authority(args);
  assert.equal(current.role, "BACKER");
  assert.deepEqual(current.ownedSubjectPublicIds, []);
  assert.equal(hashPayload(args.payload), payloadHash, "independent fixture matches the funding M30 vector");

  const db = database({ authorities: [current] });
  assert.deepEqual(await mutation._handler(db.ctx, args), { status: "NEW", attemptId, state: "PREPARED" });
  assert.deepEqual(db.reads, lookups(args));
  assert.equal(db.writes.length, 2);
  const stored = db.writes.find(({ table }) => table === "externalPrepareCommandAttempts").document;
  assert.equal(typeof stored.acceptedAt, "bigint");
  assert.ok(stored.acceptedAt >= 0n && stored.acceptedAt <= 9_223_372_036_854_775_807n);
  assert.deepEqual(stored, { ...pick(args, contextKeys), ...args.payload, state: "PREPARED", acceptedAt: stored.acceptedAt });
  const replay = db.writes.find(({ table }) => table === "externalPrepareCommandReplayClaims").document;
  assert.equal(typeof replay.claimedAt, "bigint");
  assert.deepEqual(replay, { replayIdentity: args.replayIdentity, outcome: "NEW", attemptId, claimedAt: replay.claimedAt });
});

test("returns replay before idempotency for all valid stored claim outcomes", async (t) => {
  const mutation = await loadMutation(t);
  for (const outcome of ["NEW", "IDEMPOTENCY_REPLAYED", "IDEMPOTENCY_CONFLICT"]) {
    const row = claim({ outcome });
    if (outcome === "IDEMPOTENCY_CONFLICT") delete row.attemptId;
    const db = database({ claims: [row], attempts: [attempt(), attempt()] });
    assert.deepEqual(await mutation._handler(db.ctx, input()), { status: "COMMAND_REPLAYED" });
    assert.deepEqual(db.reads, lookups().slice(0, 2));
    assert.deepEqual(db.writes, []);
  }
});

test("fails closed on duplicate or malformed replay rows before idempotency", async (t) => {
  const mutation = await loadMutation(t);
  const cases = [["duplicate claims", [claim(), claim()]], ["null claim", [null]], ["array claim", [[]]]];
  for (const [key, value] of Object.entries({ replayIdentity: "wrong", outcome: "UNKNOWN", attemptId: "", claimedAt: 1, _id: "" })) cases.push([`invalid claim.${key}`, [claim({ [key]: value })]]);
  for (const key of ["replayIdentity", "outcome", "attemptId", "claimedAt"]) { const row = claim(); delete row[key]; cases.push([`missing claim.${key}`, [row]]); }
  cases.push(["claim.claimedAt overflows int64", [claim({ claimedAt: 9_223_372_036_854_775_808n })]]);
  cases.push(["claim.claimedAt is negative", [claim({ claimedAt: -1n })]]);
  cases.push(["conflict claim has forbidden attempt link", [claim({ outcome: "IDEMPOTENCY_CONFLICT" })]]);
  for (const [name, claims] of cases) {
    const db = database({ claims });
    await assert.rejects(() => mutation._handler(db.ctx, input()), undefined, name);
    assert.deepEqual(db.reads, lookups().slice(0, 2), name);
    assert.deepEqual(db.writes, [], name);
    assert.deepEqual(db.accesses, ["commandAuthorities", "externalPrepareCommandReplayClaims"], name);
  }
});

test("links a fresh-nonce idempotency repeat and consumes that identity without another attempt", async (t) => {
  const mutation = await loadMutation(t);
  const args = input({ nonce: "QQQQQQQQQQQQQQQQQQQQQQ", replayIdentity: `tool402:wallet-command:v1:296:${signer}:QQQQQQQQQQQQQQQQQQQQQQ` });
  const db = database({ attempts: [attempt()] });
  assert.deepEqual(await mutation._handler(db.ctx, args), { status: "IDEMPOTENCY_REPLAYED", attemptId, state: "PREPARED" });
  assert.deepEqual(db.reads, lookups(args));
  assert.equal(db.writes.length, 1);
  assert.deepEqual(db.writes[0], { table: "externalPrepareCommandReplayClaims", document: { replayIdentity: args.replayIdentity, outcome: "IDEMPOTENCY_REPLAYED", attemptId, claimedAt: db.writes[0].document.claimedAt } });
  assert.equal(typeof db.writes[0].document.claimedAt, "bigint");
  db.reads.length = 0;
  assert.deepEqual(await mutation._handler(db.ctx, args), { status: "COMMAND_REPLAYED" });
  assert.deepEqual(db.reads, lookups(args).slice(0, 2));
  assert.equal(db.writes.length, 1);
});

test("consumes every conflicting context or unsafe attempt in an unlinked claim and rejects its replay", async (t) => {
  const mutation = await loadMutation(t);
  const cases = [["duplicate attempts", [attempt(), attempt()]], ["null attempt", [null]], ["array attempt", [[]]], ["attempt.acceptedAt overflows int64", [{ ...attempt(), acceptedAt: 9_223_372_036_854_775_808n }]]];
  cases.push(["attempt.acceptedAt is negative", [{ ...attempt(), acceptedAt: -1n }]]);
  for (const [key, value] of Object.entries({ version: 2, type: "external.other", chainId: 295, canonicalSignerAddress: "0x" + "c".repeat(40), principalPublicId: "principal_other", role: "ISSUER", authorityVersion: "authority_v2", payloadHash: "0x" + "b".repeat(64), state: "EXECUTED", acceptedAt: 1, _id: "", expectedTarget: "0.0.987", canonicalParametersHash: "b".repeat(64), operationKind: "ATS_ISSUE", subjectPublicId: "subject_other", network: "hedera:mainnet", expiresAt: "2026-09-07T19:03:00.000Z" })) cases.push([`invalid attempt.${key}`, [{ ...attempt(), [key]: value }]]);
  for (const key of new Set([...contextKeys, ...payloadKeys, "state", "acceptedAt"])) { const row = attempt(); delete row[key]; cases.push([`missing attempt.${key}`, [row]]); }
  for (const [name, attempts] of cases) {
    const db = database({ attempts });
    assert.deepEqual(await mutation._handler(db.ctx, input()), { status: "IDEMPOTENCY_CONFLICT" }, name);
    assert.deepEqual(db.reads, lookups(), name);
    assert.equal(db.writes.length, 1, name);
    assert.equal(typeof db.writes[0].document.claimedAt, "bigint", name);
    assert.deepEqual(db.writes[0], { table: "externalPrepareCommandReplayClaims", document: { replayIdentity: input().replayIdentity, outcome: "IDEMPOTENCY_CONFLICT", claimedAt: db.writes[0].document.claimedAt } }, name);
    db.reads.length = 0;
    assert.deepEqual(await mutation._handler(db.ctx, input()), { status: "COMMAND_REPLAYED" }, name);
    assert.deepEqual(db.reads, lookups().slice(0, 2), name);
    assert.equal(db.writes.length, 1, name);
  }
});

test("keeps admission module internal and excludes external integrations and configuration", async () => {
  await import(moduleUrl);
  assert.match(moduleUrl.pathname.split("/").at(-1), /^[a-z0-9_]+\.ts$/u);
  const source = readFileSync(moduleUrl, "utf8");
  assert.match(source, /\binternalMutationGeneric\b/u);
  assert.doesNotMatch(source, /\b(?:queryGeneric|mutationGeneric|actionGeneric|internalActionGeneric|httpActionGeneric|fetch|runAction|runMutation|runQuery)\b|process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|viem\/accounts|viem\/actions|createWalletClient|createPublicClient|_generated|convex\/nextjs|from\s+["'](?:node:)?https?["']/u);
});

test("requires the M41 atomic ATS_CREATE admission mutation before its durable scenarios", async () => {
  const admissions = await import(moduleUrl);
  assert.equal(
    typeof admissions.admitAtsCreateAndMarkAssetPending,
    "function",
    "missing M41 atomic ATS_CREATE admission mutation",
  );
});

atomicTest("registers the M41 atomic ATS_CREATE mutation with the exact generic M32 wire contract", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const admissions = await import(moduleUrl);
  const generic = admissions.admitExternalPrepareCommand;
  const atomic = admissions.admitAtsCreateAndMarkAssetPending;
  assert.deepEqual(Object.keys(admissions).sort(), [
    "admitAtsCreateAndMarkAssetPending",
    "admitExternalPrepareCommand",
  ]);
  assert.equal(atomic.isInternal, true);
  assert.equal(atomic.isMutation, true);
  for (const flag of ["isPublic", "isQuery", "isAction"]) assert.equal(atomic[flag], undefined);
  assert.deepEqual(JSON.parse(atomic.exportArgs()), JSON.parse(generic.exportArgs()));
  assert.deepEqual(JSON.parse(atomic.exportReturns()), JSON.parse(generic.exportReturns()));
});

atomicTest("keeps ATS_CREATE exclusively on the explicit atomic M32 source path", () => {
  const generic = registeredMutationSource(
    "admitExternalPrepareCommand",
    "admitAtsCreateAndMarkAssetPending",
  );
  const atomic = registeredMutationSource("admitAtsCreateAndMarkAssetPending");

  assert.match(
    generic,
    /\boperationKind\s*===\s*["']ATS_CREATE["'][\s\S]{0,320}\breject\s*\(/u,
    "generic M32 must explicitly reject ATS_CREATE before durable admission",
  );
  assert.match(
    atomic,
    /\boperationKind\s*!==\s*["']ATS_CREATE["'][\s\S]{0,320}\breject\s*\(/u,
    "atomic M32 must accept no operation kind other than ATS_CREATE",
  );
});

atomicTest("keeps the M41 ATS_CREATE link and exact replay integrity check inside one M32 mutation", () => {
  const atomic = registeredMutationSource("admitAtsCreateAndMarkAssetPending");

  assert.match(
    atomic,
    /\bawait\s+linkAtsCreateAttemptToDraftOffering\s*\(\s*ctx\s*,/u,
    "atomic M32 must invoke the non-registered M40 linker directly with its own transaction context",
  );
  assert.doesNotMatch(
    atomic,
    /\bctx\s*\.\s*runMutation\s*\(/u,
    "atomic M32 must not split the offering link into a nested mutation",
  );
  assert.doesNotMatch(
    atomic,
    /\bmarkAssetPending\b/u,
    "atomic M32 must not use the separate M40 transition",
  );
  assert.match(
    atomic,
    /\breadAttempt\s*\(\s*attempts\s*\[\s*0\s*\]\s*,\s*bound\s*\)/u,
    "atomic replay must first revalidate the stored attempt against the command context",
  );
  assert.match(
    atomic,
    /(?:const|let)\s+(?<offeringRows>[A-Za-z_$][\w$]*)\s*=\s*await\s+ctx\.db\.query\(\s*["']offerings["']\s*\)[\s\S]{0,640}\.withIndex\(\s*["']by_ats_attempt_id["']\s*,\s*\(\s*[A-Za-z_$][\w$]*\s*\)\s*=>[\s\S]{0,160}\.eq\(\s*["']atsAttemptId["']\s*,\s*(?<storedAttempt>[A-Za-z_$][\w$]*\.(?:_id|attemptId))\s*\)[\s\S]{0,640}\.take\(\s*2\s*\)/u,
    "exact idempotency replay must query by_ats_attempt_id using the actual durable stored attempt ID",
  );

  const indexedReplay = atomic.match(
    /(?:const|let)\s+(?<offeringRows>[A-Za-z_$][\w$]*)\s*=\s*await\s+ctx\.db\.query\(\s*["']offerings["']\s*\)[\s\S]{0,640}\.withIndex\(\s*["']by_ats_attempt_id["']\s*,\s*\(\s*[A-Za-z_$][\w$]*\s*\)\s*=>[\s\S]{0,160}\.eq\(\s*["']atsAttemptId["']\s*,\s*(?<storedAttempt>[A-Za-z_$][\w$]*\.(?:_id|attemptId))\s*\)[\s\S]{0,640}\.take\(\s*2\s*\)/u,
  );
  assert.notEqual(indexedReplay, null);
  const offeringRows = indexedReplay.groups.offeringRows;
  const storedAttempt = indexedReplay.groups.storedAttempt;
  const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const rowsPattern = escaped(offeringRows);
  const attemptPattern = escaped(storedAttempt);

  assert.match(
    atomic,
    new RegExp(`\\b${rowsPattern}\\.length\\s*!==\\s*1[\\s\\S]{0,640}IDEMPOTENCY_CONFLICT`, "u"),
    "zero or duplicate by_ats_attempt_id rows must become an idempotency conflict",
  );
  const indexedOffering = atomic.match(new RegExp(
    `(?:const|let)\\s+(?<offering>[A-Za-z_$][\\w$]*)\\s*=\\s*readAtsCreateReplayOffering\\(\\s*${rowsPattern}\\s*\\[\\s*0\\s*\\]\\s*\\)`,
    "u",
  ));
  assert.notEqual(indexedOffering, null);
  const offering = escaped(indexedOffering.groups.offering);
  for (const [field, expected] of [
    ["atsAttemptId", attemptPattern],
    ["state", `["']ASSET_PENDING["']`],
    ["subjectPublicId", "bound\\.payload\\.subjectPublicId"],
    ["canonicalSignerAddress", "bound\\.canonicalSignerAddress"],
    ["principalPublicId", "bound\\.principalPublicId"],
    ["authorityVersion", "bound\\.authorityVersion"],
  ]) {
    assert.match(
      atomic,
      new RegExp(`\\b${offering}\\.${field}\\s*!==\\s*${expected}`, "u"),
      `the indexed offering must match ${field} before an idempotency replay is accepted`,
    );
  }
  assert.match(
    atomic,
    /\bIDEMPOTENCY_CONFLICT\b/u,
    "orphaned, duplicate, or mismatched ATS_CREATE replays must become conflicts",
  );
});

atomicTest("snapshots indexed ATS_CREATE replay offerings before classifying a conflict", () => {
  const atomic = registeredMutationSource("admitAtsCreateAndMarkAssetPending");

  assert.match(
    atomic,
    /const\s+offering\s*=\s+readAtsCreateReplayOffering\(\s*offeringRows\s*\[\s*0\s*\]\s*\)/u,
    "an indexed replay offering must be captured through the closed own-data snapshot",
  );
  assert.match(
    atomic,
    /offering\s*===\s*null[\s\S]{0,640}IDEMPOTENCY_CONFLICT/u,
    "a malformed indexed replay offering must become a linked idempotency conflict",
  );
  assert.doesNotMatch(
    atomic,
    /const\s+offering\s*=\s*offeringRows\s*\[\s*0\s*\]/u,
    "the atomic replay branch must not dereference a raw indexed offering",
  );
});

atomicTest("requires the M47 real-issuer binding after M32 authority revalidation and before M33, replay, idempotency, or durable state", () => {
  const source = readFileSync(moduleUrl, "utf8");
  const atomic = registeredMutationSource("admitAtsCreateAndMarkAssetPending");

  assert.equal(
    /import\s*\{[^}]*\bassertStageBAtsCreateRuntimeBinding\b[^}]*\}\s+from\s+["']\.\/stage_b_ats_create_runtime_binding(?:\.ts)?["']/u.test(source),
    true,
    "the atomic mutation must consume the private M47 binding rather than a caller-selected configuration",
  );
  const revalidated = atomic.indexOf("revalidateAuthority(authorities[0], bound)");
  const binding = atomic.indexOf("assertStageBAtsCreateRuntimeBinding(bound)");
  const m33 = atomic.indexOf("assertCurrentAtsPrepareAuthority(bound.payload)");
  const replay = atomic.indexOf('ctx.db.query("externalPrepareCommandReplayClaims")');
  const idempotency = atomic.indexOf('ctx.db.query("externalPrepareCommandAttempts")');
  const durableInsert = atomic.indexOf('ctx.db.insert("externalPrepareCommandAttempts",');
  for (const [name, position] of [
    ["M32 authority revalidation", revalidated],
    ["M47 runtime binding", binding],
    ["M33 gate", m33],
    ["replay lookup", replay],
    ["idempotency lookup", idempotency],
    ["durable attempt insert", durableInsert],
  ]) assert.notEqual(position, -1, `missing ${name}`);
  assert.ok(revalidated < binding, "the binding must consume M32-revalidated authority context");
  assert.ok(binding < m33, "the binding must fail before M33");
  assert.ok(m33 < replay, "M33 must remain before replay");
  assert.ok(binding < idempotency, "the binding must fail before idempotency");
  assert.ok(binding < durableInsert, "the binding must fail before a durable write");
});

atomicTest("admits the fixed M42/M47 tuple through M33 to replay lookup without external activity", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { admitAtsCreateAndMarkAssetPending: atomic } = await import(moduleUrl);
  const args = m47AtsCreateInput();
  const db = database({
    authorities: [authority(args)],
    claims: [claim({ replayIdentity: args.replayIdentity })],
  });
  assert.deepEqual(
    await atomic._handler(db.ctx, args),
    { status: "COMMAND_REPLAYED" },
  );
  assert.deepEqual(db.reads, lookups(args).slice(0, 2));
  assert.deepEqual(db.writes, []);
  assert.deepEqual(db.accesses, [
    "commandAuthorities",
    "externalPrepareCommandReplayClaims",
  ]);
});

atomicTest("keeps selected Tool B atomic admission and command replay isolated from Tool A", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { admitAtsCreateAndMarkAssetPending: atomic } = await import(moduleUrl);
  const suffixA = "a".repeat(32);
  const suffixB = "b".repeat(32);
  const argsB = selectedAtsCreateInput(suffixB);
  const db = selectedAtomicDatabase({
    args: argsB,
    providerTools: [
      selectedProviderTool(argsB, suffixA),
      selectedProviderTool(argsB, suffixB),
    ],
    offerings: [
      selectedOffering(argsB, suffixA),
      selectedOffering(argsB, suffixB),
    ],
  });

  assert.deepEqual(
    await atomic._handler(db.ctx, argsB),
    {
      status: "NEW",
      attemptId: "externalPrepareCommandAttempts:selected",
      state: "PREPARED",
    },
  );
  assert.equal(db.rows.offerings[0].state, "DRAFT", "Tool A must remain unlinked");
  assert.equal(db.rows.offerings[0].atsAttemptId, undefined);
  assert.equal(db.rows.offerings[1].state, "ASSET_PENDING");
  assert.equal(
    db.rows.offerings[1].atsAttemptId,
    "externalPrepareCommandAttempts:selected",
  );

  const writesAfterAdmission = db.writes.length;
  assert.deepEqual(
    await atomic._handler(db.ctx, argsB),
    { status: "COMMAND_REPLAYED" },
  );
  assert.equal(db.writes.length, writesAfterAdmission);

  db.rows.offerings[0].state = "ASSET_PENDING";
  db.rows.offerings[0].atsAttemptId = "externalPrepareCommandAttempts:selected";
  db.rows.offerings[1].state = "DRAFT";
  delete db.rows.offerings[1].atsAttemptId;
  await assert.rejects(
    () => atomic._handler(db.ctx, argsB),
    TypeError,
    "Tool B replay must reject an attempt attached to Tool A",
  );
  assert.equal(db.writes.length, writesAfterAdmission);
  assert.equal(db.rows.offerings[0].subjectPublicId, `tool_${suffixA}`);
  assert.equal(db.rows.offerings[1].subjectPublicId, `tool_${suffixB}`);
});

atomicTest("rejects M42/M47 payload and authority-context drift before replay or durable activity", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const { admitAtsCreateAndMarkAssetPending: atomic } = await import(moduleUrl);
  const cases = [
    ["target", withM47Payload({
      expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    })],
    ["canonical parameters hash", withM47Payload({
      canonicalParametersHash: "0".repeat(64),
    })],
    ["subject", withM47Payload({ subjectPublicId: "riskscan_revenue_note_other" })],
    ["signer", withM47Context({
      canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    })],
    ["principal", withM47Context({ principalPublicId: "tool402_ats_issuer_other" })],
    ["authority version", withM47Context({ authorityVersion: "ats_issuer_testnet_v2" })],
  ];

  for (const [name, args] of cases) {
    const db = database({ authorities: [authority(args)] });
    await assert.rejects(() => atomic._handler(db.ctx, args), TypeError, name);
    assert.deepEqual(db.reads, lookups(args).slice(0, 1), name);
    assert.deepEqual(db.writes, [], name);
    assert.deepEqual(db.accesses, ["commandAuthorities"], name);
  }
});
