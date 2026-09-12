import assert from "node:assert/strict";
import test from "node:test";

const sourceUrl = new URL("../convex/ats_candidate_receipts.ts", import.meta.url);
const canonicalSignerAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const toolPublicId = "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const offeringPublicId = "offering_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const attemptId = "externalPrepareCommandAttempts:selected";
const candidateTransactionId = "0.0.123-1735689600-123456789";
const asset = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const transactionHash = `0x${"1".repeat(64)}`;

function authority(overrides = {}) {
  return {
    _id: "commandAuthorities:issuer",
    _creationTime: 1,
    principalPublicId: "issuer_42",
    canonicalSignerAddress,
    chainId: 296,
    role: "ISSUER",
    ownedSubjectPublicIds: [toolPublicId],
    authorityVersion: "issuer_v1",
    enabled: true,
    ...overrides,
  };
}

function providerTool(overrides = {}) {
  return {
    _id: "providerTools:selected",
    _creationTime: 1,
    toolPublicId,
    subjectPublicId: toolPublicId,
    offeringPublicId,
    serviceId: toolPublicId,
    serviceSlug: "tool-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    canonicalSignerAddress,
    chainId: 296,
    principalPublicId: "issuer_42",
    authorityVersion: "issuer_v1",
    requestId: "12345678-1234-4234-8234-123456789abc",
    offeringVersion: 1,
    directoryVersion: 1,
    createdAt: 1n,
    ...overrides,
  };
}

function offering(overrides = {}) {
  return {
    _id: "offerings:selected",
    _creationTime: 1,
    offeringPublicId,
    subjectPublicId: toolPublicId,
    canonicalSignerAddress,
    principalPublicId: "issuer_42",
    authorityVersion: "issuer_v1",
    payloadHash: `0x${"a".repeat(64)}`,
    idempotencyKey: "EEEEEEEEEEEEEEEEEEEEEw",
    advertisedQuickPriceTinybars: "10",
    advertisedStandardPriceTinybars: "25",
    version: 1,
    acceptedAt: 1n,
    updatedAt: 1n,
    definition: {
      schemaVersion: 1,
      terms: {
        version: "riskscan-revenue-note-v1", fundingTargetTinybars: "1000", noteUnitPriceTinybars: "10",
        maximumNoteUnits: "100", minimumPurchaseUnits: "1", reserveShareBps: "2000", issuerShareBps: "8000",
        platformFeeBps: "0", payoutCapTinybars: "1500",
      },
      maturityAt: "2027-09-09T00:00:00.000Z", qualifyingResource: "riskscan.quick",
    },
    narrative: {
      title: "RiskScan", customerProblem: "Risk", customerUseCases: ["Check"], useOfFunds: ["Build"], risks: ["Market"],
    },
    state: "ASSET_PENDING",
    atsAttemptId: attemptId,
    ...overrides,
  };
}

function attempt(canonicalParametersHash, overrides = {}) {
  return {
    _id: attemptId,
    _creationTime: 1,
    version: 1,
    type: "external.prepare",
    chainId: 296,
    canonicalSignerAddress,
    principalPublicId: "issuer_42",
    role: "ISSUER",
    authorityVersion: "issuer_v1",
    payloadHash: `0x${"b".repeat(64)}`,
    operationKind: "ATS_CREATE",
    subjectPublicId: toolPublicId,
    network: "hedera:testnet",
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
    canonicalParametersHash,
    idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDw",
    expiresAt: "2026-09-09T12:05:00.000Z",
    state: "SUBMITTED",
    candidateTransactionId,
    candidateEvmAddress: asset,
    acceptedAt: 1n,
    ...overrides,
  };
}

function database(rows) {
  const writes = [];
  const db = {
    async get(id) { return rows.externalPrepareCommandAttempts.find((row) => row._id === id) ?? null; },
    query(table) {
      return { withIndex(_index, _range) { return { async take(limit) { return rows[table].slice(0, limit); } }; } };
    },
    async insert(table, document) {
      const copy = structuredClone(document);
      rows[table].push({ _id: `${table}:${rows[table].length}`, _creationTime: 1, ...copy });
      writes.push({ kind: "insert", table, document: copy });
    },
    async patch(id, patch) {
      const row = Object.values(rows).flat().find((candidate) => candidate._id === id);
      assert.ok(row);
      Object.assign(row, structuredClone(patch));
      writes.push({ kind: "patch", id, patch: structuredClone(patch) });
    },
  };
  return { rows, writes, ctx: { db } };
}

