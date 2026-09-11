import { parseOfferingDefinition } from "@tool402/core";

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

function wholeHbarToTinybars(value: string): string {
  return (BigInt(value) * tinybarsPerHbar).toString();
}

function validateQualifyingResource(value: unknown): void {
  parseOfferingDefinition({
    schemaVersion: 1,
    terms: {
      version: "v1",
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
    qualifyingResource: value,
  });
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

export type ProviderDeployValidationField =
  | "toolName"
  | "customerProblem"
  | "qualifyingResource"
  | "quickPrice"
  | "standardPrice"
  | "targetAgentCustomers"
  | "useOfFunds"
  | "risks";

export type ProviderDeployFieldErrors = Readonly<Partial<Record<ProviderDeployValidationField, string>>>;

type ProviderDeployValidationValues = Readonly<{
  toolName: string;
  customerProblem: string;
  qualifyingResource: string;
  quickPrice: string;
  standardPrice: string;
  targetAgentCustomers: string;
  useOfFunds: string;
  risks: string;
}>;

function collectFieldError(
  errors: Partial<Record<ProviderDeployValidationField, string>>,
  field: ProviderDeployValidationField,
  message: string,
  validate: () => void,
): void {
  try {
    validate();
  } catch {
    errors[field] = message;
  }
}

export function providerDeployFieldErrors(
  values: ProviderDeployValidationValues,
  step: number,
): ProviderDeployFieldErrors {
  const errors: Partial<Record<ProviderDeployValidationField, string>> = {};

  if (step === 0) {
    collectFieldError(errors, "toolName", "Enter a trimmed tool name of no more than 100 UTF-8 bytes.", () => {
      validateNarrativeField("title", values.toolName);
    });
    collectFieldError(errors, "customerProblem", "Enter a trimmed customer problem of no more than 1,000 UTF-8 bytes.", () => {
      validateNarrativeField("customerProblem", values.customerProblem);
    });
  }

  if (step === 1) {
    collectFieldError(errors, "qualifyingResource", "Enter a trimmed qualifying resource of no more than 256 characters.", () => {
      validateQualifyingResource(values.qualifyingResource);
    });
  }

  if (step === 2) {
    collectFieldError(errors, "quickPrice", "Enter an HBAR amount from 0.00000001 through 0.1.", () => {
      hbarToTinybars(values.quickPrice);
    });
    collectFieldError(errors, "standardPrice", "Enter an HBAR amount from 0.00000001 through 0.1.", () => {
      hbarToTinybars(values.standardPrice);
    });
    collectFieldError(errors, "targetAgentCustomers", "Enter one to six complete target-agent customer lines of no more than 400 UTF-8 bytes each.", () => {
      validateNarrativeField("targetAgentCustomers", values.targetAgentCustomers.split("\n"));
    });
  }

  if (step === 3) {
    collectFieldError(errors, "useOfFunds", "Enter one to six complete use-of-funds lines of no more than 400 UTF-8 bytes each.", () => {
      validateNarrativeField("useOfFunds", values.useOfFunds.split("\n"));
    });
    collectFieldError(errors, "risks", "Enter one to six complete risk lines of no more than 400 UTF-8 bytes each.", () => {
      validateNarrativeField("risks", values.risks.split("\n"));
    });
  }

  return Object.freeze(errors);
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
  registryRevision: string;
  operationKind: "ATS_CREATE";
  targetKind: "EVM_ADDRESS";
  expectedTarget: string;
  canonicalParametersHash: string;
  factoryHederaId: string;
  resolverHederaId: string;
  revenueNote: Readonly<{
    name: string;
    symbol: string;
    isin: string;
    numberOfUnits: string;
    nominalValue: string;
    currency: string;
    decimals: number;
    isWhiteList: boolean;
    isControllable: boolean;
  }>;
}>;

export type ProviderDeployStageSession = Readonly<{
  connected: boolean;
  results: readonly (ProviderDeployStageState | undefined)[];
  candidate: AtsCreateCandidate | null;
  recordComplete: boolean;
}>;

export const stageFourUnavailableDetail = "No accepted clearing account is recorded.";

function sessionStageState(
  result: ProviderDeployStageState | undefined,
  predecessor: ProviderDeployStageState | undefined,
): ProviderDeployStageState {
  if (result) return Object.freeze({ ...result });
  return Object.freeze({ kind: !predecessor || predecessor.kind === "done" ? "actionable" : "blocked" });
}

export function providerDeployStageStates(
  projection: AtsCreateConfigurationProjection | undefined,
  session?: ProviderDeployStageSession,
): readonly ProviderDeployStageState[] {
  if (!session?.connected) {
    return Object.freeze([
      Object.freeze({ kind: "unavailable" }),
      Object.freeze({ kind: projection ? "blocked" : "unavailable" }),
      Object.freeze({ kind: "unavailable" }),
      Object.freeze({ kind: "blocked" }),
    ]);
  }

  const first = sessionStageState(session.results[0], undefined);
  const second = projection ? sessionStageState(session.results[1], first) : Object.freeze({ kind: "unavailable" as const });
  const third = session.candidate ? sessionStageState(session.results[2], second) : Object.freeze({ kind: "unavailable" as const });
  const fourth = session.recordComplete
    ? sessionStageState(session.results[3], third)
    : Object.freeze({ kind: "unavailable" as const, detail: stageFourUnavailableDetail });
  return Object.freeze([first, second, third, fourth]);
}

export type ProviderDeployStageControl = Readonly<{
  disabled: boolean;
  label: string;
  description: string;
}>;

export function providerDeployStageControl(
  index: number,
  state: ProviderDeployStageState,
  signatureAvailable = false,
): ProviderDeployStageControl {
  if (!Number.isInteger(index) || index < 0 || index >= providerDeployStages.length) {
    throw new RangeError("unknown provider deploy stage");
  }

  if (state.kind === "actionable" && signatureAvailable) {
    return Object.freeze({
      disabled: false,
      label: "Request signature",
      description: "Opens one signature request for this stage. Nothing is recorded unless the relay reports ACCEPTED.",
    });
  }

  if (state.kind === "blocked") {
    const predecessor = providerDeployStages[index - 1];
    return Object.freeze({
      disabled: true,
      label: "Complete the preceding stage first",
      description: `This signature handoff stays blocked until ${predecessor?.label ?? "the preceding stage"} is done.`,
    });
  }

  if (state.kind === "unavailable") {
    return Object.freeze({
      disabled: true,
      label: "Signature handoff unavailable",
      description: index === 2
        ? "This stage needs its separate human action and a command bridge before any signature can be requested."
        : "This stage needs a command bridge and its separately accepted authority before any signature can be requested.",
    });
  }

  return Object.freeze({
    disabled: true,
    label: "Signature handoff unavailable",
    description: "This local preview has no enabled command bridge for this stage.",
  });
}

export type RevenueNoteConfigurationRow = Readonly<{
  label: string;
  value: string;
}>;

export function revenueNoteConfigurationRows(
  projection: AtsCreateConfigurationProjection | undefined,
): readonly RevenueNoteConfigurationRow[] {
  if (!projection) return Object.freeze([]);
  const { revenueNote } = projection;
  return Object.freeze([
    Object.freeze({ label: "Note name", value: revenueNote.name }),
    Object.freeze({ label: "Symbol", value: revenueNote.symbol }),
    Object.freeze({ label: "ISIN", value: revenueNote.isin }),
    Object.freeze({ label: "Unit count", value: revenueNote.numberOfUnits }),
    Object.freeze({ label: "Nominal value", value: revenueNote.nominalValue }),
    Object.freeze({ label: "Currency", value: revenueNote.currency }),
    Object.freeze({ label: "Decimals", value: String(revenueNote.decimals) }),
    Object.freeze({ label: "Whitelist", value: revenueNote.isWhiteList ? "Enabled" : "Disabled" }),
    Object.freeze({ label: "Controllable", value: revenueNote.isControllable ? "Enabled" : "Disabled" }),
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
