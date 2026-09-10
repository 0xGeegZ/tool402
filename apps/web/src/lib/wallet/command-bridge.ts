import {
  canonicalAttachCandidatePayloadBytes,
  canonicalDirectoryPublishPayloadBytes,
  canonicalOfferingCreatePayloadBytes,
  canonicalizeRequirements,
  parseAttachCandidatePayload,
  parseDirectoryPublishPayload,
  parseExternalPreparePayload,
  parseOfferingCreatePayload,
} from "@tool402/core";

import {
  isDirectoryRecordComplete,
  type CompleteDirectoryRecordLiteral,
  type DirectoryRecordLiteral,
} from "../../components/provider/deploy/directory-record-literal.ts";
import {
  afterDeclinedSignature,
  hbarToTinybars,
  providerDeployStages,
  stageKindForRelayOutcome,
  termsV1Economics,
  type AtsCreateCandidate,
  type ProviderDeployStageState,
} from "../../components/provider/deploy/provider-deploy-state.ts";
import type {
  SignatureDialogRequest,
  SignatureResult,
} from "../../components/wallet/signature-dialog.tsx";
import {
  createCommandNonce,
  createCommandTimestamps,
  isTool402CommandType,
  TOOL402_COMMAND_TYPES,
  type RandomBytes,
  type Tool402CommandType,
} from "./tool402-command.ts";
import { stageBAtsCreateCommandProjection } from "../ats/stage-b-ats-create-command-projection.ts";

export const CAMPAIGN_COMMAND_TYPES = TOOL402_COMMAND_TYPES;
export type CampaignCommandType = Tool402CommandType;
export const isCampaignCommandType = isTool402CommandType;

export const OFFERING_VERSION = 1;
export const DIRECTORY_VERSION = 1;
export const TERMS_VERSION = "v1";

const neutralCampaignSubject = "riskscan_revenue_note_demo";

export type DeployStageIndex = 0 | 1 | 2 | 3;

export interface CampaignReviewValues {
  readonly toolName: string;
  readonly customerProblem: string;
  readonly qualifyingResource: string;
  readonly quickPrice: string;
  readonly standardPrice: string;
  readonly targetAgentCustomers: string;
  readonly useOfFunds: string;
  readonly risks: string;
}

export interface StageRequestInput {
  readonly stage: number;
  readonly states: readonly ProviderDeployStageState[];
  readonly values: CampaignReviewValues;
  readonly attemptPublicId: string | null;
  readonly candidate: AtsCreateCandidate | null;
  readonly record: DirectoryRecordLiteral;
  readonly nowMilliseconds: number;
  readonly randomBytes?: RandomBytes;
}

export interface StageSignatureRequest extends SignatureDialogRequest {
  readonly stage: DeployStageIndex;
  readonly idempotencyKey: string;
}

const stageDescriptions: readonly string[] = [
  "Signs one offering.create command over the reviewed values. A relayed ACCEPTED records a draft offering; it creates no asset.",
  "Signs one external.prepare command for ATS_CREATE from the frozen local configuration. It sends no transaction.",
  "Signs one external.attachCandidate command binding the returned candidate to the prepared attempt. Verification stays with the backend.",
  "Signs one directory.publish command over the frozen record literal. A relayed ACCEPTED is a backend admission, not a listing.",
];