async function fixture() {
  const [{ createProviderToolAtsConfiguration }, { buildFactoryDeployBondRequest, encodeFactoryDeployBond }] = await Promise.all([
    import("../src/ats/provider-tool-ats-configuration.ts"),
    import("../../../apps/web/src/lib/ats/factory-deploy-bond.ts"),
  ]);
  const configuration = createProviderToolAtsConfiguration({
    toolPublicId, subjectPublicId: toolPublicId, title: "RiskScan", canonicalSignerAddress,
  });
  const input = encodeFactoryDeployBond(buildFactoryDeployBondRequest(
    configuration.atsCreateConfiguration,
    { issuerEvmAddress: canonicalSignerAddress },
  ));
  return {
    rows: {
      commandAuthorities: [authority()],
      providerTools: [providerTool()],
      offerings: [offering()],
      externalPrepareCommandAttempts: [attempt(configuration.canonicalParametersHash)],
      providerToolReceiptBindings: [],
    },
    transaction: { hash: transactionHash, chainId: 296, from: canonicalSignerAddress, to: "0xd1f118a40f3b02883d35909ef2517e7edd78379d", input },
    receipt: { transactionHash, status: "0x1", logs: [{ address: "0xd1f118a40f3b02883d35909ef2517e7edd78379d", eventName: "BondDeployed", asset }] },
  };
}

test("corroborates only independently encoded exact calldata and writes READY after VERIFIED", async () => {
  const api = await import(sourceUrl.href);
  const data = await fixture();
  const db = database(data.rows);
  assert.deepEqual(
    await api.corroborateSelectedProviderToolAtsReceipt._handler(db.ctx, {
      attemptId, transaction: data.transaction, receipt: data.receipt,
    }),
    { status: "CONFIRMED", state: "READY" },
  );
  assert.equal(db.rows.offerings[0].state, "READY");
  assert.equal(db.rows.offerings[0].atsAssetEvmAddress, asset);
  assert.equal(db.rows.providerToolReceiptBindings.length, 1);
});

test("keeps selected offerings pending for UNKNOWN or mismatched evidence", async () => {
  const api = await import(sourceUrl.href);
  const data = await fixture();
  for (const [name, transaction, expected] of [
    ["unknown", null, { status: "OUTCOME_UNKNOWN", state: "ASSET_PENDING" }],
    ["mismatched input", { ...data.transaction, input: "0x00" }, { status: "REJECTED", state: "ASSET_PENDING" }],
  ]) {
    const db = database(structuredClone(data.rows));
    assert.deepEqual(
      await api.corroborateSelectedProviderToolAtsReceipt._handler(db.ctx, { attemptId, transaction, receipt: data.receipt }),
      expected,
      name,
    );
    assert.equal(db.rows.offerings[0].state, "ASSET_PENDING", name);
    assert.deepEqual(db.writes, [], name);
  }
});

test("replays an exact verified receipt without a second READY write", async () => {
  const api = await import(sourceUrl.href);
  const data = await fixture();
  const db = database(data.rows);
  await api.corroborateSelectedProviderToolAtsReceipt._handler(db.ctx, {
    attemptId, transaction: data.transaction, receipt: data.receipt,
  });
  const writesBeforeReplay = db.writes.length;
  assert.deepEqual(
    await api.corroborateSelectedProviderToolAtsReceipt._handler(db.ctx, {
      attemptId, transaction: data.transaction, receipt: data.receipt,
    }),
    { status: "ALREADY_CONFIRMED", state: "READY" },
  );
  assert.equal(db.writes.length, writesBeforeReplay);
});

test("rejects a changed selected-tool authority before a receipt can promote", async () => {
  const api = await import(sourceUrl.href);
  const data = await fixture();
  data.rows.commandAuthorities[0].authorityVersion = "issuer_v2";
  const db = database(data.rows);
  await assert.rejects(api.corroborateSelectedProviderToolAtsReceipt._handler(db.ctx, {
    attemptId, transaction: data.transaction, receipt: data.receipt,
  }));
  assert.equal(db.rows.offerings[0].state, "ASSET_PENDING");
  assert.deepEqual(db.writes, []);
});
