export const providerDeployCategories = Object.freeze([
  "security",
  "data",
  "web",
  "code",
  "ai",
  "productivity",
] as const);

export type ProviderDeployCategory = (typeof providerDeployCategories)[number];

export const providerDeploySteps = Object.freeze([
  Object.freeze({
    label: "Tool details",
    editable: Object.freeze(["toolName", "category", "oneLiner", "customerProblem"]),
    fixed: Object.freeze([]),
  }),
  Object.freeze({
    label: "Interface and capability",
    editable: Object.freeze(["qualifyingResource", "capabilitySummary"]),
    fixed: Object.freeze(["capability"]),
  }),
  Object.freeze({
    label: "Pricing and target agent customers",
    editable: Object.freeze(["quickPrice", "standardPrice", "targetAgentCustomers"]),
    fixed: Object.freeze([]),
  }),
  Object.freeze({
    label: "Funding and revenue-note terms",
    editable: Object.freeze(["useOfFunds", "risks", "acknowledgement"]),
    fixed: Object.freeze(["termsV1Economics", "revenueNoteParameters"]),
  }),
  Object.freeze({
    label: "Review and sign",
    editable: Object.freeze([]),
    fixed: Object.freeze(["reviewRows", "deploymentStages"]),
  }),
] as const);

export const acknowledgementCopy = "I confirm these are testnet, experimental terms. They promise no yield, principal, or return. Off-platform use of the tool is not observable by Tool402.";

export const termsV1Economics = Object.freeze({
  fundingTargetHbar: "1000",
  noteUnitPriceHbar: "1",
  maximumNoteUnits: "1000",
  minimumPurchaseUnits: "10",
  revenueRouting: Object.freeze({ operatorBps: 8000, backerReserveBps: 2000, feeBps: 0 }),
  payoutCapHbar: "1500",
  maturityDate: "2026-12-31",
});

const tinybarsPerHbar = 100_000_000n;
const maximumAdvertisedPriceTinybars = 10_000_000n;

export function stepCaption(step: number): string {
  const definition = providerDeploySteps[step];
  if (!definition) throw new RangeError("unknown provider deploy step");
  return `Step ${step + 1} of ${providerDeploySteps.length} · ${definition.label}`;
}

export function canGoBack(step: number): boolean {
  if (!Number.isInteger(step) || step < 0 || step >= providerDeploySteps.length) {
    throw new RangeError("unknown provider deploy step");
  }
  return step > 0;
}

export function canAdvance(step: number, values: Readonly<{ acknowledgement?: boolean }>): boolean {
  if (!Number.isInteger(step) || step < 0 || step >= providerDeploySteps.length) {
    throw new RangeError("unknown provider deploy step");
  }
  return step !== 3 || values.acknowledgement === true;
}

export function hbarToTinybars(value: string): string {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/u.test(value)) {
    throw new TypeError("advertised price must be an HBAR decimal with at most eight fractional places");
  }

  const [whole, fraction = ""] = value.split(".");
  const tinybars = BigInt(whole) * tinybarsPerHbar + BigInt(fraction.padEnd(8, "0"));
  if (tinybars < 1n || tinybars > maximumAdvertisedPriceTinybars) {
    throw new RangeError("advertised price must be from 1 through 10000000 tinybars");
  }
  return tinybars.toString();
}

type NarrativeField = "title" | "customerProblem" | "customerUseCases" | "useOfFunds" | "risks" | "targetAgentCustomers";

function assertNarrativeText(value: unknown, maximumBytes: number): asserts value is string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw new TypeError("narrative text must be a trimmed, nonblank string");
  }
  if (/[\u0000-\u001F\u007F-\u009F]/u.test(value) || hasUnpairedSurrogate(value)) {
    throw new TypeError("narrative text must not contain control characters or unpaired surrogates");
  }
  if (new TextEncoder().encode(value).byteLength > maximumBytes) {
    throw new RangeError("narrative text exceeds its byte limit");
  }
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      if (index + 1 >= value.length || value.charCodeAt(index + 1) < 0xdc00 || value.charCodeAt(index + 1) > 0xdfff) return true;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

export function validateNarrativeField(field: NarrativeField, value: unknown): void {
  if (field === "title") {
    assertNarrativeText(value, 100);
    return;
  }
  if (field === "customerProblem") {
    assertNarrativeText(value, 1000);
    return;
  }
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) {
    throw new RangeError("narrative lists must contain from one through six items");
  }
  for (const item of value) assertNarrativeText(item, 400);
}

