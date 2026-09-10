import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const bridgeUrl = new URL("../src/lib/wallet/command-bridge.ts", import.meta.url);
const literalUrl = new URL("../src/components/provider/deploy/directory-record-literal.ts", import.meta.url);
const sourcePaths = [bridgeUrl, literalUrl].map(fileURLToPath);
const sourceExists = sourcePaths.every(existsSync);
const implementedTest = sourceExists ? test : test.skip;
let bridge;
let literal;
let core;
let state;
let command;
let relay;

const campaignCommandTypes = ["external.prepare", "offering.create", "directory.publish", "external.attachCandidate"];
const nowMilliseconds = Date.parse("2026-09-09T18:00:00.000Z");
const issuedAt = "2026-09-09T18:00:00.000Z";
const expiresAt = "2026-09-09T18:05:00.000Z";
const signer = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
const neutralCampaignSubject = "riskscan_revenue_note_demo";
const realM42Projection = Object.freeze({
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: neutralCampaignSubject,
  operationKind: "ATS_CREATE",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  canonicalParametersHash: "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9",
});
const syntheticSurplusProjection = Object.freeze({
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "caller_selected_subject",
  operationKind: "ATS_CREATE",
  expectedTarget: "0x1111111111111111111111111111111111111111",
  canonicalParametersHash: "39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a",
});
const values = Object.freeze({
  toolName: "RiskScan",
  customerProblem: "Tool operators need a bounded way to assess request risk before they continue a workflow.",
  qualifyingResource: "riskscan-local-assessment",
  quickPrice: "0.1",
  standardPrice: "0.05",
  targetAgentCustomers: "Security-oriented agent operators\nProcurement agents",
  useOfFunds: "Maintain the local assessment workflow and provider documentation.",
  risks: "Testnet terms do not promise yield, principal, or return.",
});
const candidate = Object.freeze({
  transactionId: "0.0.9213391-1789430400-000000001",
  evmAddress: "0x1111111111111111111111111111111111111111",
});
const attemptPublicId = "AAAAAAAAAAAAAAAAAAAAAA";
const done = { kind: "done" };
const actionable = { kind: "actionable" };
const blocked = { kind: "blocked" };
let draws = 0;

function randomBytes(length) {
  draws += 1;
  return Uint8Array.from({ length }, (_, index) => (index === 0 ? draws : index));
}

function completeRecord() {
  return { ...literal.directoryRecordLiteral, x402Endpoint: "https://api.tool402.test/riskscan", clearingAccount: "0.0.4200" };
}

function build(stage, overrides = {}) {
  return bridge.buildStageSignatureRequest({
    stage,
    states: [actionable, blocked, { kind: "unavailable" }, { kind: "unavailable" }],
    values,
    attemptPublicId: null,
    candidate: null,
    record: literal.directoryRecordLiteral,
    nowMilliseconds,
    randomBytes,
    ...overrides,
  });
}

function payloadOf(request) {
  return JSON.parse(new TextDecoder().decode(request.canonicalPayloadBytes));
}

function sortedJson(value) {
  return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([left], [right]) => (left < right ? -1 : 1))));
}

test("requires the declared S21 bridge and directory record literal source paths", () => {
  for (const sourcePath of sourcePaths) {
    assert.equal(existsSync(sourcePath), true, `missing declared S21 source path: ${sourcePath}`);
  }
});

test.before(async () => {
  if (!sourceExists) return;
  bridge = await import(bridgeUrl.href);
  literal = await import(literalUrl.href);
  core = await import("@tool402/core");
  state = await import("../src/components/provider/deploy/provider-deploy-state.ts");
  command = await import("../src/lib/wallet/tool402-command.ts");
  relay = await import("../src/lib/wallet/command-relay.ts");
});

