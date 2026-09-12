import { parseAgentDirectoryRecordCandidate } from "../src/index.ts";
import type {
  AdvertisedDirectoryTiers,
  AgentDirectoryRecordCandidate,
  DirectoryCapability,
  DirectoryTier,
  HederaAccountId,
  Tinybar,
} from "../src/index.ts";

const candidate: AgentDirectoryRecordCandidate = parseAgentDirectoryRecordCandidate({
  schemaVersion: 1,
  serviceId: "service_42",
  serviceSlug: "riskscan",
  offeringPublicId: "offering_42",
  offeringVersion: 1,
  capabilities: ["evm-contract-risk-signals"],
  x402Endpoint: "https://api.example.test/riskscan",
  paymentProtocol: "x402",
  paymentNetwork: "hedera-testnet",
  asset: "HBAR",
  advertisedTiers: ["quick", "standard"],
  issuerRevenueAccount: "0.0.123",
  clearingAccount: "0.0.456",
  status: "active",
  publishedAt: "2026-09-07T00:00:00.000Z",
});

const schemaVersion: 1 = candidate.schemaVersion;
const serviceSlug: "riskscan" | `tool-${string}` = candidate.serviceSlug;
const protocol: "x402" = candidate.paymentProtocol;
const network: "hedera-testnet" = candidate.paymentNetwork;
const asset: "HBAR" = candidate.asset;
const status: "active" = candidate.status;
const capability: DirectoryCapability = candidate.capabilities[0];
const capabilities: readonly [DirectoryCapability] = candidate.capabilities;
const tier: DirectoryTier = candidate.advertisedTiers[0];
const quick: AdvertisedDirectoryTiers = ["quick"];
const standard: AdvertisedDirectoryTiers = ["standard"];
const both: AdvertisedDirectoryTiers = ["quick", "standard"];
const issuer: HederaAccountId = candidate.issuerRevenueAccount;
const clearing: HederaAccountId = candidate.clearingAccount;
const webUrl: string | undefined = candidate.webUrl;

// @ts-expect-error A candidate root is readonly.
candidate.serviceId = "changed";
// @ts-expect-error The optional URL is readonly too.
candidate.webUrl = "https://example.test/";
// @ts-expect-error The capability tuple is readonly.
candidate.capabilities[0] = "evm-contract-risk-signals";
// @ts-expect-error The tier tuple is readonly.
candidate.advertisedTiers[0] = "quick";
// @ts-expect-error A readonly tuple cannot be exposed as a mutable array.
const mutableTiers: DirectoryTier[] = candidate.advertisedTiers;
// @ts-expect-error An unsupported capability is outside the literal union.
const unsupportedCapability: DirectoryCapability = "other";
// @ts-expect-error An unsupported tier is outside the literal union.
const unsupportedTier: DirectoryTier = "premium";
// @ts-expect-error A candidate cannot advertise an unsupported tier.
const unsupportedCandidateTiers: AgentDirectoryRecordCandidate["advertisedTiers"] = ["premium"];
// @ts-expect-error Reversed tiers are not an advertised tuple.
const reversedTiers: AdvertisedDirectoryTiers = ["standard", "quick"];
// @ts-expect-error Duplicate tiers are not an advertised tuple.
const duplicateTiers: AdvertisedDirectoryTiers = ["quick", "quick"];
// @ts-expect-error Advertised tiers cannot be empty.
const emptyTiers: AdvertisedDirectoryTiers = [];
// @ts-expect-error Plain account text has no accepted M10 brand.
const unparsedAccount: HederaAccountId = "0.0.123";
// @ts-expect-error The issuer field retains the M10 account brand.
const unparsedIssuer: AgentDirectoryRecordCandidate["issuerRevenueAccount"] = "0.0.123";
// @ts-expect-error The clearing field retains the M10 account brand.
const unparsedClearing: AgentDirectoryRecordCandidate["clearingAccount"] = "0.0.456";
// @ts-expect-error A candidate is not an account string.
const candidateAsAccount: HederaAccountId = candidate;
// @ts-expect-error A candidate is not a payment amount.
const candidateAsPayment: Tinybar = candidate;
// @ts-expect-error Advertised account metadata is not a payment amount.
const clearingAsPayment: Tinybar = candidate.clearingAccount;

void schemaVersion;
void serviceSlug;
void protocol;
void network;
void asset;
void status;
void capability;
void capabilities;
void tier;
void quick;
void standard;
void both;
void issuer;
void clearing;
void webUrl;
void mutableTiers;
void unsupportedCapability;
void unsupportedTier;
void unsupportedCandidateTiers;
void reversedTiers;
void duplicateTiers;
void emptyTiers;
void unparsedAccount;
void unparsedIssuer;
void unparsedClearing;
void candidateAsAccount;
void candidateAsPayment;
void clearingAsPayment;
