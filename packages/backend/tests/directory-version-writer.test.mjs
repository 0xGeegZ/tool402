import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  canonicalizeRequirements,
  canonicalDirectoryPublishPayloadBytes,
  parseDirectoryPublishPayload,
} from "@tool402/core";
import { keccak256, stringToHex } from "viem";

const admissionUrl = new URL("../src/offering-command-admission.ts", import.meta.url);
const directoryUrl = new URL("../convex/directory_versions.ts", import.meta.url);
const admissionPath = fileURLToPath(admissionUrl);
const directoryPath = fileURLToPath(directoryUrl);
const sourcesExist = existsSync(admissionPath) && existsSync(directoryPath);
const implementedTest = sourcesExist ? test : test.skip;

const durableNow = Date.parse("2026-09-09T13:00:30.000Z");
const issuedAt = "2026-09-09T13:00:00.000Z";
const expiresAt = "2026-09-09T13:04:00.000Z";
const canonicalSignerAddress = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const offeringId = "offerings:ready";
const directoryId = "directoryVersions:active";

function directoryPayload(overrides = {}) {
  return {
    schemaVersion: 1,
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    directoryVersion: 1,
    record: {
      schemaVersion: 1,
      serviceId: "riskscan_quick",
      serviceSlug: "riskscan",
      offeringPublicId: "offering_42",
      offeringVersion: 1,
      capabilities: ["evm-contract-risk-signals"],
      x402Endpoint: "https://api.tool402.test/riskscan",
      webUrl: "https://tool402.test/",
      paymentProtocol: "x402",
      paymentNetwork: "hedera-testnet",
      asset: "HBAR",
      advertisedTiers: ["quick", "standard"],
      issuerRevenueAccount: "0.0.123",
      clearingAccount: "0.0.456",
      status: "active",
      publishedAt: "2026-09-09T12:00:00.000Z",
    },
    idempotencyKey: "CCCCCCCCCCCCCCCCCCCCCg",
    expiresAt,
    ...overrides,
  };
}

function hashPayload(payload) {
  const bytes = canonicalDirectoryPublishPayloadBytes(parseDirectoryPublishPayload(payload));
  return keccak256(stringToHex(new TextDecoder().decode(bytes)));
}

function rawJcsPayloadHash(payload) {
  return keccak256(stringToHex(canonicalizeRequirements(payload)));
}

