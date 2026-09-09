import assert from "node:assert/strict";
import test from "node:test";

const string = { type: "string" };
const number = { type: "number" };
const bigint = { type: "bigint" };
const boolean = { type: "boolean" };
const literal = (value) => ({ type: "literal", value });
const array = (value) => ({ type: "array", value });
const union = (...values) => ({ type: "union", value: values.map(literal) });
const optional = (fieldType) => ({ fieldType, optional: true });
const object = (fields) => ({
  type: "object",
  value: Object.fromEntries(
    Object.entries(fields).map(([key, candidate]) => [
      key,
      candidate !== null
        && typeof candidate === "object"
        && Object.hasOwn(candidate, "fieldType")
        && Object.hasOwn(candidate, "optional")
        ? candidate
        : { fieldType: candidate, optional: false },
    ]),
  ),
});
const id = (tableName) => ({ type: "id", tableName });

function tableContract(table) {
  return {
    documentType: table.documentType,
    indexes: table.indexes.map(({ indexDescriptor, fields }) => [indexDescriptor, fields]),
    searchIndexes: table.searchIndexes,
    vectorIndexes: table.vectorIndexes,
  };
}

function tableSubset(exported, names) {
  const wanted = new Set(names);
  return Object.fromEntries(
    exported.tables
      .filter(({ tableName }) => wanted.has(tableName))
      .map((table) => [table.tableName, tableContract(table)]),
  );
}

const m40Tables = ["offerings", "directoryVersions", "walletCommandReplayClaims"];
const m04Tables = [
  "riskScanRequests",
  "riskScanSettlementAttempts",
  "riskScanSettlementRecords",
  "riskScanPublicProjections",
  "riskScanOutbox",
  "riskScanEvidenceReferences",
];
const m32Tables = [
  "commandAuthorities",
  "externalPrepareCommandReplayClaims",
  "externalPrepareCommandAttempts",
];

