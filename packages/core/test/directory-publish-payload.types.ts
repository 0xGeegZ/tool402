import {
  canonicalDirectoryPublishPayloadBytes,
  parseDirectoryPublishPayload,
} from "@tool402/core";
import type {
  AgentDirectoryRecordCandidate,
  DirectoryPublishPayload,
} from "@tool402/core";

const payload: DirectoryPublishPayload = parseDirectoryPublishPayload({
  schemaVersion: 1,
  offeringPublicId: "riskscan_revenue_note_demo",
  offeringVersion: 1,
  directoryVersion: 1,
  record: {
    schemaVersion: 1,
    serviceId: "riskscan_quick",
    serviceSlug: "riskscan",
    offeringPublicId: "riskscan_revenue_note_demo",
    offeringVersion: 1,
    capabilities: ["evm-contract-risk-signals"],
    x402Endpoint: "https://api.tool402.test/riskscan",
    paymentProtocol: "x402",
    paymentNetwork: "hedera-testnet",
    asset: "HBAR",
    advertisedTiers: ["quick", "standard"],
    issuerRevenueAccount: "0.0.123",
    clearingAccount: "0.0.456",
    status: "active",
    publishedAt: "2026-09-08T00:00:00.000Z",
  },
  idempotencyKey: "BBBBBBBBBBBBBBBBBBBBBQ",
  expiresAt: "2026-09-15T00:00:00.000Z",
});

const record: AgentDirectoryRecordCandidate = payload.record;
const serviceSlug: "riskscan" = payload.record.serviceSlug;
const schemaVersion: 1 = payload.schemaVersion;
const bytes: Uint8Array = canonicalDirectoryPublishPayloadBytes(payload);

void record;
void serviceSlug;
void schemaVersion;
void bytes;

// @ts-expect-error Parsed payload roots are readonly.
payload.directoryVersion = 2;
// @ts-expect-error Delegated candidate arrays are readonly.
payload.record.advertisedTiers.push("quick");
// @ts-expect-error Service slug remains the accepted closed literal.
const otherSlug: "other" = payload.record.serviceSlug;

void otherSlug;
