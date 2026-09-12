import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  canonicalOfferingCreatePayloadBytes,
  canonicalizeRequirements,
  parseOfferingCreatePayload,
} from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const admissionUrl = new URL("../src/offering-command-admission.ts", import.meta.url);
const offeringsUrl = new URL("../convex/offerings.ts", import.meta.url);
const providerToolAuthorityUrl = new URL("../convex/provider_tool_authority.ts", import.meta.url);
const schemaUrl = new URL("../convex/schema.ts", import.meta.url);
const backendIndexUrl = new URL("../src/index.ts", import.meta.url);
const admissionPath = fileURLToPath(admissionUrl);
const offeringsPath = fileURLToPath(offeringsUrl);
const providerToolAuthorityPath = fileURLToPath(providerToolAuthorityUrl);
const sourcesExist = existsSync(admissionPath) && existsSync(offeringsPath);
const implementedTest = sourcesExist ? test : test.skip;
const selectedToolSourceExists = existsSync(providerToolAuthorityPath);
const selectedToolTest = selectedToolSourceExists ? test : test.skip;
const atomicHelperSourceDeclared = sourcesExist && readFileSync(offeringsPath, "utf8").includes(
  "linkAtsCreateAttemptToDraftOffering",
);
const atomicTest = atomicHelperSourceDeclared ? test : test.skip;

const durableNow = Date.parse("2026-09-09T13:00:30.000Z");
const issuedAt = "2026-09-09T13:00:00.000Z";
const expiresAt = "2026-09-09T13:04:00.000Z";
const canonicalSignerAddress = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const offeringId = "offerings:accepted";
const atsAttemptId = "externalPrepareCommandAttempts:ats-create";

function offeringPayload(overrides = {}) {
  return {
    schemaVersion: 1,
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    subjectPublicId: "subject_42",
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
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBQ",
    expiresAt,
    ...overrides,
  };
}

function hashPayload(payload) {
  const bytes = canonicalOfferingCreatePayloadBytes(parseOfferingCreatePayload(payload));
  return keccak256(stringToHex(new TextDecoder().decode(bytes)));
}

function hashRawPayload(payload) {
  return keccak256(stringToHex(canonicalizeRequirements(payload)));
}

