import { parseAttachCandidatePayload } from "../src/index.ts";
import type {
  AttachCandidatePayload,
  CandidateTransactionId,
  EvmAddress,
  HederaTransactionId,
  MirrorTransactionId,
} from "../src/index.ts";

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

void candidateTransactionId;
void candidateAddress;
void canonicalCandidate;
void mirrorCandidate;

// @ts-expect-error Parsed payload roots are readonly.
payload.operationKind = "ATS_ISSUE";
// @ts-expect-error Candidate transaction identifiers are not EVM addresses.
const transactionAsAddress: EvmAddress = payload.candidateTransactionId;
// @ts-expect-error EVM addresses are not candidate transaction identifiers.
const addressAsTransaction: CandidateTransactionId = payload.candidateEvmAddress!;

void transactionAsAddress;
void addressAsTransaction;