implementedTest("closes the campaign command type set on the builder and the relay flow", async () => {
  assert.deepEqual([...bridge.CAMPAIGN_COMMAND_TYPES], campaignCommandTypes);
  assert.deepEqual([...command.TOOL402_COMMAND_TYPES], campaignCommandTypes);
  assert.equal(Object.isFrozen(bridge.CAMPAIGN_COMMAND_TYPES), true);
  assert.equal(command.TOOL402_COMMAND_TYPE, "external.prepare");
  for (const type of campaignCommandTypes) {
    assert.equal(bridge.isCampaignCommandType(type), true);
    const unsigned = command.createUnsignedCommand({
      type,
      signer,
      nonce: attemptPublicId,
      issuedAt,
      expiresAt,
      canonicalPayloadBytes: new TextEncoder().encode(`{"expiresAt":"${expiresAt}"}`),
    });
    assert.equal(unsigned.type, type);
  }
  for (const type of ["offering.delete", "external.Prepare", "", undefined, null, 1]) {
    assert.equal(bridge.isCampaignCommandType(type), false);
    assert.throws(() => command.createUnsignedCommand({
      type,
      signer,
      nonce: attemptPublicId,
      issuedAt,
      expiresAt,
      canonicalPayloadBytes: new TextEncoder().encode(`{"expiresAt":"${expiresAt}"}`),
    }), TypeError);
  }

  const calls = [];
  const provider = { isMetaMask: true, async request(input) { calls.push(input); return "0x128"; } };
  const bodies = [];
  const result = await relay.signAndRelayCommand(
    provider,
    { type: "offering.delete", canonicalPayloadBytes: new TextEncoder().encode(`{"expiresAt":"${expiresAt}"}`), issuedAt, expiresAt },
    { relay: async (body) => { bodies.push(body); return "ACCEPTED"; }, nowMilliseconds: () => nowMilliseconds },
  );
  assert.deepEqual(result, { kind: "signing_failed" });
  assert.deepEqual(calls, []);
  assert.deepEqual(bodies, []);
});

implementedTest("builds the stage 1 offering.create request through the accepted parser over the reviewed values", () => {
  const request = build(0);
  const payload = payloadOf(request);
  const parsed = core.parseOfferingCreatePayload(payload);

  assert.equal(request.stage, 0);
  assert.equal(request.type, "offering.create");
  assert.equal(request.issuedAt, issuedAt);
  assert.equal(request.expiresAt, expiresAt);
  assert.equal(payload.expiresAt, expiresAt);
  assert.equal(request.idempotencyKey, parsed.idempotencyKey);
  assert.equal(typeof request.title, "string");
  assert.ok(request.title.length > 0);
  assert.ok(request.description.length > 0);
  assert.equal(parsed.offeringPublicId, neutralCampaignSubject);
  assert.equal(parsed.subjectPublicId, neutralCampaignSubject);
  assert.equal(parsed.offeringVersion, 1);
  assert.equal(parsed.definition.qualifyingResource, values.qualifyingResource);
  assert.equal(parsed.definition.maturityAt, "2026-12-31T00:00:00.000Z");
  assert.deepEqual(
    Object.fromEntries(Object.entries(parsed.definition.terms).map(([key, value]) => [key, String(value)])),
    {
      version: "v1",
      fundingTargetTinybars: "100000000000",
      noteUnitPriceTinybars: "100000000",
      maximumNoteUnits: "1000",
      minimumPurchaseUnits: "10",
      reserveShareBps: "2000",
      issuerShareBps: "8000",
      platformFeeBps: "0",
      payoutCapTinybars: "150000000000",
    },
  );
  assert.deepEqual(parsed.narrative, {
    title: values.toolName,
    customerProblem: values.customerProblem,
    customerUseCases: ["Security-oriented agent operators", "Procurement agents"],
    useOfFunds: [values.useOfFunds],
    risks: [values.risks],
  });
  assert.equal(String(parsed.advertisedQuickPriceTinybars), state.hbarToTinybars(values.quickPrice));
  assert.equal(String(parsed.advertisedStandardPriceTinybars), state.hbarToTinybars(values.standardPrice));
  assert.deepEqual(request.canonicalPayloadBytes, core.canonicalOfferingCreatePayloadBytes(parsed));
});

implementedTest("preserves the Core rejection of blank and noncanonical offering resources before signing", () => {
  for (const qualifyingResource of ["", " ", " riskscan", "riskscan ", "a".repeat(257)]) {
    assert.throws(
      () => build(0, { values: { ...values, qualifyingResource } }),
      /qualifyingResource/u,
      JSON.stringify(qualifyingResource),
    );
  }
});

implementedTest("builds the stage 2 external.prepare request from the real M42 public projection without caller input", () => {
  const request = build(1, {
    states: [done, actionable, { kind: "unavailable" }, { kind: "unavailable" }],
    projection: syntheticSurplusProjection,
  });
  const payload = payloadOf(request);
  const parsed = core.parseExternalPreparePayload(payload);

  assert.equal(request.stage, 1);
  assert.equal(request.type, "external.prepare");
  assert.equal(request.expiresAt, expiresAt);
  assert.equal(request.idempotencyKey, parsed.idempotencyKey);
  assert.deepEqual(
    { ...parsed, idempotencyKey: undefined, expiresAt: undefined },
    {
      ...realM42Projection,
      idempotencyKey: undefined,
      expiresAt: undefined,
    },
  );
  assert.equal(new TextDecoder().decode(request.canonicalPayloadBytes), sortedJson(payload));
  assert.match(command.hashCommandPayload(request.canonicalPayloadBytes), /^0x[0-9a-f]{64}$/u);
});