export const providerDeployStageKinds = Object.freeze([
  "blocked",
  "actionable",
  "in_progress",
  "done",
  "unavailable",
  "unsupported_type",
  "rejected",
  "replayed",
  "conflict",
  "unknown",
] as const);

export type ProviderDeployStageKind = (typeof providerDeployStageKinds)[number];

export const providerDeployStages = Object.freeze([
  Object.freeze({ label: "Record the draft offering", commandType: "offering.create" }),
  Object.freeze({ label: "Prepare asset creation", commandType: "external.prepare", operationKind: "ATS_CREATE" }),
  Object.freeze({
    label: "Create the revenue note",
    substeps: Object.freeze([
      Object.freeze({
        label: "Create the revenue note in MetaMask",
        returnsCandidate: Object.freeze(["transactionId", "evmAddress"]),
      }),
      Object.freeze({
        label: "Attach the returned candidate",
        commandType: "external.attachCandidate",
        requiresCandidate: Object.freeze(["transactionId", "evmAddress"]),
      }),
    ]),
  }),
  Object.freeze({ label: "Publish to the Tool Directory", commandType: "directory.publish" }),
] as const);

const relayOutcomeKinds = Object.freeze({
  ACCEPTED: "done",
  UNSUPPORTED_TYPE: "unsupported_type",
  REJECTED: "rejected",
  REPLAYED: "replayed",
  CONFLICT: "conflict",
  not_configured: "unavailable",
  transport_failure: "unknown",
  unexpected_response: "unknown",
} as const);

export type RelayOutcome = keyof typeof relayOutcomeKinds;

export function stageKindForRelayOutcome(outcome: string): ProviderDeployStageKind {
  if (!(outcome in relayOutcomeKinds)) throw new TypeError("unknown relay outcome");
  return relayOutcomeKinds[outcome as RelayOutcome];
}

export type ProviderDeployStageState = Readonly<{
  kind: ProviderDeployStageKind;
  detail?: string;
}>;

export type AtsCreateConfigurationProjection = Readonly<{
  network: "hedera:testnet";
  chainId: 296;
  subjectPublicId: "riskscan_revenue_note_demo";
  offeringVersion: "ats_demo_v1";
  registryRevision: "ats_sdk_8_0_0_testnet_v2";
  operationKind: "ATS_CREATE";
  targetKind: "EVM_ADDRESS";
  expectedTarget: string;
  canonicalParametersHash: string;
  factoryHederaId: string;
  resolverHederaId: string;
}>;

export function providerDeployStageStates(
  projection: AtsCreateConfigurationProjection | undefined,
): readonly ProviderDeployStageState[] {
  return Object.freeze([
    Object.freeze({ kind: "actionable" }),
    Object.freeze({ kind: projection ? "blocked" : "unavailable" }),
    Object.freeze({ kind: "unavailable" }),
    Object.freeze({ kind: "blocked" }),
  ]);
}

export type RevenueNoteConfigurationRow = Readonly<{
  label: string;
  value: string;
}>;

export function revenueNoteConfigurationRows(
  projection: AtsCreateConfigurationProjection | undefined,
): readonly RevenueNoteConfigurationRow[] {
  if (!projection) return Object.freeze([]);
  return Object.freeze([
    Object.freeze({ label: "Network", value: projection.network }),
    Object.freeze({ label: "Chain ID", value: String(projection.chainId) }),
    Object.freeze({ label: "Subject", value: projection.subjectPublicId }),
    Object.freeze({ label: "Offering version", value: projection.offeringVersion }),
    Object.freeze({ label: "Registry revision", value: projection.registryRevision }),
    Object.freeze({ label: "Factory", value: projection.factoryHederaId }),
    Object.freeze({ label: "Resolver", value: projection.resolverHederaId }),
  ]);
}

export function prepareAssetConfiguration(
  projection: AtsCreateConfigurationProjection | undefined,
): AtsCreateConfigurationProjection | null {
  return projection ?? null;
}

export type AtsCreateCandidate = Readonly<{
  transactionId: string;
  evmAddress: string;
}>;

export function createAtsCreateCandidate(candidate: AtsCreateCandidate): AtsCreateCandidate {
  if (candidate.transactionId.trim().length === 0 || !/^0x[0-9a-f]{40}$/u.test(candidate.evmAddress)) {
    throw new TypeError("ATS_CREATE candidate must contain a transactionId and lower-case evmAddress");
  }
  return Object.freeze({ transactionId: candidate.transactionId, evmAddress: candidate.evmAddress });
}

export function afterDeclinedSignature(): ProviderDeployStageState {
  return Object.freeze({ kind: "actionable", detail: "Nothing was recorded." });
}