const offeringTerms = object({
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
const offeringDefinition = object({
  schemaVersion: literal(1),
  terms: offeringTerms,
  maturityAt: string,
  qualifyingResource: string,
});
const offeringNarrative = object({
  title: string,
  customerProblem: string,
  customerUseCases: array(string),
  useOfFunds: array(string),
  risks: array(string),
});

const expectedM40 = {
  offerings: {
    documentType: object({
      offeringPublicId: string,
      subjectPublicId: string,
      canonicalSignerAddress: string,
      principalPublicId: string,
      authorityVersion: string,
      payloadHash: string,
      idempotencyKey: string,
      advertisedQuickPriceTinybars: string,
      advertisedStandardPriceTinybars: string,
      version: number,
      acceptedAt: bigint,
      updatedAt: bigint,
      definition: offeringDefinition,
      narrative: offeringNarrative,
      state: union("DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"),
      atsAttemptId: optional(id("externalPrepareCommandAttempts")),
      atsAssetEvmAddress: optional(string),
      activeDirectoryVersionId: optional(id("directoryVersions")),
    }),
    indexes: [
      ["by_offering_public_id_and_version", ["offeringPublicId", "version"]],
      ["by_ats_attempt_id", ["atsAttemptId"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
  directoryVersions: {
    documentType: object({
      offeringPublicId: string,
      payloadHash: string,
      canonicalSignerAddress: string,
      idempotencyKey: string,
      offeringVersion: number,
      directoryVersion: number,
      serviceSlug: literal("riskscan"),
      record: object({
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
      }),
      state: union("DRAFT", "PUBLISH_PREPARED", "ACTIVE", "SUPERSEDED"),
      acceptedAt: bigint,
    }),
    indexes: [
      ["by_service_slug_and_state", ["serviceSlug", "state"]],
      ["by_offering_public_id_and_directory_version", ["offeringPublicId", "directoryVersion"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
  walletCommandReplayClaims: {
    documentType: object({
      replayIdentity: string,
      commandType: union("offering.create", "directory.publish", "external.attachCandidate"),
      outcome: union("NEW", "IDEMPOTENCY_REPLAYED", "IDEMPOTENCY_CONFLICT"),
      targetId: optional(string),
      claimedAt: bigint,
    }),
    indexes: [["by_replay_identity", ["replayIdentity"]]],
    searchIndexes: [],
    vectorIndexes: [],
  },
};

const expectedM04 = {
  riskScanRequests: {
    documentType: object({
      publicId: string,
      requestRef: string,
      subjectRefHash: string,
      inputHash: string,
      state: string,
      createdAt: bigint,
      updatedAt: bigint,
    }),
    indexes: [
      ["by_public_id", ["publicId"]],
      ["by_request_ref", ["requestRef"]],
      ["by_state_and_updated_at", ["state", "updatedAt"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
  riskScanSettlementAttempts: {
    documentType: object({
      publicId: string,
      operation: string,
      idempotencyKeyHash: string,
      network: string,
      state: string,
      requestId: id("riskScanRequests"),
      candidateSettlementRef: optional(string),
      nextReconciliationAt: optional(bigint),
      createdAt: bigint,
      updatedAt: bigint,
    }),
    indexes: [
      ["by_public_id", ["publicId"]],
      ["by_request", ["requestId"]],
      ["by_idempotency_scope_and_key", ["operation", "idempotencyKeyHash"]],
      ["by_network_and_candidate", ["network", "candidateSettlementRef"]],
      ["by_state_and_next_reconciliation", ["state", "nextReconciliationAt"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
  riskScanSettlementRecords: {
    documentType: object({
      attemptId: id("riskScanSettlementAttempts"),
      network: string,
      transactionRef: string,
      verificationState: string,
      observedAt: bigint,
      finalityBoundary: optional(string),
    }),
    indexes: [
      ["by_attempt", ["attemptId"]],
      ["by_network_and_transaction_ref", ["network", "transactionRef"]],
      ["by_verification_state_and_observed_at", ["verificationState", "observedAt"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
  riskScanPublicProjections: {
    documentType: object({
      requestId: id("riskScanRequests"),
      publicState: string,
      asOf: bigint,
      safeResultHash: optional(string),
    }),
    indexes: [
      ["by_request", ["requestId"]],
      ["by_public_state_and_as_of", ["publicState", "asOf"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
  riskScanOutbox: {
    documentType: object({
      publicId: string,
      subjectType: string,
      subjectId: string,
      eventKind: string,
      idempotencyKeyHash: string,
      state: string,
      nextAttemptAt: optional(bigint),
      createdAt: bigint,
      updatedAt: bigint,
    }),
    indexes: [
      ["by_public_id", ["publicId"]],
      ["by_subject", ["subjectType", "subjectId"]],
      ["by_idempotency_scope_and_key", ["eventKind", "idempotencyKeyHash"]],
      ["by_state_and_next_attempt", ["state", "nextAttemptAt"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
  riskScanEvidenceReferences: {
    documentType: object({
      subjectType: string,
      subjectId: string,
      kind: string,
      sanitizedReference: string,
      verificationState: string,
      network: optional(string),
      observedAt: bigint,
    }),
    indexes: [
      ["by_subject", ["subjectType", "subjectId"]],
      ["by_kind_and_observed_at", ["kind", "observedAt"]],
      ["by_verification_state_and_observed_at", ["verificationState", "observedAt"]],
    ],
    searchIndexes: [],
    vectorIndexes: [],
  },
};

const expectedM32 = {
  commandAuthorities: {
    documentType: object({
      principalPublicId: string,
      canonicalSignerAddress: string,
      chainId: literal(296),
      role: union("ISSUER", "BACKER"),
      ownedSubjectPublicIds: array(string),
      authorityVersion: string,
      enabled: boolean,
    }),
    indexes: [["by_chain_id_and_canonical_signer_address", ["chainId", "canonicalSignerAddress"]]],
    searchIndexes: [],
    vectorIndexes: [],
  },
  externalPrepareCommandReplayClaims: {
    documentType: object({
      replayIdentity: string,
      outcome: union("NEW", "IDEMPOTENCY_REPLAYED", "IDEMPOTENCY_CONFLICT"),
      attemptId: optional(id("externalPrepareCommandAttempts")),
      claimedAt: bigint,
    }),
    indexes: [["by_replay_identity", ["replayIdentity"]]],
    searchIndexes: [],
    vectorIndexes: [],
  },
  externalPrepareCommandAttempts: {
    documentType: object({
      version: literal(1),
      type: literal("external.prepare"),
      chainId: literal(296),
      canonicalSignerAddress: string,
      principalPublicId: string,
      role: union("ISSUER", "BACKER"),
      authorityVersion: string,
      payloadHash: string,
      operationKind: union(
        "ATS_CREATE",
        "ATS_CONTROL_LIST",
        "ATS_ISSUE",
        "ATS_TRANSFER",
        "ATS_COUPON",
        "HEDERA_FUNDING",
      ),
      subjectPublicId: string,
      network: literal("hedera:testnet"),
      expectedTarget: string,
      canonicalParametersHash: string,
      idempotencyKey: string,
      expiresAt: string,
      state: literal("PREPARED"),
      acceptedAt: bigint,
    }),
    indexes: [["by_idempotency_key", ["idempotencyKey"]]],
    searchIndexes: [],
    vectorIndexes: [],
  },
};

test("declares exactly the additive M40 tables and preserves accepted M04 and M32 subsets", async () => {
  const { default: schema } = await import(new URL("../convex/schema.ts", import.meta.url));
  const exported = JSON.parse(schema.export());

  assert.equal(exported.schemaValidation, true);
  assert.deepEqual(
    exported.tables
      .filter(({ tableName }) => m40Tables.includes(tableName))
      .map(({ tableName }) => tableName)
      .sort(),
    [...m40Tables].sort(),
  );
  assert.deepEqual(tableSubset(exported, m40Tables), expectedM40);
  assert.deepEqual(
    exported.tables
      .filter(({ tableName }) => tableName.startsWith("riskScan"))
      .map(({ tableName }) => tableName)
      .sort(),
    [...m04Tables].sort(),
  );
  assert.deepEqual(tableSubset(exported, m04Tables), expectedM04);
  assert.deepEqual(
    exported.tables
      .filter(({ tableName }) =>
        tableName.startsWith("commandAuthorit") || tableName.startsWith("externalPrepareCommand"))
      .map(({ tableName }) => tableName)
      .sort(),
    [...m32Tables].sort(),
  );
  assert.deepEqual(tableSubset(exported, m32Tables), expectedM32);
});