function admissionInput(overrides = {}) {
  const payload = overrides.payload ?? directoryPayload();
  const nonce = overrides.nonce ?? "AAAAAAAAAAAAAAAAAAAAAA";
  const payloadHash = overrides.payloadHash ?? hashPayload(payload);
  return {
    version: 1,
    type: "directory.publish",
    chainId: 296,
    canonicalSignerAddress,
    nonce,
    issuedAt,
    expiresAt: payload.expiresAt,
    payloadHash,
    replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:${nonce}`,
    principalPublicId: "principal_42",
    role: "ISSUER",
    authorityVersion: "authority-v1",
    payload,
    ...overrides,
  };
}

function authority(input = admissionInput(), overrides = {}) {
  return {
    _id: "commandAuthorities:issuer",
    _creationTime: durableNow - 1,
    principalPublicId: input.principalPublicId,
    canonicalSignerAddress: input.canonicalSignerAddress,
    chainId: input.chainId,
    role: "ISSUER",
    ownedSubjectPublicIds: ["subject_42"],
    authorityVersion: input.authorityVersion,
    enabled: true,
    ...overrides,
  };
}

function offeringDocument(input = admissionInput(), overrides = {}) {
  return {
    _id: offeringId,
    _creationTime: durableNow - 1,
    offeringPublicId: input.payload.offeringPublicId,
    subjectPublicId: "subject_42",
    canonicalSignerAddress: input.canonicalSignerAddress,
    principalPublicId: input.principalPublicId,
    authorityVersion: input.authorityVersion,
    payloadHash: `0x${"a".repeat(64)}`,
    idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBQ",
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    version: input.payload.offeringVersion,
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
    state: "READY",
    atsAttemptId: "externalPrepareCommandAttempts:prepared",
    atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ...overrides,
  };
}

function publishedOffering(input = admissionInput(), overrides = {}) {
  return offeringDocument(input, {
    state: "OPEN",
    activeDirectoryVersionId: directoryId,
    ...overrides,
  });
}

function directoryDocument(input = admissionInput(), overrides = {}) {
  const payload = input.payload;
  return {
    _id: directoryId,
    _creationTime: durableNow - 1,
    offeringPublicId: payload.offeringPublicId,
    payloadHash: input.payloadHash,
    canonicalSignerAddress: input.canonicalSignerAddress,
    idempotencyKey: payload.idempotencyKey,
    offeringVersion: payload.offeringVersion,
    directoryVersion: payload.directoryVersion,
    serviceSlug: payload.record.serviceSlug,
    record: structuredClone(payload.record),
    state: "ACTIVE",
    acceptedAt: 1n,
    ...overrides,
  };
}

function replayClaim(input = admissionInput(), overrides = {}) {
  return {
    _id: "walletCommandReplayClaims:claimed",
    _creationTime: durableNow - 1,
    replayIdentity: input.replayIdentity,
    commandType: "directory.publish",
    outcome: "NEW",
    targetId: directoryId,
    claimedAt: 1n,
    ...overrides,
  };
}

function accessorBackedRow(row, field) {
  let reads = 0;
  const hostile = { ...row };
  Object.defineProperty(hostile, field, {
    configurable: true,
    enumerable: true,
    get() {
      reads += 1;
      return row[field];
    },
  });
  return {
    reads() {
      return reads;
    },
    row: hostile,
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
  directoryVersions = [],
  directoryPatchRows = [],
} = {}) {
  const rows = {
    commandAuthorities: [...authorities],
    walletCommandReplayClaims: [...claims],
    offerings: [...offerings],
    directoryVersions,
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
              return queryRows(rows, table, request).slice(0, limit);
            },
          };
          return builder;
        },
      };
    },
    async insert(table, document) {
      accesses.push(table);
      assert.ok(["directoryVersions", "walletCommandReplayClaims"].includes(table), `unexpected insert: ${table}`);
      const id = table === "directoryVersions"
        ? directoryId
        : `walletCommandReplayClaims:${writes.length}`;
      const copy = structuredClone(document);
      writes.push({ kind: "insert", table, document: copy, id });
      if (Array.isArray(rows[table])) {
        rows[table].push({ _id: id, _creationTime: durableNow, ...structuredClone(copy) });
      }
      return id;
    },
    async patch(id, document) {
      accesses.push("patch");
      const copy = structuredClone(document);
      writes.push({ kind: "patch", id, document: copy });
      const table = String(id).split(":", 1)[0];
      const candidates = Array.isArray(rows[table])
        ? rows[table]
        : table === "directoryVersions"
          ? directoryPatchRows
          : null;
      if (candidates === null) throw new Error(`unknown patch target: ${id}`);
      const row = candidates.find((candidate) => candidate?._id === id);
      if (row === undefined) throw new Error(`unknown patch target: ${id}`);
      Object.assign(row, copy);
    },
    get: forbidden,
    replace: forbidden,
    delete: forbidden,
  };

  return {
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

function expectedDirectoryReads(input) {
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
    {
      table: "directoryVersions",
      index: "by_offering_public_id_and_directory_version",
      filters: [["offeringPublicId", input.payload.offeringPublicId], ["directoryVersion", input.payload.directoryVersion]],
      orders: [],
      limit: 2,
    },
    {
      table: "directoryVersions",
      index: "by_service_slug_and_state",
      filters: [["serviceSlug", "riskscan"], ["state", "ACTIVE"]],
      orders: [],
      limit: 2,
    },
  ];
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

const directoryRecordValidator = object({
  schemaVersion: literal(1),
  serviceId: string,
  serviceSlug: literal("riskscan"),
  offeringPublicId: string,
  offeringVersion: number,
  capabilities: array(literal("evm-contract-risk-signals")),
  x402Endpoint: string,
  webUrl: optional(string),
  paymentProtocol: literal("x402"),
  paymentNetwork: literal("hedera-testnet"),
  asset: literal("HBAR"),
  advertisedTiers: array(union("quick", "standard")),
  issuerRevenueAccount: string,
  clearingAccount: string,
  status: literal("active"),
  publishedAt: string,
});
const directoryPayloadValidator = object({
  schemaVersion: literal(1),
  offeringPublicId: string,
  offeringVersion: number,
  directoryVersion: number,
  record: directoryRecordValidator,
  idempotencyKey: string,
  expiresAt: string,
});
const directoryCommandValidator = object({
  version: literal(1),
  type: literal("directory.publish"),
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
  payload: directoryPayloadValidator,
});
const activeDirectoryProjectionValidator = object({
  offeringPublicId: string,
  offeringVersion: number,
  directoryVersion: number,
  serviceSlug: literal("riskscan"),
  record: directoryRecordValidator,
  state: literal("ACTIVE"),
  acceptedAt: bigint,
});

function sortedReturnArms(validator) {
  return validator.value.sort((left, right) => {
    const leftStatus = left.value?.status?.fieldType?.value ?? left.type;
    const rightStatus = right.value?.status?.fieldType?.value ?? right.type;
    return leftStatus.localeCompare(rightStatus);
  });
}

async function loadDirectory(t, now = durableNow) {
  t.mock.timers.enable({ apis: ["Date"], now });
  return import(directoryUrl.href);
}

function assertNoAdmissionInternals(record) {
  for (const key of [
    "payloadHash",
    "canonicalSignerAddress",
    "idempotencyKey",
    "principalPublicId",
    "authorityVersion",
    "replayIdentity",
    "_id",
    "_creationTime",
  ]) {
    assert.equal(Object.hasOwn(record, key), false, `projection must omit ${key}`);
  }
}

function assertNoDirectoryOrOfferingWrite(writes) {
  assert.equal(
    writes.some(({ id, table }) => table === "directoryVersions" || String(id).startsWith("offerings:")),
    false,
    "unsafe stored linkage must not write a directory or offering row",
  );
}

function assertUnlinkedDirectoryConflictClaim(db, input) {
  assert.equal(db.writes.length, 1);
  assert.deepEqual(db.writes[0], {
    kind: "insert",
    table: "walletCommandReplayClaims",
    id: "walletCommandReplayClaims:0",
    document: {
      replayIdentity: input.replayIdentity,
      commandType: "directory.publish",
      outcome: "IDEMPOTENCY_CONFLICT",
      claimedAt: db.writes[0].document.claimedAt,
    },
  });
  assert.equal(typeof db.writes[0].document.claimedAt, "bigint");
}

test("requires the declared M40 directory command and Convex source modules", () => {
  assert.equal(existsSync(admissionPath), true, `missing declared source module: ${admissionPath}`);
  assert.equal(existsSync(directoryPath), true, `missing declared source module: ${directoryPath}`);
});

implementedTest("registers the exact closed directory admission and public-projection interfaces", async (t) => {
  const directory = await loadDirectory(t);
  assert.deepEqual(Object.keys(directory).sort(), ["admitDirectoryPublish", "getActive"]);
  assert.equal(directory.admitDirectoryPublish.isInternal, true);
  assert.equal(directory.admitDirectoryPublish.isMutation, true);
  for (const flag of ["isPublic", "isQuery", "isAction"]) {
    assert.equal(directory.admitDirectoryPublish[flag], undefined);
  }
  assert.equal(directory.getActive.isQuery, true);
  assert.equal(directory.getActive.isPublic, true);
  for (const flag of ["isInternal", "isMutation", "isAction"]) {
    assert.equal(directory.getActive[flag], undefined);
  }
  assert.deepEqual(JSON.parse(directory.admitDirectoryPublish.exportArgs()), directoryCommandValidator);
  assert.deepEqual(
    sortedReturnArms(JSON.parse(directory.admitDirectoryPublish.exportReturns())),
    sortedReturnArms({
      type: "union",
      value: [
        object({ status: literal("NEW"), targetId: id("directoryVersions"), state: literal("ACTIVE") }),
        object({ status: literal("IDEMPOTENCY_REPLAYED"), targetId: id("directoryVersions"), state: literal("ACTIVE") }),
        object({ status: literal("COMMAND_REPLAYED") }),
        object({ status: literal("IDEMPOTENCY_CONFLICT") }),
        object({ status: literal("PRECONDITION_UNMET") }),
      ],
    }),
  );
  assert.deepEqual(JSON.parse(directory.getActive.exportArgs()), object({
    serviceSlug: literal("riskscan"),
  }));
  assert.deepEqual(
    sortedReturnArms(JSON.parse(directory.getActive.exportReturns())),
    sortedReturnArms({ type: "union", value: [{ type: "null" }, activeDirectoryProjectionValidator] }),
  );
  for (const source of [readFileSync(admissionPath, "utf8"), readFileSync(directoryPath, "utf8")]) {
    assert.doesNotMatch(
      source,
      /\b(?:fetch|runAction|runMutation|runQuery|actionGeneric|internalActionGeneric|httpActionGeneric)\b|process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|viem\/accounts|viem\/actions|createWalletClient|createPublicClient|_generated|convex\/nextjs|from\s+["'](?:node:)?https?["']/u,
    );
  }
  const admissionSource = readFileSync(admissionPath, "utf8");
  assert.match(admissionSource, /\bparseDirectoryPublishPayload\b/u);
  assert.match(admissionSource, /\bcanonicalDirectoryPublishPayloadBytes\b/u);
  assert.doesNotMatch(admissionSource, /\bDate\.now\b/u);
});

implementedTest("rejects malformed serialized directory commands before all durable access", async (t) => {
  const directory = await loadDirectory(t);
  const valid = admissionInput();
  const rawMalformedPayload = {
    ...directoryPayload(),
    untrustedExtraField: "parser-first",
  };
  const rawMalformedInput = admissionInput({
    payload: rawMalformedPayload,
    payloadHash: rawJcsPayloadHash(rawMalformedPayload),
  });
  const rawCrossFieldMismatchPayload = directoryPayload({
    record: {
      ...directoryPayload().record,
      offeringPublicId: "offering_other",
    },
  });
  const rawCrossFieldMismatchInput = admissionInput({
    payload: rawCrossFieldMismatchPayload,
    payloadHash: rawJcsPayloadHash(rawCrossFieldMismatchPayload),
  });
  assert.equal(rawMalformedInput.payloadHash, rawJcsPayloadHash(rawMalformedPayload));
  assert.equal(
    rawCrossFieldMismatchInput.payloadHash,
    rawJcsPayloadHash(rawCrossFieldMismatchPayload),
  );
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
    { ...valid, type: "offering.create" },
    { ...valid, chainId: 295 },
    { ...valid, role: "BACKER" },
    { ...valid, principalPublicId: "" },
    { ...valid, principalPublicId: null },
    { ...valid, authorityVersion: "" },
    { ...valid, authorityVersion: null },
    { ...valid, canonicalSignerAddress: valid.canonicalSignerAddress.toUpperCase() },
    { ...valid, nonce: "not-a-canonical-nonce" },
    { ...valid, replayIdentity: "forged" },
    {
      ...valid,
      canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    {
      ...valid,
      nonce: "AAAAAAAAAAAAAAAAAAAAAQ",
    },
    { ...valid, expiresAt: "2026-09-09T13:04:00Z" },
    { ...valid, issuedAt: valid.expiresAt },
    { ...valid, issuedAt: "2026-09-09T12:58:59.999Z" },
    { ...valid, issuedAt: "2026-09-09T13:01:30.001Z" },
    { ...valid, payloadHash: `0x${"0".repeat(64)}` },
    { ...valid, payload: { ...valid.payload, directoryVersion: 2 } },
    { ...valid, payload: { ...valid.payload, expiresAt: "2026-09-09T13:03:00.000Z" } },
    rawMalformedInput,
    rawCrossFieldMismatchInput,
    customPrototype,
    symbolKeyed,
    accessorBacked,
    new Proxy(valid, { ownKeys() { throw new Error("hostile reflection"); } }),
  ];
  for (const value of malformed) {
    const db = database();
    await assert.rejects(() => directory.admitDirectoryPublish._handler(db.ctx, value), undefined);
    assert.deepEqual(db.accesses, []);
  }
  assert.equal(accessorReads, 0);
});

implementedTest("rejects exact durable-time boundary violations before durable access", async (t) => {
  const directory = await loadDirectory(t);
  const payloadExpiryMismatch = directoryPayload({
    expiresAt: "2026-09-09T13:03:00.000Z",
  });
  const tooLongPayload = directoryPayload({
    expiresAt: "2026-09-09T13:05:00.000Z",
  });
  const malformed = [
    admissionInput({
      payload: payloadExpiryMismatch,
      expiresAt,
      payloadHash: hashPayload(payloadExpiryMismatch),
    }),
    admissionInput({ issuedAt: "2026-09-09T13:01:30.001Z" }),
    admissionInput({
      payload: tooLongPayload,
      issuedAt: "2026-09-09T12:59:59.999Z",
    }),
  ];

  for (const input of malformed) {
    const db = database();
    await assert.rejects(() => directory.admitDirectoryPublish._handler(db.ctx, input), undefined);
    assert.deepEqual(db.accesses, []);
  }
});

implementedTest("treats inclusive command-time boundaries as valid", async (t) => {
  const directory = await loadDirectory(t);
  const expiresAtNowPayload = directoryPayload({
    expiresAt: "2026-09-09T13:00:30.000Z",
  });
  const boundaryInputs = [
    admissionInput({ issuedAt: "2026-09-09T13:01:30.000Z" }),
    admissionInput({ issuedAt: "2026-09-09T12:59:00.000Z" }),
    admissionInput({
      payload: expiresAtNowPayload,
      issuedAt: "2026-09-09T12:55:30.000Z",
    }),
  ];

  for (const input of boundaryInputs) {
    const db = database({
      authorities: [authority(input)],
      claims: [replayClaim(input)],
      offerings: [offeringDocument(input)],
    });
    assert.deepEqual(
      await directory.admitDirectoryPublish._handler(db.ctx, input),
      { status: "COMMAND_REPLAYED" },
    );
    assert.deepEqual(db.reads, expectedDirectoryReads(input).slice(0, 2));
    assert.deepEqual(db.writes, []);
  }
});

implementedTest("rejects a command that expires one millisecond before durable verification", async (t) => {
  const directory = await loadDirectory(t, Date.parse(expiresAt) + 1);
  const db = database();
  await assert.rejects(() => directory.admitDirectoryPublish._handler(db.ctx, admissionInput()), undefined);
  assert.deepEqual(db.accesses, []);
});

implementedTest("rechecks one current issuer and defers ownership to the referenced offering before writes", async (t) => {
  const directory = await loadDirectory(t);
  const input = admissionInput();
  for (const authorities of [
    [],
    [authority(input), authority(input)],
    [authority(input, { enabled: false })],
    [authority(input, { role: "BACKER" })],
    [authority(input, { role: null })],
    [authority(input, { enabled: "true" })],
    [authority(input, { ownedSubjectPublicIds: "subject_42" })],
    [authority(input, { principalPublicId: "principal_other" })],
    [authority(input, { canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })],
    [authority(input, { chainId: 295 })],
    [authority(input, { authorityVersion: "authority-v2" })],
  ]) {
    const db = database({ authorities, claims: [replayClaim(input)], offerings: [offeringDocument(input)] });
    await assert.rejects(() => directory.admitDirectoryPublish._handler(db.ctx, input), undefined);
    assert.deepEqual(db.reads, expectedDirectoryReads(input).slice(0, 1));
    assert.deepEqual(db.writes, []);
  }

  const unownedDb = database({
    authorities: [authority(input, { ownedSubjectPublicIds: ["subject_other"] })],
    offerings: [offeringDocument(input)],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(unownedDb.ctx, input), undefined);
  assert.deepEqual(unownedDb.reads, expectedDirectoryReads(input).slice(0, 3));
  assert.deepEqual(unownedDb.writes, []);

  const mismatchedPrincipalDb = database({
    authorities: [authority(input)],
    offerings: [offeringDocument(input, { principalPublicId: "principal_other" })],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(mismatchedPrincipalDb.ctx, input), undefined);
  assert.deepEqual(mismatchedPrincipalDb.reads, expectedDirectoryReads(input).slice(0, 3));
  assert.deepEqual(mismatchedPrincipalDb.writes, []);
});

implementedTest("fails closed on malformed, duplicate, and descriptor-backed authority or replay rows", async (t) => {
  const directory = await loadDirectory(t);
  const input = admissionInput();
  const hostileAuthority = accessorBackedRow(authority(input), "enabled");
  const authorityDb = database({ authorities: [hostileAuthority.row] });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(authorityDb.ctx, input), undefined);
  assert.deepEqual(authorityDb.reads, expectedDirectoryReads(input).slice(0, 1));
  assert.deepEqual(authorityDb.writes, []);
  assert.equal(hostileAuthority.reads(), 0);

  const malformedClaimDb = database({
    authorities: [authority(input)],
    claims: [replayClaim(input, { outcome: "UNKNOWN" })],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(malformedClaimDb.ctx, input), undefined);
  assert.deepEqual(malformedClaimDb.reads, expectedDirectoryReads(input).slice(0, 2));
  assert.deepEqual(malformedClaimDb.writes, []);

  const duplicateClaimDb = database({
    authorities: [authority(input)],
    claims: [
      replayClaim(input),
      replayClaim(input, { _id: "walletCommandReplayClaims:duplicate" }),
    ],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(duplicateClaimDb.ctx, input), undefined);
  assert.deepEqual(duplicateClaimDb.reads, expectedDirectoryReads(input).slice(0, 2));
  assert.deepEqual(duplicateClaimDb.writes, []);

  const hostileClaim = accessorBackedRow(replayClaim(input), "outcome");
  const hostileClaimDb = database({
    authorities: [authority(input)],
    claims: [hostileClaim.row],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(hostileClaimDb.ctx, input), undefined);
  assert.deepEqual(hostileClaimDb.reads, expectedDirectoryReads(input).slice(0, 2));
  assert.deepEqual(hostileClaimDb.writes, []);
  assert.equal(hostileClaim.reads(), 0);
});

implementedTest("returns a replay before idempotency or offering lifecycle lookup", async (t) => {
  const directory = await loadDirectory(t);
  const input = admissionInput();
  const db = database({
    authorities: [authority(input)],
    claims: [replayClaim(input)],
    offerings: [offeringDocument(input)],
  });
  assert.deepEqual(await directory.admitDirectoryPublish._handler(db.ctx, input), { status: "COMMAND_REPLAYED" });
  assert.deepEqual(db.reads, expectedDirectoryReads(input).slice(0, 2));
  assert.deepEqual(db.writes, []);
});

implementedTest("refuses non-READY and duplicate offering or ACTIVE directory state before mutation", async (t) => {
  const directory = await loadDirectory(t);
  const input = admissionInput();
  for (const state of ["DRAFT", "ASSET_PENDING", "OPEN", "CLOSED"]) {
    const db = database({ authorities: [authority(input)], offerings: [offeringDocument(input, { state })] });
    assert.deepEqual(
      await directory.admitDirectoryPublish._handler(db.ctx, input),
      { status: "PRECONDITION_UNMET" },
      state,
    );
    assert.deepEqual(
      db.reads,
      expectedDirectoryReads(input).slice(0, state === "OPEN" ? 4 : 3),
    );
    assert.deepEqual(db.writes, []);
  }

  const missingAttempt = offeringDocument(input);
  delete missingAttempt.atsAttemptId;
  const missingAsset = offeringDocument(input);
  delete missingAsset.atsAssetEvmAddress;
  const unsafeReadyOfferings = [
    missingAttempt,
    offeringDocument(input, { atsAttemptId: "" }),
    offeringDocument(input, { atsAttemptId: null }),
    missingAsset,
    offeringDocument(input, { atsAssetEvmAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }),
    offeringDocument(input, { atsAssetEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
  ];
  for (const offering of unsafeReadyOfferings) {
    const db = database({ authorities: [authority(input)], offerings: [offering] });
    assert.deepEqual(
      await directory.admitDirectoryPublish._handler(db.ctx, input),
      { status: "PRECONDITION_UNMET" },
    );
    assert.deepEqual(db.reads, expectedDirectoryReads(input).slice(0, 3));
    assertNoDirectoryOrOfferingWrite(db.writes);
  }

  const mismatchedVersionPayload = directoryPayload({
    offeringVersion: 2,
    record: { ...directoryPayload().record, offeringVersion: 2 },
  });
  const mismatchedVersionInput = admissionInput({ payload: mismatchedVersionPayload });
  const mismatchedVersionDb = database({
    authorities: [authority(mismatchedVersionInput)],
    offerings: [offeringDocument(mismatchedVersionInput, { version: 1 })],
  });
  assert.deepEqual(
    await directory.admitDirectoryPublish._handler(mismatchedVersionDb.ctx, mismatchedVersionInput),
    { status: "PRECONDITION_UNMET" },
  );
  assert.deepEqual(mismatchedVersionDb.reads, expectedDirectoryReads(mismatchedVersionInput).slice(0, 3));
  assert.deepEqual(mismatchedVersionDb.writes, []);

  const duplicateOfferingDb = database({
    authorities: [authority(input)],
    offerings: [offeringDocument(input), offeringDocument(input, { _id: "offerings:duplicate" })],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(duplicateOfferingDb.ctx, input), undefined);
  assert.deepEqual(duplicateOfferingDb.reads, expectedDirectoryReads(input).slice(0, 3));
  assert.deepEqual(duplicateOfferingDb.writes, []);

  const activeInput = admissionInput({ payload: directoryPayload({ directoryVersion: 2 }) });
  const active = directoryDocument(activeInput, { _id: "directoryVersions:prior", directoryVersion: 1 });
  const duplicateActiveDb = database({
    authorities: [authority(activeInput)],
    offerings: [offeringDocument(activeInput)],
    directoryVersions: ({ index }) => index === "by_service_slug_and_state" ? [active, { ...active, _id: "directoryVersions:duplicate" }] : [],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(duplicateActiveDb.ctx, activeInput), undefined);
  assert.deepEqual(duplicateActiveDb.reads, expectedDirectoryReads(activeInput));
  assert.deepEqual(duplicateActiveDb.writes, []);
});

implementedTest("fails closed on malformed, duplicate, or descriptor-backed referenced offering and directory rows", async (t) => {
  const directory = await loadDirectory(t);
  const input = admissionInput();
  const malformedOfferingCases = [
    null,
    [],
    offeringDocument(input, { state: "UNKNOWN" }),
    offeringDocument(input, { principalPublicId: null }),
  ];
  for (const offerings of malformedOfferingCases.map((row) => [row])) {
    const db = database({ authorities: [authority(input)], offerings });
    await assert.rejects(() => directory.admitDirectoryPublish._handler(db.ctx, input), undefined);
    assert.deepEqual(db.reads, expectedDirectoryReads(input).slice(0, 3));
    assertNoDirectoryOrOfferingWrite(db.writes);
  }

  const hostileOffering = accessorBackedRow(offeringDocument(input), "state");
  const hostileOfferingDb = database({
    authorities: [authority(input)],
    offerings: [hostileOffering.row],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(hostileOfferingDb.ctx, input), undefined);
  assert.deepEqual(hostileOfferingDb.reads, expectedDirectoryReads(input).slice(0, 3));
  assertNoDirectoryOrOfferingWrite(hostileOfferingDb.writes);
  assert.equal(hostileOffering.reads(), 0);

  const directoryInput = admissionInput({ payload: directoryPayload({ directoryVersion: 2 }) });
  const targetRows = [
    null,
    [],
    directoryDocument(directoryInput, { record: {} }),
    directoryDocument(directoryInput, { state: "PUBLISH_PREPARED" }),
  ];
  for (const target of targetRows) {
    const db = database({
      authorities: [authority(directoryInput)],
      offerings: [offeringDocument(directoryInput)],
      directoryVersions: ({ index }) => index === "by_offering_public_id_and_directory_version" ? [target] : [],
    });
    await assert.rejects(() => directory.admitDirectoryPublish._handler(db.ctx, directoryInput), undefined);
    assert.deepEqual(db.reads, expectedDirectoryReads(directoryInput).slice(0, 4));
    assertNoDirectoryOrOfferingWrite(db.writes);
  }

  const duplicateTargetDb = database({
    authorities: [authority(directoryInput)],
    offerings: [offeringDocument(directoryInput)],
    directoryVersions: ({ index }) => index === "by_offering_public_id_and_directory_version"
      ? [directoryDocument(directoryInput), directoryDocument(directoryInput, { _id: "directoryVersions:duplicate" })]
      : [],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(duplicateTargetDb.ctx, directoryInput), undefined);
  assert.deepEqual(duplicateTargetDb.reads, expectedDirectoryReads(directoryInput).slice(0, 4));
  assertNoDirectoryOrOfferingWrite(duplicateTargetDb.writes);

  const hostileTarget = accessorBackedRow(directoryDocument(directoryInput), "state");
  const hostileTargetDb = database({
    authorities: [authority(directoryInput)],
    offerings: [offeringDocument(directoryInput)],
    directoryVersions: ({ index }) => index === "by_offering_public_id_and_directory_version" ? [hostileTarget.row] : [],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(hostileTargetDb.ctx, directoryInput), undefined);
  assert.deepEqual(hostileTargetDb.reads, expectedDirectoryReads(directoryInput).slice(0, 4));
  assertNoDirectoryOrOfferingWrite(hostileTargetDb.writes);
  assert.equal(hostileTarget.reads(), 0);

  const active = directoryDocument(directoryInput, {
    _id: "directoryVersions:active-prior",
    directoryVersion: 1,
  });
  const activeRows = [
    null,
    [],
    directoryDocument(directoryInput, { _id: "directoryVersions:active-malformed", directoryVersion: 1, record: {} }),
  ];
  for (const activeRow of activeRows) {
    const db = database({
      authorities: [authority(directoryInput)],
      offerings: [offeringDocument(directoryInput)],
      directoryVersions: ({ index }) => index === "by_service_slug_and_state" ? [activeRow] : [],
    });
    await assert.rejects(() => directory.admitDirectoryPublish._handler(db.ctx, directoryInput), undefined);
    assert.deepEqual(db.reads, expectedDirectoryReads(directoryInput));
    assertNoDirectoryOrOfferingWrite(db.writes);
  }

  const duplicateActiveDb = database({
    authorities: [authority(directoryInput)],
    offerings: [offeringDocument(directoryInput)],
    directoryVersions: ({ index }) => index === "by_service_slug_and_state"
      ? [active, { ...active, _id: "directoryVersions:active-duplicate" }]
      : [],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(duplicateActiveDb.ctx, directoryInput), undefined);
  assert.deepEqual(duplicateActiveDb.reads, expectedDirectoryReads(directoryInput));
  assertNoDirectoryOrOfferingWrite(duplicateActiveDb.writes);

  const hostileActive = accessorBackedRow(active, "record");
  const hostileActiveDb = database({
    authorities: [authority(directoryInput)],
    offerings: [offeringDocument(directoryInput)],
    directoryVersions: ({ index }) => index === "by_service_slug_and_state" ? [hostileActive.row] : [],
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(hostileActiveDb.ctx, directoryInput), undefined);
  assert.deepEqual(hostileActiveDb.reads, expectedDirectoryReads(directoryInput));
  assertNoDirectoryOrOfferingWrite(hostileActiveDb.writes);
  assert.equal(hostileActive.reads(), 0);
});

implementedTest("atomically publishes one ACTIVE directory version, supersedes the prior one, and opens its READY offering", async (t) => {
  const directory = await loadDirectory(t);
  const input = admissionInput({ payload: directoryPayload({ directoryVersion: 2 }) });
  const prior = directoryDocument(input, {
    _id: "directoryVersions:prior",
    directoryVersion: 1,
    idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDw",
  });
  const db = database({
    authorities: [authority(input)],
    offerings: [offeringDocument(input)],
    directoryVersions: ({ index }) => index === "by_service_slug_and_state" ? [prior] : [],
    directoryPatchRows: [prior],
  });

  assert.deepEqual(
    await directory.admitDirectoryPublish._handler(db.ctx, input),
    { status: "NEW", targetId: directoryId, state: "ACTIVE" },
  );
  assert.deepEqual(db.reads, expectedDirectoryReads(input));
  const inserted = db.writes.find(({ kind, table }) => kind === "insert" && table === "directoryVersions");
  assert.notEqual(inserted, undefined);
  assert.equal(typeof inserted.document.acceptedAt, "bigint");
  assert.deepEqual(inserted.document, {
    offeringPublicId: input.payload.offeringPublicId,
    payloadHash: input.payloadHash,
    canonicalSignerAddress: input.canonicalSignerAddress,
    idempotencyKey: input.payload.idempotencyKey,
    offeringVersion: input.payload.offeringVersion,
    directoryVersion: input.payload.directoryVersion,
    serviceSlug: "riskscan",
    record: input.payload.record,
    state: "ACTIVE",
    acceptedAt: inserted.document.acceptedAt,
  });
  const patches = db.writes.filter(({ kind }) => kind === "patch");
  assert.equal(patches.length, 2);
  assert.deepEqual(
    patches.find(({ id }) => id === prior._id),
    { kind: "patch", id: prior._id, document: { state: "SUPERSEDED" } },
  );
  assert.deepEqual(
    patches.find(({ id }) => id === offeringId),
    {
      kind: "patch",
      id: offeringId,
      document: {
        state: "OPEN",
        activeDirectoryVersionId: directoryId,
        updatedAt: BigInt(durableNow),
      },
    },
  );
  const claim = db.writes.find(({ kind, table }) => kind === "insert" && table === "walletCommandReplayClaims");
  assert.notEqual(claim, undefined);
  assert.equal(typeof claim.document.claimedAt, "bigint");
  assert.deepEqual(claim.document, {
    replayIdentity: input.replayIdentity,
    commandType: "directory.publish",
    outcome: "NEW",
    targetId: directoryId,
    claimedAt: claim.document.claimedAt,
  });
});

implementedTest("returns a linked idempotency replay only for the exact stored directory command context", async (t) => {
  const directory = await loadDirectory(t);
  const original = admissionInput();
  const replayed = admissionInput({
    nonce: "QQQQQQQQQQQQQQQQQQQQQQ",
    replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:QQQQQQQQQQQQQQQQQQQQQQ`,
  });
  const replayDb = database({
    authorities: [authority(replayed)],
    offerings: [publishedOffering(replayed)],
    directoryVersions: ({ index }) => {
      const persisted = directoryDocument(original);
      if (index === "by_offering_public_id_and_directory_version") return [persisted];
      if (index === "by_service_slug_and_state") return [persisted];
      return [];
    },
  });
  assert.deepEqual(
    await directory.admitDirectoryPublish._handler(replayDb.ctx, replayed),
    { status: "IDEMPOTENCY_REPLAYED", targetId: directoryId, state: "ACTIVE" },
  );
  assert.deepEqual(replayDb.reads, expectedDirectoryReads(replayed));
  assert.equal(replayDb.writes.length, 1);
  assert.deepEqual(replayDb.writes[0].document, {
    replayIdentity: replayed.replayIdentity,
    commandType: "directory.publish",
    outcome: "IDEMPOTENCY_REPLAYED",
    targetId: directoryId,
    claimedAt: replayDb.writes[0].document.claimedAt,
  });

  const conflicts = [
    [
      admissionInput({
        nonce: "gggggggggggggggggggggg",
        replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:gggggggggggggggggggggg`,
      }),
      (input) => directoryDocument(input, { canonicalSignerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
    ],
    [
      admissionInput({
        nonce: "HHHHHHHHHHHHHHHHHHHHHw",
        replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:HHHHHHHHHHHHHHHHHHHHHw`,
        payload: directoryPayload({
          record: { ...directoryPayload().record, serviceId: "riskscan_alternate" },
        }),
      }),
      () => directoryDocument(original),
    ],
    [
      admissionInput({
        nonce: "IIIIIIIIIIIIIIIIIIIIIg",
        replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:IIIIIIIIIIIIIIIIIIIIIg`,
        principalPublicId: "principal_other",
      }),
      () => directoryDocument(original),
      () => publishedOffering(original),
    ],
    [
      admissionInput({
        nonce: "JJJJJJJJJJJJJJJJJJJJJw",
        replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:JJJJJJJJJJJJJJJJJJJJJw`,
        authorityVersion: "authority-v2",
      }),
      () => directoryDocument(original),
      () => publishedOffering(original),
    ],
  ];
  for (const [conflict, stored, storedOffering] of conflicts) {
    const conflictDb = database({
      authorities: [authority(conflict)],
      offerings: [storedOffering?.(conflict) ?? publishedOffering(conflict)],
      directoryVersions: ({ index }) => index === "by_offering_public_id_and_directory_version"
        ? [stored(conflict)]
        : [],
    });
    assert.deepEqual(
      await directory.admitDirectoryPublish._handler(conflictDb.ctx, conflict),
      { status: "IDEMPOTENCY_CONFLICT" },
    );
    assert.deepEqual(conflictDb.reads, expectedDirectoryReads(conflict).slice(0, 4));
    assert.equal(conflictDb.writes.length, 1);
    assert.deepEqual(conflictDb.writes[0].document, {
      replayIdentity: conflict.replayIdentity,
      commandType: "directory.publish",
      outcome: "IDEMPOTENCY_CONFLICT",
      claimedAt: conflictDb.writes[0].document.claimedAt,
    });
  }
});