function isStageIndex(value: number): value is DeployStageIndex {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function wholeHbarToTinybars(value: string): string {
  return (BigInt(value) * 100_000_000n).toString();
}

function lines(value: string): readonly string[] {
  return value.split("\n");
}

function offeringCreateBytes(
  values: CampaignReviewValues,
  subjectPublicId: string,
  idempotencyKey: string,
  expiresAt: string,
): Uint8Array {
  const payload = parseOfferingCreatePayload({
    schemaVersion: 1,
    offeringPublicId: subjectPublicId,
    offeringVersion: OFFERING_VERSION,
    subjectPublicId,
    definition: {
      schemaVersion: 1,
      terms: {
        version: TERMS_VERSION,
        fundingTargetTinybars: wholeHbarToTinybars(termsV1Economics.fundingTargetHbar),
        noteUnitPriceTinybars: wholeHbarToTinybars(termsV1Economics.noteUnitPriceHbar),
        maximumNoteUnits: termsV1Economics.maximumNoteUnits,
        minimumPurchaseUnits: termsV1Economics.minimumPurchaseUnits,
        reserveShareBps: String(termsV1Economics.revenueRouting.backerReserveBps),
        issuerShareBps: String(termsV1Economics.revenueRouting.operatorBps),
        platformFeeBps: String(termsV1Economics.revenueRouting.feeBps),
        payoutCapTinybars: wholeHbarToTinybars(termsV1Economics.payoutCapHbar),
      },
      maturityAt: `${termsV1Economics.maturityDate}T00:00:00.000Z`,
      qualifyingResource: values.qualifyingResource,
    },
    narrative: {
      title: values.toolName,
      customerProblem: values.customerProblem,
      customerUseCases: lines(values.targetAgentCustomers),
      useOfFunds: lines(values.useOfFunds),
      risks: lines(values.risks),
    },
    advertisedQuickPriceTinybars: hbarToTinybars(values.quickPrice),
    advertisedStandardPriceTinybars: hbarToTinybars(values.standardPrice),
    idempotencyKey,
    expiresAt,
  });
  return canonicalOfferingCreatePayloadBytes(payload);
}

function externalPrepareBytes(
  stageBCommand: typeof stageBAtsCreateCommandProjection,
  idempotencyKey: string,
  expiresAt: string,
): Uint8Array {
  const payload = parseExternalPreparePayload({
    operationKind: stageBCommand.operationKind,
    subjectPublicId: stageBCommand.subjectPublicId,
    network: stageBCommand.network,
    chainId: stageBCommand.chainId,
    expectedTarget: stageBCommand.expectedTarget,
    canonicalParametersHash: stageBCommand.canonicalParametersHash,
    idempotencyKey,
    expiresAt,
  });
  return new TextEncoder().encode(canonicalizeRequirements(payload));
}

function attachCandidateBytes(
  attemptPublicId: string,
  candidate: AtsCreateCandidate,
  idempotencyKey: string,
  expiresAt: string,
): Uint8Array {
  const payload = parseAttachCandidatePayload({
    schemaVersion: 1,
    attemptPublicId,
    operationKind: "ATS_CREATE",
    candidateTransactionId: candidate.transactionId,
    candidateEvmAddress: candidate.evmAddress,
    idempotencyKey,
    expiresAt,
  });
  return canonicalAttachCandidatePayloadBytes(payload);
}

function directoryPublishBytes(
  record: CompleteDirectoryRecordLiteral,
  subjectPublicId: string,
  publishedAt: string,
  idempotencyKey: string,
  expiresAt: string,
): Uint8Array {
  const payload = parseDirectoryPublishPayload({
    schemaVersion: 1,
    offeringPublicId: subjectPublicId,
    offeringVersion: OFFERING_VERSION,
    directoryVersion: DIRECTORY_VERSION,
    record: {
      schemaVersion: 1,
      serviceId: record.serviceId,
      serviceSlug: record.serviceSlug,
      offeringPublicId: subjectPublicId,
      offeringVersion: OFFERING_VERSION,
      capabilities: [...record.capabilities],
      x402Endpoint: record.x402Endpoint,
      paymentProtocol: record.paymentProtocol,
      paymentNetwork: record.paymentNetwork,
      asset: record.asset,
      advertisedTiers: [...record.advertisedTiers],
      issuerRevenueAccount: record.issuerRevenueAccount,
      clearingAccount: record.clearingAccount,
      status: record.status,
      publishedAt,
    },
    idempotencyKey,
    expiresAt,
  });
  return canonicalDirectoryPublishPayloadBytes(payload);
}

export function buildStageSignatureRequest(
  input: StageRequestInput,
): StageSignatureRequest {
  const { stage } = input;
  if (!isStageIndex(stage)) {
    throw new RangeError("unknown provider deploy stage");
  }
  if (stage > 0 && input.states[stage - 1]?.kind !== "done") {
    throw new TypeError(
      "a stage request needs its predecessor stage to be done in this session",
    );
  }

  const { issuedAt, expiresAt } = createCommandTimestamps(input.nowMilliseconds);
  const idempotencyKey = createCommandNonce(input.randomBytes);
  let type: CampaignCommandType;
  let canonicalPayloadBytes: Uint8Array;

  switch (stage) {
    case 0:
      type = "offering.create";
      canonicalPayloadBytes = offeringCreateBytes(input.values, neutralCampaignSubject, idempotencyKey, expiresAt);
      break;
    case 1:
      type = "external.prepare";
      canonicalPayloadBytes = externalPrepareBytes(stageBAtsCreateCommandProjection, idempotencyKey, expiresAt);
      break;
    case 2:
      if (input.candidate === null) {
        throw new TypeError("stage 3 needs the candidate the separately carded action returned");
      }
      if (input.attemptPublicId === null) {
        throw new TypeError("stage 3 needs the stage 2 idempotency key as its attempt identifier");
      }
      type = "external.attachCandidate";
      canonicalPayloadBytes = attachCandidateBytes(input.attemptPublicId, input.candidate, idempotencyKey, expiresAt);
      break;
    case 3:
      if (!isDirectoryRecordComplete(input.record)) {
        throw new TypeError("stage 4 needs a complete directory record literal");
      }
      type = "directory.publish";
      canonicalPayloadBytes = directoryPublishBytes(input.record, neutralCampaignSubject, issuedAt, idempotencyKey, expiresAt);
      break;
  }

  return Object.freeze({
    stage,
    type,
    canonicalPayloadBytes,
    issuedAt,
    expiresAt,
    idempotencyKey,
    title: providerDeployStages[stage].label,
    description: stageDescriptions[stage] ?? "",
  });
}

function relayedStageState(
  phase: SignatureResult["phase"],
  outcome: NonNullable<SignatureResult["outcome"]>,
): ProviderDeployStageState {
  const kind = stageKindForRelayOutcome(outcome);
  return Object.freeze({ kind: kind === "done" && phase !== "complete" ? "unknown" : kind });
}

export function stageStateForSignatureResult(
  result: SignatureResult,
): ProviderDeployStageState {
  switch (result.phase) {
    case "complete":
      return result.outcome === null
        ? Object.freeze({ kind: "unknown" })
        : relayedStageState(result.phase, result.outcome);
    case "rejected":
      return afterDeclinedSignature();
    case "failed":
      return result.outcome === null
        ? afterDeclinedSignature()
        : relayedStageState(result.phase, result.outcome);
    case "unknown":
      return Object.freeze({ kind: "unknown" });
    default:
      throw new TypeError("a stage state is derived only from a final signature result");
  }
}