function admissionInput(overrides = {}) {
  const payload = overrides.payload ?? offeringPayload();
  const nonce = overrides.nonce ?? "AAAAAAAAAAAAAAAAAAAAAA";
  const payloadHash = overrides.payloadHash ?? hashPayload(payload);
  return {
    version: 1,
    type: "offering.create",
    chainId: 296,
    canonicalSignerAddress,
    nonce,
    issuedAt,
    expiresAt: overrides.expiresAt ?? payload.expiresAt,
    payloadHash,
    replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:${nonce}`,
    principalPublicId: "principal_42",
    role: "ISSUER",
    authorityVersion: "authority-v1",
    payload,
    ...overrides,
  };
}

function reboundInput(payload, overrides = {}) {
  return admissionInput({
    ...overrides,
    payload,
    expiresAt: overrides.expiresAt ?? payload.expiresAt,
    payloadHash: hashPayload(payload),
  });
}

function rawPayloadInput(payload, overrides = {}) {
  return admissionInput({
    ...overrides,
    payload,
    expiresAt: overrides.expiresAt ?? payload.expiresAt,
    payloadHash: hashRawPayload(payload),
  });
}

function authority(input = admissionInput(), overrides = {}) {
  return {
    _id: "commandAuthorities:issuer",
    _creationTime: durableNow - 1,
    principalPublicId: input.principalPublicId,
    canonicalSignerAddress: input.canonicalSignerAddress,
    chainId: input.chainId,
    role: "ISSUER",
    ownedSubjectPublicIds: [input.payload.subjectPublicId],
    authorityVersion: input.authorityVersion,
    enabled: true,
    ...overrides,
  };
}

function providerTool(input, overrides = {}) {
  const toolPublicId = input.payload.subjectPublicId;
  const suffix = toolPublicId.slice("tool_".length);
  return {
    _id: `providerTools:${suffix}`,
    _creationTime: durableNow - 2,
    toolPublicId,
    subjectPublicId: toolPublicId,
    offeringPublicId: `offering_${suffix}`,
    serviceId: toolPublicId,
    serviceSlug: `tool-${suffix}`,
    canonicalSignerAddress: input.canonicalSignerAddress,
    chainId: 296,
    principalPublicId: input.principalPublicId,
    authorityVersion: input.authorityVersion,
    requestId: "00000000-0000-4000-8000-000000000000",
    offeringVersion: 1,
    directoryVersion: 1,
    createdAt: 1n,
    ...overrides,
  };
}

function selectedInput(suffix, overrides = {}) {
  const { idempotencyKey = "BBBBBBBBBBBBBBBBBBBBBQ", ...commandOverrides } = overrides;
  const payload = offeringPayload({
    offeringPublicId: `offering_${suffix}`,
    subjectPublicId: `tool_${suffix}`,
    idempotencyKey,
  });
  return reboundInput(payload, commandOverrides);
}

function offeringDocument(input = admissionInput(), overrides = {}) {
  const payload = input.payload;
  return {
    _id: offeringId,
    _creationTime: durableNow - 1,
    offeringPublicId: payload.offeringPublicId,
    subjectPublicId: payload.subjectPublicId,
    canonicalSignerAddress: input.canonicalSignerAddress,
    principalPublicId: input.principalPublicId,
    authorityVersion: input.authorityVersion,
    payloadHash: input.payloadHash,
    idempotencyKey: payload.idempotencyKey,
    advertisedQuickPriceTinybars: payload.advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars: payload.advertisedStandardPriceTinybars,
    version: payload.offeringVersion,
    acceptedAt: 1n,
    updatedAt: 1n,
    definition: structuredClone(payload.definition),
    narrative: structuredClone(payload.narrative),
    state: "DRAFT",
    ...overrides,
  };
}

function replayClaim(input = admissionInput(), overrides = {}) {
  return {
    _id: "walletCommandReplayClaims:claimed",
    _creationTime: durableNow - 1,
    replayIdentity: input.replayIdentity,
    commandType: "offering.create",
    outcome: "NEW",
    targetId: offeringId,
    claimedAt: 1n,
    ...overrides,
  };
}

function atsCreateAttempt(input = admissionInput(), overrides = {}) {
  return {
    _id: atsAttemptId,
    _creationTime: durableNow - 1,
    version: 1,
    type: "external.prepare",
    chainId: 296,
    canonicalSignerAddress: input.canonicalSignerAddress,
    principalPublicId: input.principalPublicId,
    role: "ISSUER",
    authorityVersion: input.authorityVersion,
    payloadHash: `0x${"c".repeat(64)}`,
    operationKind: "ATS_CREATE",
    subjectPublicId: input.payload.subjectPublicId,
    network: "hedera:testnet",
    expectedTarget: "0x5fa65ca30d1984701f10476664327f97c864a9d3",
    canonicalParametersHash: "d".repeat(64),
    idempotencyKey: "CCCCCCCCCCCCCCCCCCCCCg",
    expiresAt: input.expiresAt,
    state: "PREPARED",
    acceptedAt: 1n,
    ...overrides,
  };
}

function atsCreateDraftBinding(input = admissionInput(), overrides = {}) {
  return {
    attemptId: atsAttemptId,
    subjectPublicId: input.payload.subjectPublicId,
    canonicalSignerAddress: input.canonicalSignerAddress,
    principalPublicId: input.principalPublicId,
    authorityVersion: input.authorityVersion,
    ...overrides,
  };
}

function queryRows(rows, table, request) {
  const source = rows[table] ?? [];
  return typeof source === "function" ? source(request) : source;
}

function database({
  authorities = [],
  claims = [],
  offerings = [],
  attempts = [],
  providerTools = [],
  getRows = {},
  queryResults = {},
} = {}) {
  const rows = {
    commandAuthorities: [...authorities],
    walletCommandReplayClaims: [...claims],
    offerings: [...offerings],
    externalPrepareCommandAttempts: [...attempts],
    providerTools: [...providerTools],
  };
  const reads = [];
  const writes = [];
  const accesses = [];
  const forbidden = () => {
    accesses.push("forbidden");
    throw new Error("unexpected database or external operation");
  };
  const db = {
    query(table) {
      accesses.push(table);
      assert.ok(Object.hasOwn(rows, table), `unexpected table: ${table}`);
      return {
        withIndex(index, select) {
          const filters = [];
          const range = {
            eq(field, value) {
              filters.push([field, value]);
              return range;
            },
          };
          select(range);
          const request = { table, index, filters, orders: [] };
          const builder = {
            order(direction) {
              request.orders.push(direction);
              return builder;
            },
            async take(limit) {
              assert.equal(limit, 2, `${table} must use bounded reads`);
              reads.push({ ...request, filters: [...filters], orders: [...request.orders], limit });
              const queryKey = `${table}:${index}`;
              const source = Object.hasOwn(queryResults, queryKey)
                ? queryResults[queryKey]
                : queryRows(rows, table, request);
              const candidates = typeof source === "function" ? source(request) : source;
              assert.ok(Array.isArray(candidates), `${table} index must return an array`);
              return candidates.slice(0, limit);
            },
          };
          return builder;
        },
      };
    },
    async get(id) {
      const table = String(id).split(":", 1)[0];
      accesses.push(`get:${table}`);
      reads.push({ table, id, kind: "get" });
      if (Object.hasOwn(getRows, id)) return getRows[id];
      const row = rows[table]?.find((candidate) => candidate?._id === id);
      return row ?? null;
    },
    async insert(table, document) {
      accesses.push(table);
      assert.ok(["offerings", "walletCommandReplayClaims"].includes(table), `unexpected insert: ${table}`);
      const id = table === "offerings"
        ? rows.offerings.length === 0 ? offeringId : `offerings:${rows.offerings.length}`
        : `walletCommandReplayClaims:${writes.length}`;
      const copy = structuredClone(document);
      writes.push({ kind: "insert", table, document: copy, id });
      rows[table].push({ _id: id, _creationTime: durableNow, ...structuredClone(copy) });
      return id;
    },
    async patch(id, document) {
      accesses.push("patch");
      const copy = structuredClone(document);
      writes.push({ kind: "patch", id, document: copy });
      const table = String(id).split(":", 1)[0];
      const row = rows[table]?.find((candidate) => candidate?._id === id);
      if (row === undefined) throw new Error(`unknown patch target: ${id}`);
      Object.assign(row, copy);
    },
    replace: forbidden,
    delete: forbidden,
  };

  return {
    rows,
    reads,
    writes,
    accesses,
    ctx: {
      db,
      runAction: forbidden,
      runMutation: forbidden,
      runQuery: forbidden,
      scheduler: { runAfter: forbidden, runAt: forbidden },
    },
  };
}

function useExactIndexRows(db, queryResults, tables) {
  for (const [table, indexes] of Object.entries(tables)) {
    for (const index of indexes) {
      queryResults[`${table}:${index}`] = ({ filters }) => db.rows[table].filter(
        (row) => row !== null && typeof row === "object"
          && filters.every(([field, value]) => row[field] === value),
      );
    }
  }
}

function atomicTransactionDatabase({ offerings = [] } = {}) {
  const rows = {
    offerings: structuredClone(offerings),
    externalPrepareCommandAttempts: [],
    externalPrepareCommandReplayClaims: [],
  };
  const writes = [];
  const reads = [];
  const db = {
    query(table) {
      assert.equal(table, "offerings");
      return {
        withIndex(index, select) {
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
              reads.push({ table, index, filters: [...filters], limit });
              return rows.offerings.slice(0, limit);
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
        ? atsAttemptId
        : `externalPrepareCommandReplayClaims:${rows.externalPrepareCommandReplayClaims.length}`;
      rows[table].push({ _id: id, _creationTime: durableNow, ...structuredClone(document) });
      writes.push({ kind: "insert", table, id, document: structuredClone(document) });
      return id;
    },
    async patch(id, document) {
      const row = rows.offerings.find((candidate) => candidate?._id === id);
      assert.notEqual(row, undefined);
      Object.assign(row, structuredClone(document));
      writes.push({ kind: "patch", id, document: structuredClone(document) });
    },
  };
  return {
    ctx: {
      db,
      runAction() { throw new Error("unexpected external action"); },
      runMutation() { throw new Error("unexpected nested mutation"); },
      runQuery() { throw new Error("unexpected query adapter"); },
      scheduler: {
        runAfter() { throw new Error("unexpected scheduler"); },
        runAt() { throw new Error("unexpected scheduler"); },
      },
    },
    reads,
    writes,
    rows,
    async transaction(work) {
      const snapshot = structuredClone(rows);
      const writeCount = writes.length;
      const readCount = reads.length;
      try {
        return await work();
      } catch (error) {
        for (const table of Object.keys(rows)) {
          rows[table].splice(0, rows[table].length, ...snapshot[table]);
        }
        writes.splice(writeCount);
        reads.splice(readCount);
        throw error;
      }
    },
  };
}

function expectedOfferingReads(input) {
  return [
    {
      table: "commandAuthorities",
      index: "by_chain_id_and_canonical_signer_address",
      filters: [["chainId", 296], ["canonicalSignerAddress", input.canonicalSignerAddress]],
      orders: [],
      limit: 2,
    },
    {
      table: "walletCommandReplayClaims",
      index: "by_replay_identity",
      filters: [["replayIdentity", input.replayIdentity]],
      orders: [],
      limit: 2,
    },
    {
      table: "offerings",
      index: "by_offering_public_id_and_version",
      filters: [["offeringPublicId", input.payload.offeringPublicId], ["version", input.payload.offeringVersion]],
      orders: [],
      limit: 2,
    },
  ];
}

function expectedPendingReads() {
  return [
    { table: "offerings", id: offeringId, kind: "get" },
    { table: "externalPrepareCommandAttempts", id: atsAttemptId, kind: "get" },
    {
      table: "offerings",
      index: "by_ats_attempt_id",
      filters: [["atsAttemptId", atsAttemptId]],
      orders: [],
      limit: 2,
    },
  ];
}

function expectedReadyRead() {
  return [{
    table: "offerings",
    index: "by_ats_attempt_id",
    filters: [["atsAttemptId", atsAttemptId]],
    orders: [],
    limit: 2,
  }];
}

function assertUnlinkedConflictClaim(db, input) {
  assert.equal(db.writes.length, 1);
  assert.deepEqual(db.writes[0], {
    kind: "insert",
    table: "walletCommandReplayClaims",
    id: "walletCommandReplayClaims:0",
    document: {
      replayIdentity: input.replayIdentity,
      commandType: "offering.create",
      outcome: "IDEMPOTENCY_CONFLICT",
      claimedAt: db.writes[0].document.claimedAt,
    },
  });
  assert.equal(typeof db.writes[0].document.claimedAt, "bigint");
}

async function loadOfferings(t, now = durableNow) {
  t.mock.timers.enable({ apis: ["Date"], now });
  const [admission, offerings] = await Promise.all([import(admissionUrl.href), import(offeringsUrl.href)]);
  return { admission, offerings };
}

const string = { type: "string" };
const number = { type: "number" };
const bigint = { type: "bigint" };
const literal = (value) => ({ type: "literal", value });
const array = (value) => ({ type: "array", value });
const union = (...values) => ({ type: "union", value: values.map(literal) });
const optional = (fieldType) => ({ fieldType, optional: true });
const object = (fields) => ({
  type: "object",
  value: Object.fromEntries(
    Object.entries(fields).map(([key, fieldType]) => [
      key,
      fieldType !== null
        && typeof fieldType === "object"
        && Object.hasOwn(fieldType, "fieldType")
        && Object.hasOwn(fieldType, "optional")
        ? fieldType
        : { fieldType, optional: false },
    ]),
  ),
});
const id = (tableName) => ({ type: "id", tableName });

const offeringTermsValidator = object({
  version: string,
  fundingTargetTinybars: string,
  noteUnitPriceTinybars: string,
  maximumNoteUnits: string,
  minimumPurchaseUnits: string,
  reserveShareBps: string,
  issuerShareBps: string,
  platformFeeBps: string,
  payoutCapTinybars: string,
});
const offeringDefinitionValidator = object({
  schemaVersion: literal(1),
  terms: offeringTermsValidator,
  maturityAt: string,
  qualifyingResource: string,
});
const offeringNarrativeValidator = object({
  title: string,
  customerProblem: string,
  customerUseCases: array(string),
  useOfFunds: array(string),
  risks: array(string),
});
const offeringPayloadValidator = object({
  schemaVersion: literal(1),
  offeringPublicId: string,
  offeringVersion: number,
  subjectPublicId: string,
  definition: offeringDefinitionValidator,
  narrative: offeringNarrativeValidator,
  advertisedQuickPriceTinybars: string,
  advertisedStandardPriceTinybars: string,
  idempotencyKey: string,
  expiresAt: string,
});
const offeringCommandValidator = object({
  version: literal(1),
  type: literal("offering.create"),
  chainId: literal(296),
  canonicalSignerAddress: string,
  nonce: string,
  issuedAt: string,
  expiresAt: string,
  payloadHash: string,
  replayIdentity: string,
  principalPublicId: string,
  role: literal("ISSUER"),
  authorityVersion: string,
  payload: offeringPayloadValidator,
});
const offeringProjectionValidator = object({
  offeringPublicId: string,
  version: number,
  subjectPublicId: string,
  state: union("DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"),
  definition: offeringDefinitionValidator,
  narrative: offeringNarrativeValidator,
  advertisedQuickPriceTinybars: string,
  advertisedStandardPriceTinybars: string,
  canonicalSignerAddress: string,
  atsAssetEvmAddress: optional(string),
  atsAttemptPublicId: optional(string),
  acceptedAt: bigint,
  updatedAt: bigint,
});

function sortedReturnArms(validator) {
  return validator.value.sort((left, right) => {
    const leftStatus = left.value?.status?.fieldType?.value ?? left.type;
    const rightStatus = right.value?.status?.fieldType?.value ?? right.type;
    return leftStatus.localeCompare(rightStatus);
  });
}

function assertNoSensitiveKeys(record) {
  for (const key of [
    "principalPublicId",
    "authorityVersion",
    "payloadHash",
    "idempotencyKey",
    "_id",
    "_creationTime",
    "atsAttemptId",
    "activeDirectoryVersionId",
  ]) {
    assert.equal(Object.hasOwn(record, key), false, `projection must omit ${key}`);
  }
}

test("requires the declared M40 offering command and Convex source modules", () => {
  assert.equal(existsSync(admissionPath), true, `missing declared source module: ${admissionPath}`);
  assert.equal(existsSync(offeringsPath), true, `missing declared source module: ${offeringsPath}`);
});

test("requires the private bounded selected-provider-tool authority resolver", () => {
  assert.equal(
    selectedToolSourceExists,
    true,
    `missing selected-provider-tool resolver: ${providerToolAuthorityPath}`,
  );
});

selectedToolTest("admits equal-content tools independently and rejects selected identity or replay drift", async (t) => {
  const { offerings } = await loadOfferings(t);
  const suffixA = "a".repeat(32);
  const suffixB = "b".repeat(32);
  const inputA = selectedInput(suffixA);
  const inputB = selectedInput(suffixB, {
    nonce: "QQQQQQQQQQQQQQQQQQQQQQ",
    replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:QQQQQQQQQQQQQQQQQQQQQQ`,
    idempotencyKey: "CCCCCCCCCCCCCCCCCCCCCg",
  });
  assert.deepEqual(inputA.payload.definition, inputB.payload.definition);
  assert.deepEqual(inputA.payload.narrative, inputB.payload.narrative);
  assert.equal(inputA.payload.advertisedQuickPriceTinybars, inputB.payload.advertisedQuickPriceTinybars);
  assert.equal(inputA.payload.advertisedStandardPriceTinybars, inputB.payload.advertisedStandardPriceTinybars);

  const current = authority(inputA, { ownedSubjectPublicIds: ["riskscan_revenue_note_demo"] });
  const queryResults = {};
  const db = database({
    authorities: [current],
    providerTools: [providerTool(inputA), providerTool(inputB)],
    queryResults,
  });
  useExactIndexRows(db, queryResults, {
    commandAuthorities: ["by_chain_id_and_canonical_signer_address"],
    providerTools: ["by_tool_public_id"],
    walletCommandReplayClaims: ["by_replay_identity"],
    offerings: ["by_offering_public_id_and_version"],
  });

  assert.deepEqual(
    await offerings.admitOfferingCreate._handler(db.ctx, inputA),
    { status: "NEW", targetId: offeringId, state: "DRAFT" },
  );
  assert.deepEqual(
    await offerings.admitOfferingCreate._handler(db.ctx, inputB),
    { status: "NEW", targetId: "offerings:1", state: "DRAFT" },
  );
  const storedOfferings = db.rows.offerings.map(({ _id, ...row }) => ({ _id, ...row }));
  assert.equal(storedOfferings.length, 2);
  assert.equal(storedOfferings[0].offeringPublicId, inputA.payload.offeringPublicId);
  assert.equal(storedOfferings[1].offeringPublicId, inputB.payload.offeringPublicId);

  const beforeReload = structuredClone(db.rows.offerings[0]);
  const reloadA = selectedInput(suffixA, {
    nonce: "HHHHHHHHHHHHHHHHHHHHHw",
    replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:HHHHHHHHHHHHHHHHHHHHHw`,
  });
  assert.deepEqual(
    await offerings.admitOfferingCreate._handler(db.ctx, reloadA),
    { status: "IDEMPOTENCY_REPLAYED", targetId: offeringId, state: "DRAFT" },
  );
  assert.deepEqual(db.rows.offerings[0], beforeReload, "reload must not overwrite admitted fields");
  assert.equal(db.rows.offerings.length, 2);

  assert.deepEqual(
    await offerings.admitOfferingCreate._handler(db.ctx, inputA),
    { status: "COMMAND_REPLAYED" },
  );
  const driftedPayload = offeringPayload({
    offeringPublicId: inputA.payload.offeringPublicId,
    subjectPublicId: inputA.payload.subjectPublicId,
    narrative: { ...inputA.payload.narrative, title: "Changed after admission" },
  });
  const driftedReplay = reboundInput(driftedPayload, {
    nonce: inputA.nonce,
    replayIdentity: inputA.replayIdentity,
  });
  await assert.rejects(
    () => offerings.admitOfferingCreate._handler(db.ctx, driftedReplay),
    TypeError,
  );
  assert.equal(db.rows.offerings.length, 2);

  const rejected = [
    [
      "swapped offering",
      reboundInput(offeringPayload({
        offeringPublicId: inputB.payload.offeringPublicId,
        subjectPublicId: inputA.payload.subjectPublicId,
      })),
      [providerTool(inputA), providerTool(inputB)],
      current,
    ],
    [
      "swapped subject",
      reboundInput(offeringPayload({
        offeringPublicId: inputA.payload.offeringPublicId,
        subjectPublicId: inputB.payload.subjectPublicId,
      })),
      [providerTool(inputA), providerTool(inputB)],
      current,
    ],
    ["fabricated tool", selectedInput("c".repeat(32)), [providerTool(inputA)], current],
    [
      "foreign owner",
      inputA,
      [providerTool(inputA, { canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })],
      current,
    ],
    ["revoked authority", inputA, [providerTool(inputA)], { ...current, enabled: false }],
    [
      "changed authority",
      inputA,
      [providerTool(inputA)],
      { ...current, authorityVersion: "authority-v2" },
    ],
  ];
  for (const [name, command, providerTools, selectedAuthority] of rejected) {
    const rejectedQueryResults = {};
    const rejectedDb = database({
      authorities: [selectedAuthority],
      providerTools,
      queryResults: rejectedQueryResults,
    });
    useExactIndexRows(rejectedDb, rejectedQueryResults, {
      commandAuthorities: ["by_chain_id_and_canonical_signer_address"],
      providerTools: ["by_tool_public_id"],
      walletCommandReplayClaims: ["by_replay_identity"],
      offerings: ["by_offering_public_id_and_version"],
    });
    await assert.rejects(
      () => offerings.admitOfferingCreate._handler(rejectedDb.ctx, command),
      TypeError,
      name,
    );
    assert.deepEqual(rejectedDb.writes, [], name);
  }
});

selectedToolTest("links preparation only to the selected tool after a fresh ownership check", async (t) => {
  const { offerings } = await loadOfferings(t);
  const inputA = selectedInput("a".repeat(32));
  const inputB = selectedInput("b".repeat(32), { idempotencyKey: "CCCCCCCCCCCCCCCCCCCCCg" });
  const draftA = offeringDocument(inputA, { _id: "offerings:A" });
  const draftB = offeringDocument(inputB, { _id: "offerings:B" });
  const current = authority(inputB, { ownedSubjectPublicIds: ["riskscan_revenue_note_demo"] });
  const queryResults = {};
  const db = database({
    authorities: [current],
    offerings: [draftA, draftB],
    providerTools: [providerTool(inputA), providerTool(inputB)],
    queryResults,
  });
  useExactIndexRows(db, queryResults, {
    commandAuthorities: ["by_chain_id_and_canonical_signer_address"],
    providerTools: ["by_tool_public_id"],
    offerings: ["by_ats_create_draft_binding"],
  });

  await offerings.linkAtsCreateAttemptToDraftOffering(db.ctx, {
    attemptId: atsAttemptId,
    subjectPublicId: inputB.payload.subjectPublicId,
    canonicalSignerAddress: inputB.canonicalSignerAddress,
    principalPublicId: inputB.principalPublicId,
    authorityVersion: inputB.authorityVersion,
  });
  assert.equal(db.writes.length, 1);
  assert.deepEqual(db.writes[0], {
    kind: "patch",
    id: "offerings:B",
    document: {
      state: "ASSET_PENDING",
      atsAttemptId,
      updatedAt: db.writes[0].document.updatedAt,
    },
  });
  assert.equal(db.rows.offerings[0].state, "DRAFT", "Tool A must remain unlinked");
  assert.equal(db.rows.offerings[1].state, "ASSET_PENDING");

  const revokedResults = {};
  const revokedDb = database({
    authorities: [{ ...current, enabled: false }],
    offerings: [draftB],
    providerTools: [providerTool(inputB)],
    queryResults: revokedResults,
  });
  useExactIndexRows(revokedDb, revokedResults, {
    commandAuthorities: ["by_chain_id_and_canonical_signer_address"],
    providerTools: ["by_tool_public_id"],
    offerings: ["by_ats_create_draft_binding"],
  });
  await assert.rejects(
    () => offerings.linkAtsCreateAttemptToDraftOffering(revokedDb.ctx, {
      attemptId: atsAttemptId,
      subjectPublicId: inputB.payload.subjectPublicId,
      canonicalSignerAddress: inputB.canonicalSignerAddress,
      principalPublicId: inputB.principalPublicId,
      authorityVersion: inputB.authorityVersion,
    }),
    TypeError,
  );
  assert.deepEqual(revokedDb.writes, []);
});

test("requires the M41 atomic DRAFT-offering linker and its exact additive lookup index", async () => {
  const offerings = await import(offeringsUrl);
  assert.equal(
    typeof offerings.linkAtsCreateAttemptToDraftOffering,
    "function",
    "missing M41 non-registered ATS_CREATE DRAFT-offering linker",
  );
  const schemaSource = readFileSync(schemaUrl, "utf8");
  assert.match(
    schemaSource,
    /\.index\(\s*"by_ats_create_draft_binding"\s*,\s*\[\s*"subjectPublicId"\s*,\s*"canonicalSignerAddress"\s*,\s*"principalPublicId"\s*,\s*"authorityVersion"\s*,\s*"state"\s*\]\s*\)/u,
  );
});

atomicTest("reads only a complete safe ASSET_PENDING offering before an M41 ATS_CREATE replay", async (t) => {
  const { offerings } = await loadOfferings(t);
  assert.equal(
    typeof offerings.readAtsCreateReplayOffering,
    "function",
    "missing M41 safe ATS_CREATE replay-offering reader",
  );

  const input = admissionInput();
  const valid = offeringDocument(input, {
    state: "ASSET_PENDING",
    atsAttemptId,
  });
  const expected = {
    offeringId: valid._id,
    atsAttemptId,
    state: "ASSET_PENDING",
    subjectPublicId: input.payload.subjectPublicId,
    canonicalSignerAddress: input.canonicalSignerAddress,
    principalPublicId: input.principalPublicId,
    authorityVersion: input.authorityVersion,
  };
  const replayOffering = offerings.readAtsCreateReplayOffering(valid);
  assert.deepEqual(replayOffering, expected);
  assert.equal(Object.isFrozen(replayOffering), true);

  const accessorBacked = { ...valid };
  let accessorReads = 0;
  Object.defineProperty(accessorBacked, "state", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("unsafe accessor must not run");
    },
  });
  const ownKeysThrowingProxy = new Proxy(valid, {
    ownKeys() {
      throw new Error("unsafe proxy reflection must not run");
    },
  });
  const cases = [
    null,
    Object.create(valid),
    {
      atsAttemptId,
      state: "ASSET_PENDING",
      subjectPublicId: input.payload.subjectPublicId,
      canonicalSignerAddress: input.canonicalSignerAddress,
      principalPublicId: input.principalPublicId,
      authorityVersion: input.authorityVersion,
    },
    offeringDocument(input, {
      state: "ASSET_PENDING",
      atsAttemptId,
      atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }),
    offeringDocument(input, {
      state: "ASSET_PENDING",
      atsAttemptId,
      activeDirectoryVersionId: "directoryVersions:active",
    }),
    accessorBacked,
    ownKeysThrowingProxy,
  ];
  for (const candidate of cases) {
    assert.equal(offerings.readAtsCreateReplayOffering(candidate), null);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("registers the exact closed M40 admission, asset-seam, and public-projection interfaces", async (t) => {
  const { admission, offerings } = await loadOfferings(t);
  assert.deepEqual(Object.keys(offerings).sort(), [
    "admitOfferingCreate",
    "getPublicProjection",
    ...(atomicHelperSourceDeclared ? ["linkAtsCreateAttemptToDraftOffering"] : []),
    "markAssetPending",
    "markAssetReady",
    "readAtsCreateReplayOffering",
    "readSelectedAtsCreateConfigurationOffering",
    "readSelectedAtsCreateCorroborationOffering",
  ]);
  for (const mutation of [
    offerings.admitOfferingCreate,
    offerings.markAssetPending,
    offerings.markAssetReady,
  ]) {
    assert.equal(mutation.isInternal, true);
    assert.equal(mutation.isMutation, true);
    for (const flag of ["isPublic", "isQuery", "isAction"]) assert.equal(mutation[flag], undefined);
  }
  assert.equal(offerings.getPublicProjection.isQuery, true);
  assert.equal(offerings.getPublicProjection.isPublic, true);
  for (const flag of ["isInternal", "isMutation", "isAction"]) {
    assert.equal(offerings.getPublicProjection[flag], undefined);
  }
  assert.deepEqual(JSON.parse(offerings.admitOfferingCreate.exportArgs()), offeringCommandValidator);
  assert.deepEqual(
    sortedReturnArms(JSON.parse(offerings.admitOfferingCreate.exportReturns())),
    sortedReturnArms({
      type: "union",
      value: [
        object({ status: literal("NEW"), targetId: id("offerings"), state: literal("DRAFT") }),
        object({ status: literal("IDEMPOTENCY_REPLAYED"), targetId: id("offerings"), state: literal("DRAFT") }),
        object({ status: literal("COMMAND_REPLAYED") }),
        object({ status: literal("IDEMPOTENCY_CONFLICT") }),
        object({ status: literal("PRECONDITION_UNMET") }),
      ],
    }),
  );
  assert.deepEqual(JSON.parse(offerings.markAssetPending.exportArgs()), object({
    offeringId: id("offerings"),
    attemptId: id("externalPrepareCommandAttempts"),
  }));
  assert.deepEqual(JSON.parse(offerings.markAssetPending.exportReturns()), object({
    offeringId: id("offerings"),
    state: literal("ASSET_PENDING"),
  }));
  assert.deepEqual(JSON.parse(offerings.markAssetReady.exportArgs()), object({
    attemptId: id("externalPrepareCommandAttempts"),
    atsAssetEvmAddress: string,
  }));
  assert.deepEqual(JSON.parse(offerings.markAssetReady.exportReturns()), object({
    offeringId: id("offerings"),
    state: literal("READY"),
  }));
  assert.deepEqual(JSON.parse(offerings.getPublicProjection.exportArgs()), object({
    offeringPublicId: string,
  }));
  assert.deepEqual(
    sortedReturnArms(JSON.parse(offerings.getPublicProjection.exportReturns())),
    sortedReturnArms({ type: "union", value: [{ type: "null" }, offeringProjectionValidator] }),
  );

  for (const source of [readFileSync(admissionPath, "utf8"), readFileSync(offeringsPath, "utf8")]) {
    assert.doesNotMatch(
      source,
      /\b(?:fetch|runAction|runMutation|runQuery|actionGeneric|internalActionGeneric|httpActionGeneric)\b|process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|viem\/accounts|viem\/actions|createWalletClient|createPublicClient|_generated|convex\/nextjs|from\s+["'](?:node:)?https?["']/u,
    );
  }
  const admissionSource = readFileSync(admissionPath, "utf8");
  assert.match(admissionSource, /\bparseOfferingCreatePayload\b/u);
  assert.match(admissionSource, /\bcanonicalOfferingCreatePayloadBytes\b/u);
  assert.doesNotMatch(admissionSource, /\bDate\.now\b/u);
  assert.equal(Object.hasOwn(admission, "default"), false);
  assert.doesNotMatch(readFileSync(backendIndexUrl, "utf8"), /offering-command-admission/u);
});

atomicTest("links exactly one matching unlinked DRAFT offering through the five-field atomic binding index", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const binding = atsCreateDraftBinding(input);
  const draft = offeringDocument(input);
  const db = database({
    offerings: [draft],
    queryResults: { "offerings:by_ats_create_draft_binding": [draft] },
  });

  await offerings.linkAtsCreateAttemptToDraftOffering(db.ctx, binding);
  assert.deepEqual(db.reads, [{
    table: "offerings",
    index: "by_ats_create_draft_binding",
    filters: [
      ["subjectPublicId", binding.subjectPublicId],
      ["canonicalSignerAddress", binding.canonicalSignerAddress],
      ["principalPublicId", binding.principalPublicId],
      ["authorityVersion", binding.authorityVersion],
      ["state", "DRAFT"],
    ],
    orders: [],
    limit: 2,
  }]);
  assert.equal(db.writes.length, 1);
  assert.equal(db.writes[0].kind, "patch");
  assert.equal(db.writes[0].id, offeringId);
  assert.equal(typeof db.writes[0].document.updatedAt, "bigint");
  assert.deepEqual(db.writes[0].document, {
    state: "ASSET_PENDING",
    atsAttemptId,
    updatedAt: db.writes[0].document.updatedAt,
  });
});

atomicTest("fails closed without an offering patch for missing, duplicate, malformed, linked, or cross-context atomic candidates", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const binding = atsCreateDraftBinding(input);
  const draft = offeringDocument(input);
  const malformed = { ...draft };
  delete malformed.payloadHash;
  const cases = [
    ["missing", []],
    ["duplicate", [draft, { ...draft, _id: "offerings:duplicate" }]],
    ["malformed", [malformed]],
    ["already linked", [offeringDocument(input, {
      state: "ASSET_PENDING",
      atsAttemptId,
    })]],
    ["different subject", [offeringDocument(input, { subjectPublicId: "subject_other" })]],
    ["different signer", [offeringDocument(input, {
      canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    })]],
    ["different principal", [offeringDocument(input, { principalPublicId: "principal_other" })]],
    ["different authority", [offeringDocument(input, { authorityVersion: "authority-other" })]],
  ];

  for (const [name, candidates] of cases) {
    const db = database({
      offerings: candidates,
      queryResults: { "offerings:by_ats_create_draft_binding": candidates },
    });
    await assert.rejects(
      () => offerings.linkAtsCreateAttemptToDraftOffering(db.ctx, binding),
      undefined,
      name,
    );
    assert.deepEqual(db.writes, [], `${name} must leave the offering unpatched`);
  }
});

atomicTest("rolls back the synthetic attempt, DRAFT link, and replay claim together when the atomic offering lookup rejects", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const binding = atsCreateDraftBinding(input);
  const db = atomicTransactionDatabase({ offerings: [] });

  await assert.rejects(() => db.transaction(async () => {
    const { _id, _creationTime, ...attemptDocument } = atsCreateAttempt(input);
    const attemptId = await db.ctx.db.insert("externalPrepareCommandAttempts", {
      ...attemptDocument,
    });
    await offerings.linkAtsCreateAttemptToDraftOffering(db.ctx, {
      ...binding,
      attemptId,
    });
    await db.ctx.db.insert("externalPrepareCommandReplayClaims", {
      replayIdentity: "tool402:wallet-command:v1:296:0xbfb8ea59964b307a79d4f0b98201db95e6dfa454:AAAAAAAAAAAAAAAAAAAAAA",
      outcome: "NEW",
      attemptId,
      claimedAt: 1n,
    });
  }));
  assert.deepEqual(db.rows.externalPrepareCommandAttempts, []);
  assert.deepEqual(db.rows.externalPrepareCommandReplayClaims, []);
  assert.deepEqual(db.rows.offerings, []);
  assert.deepEqual(db.writes, []);
});

implementedTest("parses raw M38 offering payloads before any durable access or admission hash trust", async (t) => {
  const { offerings } = await loadOfferings(t);
  const valid = admissionInput();
  const customPrototype = Object.assign(Object.create(null), valid);
  const symbolKeyed = { ...valid, [Symbol("unexpected")]: true };
  const accessorBacked = { ...valid };
  let accessorReads = 0;
  Object.defineProperty(accessorBacked, "payload", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("an untrusted accessor must not run");
    },
  });
  const malformed = [
    null,
    [],
    {},
    { ...valid, signature: "not accepted here" },
    { ...valid, version: 2 },
    { ...valid, version: "1" },
    { ...valid, type: "directory.publish" },
    { ...valid, chainId: 295 },
    { ...valid, role: "BACKER" },
    { ...valid, principalPublicId: "" },
    { ...valid, principalPublicId: null },
    { ...valid, authorityVersion: "" },
    { ...valid, authorityVersion: null },
    { ...valid, canonicalSignerAddress: valid.canonicalSignerAddress.toUpperCase() },
    { ...valid, nonce: "not-a-canonical-nonce" },
    { ...valid, replayIdentity: "forged" },
    { ...valid, expiresAt: "2026-09-09T13:04:00Z" },
    { ...valid, payloadHash: `0x${"0".repeat(64)}` },
    { ...valid, payload: { ...valid.payload, subjectPublicId: "subject_other" } },
    customPrototype,
    symbolKeyed,
    accessorBacked,
    new Proxy(valid, { ownKeys() { throw new Error("hostile reflection"); } }),
  ];

  for (const value of malformed) {
    const db = database();
    await assert.rejects(() => offerings.admitOfferingCreate._handler(db.ctx, value), undefined);
    assert.deepEqual(db.accesses, []);
  }

  for (const [name, rawPayload] of [
    ["M38 schema version", { ...valid.payload, schemaVersion: 2 }],
    ["M38 offering version", { ...valid.payload, offeringVersion: 0 }],
    ["M38 subject", { ...valid.payload, subjectPublicId: "" }],
    ["M38 extra field", { ...valid.payload, extra: true }],
  ]) {
    const input = rawPayloadInput(rawPayload);
    const db = database();
    assert.equal(input.payloadHash, hashRawPayload(rawPayload), `${name} must use independently computed raw JCS`);
    await assert.rejects(() => offerings.admitOfferingCreate._handler(db.ctx, input), undefined, name);
    assert.deepEqual(db.accesses, [], `${name}: malformed payload must fail before every durable access`);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("enforces exact command-payload expiry equality and durable clock boundaries before database access", async (t) => {
  const { offerings } = await loadOfferings(t);
  const maximumLifetimePayload = offeringPayload({ expiresAt: "2026-09-09T13:04:00.000Z" });
  const futureSkewPayload = offeringPayload({ expiresAt: "2026-09-09T13:04:00.000Z" });
  const mismatchPayload = offeringPayload({ expiresAt: "2026-09-09T13:03:59.999Z" });
  const cases = [
    [
      "command-payload expiry differs by one millisecond",
      reboundInput(mismatchPayload, { expiresAt: "2026-09-09T13:04:00.000Z" }),
    ],
    [
      "issuedAt follows expiresAt",
      reboundInput(maximumLifetimePayload, { issuedAt: "2026-09-09T13:04:00.001Z" }),
    ],
    [
      "lifetime exceeds 300 seconds by one millisecond",
      reboundInput(maximumLifetimePayload, { issuedAt: "2026-09-09T12:58:59.999Z" }),
    ],
    [
      "issuedAt exceeds future skew by one millisecond",
      reboundInput(futureSkewPayload, { issuedAt: "2026-09-09T13:01:30.001Z" }),
    ],
  ];
  for (const [name, input] of cases) {
    const db = database();
    await assert.rejects(() => offerings.admitOfferingCreate._handler(db.ctx, input), undefined, name);
    assert.deepEqual(db.accesses, [], `${name}: must reject before a durable access`);
  }

  const expiredDb = database();
  t.mock.timers.setTime(Date.parse(expiresAt) + 1);
  await assert.rejects(() => offerings.admitOfferingCreate._handler(expiredDb.ctx, admissionInput()), undefined);
  assert.deepEqual(expiredDb.accesses, [], "expiry plus one millisecond must reject before durable access");
});

implementedTest("accepts inclusive expiry, future-skew, and maximum-lifetime boundaries", async (t) => {
  const { offerings } = await loadOfferings(t);
  const cases = [
    [Date.parse(expiresAt), admissionInput()],
    [durableNow, reboundInput(offeringPayload(), { issuedAt: "2026-09-09T13:01:30.000Z" })],
    [durableNow, reboundInput(offeringPayload(), { issuedAt: "2026-09-09T12:59:00.000Z" })],
  ];
  for (const [now, input] of cases) {
    t.mock.timers.setTime(now);
    const db = database({ authorities: [authority(input)] });
    assert.deepEqual(
      await offerings.admitOfferingCreate._handler(db.ctx, input),
      { status: "NEW", targetId: offeringId, state: "DRAFT" },
    );
  }
});

implementedTest("fails closed on duplicate or malformed current authority rows before replay and idempotency", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const missingEnabled = authority(input);
  delete missingEnabled.enabled;
  const accessorAuthority = { ...authority(input) };
  let accessorReads = 0;
  Object.defineProperty(accessorAuthority, "enabled", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("stored authority accessor must not run");
    },
  });
  const customPrototypeAuthority = Object.assign(Object.create(null), authority(input));
  const symbolAuthority = { ...authority(input), [Symbol("unexpected")]: true };
  const malformed = [
    [],
    [authority(input), authority(input)],
    [null],
    [[]],
    [authority(input, { enabled: false })],
    [authority(input, { enabled: "true" })],
    [authority(input, { role: "BACKER" })],
    [authority(input, { ownedSubjectPublicIds: [] })],
    [authority(input, { ownedSubjectPublicIds: [input.payload.subjectPublicId, 4] })],
    [authority(input, { principalPublicId: "principal_other" })],
    [authority(input, { canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })],
    [authority(input, { chainId: 295 })],
    [authority(input, { authorityVersion: "authority-v2" })],
    [missingEnabled],
    [accessorAuthority],
    [customPrototypeAuthority],
    [symbolAuthority],
    [new Proxy(authority(input), { ownKeys() { throw new Error("hostile stored reflection"); } })],
  ];
  for (const authorities of malformed) {
    const db = database({ authorities, claims: [replayClaim(input)], offerings: [offeringDocument(input)] });
    await assert.rejects(() => offerings.admitOfferingCreate._handler(db.ctx, input), undefined);
    assert.deepEqual(db.reads, expectedOfferingReads(input).slice(0, 1));
    assert.deepEqual(db.writes, []);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("treats every valid replay row as replay and rejects duplicate or malformed claims before offering lookup", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  for (const claim of [
    replayClaim(input, { outcome: "NEW" }),
    replayClaim(input, { outcome: "IDEMPOTENCY_REPLAYED" }),
    replayClaim(input, { outcome: "IDEMPOTENCY_CONFLICT", targetId: undefined }),
  ]) {
    if (claim.outcome === "IDEMPOTENCY_CONFLICT") delete claim.targetId;
    const db = database({ authorities: [authority(input)], claims: [claim], offerings: [offeringDocument(input)] });
    assert.deepEqual(
      await offerings.admitOfferingCreate._handler(db.ctx, input),
      { status: "COMMAND_REPLAYED" },
    );
    assert.deepEqual(db.reads, expectedOfferingReads(input).slice(0, 2));
    assert.deepEqual(db.writes, []);
  }

  const missingTarget = replayClaim(input);
  delete missingTarget.targetId;
  const conflictWithTarget = replayClaim(input, { outcome: "IDEMPOTENCY_CONFLICT" });
  const accessorClaim = { ...replayClaim(input) };
  let accessorReads = 0;
  Object.defineProperty(accessorClaim, "outcome", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("stored replay accessor must not run");
    },
  });
  const malformed = [
    [replayClaim(input), replayClaim(input)],
    [null],
    [[]],
    [replayClaim(input, { replayIdentity: "other" })],
    [replayClaim(input, { commandType: "external.prepare" })],
    [replayClaim(input, { outcome: "UNKNOWN" })],
    [replayClaim(input, { claimedAt: 1 })],
    [replayClaim(input, { claimedAt: -1n })],
    [replayClaim(input, { claimedAt: 9_223_372_036_854_775_808n })],
    [missingTarget],
    [conflictWithTarget],
    [Object.assign(Object.create(null), replayClaim(input))],
    [{ ...replayClaim(input), [Symbol("unexpected")]: true }],
    [accessorClaim],
    [new Proxy(replayClaim(input), { ownKeys() { throw new Error("hostile stored reflection"); } })],
  ];
  for (const claims of malformed) {
    const db = database({ authorities: [authority(input)], claims, offerings: [offeringDocument(input)] });
    await assert.rejects(() => offerings.admitOfferingCreate._handler(db.ctx, input), undefined);
    assert.deepEqual(db.reads, expectedOfferingReads(input).slice(0, 2));
    assert.deepEqual(db.writes, []);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("refuses an offering version other than one without a durable write", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput({ payload: offeringPayload({ offeringVersion: 2 }) });
  const db = database({ authorities: [authority(input)] });

  assert.deepEqual(
    await offerings.admitOfferingCreate._handler(db.ctx, input),
    { status: "PRECONDITION_UNMET" },
  );
  assert.deepEqual(db.reads, expectedOfferingReads(input));
  assert.deepEqual(db.writes, []);
});

implementedTest("creates one DRAFT offering and one linked NEW replay claim in the durable transaction", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const db = database({ authorities: [authority(input)] });

  assert.deepEqual(
    await offerings.admitOfferingCreate._handler(db.ctx, input),
    { status: "NEW", targetId: offeringId, state: "DRAFT" },
  );
  assert.deepEqual(db.reads, expectedOfferingReads(input));
  assert.equal(db.writes.length, 2);

  const storedOffering = db.writes.find(({ table }) => table === "offerings");
  assert.notEqual(storedOffering, undefined);
  assert.equal(typeof storedOffering.document.acceptedAt, "bigint");
  assert.equal(typeof storedOffering.document.updatedAt, "bigint");
  const { _id, _creationTime, ...expectedOffering } = offeringDocument(input);
  assert.deepEqual(storedOffering.document, {
    ...expectedOffering,
    acceptedAt: storedOffering.document.acceptedAt,
    updatedAt: storedOffering.document.updatedAt,
  });

  const storedClaim = db.writes.find(({ table }) => table === "walletCommandReplayClaims");
  assert.notEqual(storedClaim, undefined);
  assert.equal(typeof storedClaim.document.claimedAt, "bigint");
  assert.deepEqual(storedClaim.document, {
    replayIdentity: input.replayIdentity,
    commandType: "offering.create",
    outcome: "NEW",
    targetId: offeringId,
    claimedAt: storedClaim.document.claimedAt,
  });
});

implementedTest("returns a claimed replay before any offering idempotency lookup", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const db = database({
    authorities: [authority(input)],
    claims: [replayClaim(input)],
    offerings: [offeringDocument(input), offeringDocument(input)],
  });

  assert.deepEqual(await offerings.admitOfferingCreate._handler(db.ctx, input), { status: "COMMAND_REPLAYED" });
  assert.deepEqual(db.reads, expectedOfferingReads(input).slice(0, 2));
  assert.deepEqual(db.writes, []);
});

implementedTest("claims a fresh nonce for an exact idempotent offering and consumes context drift as a conflict", async (t) => {
  const { offerings } = await loadOfferings(t);
  const original = admissionInput();
  const replayed = admissionInput({
    nonce: "QQQQQQQQQQQQQQQQQQQQQQ",
    replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:QQQQQQQQQQQQQQQQQQQQQQ`,
  });
  const replayDb = database({ authorities: [authority(replayed)], offerings: [offeringDocument(original)] });
  assert.deepEqual(
    await offerings.admitOfferingCreate._handler(replayDb.ctx, replayed),
    { status: "IDEMPOTENCY_REPLAYED", targetId: offeringId, state: "DRAFT" },
  );
  assert.deepEqual(replayDb.reads, expectedOfferingReads(replayed));
  assert.deepEqual(replayDb.writes, [{
    kind: "insert",
    table: "walletCommandReplayClaims",
    id: "walletCommandReplayClaims:0",
    document: {
      replayIdentity: replayed.replayIdentity,
      commandType: "offering.create",
      outcome: "IDEMPOTENCY_REPLAYED",
      targetId: offeringId,
      claimedAt: replayDb.writes[0].document.claimedAt,
    },
  }]);

  const storedPayloadDrifts = [
    offeringDocument(original, {
      narrative: {
        ...original.payload.narrative,
        title: "Drifted but canonical title",
      },
    }),
    offeringDocument(original, {
      advertisedQuickPriceTinybars: "11",
    }),
    offeringDocument(original, {
      definition: {
        ...original.payload.definition,
        terms: {
          ...original.payload.definition.terms,
          fundingTargetTinybars: "1001",
        },
      },
    }),
  ];
  for (const driftedOffering of storedPayloadDrifts) {
    const driftDb = database({
      authorities: [authority(replayed)],
      offerings: [driftedOffering],
    });
    assert.deepEqual(
      await offerings.admitOfferingCreate._handler(driftDb.ctx, replayed),
      { status: "IDEMPOTENCY_CONFLICT" },
    );
    assert.deepEqual(driftDb.reads, expectedOfferingReads(replayed));
    assertUnlinkedConflictClaim(driftDb, replayed);
  }

  const conflicts = [
    [
      admissionInput({
        nonce: "gggggggggggggggggggggg",
        replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:gggggggggggggggggggggg`,
      }),
      (input) => offeringDocument(input, { authorityVersion: "authority-other" }),
    ],
    [
      admissionInput({
        nonce: "HHHHHHHHHHHHHHHHHHHHHw",
        replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:HHHHHHHHHHHHHHHHHHHHHw`,
        payload: offeringPayload({
          narrative: { ...offeringPayload().narrative, title: "Changed narrative" },
        }),
      }),
      () => offeringDocument(original),
    ],
    [
      admissionInput({
        nonce: "IIIIIIIIIIIIIIIIIIIIIg",
        replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:IIIIIIIIIIIIIIIIIIIIIg`,
        principalPublicId: "principal_other",
      }),
      () => offeringDocument(original),
    ],
    [
      admissionInput({
        nonce: "JJJJJJJJJJJJJJJJJJJJJw",
        replayIdentity: `tool402:wallet-command:v1:296:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:JJJJJJJJJJJJJJJJJJJJJw`,
        canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
      () => offeringDocument(original),
    ],
  ];
  for (const [conflicting, stored] of conflicts) {
    const conflictDb = database({
      authorities: [authority(conflicting)],
      offerings: [stored(conflicting)],
    });
    assert.deepEqual(
      await offerings.admitOfferingCreate._handler(conflictDb.ctx, conflicting),
      { status: "IDEMPOTENCY_CONFLICT" },
    );
    assert.equal(conflictDb.writes.length, 1);
    assert.deepEqual(conflictDb.writes[0].document, {
      replayIdentity: conflicting.replayIdentity,
      commandType: "offering.create",
      outcome: "IDEMPOTENCY_CONFLICT",
      claimedAt: conflictDb.writes[0].document.claimedAt,
    });
  }
});

implementedTest("consumes a fresh identity as an unlinked conflict for duplicate or malformed stored offerings", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const missingPayloadHash = offeringDocument(input);
  delete missingPayloadHash.payloadHash;
  const accessorOffering = { ...offeringDocument(input) };
  let accessorReads = 0;
  Object.defineProperty(accessorOffering, "state", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("stored offering accessor must not run");
    },
  });
  const malformed = [
    [offeringDocument(input), offeringDocument(input)],
    [null],
    [[]],
    [offeringDocument(input, { state: "READY" })],
    [offeringDocument(input, { version: 2 })],
    [offeringDocument(input, { principalPublicId: "principal_other" })],
    [offeringDocument(input, { canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })],
    [offeringDocument(input, { authorityVersion: "authority-other" })],
    [offeringDocument(input, { payloadHash: `0x${"a".repeat(64)}` })],
    [offeringDocument(input, { idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDA" })],
    [offeringDocument(input, { acceptedAt: 1 })],
    [missingPayloadHash],
    [Object.assign(Object.create(null), offeringDocument(input))],
    [{ ...offeringDocument(input), [Symbol("unexpected")]: true }],
    [accessorOffering],
    [new Proxy(offeringDocument(input), { ownKeys() { throw new Error("hostile stored reflection"); } })],
  ];
  for (const storedOfferings of malformed) {
    const db = database({ authorities: [authority(input)], offerings: storedOfferings });
    assert.deepEqual(
      await offerings.admitOfferingCreate._handler(db.ctx, input),
      { status: "IDEMPOTENCY_CONFLICT" },
    );
    assert.deepEqual(db.reads, expectedOfferingReads(input));
    assertUnlinkedConflictClaim(db, input);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("moves exactly one safe DRAFT offering to ASSET_PENDING only for its matching PREPARED ATS_CREATE attempt", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const draft = offeringDocument(input);
  const attempt = atsCreateAttempt(input);
  const db = database({
    offerings: [draft],
    attempts: [attempt],
    getRows: { [offeringId]: draft, [atsAttemptId]: attempt },
    queryResults: { "offerings:by_ats_attempt_id": [] },
  });

  assert.deepEqual(
    await offerings.markAssetPending._handler(db.ctx, { offeringId, attemptId: atsAttemptId }),
    { offeringId, state: "ASSET_PENDING" },
  );
  assert.deepEqual(db.reads, expectedPendingReads());
  assert.equal(db.writes.length, 1);
  assert.equal(db.writes[0].kind, "patch");
  assert.equal(db.writes[0].id, offeringId);
  assert.equal(typeof db.writes[0].document.updatedAt, "bigint");
  assert.deepEqual(db.writes[0].document, {
    state: "ASSET_PENDING",
    atsAttemptId,
    updatedAt: db.writes[0].document.updatedAt,
  });
});

implementedTest("rejects every unsafe pending transition without a write", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const draft = offeringDocument(input);
  const attempt = atsCreateAttempt(input);
  const malformedDraft = { ...draft };
  let accessorReads = 0;
  Object.defineProperty(malformedDraft, "state", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("stored offering accessor must not run");
    },
  });
  const cases = [
    [null, attempt, []],
    [offeringDocument(input, { state: "ASSET_PENDING", atsAttemptId }), attempt, []],
    [offeringDocument(input, { atsAttemptId }), attempt, []],
    [offeringDocument(input, { atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }), attempt, []],
    [draft, null, []],
    [draft, atsCreateAttempt(input, { state: "OUTCOME_UNKNOWN" }), []],
    [draft, atsCreateAttempt(input, { operationKind: "ATS_ISSUE" }), []],
    [draft, atsCreateAttempt(input, { subjectPublicId: "subject_other" }), []],
    [draft, Object.assign(Object.create(null), attempt), []],
    [Object.assign(Object.create(null), draft), attempt, []],
    [malformedDraft, attempt, []],
    [draft, attempt, [offeringDocument(input, { _id: "offerings:already-linked", state: "ASSET_PENDING", atsAttemptId })]],
    [draft, attempt, [null]],
    [draft, attempt, [offeringDocument(input, { _id: "offerings:linked-a", state: "ASSET_PENDING", atsAttemptId }), offeringDocument(input, { _id: "offerings:linked-b", state: "ASSET_PENDING", atsAttemptId })]],
  ];
  for (const [storedOffering, storedAttempt, linkedRows] of cases) {
    const db = database({
      offerings: storedOffering === null ? [] : [storedOffering],
      attempts: storedAttempt === null ? [] : [storedAttempt],
      getRows: { [offeringId]: storedOffering, [atsAttemptId]: storedAttempt },
      queryResults: { "offerings:by_ats_attempt_id": linkedRows },
    });
    await assert.rejects(
      () => offerings.markAssetPending._handler(db.ctx, { offeringId, attemptId: atsAttemptId }),
      undefined,
    );
    assert.deepEqual(db.writes, []);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("fails closed: markAssetReady has no receipt-proof authority", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const pending = offeringDocument(input, { state: "ASSET_PENDING", atsAttemptId });
  const atsAssetEvmAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const db = database({ offerings: [pending] });

  await assert.rejects(
    offerings.markAssetReady._handler(db.ctx, { attemptId: atsAttemptId, atsAssetEvmAddress }),
  );
  assert.deepEqual(db.reads, []);
  assert.deepEqual(db.writes, []);
});

implementedTest("rejects malformed address and every unsafe indexed ready transition without a write", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const pending = offeringDocument(input, { state: "ASSET_PENDING", atsAttemptId });
  for (const atsAssetEvmAddress of [
    "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaag",
  ]) {
    const db = database({ offerings: [pending] });
    await assert.rejects(
      () => offerings.markAssetReady._handler(db.ctx, { attemptId: atsAttemptId, atsAssetEvmAddress }),
      undefined,
    );
    assert.deepEqual(db.reads, []);
    assert.deepEqual(db.writes, []);
  }

  const accessorPending = { ...pending };
  let accessorReads = 0;
  Object.defineProperty(accessorPending, "state", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("stored pending accessor must not run");
    },
  });
  const malformed = [
    [],
    [pending, { ...pending, _id: "offerings:duplicate" }],
    [null],
    [[]],
    [offeringDocument(input, { state: "DRAFT", atsAttemptId })],
    [offeringDocument(input, { state: "ASSET_PENDING", atsAttemptId: "externalPrepareCommandAttempts:other" })],
    [offeringDocument(input, { state: "ASSET_PENDING", atsAttemptId, atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })],
    [Object.assign(Object.create(null), pending)],
    [{ ...pending, [Symbol("unexpected")]: true }],
    [accessorPending],
    [new Proxy(pending, { ownKeys() { throw new Error("hostile stored reflection"); } })],
  ];
  for (const storedOfferings of malformed) {
    const db = database({ offerings: storedOfferings });
    await assert.rejects(
      () => offerings.markAssetReady._handler(db.ctx, {
        attemptId: atsAttemptId,
        atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
      undefined,
    );
    assert.deepEqual(db.reads, []);
    assert.deepEqual(db.writes, []);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("returns only the highest sanitized offering projection and fails closed on duplicate rows", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const newest = offeringDocument(input, {
    _id: "offerings:newest",
    version: 2,
    state: "READY",
    atsAttemptId,
    atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    updatedAt: 2n,
  });
  const older = offeringDocument(input, { _id: "offerings:older", version: 1, updatedAt: 1n });
  const db = database({ offerings: [newest, older] });
  const projection = await offerings.getPublicProjection._handler(db.ctx, {
    offeringPublicId: input.payload.offeringPublicId,
  });
  assert.deepEqual(db.reads, [{
    table: "offerings",
    index: "by_offering_public_id_and_version",
    filters: [["offeringPublicId", input.payload.offeringPublicId]],
    orders: ["desc"],
    limit: 2,
  }]);
  assert.deepEqual(projection, {
    offeringPublicId: newest.offeringPublicId,
    version: newest.version,
    subjectPublicId: newest.subjectPublicId,
    state: newest.state,
    definition: newest.definition,
    narrative: newest.narrative,
    advertisedQuickPriceTinybars: newest.advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars: newest.advertisedStandardPriceTinybars,
    canonicalSignerAddress: newest.canonicalSignerAddress,
    atsAssetEvmAddress: newest.atsAssetEvmAddress,
    acceptedAt: newest.acceptedAt,
    updatedAt: newest.updatedAt,
  });
  assertNoSensitiveKeys(projection);

  const absentDb = database();
  assert.equal(
    await offerings.getPublicProjection._handler(absentDb.ctx, { offeringPublicId: input.payload.offeringPublicId }),
    null,
  );
  assert.deepEqual(absentDb.writes, []);

  const duplicateDb = database({ offerings: [newest, { ...newest, _id: "offerings:duplicate" }] });
  await assert.rejects(
    () => offerings.getPublicProjection._handler(duplicateDb.ctx, { offeringPublicId: input.payload.offeringPublicId }),
    undefined,
  );
  assert.deepEqual(duplicateDb.writes, []);

  const accessorOffering = { ...newest };
  let accessorReads = 0;
  Object.defineProperty(accessorOffering, "state", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("stored projection accessor must not run");
    },
  });
  const malformedRows = [
    [null],
    [[]],
    [offeringDocument(input, { state: "READY" })],
    [offeringDocument(input, { state: "ASSET_PENDING", atsAttemptId, atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })],
    [offeringDocument(input, { canonicalSignerAddress: input.canonicalSignerAddress.toUpperCase() })],
    [Object.assign(Object.create(null), newest)],
    [{ ...newest, [Symbol("unexpected")]: true }],
    [accessorOffering],
    [new Proxy(newest, { ownKeys() { throw new Error("hostile stored reflection"); } })],
  ];
  for (const storedOfferings of malformedRows) {
    const db = database({ offerings: storedOfferings });
    await assert.rejects(
      () => offerings.getPublicProjection._handler(db.ctx, { offeringPublicId: input.payload.offeringPublicId }),
      undefined,
    );
    assert.deepEqual(db.reads, [{
      table: "offerings",
      index: "by_offering_public_id_and_version",
      filters: [["offeringPublicId", input.payload.offeringPublicId]],
      orders: ["desc"],
      limit: 2,
    }]);
    assert.deepEqual(db.writes, []);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("projects a durable ATS resume reference only from its exact linked PREPARED attempt", async (t) => {
  const { offerings } = await loadOfferings(t);
  const input = admissionInput();
  const pending = offeringDocument(input, { state: "ASSET_PENDING", atsAttemptId });
  const prepared = atsCreateAttempt(input);
  const db = database({ offerings: [pending], attempts: [prepared] });

  assert.deepEqual(
    await offerings.getPublicProjection._handler(db.ctx, {
      offeringPublicId: input.payload.offeringPublicId,
    }),
    {
      offeringPublicId: pending.offeringPublicId,
      version: pending.version,
      subjectPublicId: pending.subjectPublicId,
      state: "ASSET_PENDING",
      definition: pending.definition,
      narrative: pending.narrative,
      advertisedQuickPriceTinybars: pending.advertisedQuickPriceTinybars,
      advertisedStandardPriceTinybars: pending.advertisedStandardPriceTinybars,
      canonicalSignerAddress: pending.canonicalSignerAddress,
      atsAttemptPublicId: prepared.idempotencyKey,
      acceptedAt: pending.acceptedAt,
      updatedAt: pending.updatedAt,
    },
  );
  assert.deepEqual(db.reads, [
    {
      table: "offerings",
      index: "by_offering_public_id_and_version",
      filters: [["offeringPublicId", input.payload.offeringPublicId]],
      orders: ["desc"],
      limit: 2,
    },
    { table: "externalPrepareCommandAttempts", id: atsAttemptId, kind: "get" },
  ]);

  const submitted = atsCreateAttempt(input, {
    state: "SUBMITTED",
    candidateTransactionId: "0.0.7314364-1789162676-441089095",
    candidateEvmAddress: "0x1111111111111111111111111111111111111111",
  });
  const submittedDb = database({ offerings: [pending], attempts: [submitted] });
  assert.deepEqual(
    await offerings.getPublicProjection._handler(submittedDb.ctx, {
      offeringPublicId: input.payload.offeringPublicId,
    }),
    {
      offeringPublicId: pending.offeringPublicId,
      version: pending.version,
      subjectPublicId: pending.subjectPublicId,
      state: "ASSET_PENDING",
      definition: pending.definition,
      narrative: pending.narrative,
      advertisedQuickPriceTinybars: pending.advertisedQuickPriceTinybars,
      advertisedStandardPriceTinybars: pending.advertisedStandardPriceTinybars,
      canonicalSignerAddress: pending.canonicalSignerAddress,
      atsAttemptPublicId: submitted.idempotencyKey,
      acceptedAt: pending.acceptedAt,
      updatedAt: pending.updatedAt,
    },
  );

  for (const attempt of [
    { ...prepared, state: "CONFIRMED" },
    { ...submitted, candidateTransactionId: undefined },
    { ...submitted, candidateEvmAddress: "0x111111111111111111111111111111111111111A" },
    { ...prepared, canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    { ...prepared, principalPublicId: "foreign-principal" },
    { ...prepared, authorityVersion: "foreign-authority" },
    { ...prepared, subjectPublicId: "foreign_subject" },
    { ...prepared, idempotencyKey: "not-a-canonical-attempt-id" },
  ]) {
    const invalid = database({ offerings: [pending], attempts: [attempt] });
    await assert.rejects(
      () => offerings.getPublicProjection._handler(invalid.ctx, {
        offeringPublicId: input.payload.offeringPublicId,
      }),
    );
    assert.deepEqual(invalid.writes, []);
  }
});