implementedTest("fails closed when an exact directory replay no longer binds one safe OPEN offering and one ACTIVE version", async (t) => {
  const directory = await loadDirectory(t);
  const original = admissionInput();
  const replayed = admissionInput({
    nonce: "QQQQQQQQQQQQQQQQQQQQQQ",
    replayIdentity: `tool402:wallet-command:v1:296:${canonicalSignerAddress}:QQQQQQQQQQQQQQQQQQQQQQ`,
  });
  const persisted = directoryDocument(original);
  const missingActiveDirectoryId = publishedOffering(replayed);
  delete missingActiveDirectoryId.activeDirectoryVersionId;
  const missingAttemptId = publishedOffering(replayed);
  delete missingAttemptId.atsAttemptId;
  const missingAssetAddress = publishedOffering(replayed);
  delete missingAssetAddress.atsAssetEvmAddress;
  const unsafeOpenOfferings = [
    publishedOffering(replayed, { activeDirectoryVersionId: "directoryVersions:other" }),
    missingActiveDirectoryId,
    missingAttemptId,
    missingAssetAddress,
    publishedOffering(replayed, { atsAssetEvmAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }),
  ];

  for (const offering of unsafeOpenOfferings) {
    const db = database({
      authorities: [authority(replayed)],
      offerings: [offering],
      directoryVersions: ({ index }) => {
        if (index === "by_offering_public_id_and_directory_version") return [persisted];
        if (index === "by_service_slug_and_state") return [persisted];
        return [];
      },
    });
    assert.deepEqual(
      await directory.admitDirectoryPublish._handler(db.ctx, replayed),
      { status: "IDEMPOTENCY_CONFLICT" },
    );
    assert.deepEqual(db.reads, expectedDirectoryReads(replayed));
    assertNoDirectoryOrOfferingWrite(db.writes);
    assertUnlinkedDirectoryConflictClaim(db, replayed);
  }

  const duplicateActiveDb = database({
    authorities: [authority(replayed)],
    offerings: [publishedOffering(replayed)],
    directoryVersions: ({ index }) => {
      if (index === "by_offering_public_id_and_directory_version") return [persisted];
      if (index === "by_service_slug_and_state") {
        return [persisted, { ...persisted, _id: "directoryVersions:duplicate-active" }];
      }
      return [];
    },
  });
  await assert.rejects(() => directory.admitDirectoryPublish._handler(duplicateActiveDb.ctx, replayed), undefined);
  assert.deepEqual(duplicateActiveDb.reads, expectedDirectoryReads(replayed));
  assert.deepEqual(duplicateActiveDb.writes, []);
});

