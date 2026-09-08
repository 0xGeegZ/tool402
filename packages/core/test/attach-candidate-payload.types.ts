import {
  canonicalAttachCandidatePayloadBytes,
  parseAttachCandidatePayload,
} from "@tool402/core";
import type {
  AttachCandidatePayload,
  CandidateTransactionId,
  EvmAddress,
  HederaTransactionId,
  MirrorTransactionId,
} from "@tool402/core";

const payload: AttachCandidatePayload = parseAttachCandidatePayload({
  schemaVersion: 1,
  attemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
  operationKind: "ATS_CREATE",
  candidateTransactionId: "0.0.123@1735689600.123456789",
  candidateEvmAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDw",
  expiresAt: "2026-09-15T00:00:00.000Z",
});

declare const hederaTransactionId: HederaTransactionId;
declare const mirrorTransactionId: MirrorTransactionId;

const candidateTransactionId: CandidateTransactionId = payload.candidateTransactionId;
const candidateAddress: EvmAddress | undefined = payload.candidateEvmAddress;
const canonicalCandidate: CandidateTransactionId = hederaTransactionId;
const mirrorCandidate: CandidateTransactionId = mirrorTransactionId;
const schemaVersion: 1 = payload.schemaVersion;
const bytes: Uint8Array = canonicalAttachCandidatePayloadBytes(payload);
const fundingPayload: AttachCandidatePayload = parseAttachCandidatePayload({
  schemaVersion: 1,
  attemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
  operationKind: "HEDERA_FUNDING",
  candidateTransactionId: "0.0.123-1735689600-123456789",
  idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDw",
  expiresAt: "2026-09-15T00:00:00.000Z",
});

void candidateTransactionId;
void candidateAddress;
void canonicalCandidate;
void mirrorCandidate;
void schemaVersion;
void bytes;

// @ts-expect-error Parsed payload roots are readonly.
payload.operationKind = "ATS_ISSUE";
// @ts-expect-error Candidate transaction identifiers are not EVM addresses.
const transactionAsAddress: EvmAddress = payload.candidateTransactionId;
// @ts-expect-error EVM addresses are not candidate transaction identifiers.
const addressAsTransaction: CandidateTransactionId = payload.candidateEvmAddress!;
// @ts-expect-error The candidate address is optional outside ATS_CREATE.
const requiredFundingAddress: EvmAddress = fundingPayload.candidateEvmAddress;
// @ts-expect-error A plain string is neither accepted transaction-id brand.
const plainStringAsCandidate: CandidateTransactionId = "0.0.123-1735689600-123456789";

void transactionAsAddress;
void addressAsTransaction;
void requiredFundingAddress;
void plainStringAsCandidate;