implementedTest("builds the stage 3 external.attachCandidate request from the stage 2 key and the M44 candidate", () => {
  const request = build(2, { states: [done, done, actionable, { kind: "unavailable" }], attemptPublicId, candidate });
  const payload = payloadOf(request);
  const parsed = core.parseAttachCandidatePayload(payload);

  assert.equal(request.stage, 2);
  assert.equal(request.type, "external.attachCandidate");
  assert.equal(request.expiresAt, expiresAt);
  assert.equal(parsed.attemptPublicId, attemptPublicId);
  assert.equal(parsed.operationKind, "ATS_CREATE");
  assert.equal(parsed.candidateTransactionId, candidate.transactionId);
  assert.equal(parsed.candidateEvmAddress, candidate.evmAddress);
  assert.notEqual(parsed.idempotencyKey, attemptPublicId);
  assert.equal(request.idempotencyKey, parsed.idempotencyKey);
  assert.deepEqual(request.canonicalPayloadBytes, core.canonicalAttachCandidatePayloadBytes(parsed));
});

implementedTest("builds the stage 4 directory.publish request only from a complete record literal", () => {
  const record = completeRecord();
  const request = build(3, { states: [done, done, done, actionable], record });
  const payload = payloadOf(request);
  const parsed = core.parseDirectoryPublishPayload(payload);

  assert.equal(request.stage, 3);
  assert.equal(request.type, "directory.publish");
  assert.equal(request.expiresAt, expiresAt);
  assert.equal(parsed.offeringPublicId, neutralCampaignSubject);
  assert.equal(parsed.offeringVersion, 1);
  assert.equal(parsed.directoryVersion, 1);
  assert.equal(parsed.record.offeringPublicId, neutralCampaignSubject);
  assert.equal(parsed.record.offeringVersion, 1);
  assert.equal(parsed.record.issuerRevenueAccount, "0.0.10430887");
  assert.equal(parsed.record.clearingAccount, "0.0.4200");
  assert.equal(parsed.record.x402Endpoint, "https://api.tool402.test/riskscan");
  assert.equal(parsed.record.publishedAt, issuedAt);
  assert.equal(request.idempotencyKey, parsed.idempotencyKey);
  assert.deepEqual(request.canonicalPayloadBytes, core.canonicalDirectoryPublishPayloadBytes(parsed));
});

implementedTest("shares one expiresAt per request and never reuses an idempotency key", () => {
  const first = build(0);
  const second = build(0);
  const third = build(1, {
    states: [done, actionable, { kind: "unavailable" }, { kind: "unavailable" }],
    projection: syntheticSurplusProjection,
  });

  for (const request of [first, second, third]) {
    assert.equal(payloadOf(request).expiresAt, request.expiresAt);
    assert.equal(Date.parse(request.expiresAt) - Date.parse(request.issuedAt), 300_000);
    assert.match(request.idempotencyKey, /^[A-Za-z0-9_-]{21}[AQgw]$/u);
  }
  assert.equal(new Set([first, second, third].map((request) => request.idempotencyKey)).size, 3);
});

implementedTest("refuses a request whose predecessor is not done or whose stage precondition is missing", () => {
  assert.throws(() => build(1), /predecessor/i);
  assert.throws(() => build(1, { states: [actionable, actionable, blocked, blocked] }), /predecessor/i);
  assert.throws(() => build(2, { states: [done, done, actionable, blocked], attemptPublicId }), /candidate/i);
  assert.throws(() => build(2, { states: [done, done, actionable, blocked], candidate }), /stage 2/i);
  assert.throws(() => build(2, { states: [done, actionable, actionable, blocked], attemptPublicId, candidate }), /predecessor/i);
  assert.throws(() => build(3, { states: [done, done, done, actionable] }), /record/i);
  assert.throws(() => build(3, { states: [done, done, actionable, actionable], record: completeRecord() }), /predecessor/i);
  assert.throws(() => build(4), RangeError);
  assert.equal(build(0, { states: [actionable, blocked, blocked, blocked] }).stage, 0);
});