implementedTest("returns one sanitized active directory projection and fails closed on duplicates", async (t) => {
  const directory = await loadDirectory(t);
  const input = admissionInput();
  const active = directoryDocument(input);
  const db = database({ directoryVersions: [active] });
  const projection = await directory.getActive._handler(db.ctx, { serviceSlug: "riskscan" });
  assert.deepEqual(db.reads, [{
    table: "directoryVersions",
    index: "by_service_slug_and_state",
    filters: [["serviceSlug", "riskscan"], ["state", "ACTIVE"]],
    orders: [],
    limit: 2,
  }]);
  assert.deepEqual(projection, {
    offeringPublicId: active.offeringPublicId,
    offeringVersion: active.offeringVersion,
    directoryVersion: active.directoryVersion,
    serviceSlug: active.serviceSlug,
    record: active.record,
    state: "ACTIVE",
    acceptedAt: active.acceptedAt,
  });
  assertNoAdmissionInternals(projection);

  const absentDb = database();
  assert.equal(await directory.getActive._handler(absentDb.ctx, { serviceSlug: "riskscan" }), null);
  assert.deepEqual(absentDb.writes, []);

  const duplicateDb = database({ directoryVersions: [active, { ...active, _id: "directoryVersions:duplicate" }] });
  await assert.rejects(() => directory.getActive._handler(duplicateDb.ctx, { serviceSlug: "riskscan" }), undefined);
  assert.deepEqual(duplicateDb.writes, []);
});
