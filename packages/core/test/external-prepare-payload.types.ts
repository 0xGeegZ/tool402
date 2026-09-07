import { parseExternalPreparePayload } from "../src/index.ts";
import type {
  CanonicalParametersHash,
  EvmAddress,
  ExternalOperationKind,
  ExternalPreparePayload,
  ExternalPrepareTarget,
  HederaAccountId,
} from "../src/index.ts";

declare const canonicalParametersHash: CanonicalParametersHash;
declare const evmAddress: EvmAddress;
declare const hederaAccountId: HederaAccountId;

const payload: ExternalPreparePayload = parseExternalPreparePayload({
  operationKind: "ATS_CREATE",
  subjectPublicId: "subject_42",
  network: "hedera:testnet",
  chainId: 296,
  expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  canonicalParametersHash: "a".repeat(64),
  idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
  expiresAt: "2026-09-07T00:00:00.000Z",
});

const operationKind: ExternalOperationKind = payload.operationKind;
const network: "hedera:testnet" = payload.network;
const chainId: 296 = payload.chainId;
const expectedTarget: ExternalPrepareTarget = payload.expectedTarget;
const parsedHash: CanonicalParametersHash = payload.canonicalParametersHash;
const evmTarget: ExternalPrepareTarget = evmAddress;
const hederaTarget: ExternalPrepareTarget = hederaAccountId;

void operationKind;
void network;
void chainId;
void expectedTarget;
void parsedHash;
void evmTarget;
void hederaTarget;

// @ts-expect-error Parsed payload fields are readonly.
payload.operationKind = "ATS_ISSUE";
// @ts-expect-error External operation kinds are closed.
const unsupportedOperationKind: ExternalOperationKind = "ATS_UNKNOWN";
// @ts-expect-error An EVM address is not a Hedera account identifier.
const evmAsHedera: HederaAccountId = evmAddress;
// @ts-expect-error A Hedera account identifier is not an EVM address.
const hederaAsEvm: EvmAddress = hederaAccountId;
// @ts-expect-error A canonical parameters hash is not a target address.
const hashAsTarget: ExternalPrepareTarget = canonicalParametersHash;
// @ts-expect-error A target address is not a canonical parameters hash.
const targetAsHash: CanonicalParametersHash = evmAddress;

void unsupportedOperationKind;
void evmAsHedera;
void hederaAsEvm;
void hashAsTarget;
void targetAsHash;