implementedTest("keeps caller and S16 display projections out of stage 2 while confining the neutral subject to stages 1 and 4", () => {
  const source = readFileSync(bridgeUrl, "utf8");

  assert.equal(
    /import\s*\{[^}]*\bstageBAtsCreateCommandProjection\b[^}]*\}\s+from\s+["']\.\.\/ats\/stage-b-ats-create-command-projection(?:\.ts)?["']/u.test(source),
    true,
    "the bridge must import the public M47 command projection",
  );
  assert.doesNotMatch(source, /ats-create-configuration/u);
  assert.doesNotMatch(source, /\bprojection\s*\??\s*:/u);
  assert.doesNotMatch(source, /\binput\s*\.\s*projection\b/u);
  assert.match(
    source,
    /const\s+neutralCampaignSubject\s*=\s*["']riskscan_revenue_note_demo["']/u,
  );
  assert.match(
    source,
    /case\s+0\s*:[\s\S]{0,480}offeringCreateBytes\(\s*input\.values\s*,\s*neutralCampaignSubject\s*,/u,
  );
  assert.match(
    source,
    /case\s+1\s*:[\s\S]{0,480}externalPrepareBytes\(\s*stageBAtsCreateCommandProjection\s*,/u,
  );
  assert.match(
    source,
    /case\s+3\s*:[\s\S]{0,480}directoryPublishBytes\(\s*input\.record\s*,\s*neutralCampaignSubject\s*,/u,
  );
});

implementedTest("freezes the directory record literal without inventing a clearing account or endpoint", () => {
  const record = literal.directoryRecordLiteral;

  assert.equal(Object.isFrozen(record), true);
  assert.equal(record.serviceSlug, "riskscan");
  assert.equal(record.issuerRevenueAccount, "0.0.10430887");
  assert.deepEqual([...record.capabilities], ["evm-contract-risk-signals"]);
  assert.deepEqual([...record.advertisedTiers], ["quick", "standard"]);
  assert.equal(record.paymentProtocol, "x402");
  assert.equal(record.paymentNetwork, "hedera-testnet");
  assert.equal(record.asset, "HBAR");
  assert.equal(record.status, "active");
  assert.equal(Object.hasOwn(record, "clearingAccount"), false);
  assert.equal(Object.hasOwn(record, "x402Endpoint"), false);
  assert.deepEqual(literal.missingDirectoryRecordFields(record), ["x402Endpoint", "clearingAccount"]);
  assert.equal(literal.isDirectoryRecordComplete(record), false);
  assert.equal(literal.isDirectoryRecordComplete(completeRecord()), true);
  assert.deepEqual(literal.missingDirectoryRecordFields({ ...record, x402Endpoint: "https://api.tool402.test/riskscan" }), ["clearingAccount"]);
});

implementedTest("maps a final dialog result onto the closed stage union with one path to done", () => {
  const map = (phase, outcome) => bridge.stageStateForSignatureResult({ phase, outcome });

  assert.deepEqual(map("complete", "ACCEPTED"), { kind: "done" });
  assert.deepEqual(map("complete", "REPLAYED"), { kind: "replayed" });
  assert.deepEqual(map("rejected", null), { kind: "actionable", detail: "Nothing was recorded." });
  assert.deepEqual(map("failed", null), { kind: "actionable", detail: "Nothing was recorded." });
  assert.deepEqual(map("failed", "CONFLICT"), { kind: "conflict" });
  assert.deepEqual(map("failed", "REJECTED"), { kind: "rejected" });
  assert.deepEqual(map("failed", "UNSUPPORTED_TYPE"), { kind: "unsupported_type" });
  assert.deepEqual(map("failed", "not_configured"), { kind: "unavailable" });
  assert.deepEqual(map("unknown", "transport_failure"), { kind: "unknown" });
  assert.deepEqual(map("unknown", "unexpected_response"), { kind: "unknown" });
  for (const phase of ["idle", "waiting", "checking"]) {
    assert.throws(() => map(phase, null), TypeError);
  }

  const doneResults = [];
  for (const phase of ["complete", "rejected", "failed", "unknown"]) {
    for (const outcome of [null, ...relay.RELAY_OUTCOMES]) {
      const mapped = map(phase, outcome);
      assert.equal(Object.isFrozen(mapped), true);
      assert.ok(state.providerDeployStageKinds.includes(mapped.kind));
      if (mapped.kind === "done") doneResults.push([phase, outcome]);
    }
  }
  assert.deepEqual(doneResults, [["complete", "ACCEPTED"]]);
});
