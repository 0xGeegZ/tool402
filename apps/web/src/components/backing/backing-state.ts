import { canonicalizeRequirements, createOfferingTerms, parseExternalPreparePayload } from "@tool402/core";
import { keccak256 } from "viem";

import { formatHbar, formatShare } from "../../lib/hbar-format.ts";
import type { OfferingRecord } from "../../lib/offering-projection.ts";
import type { RelayOutcome } from "../../lib/wallet/command-relay.ts";
import { createCommandNonce, createCommandTimestamps, type RandomBytes } from "../../lib/wallet/tool402-command.ts";
import type { SignatureDialogRequest, SignatureResult } from "../wallet/signature-dialog.tsx";

export { formatHbar, formatShare };

export const backingViewKinds = Object.freeze([
  "offering_unavailable",
  "choosing",
  "prepared",
  "payment_submitted",
  "payment_outcome_unknown",
  "allocation_pending",
  "complete",
  "refused",
] as const);

export type BackingViewKind = (typeof backingViewKinds)[number];

export const backingLifecycleLabels: Readonly<Record<BackingViewKind, string | null>> = Object.freeze({
  offering_unavailable: null,
  choosing: null,
  prepared: "awaiting_payment",
  payment_submitted: "payment_submitted",
  payment_outcome_unknown: "payment_outcome_unknown",
  allocation_pending: "allocation_pending",
  complete: "complete",
  refused: null,
});

export const backingAttemptStates: Readonly<Record<BackingViewKind, "PREPARED" | null>> = Object.freeze({
  offering_unavailable: null,
  choosing: null,
  prepared: "PREPARED",
  payment_submitted: "PREPARED",
  payment_outcome_unknown: null,
  allocation_pending: null,
  complete: null,
  refused: null,
});

type OfferingTerms = ReturnType<typeof createOfferingTerms>;

export type BackingProjection = OfferingRecord & { readonly fundingTreasuryAddress?: string };

export interface BackingOffering {
  readonly offeringPublicId: string;
  readonly subjectPublicId: string;
  readonly terms: OfferingTerms;
  readonly maturityAt: string;
  readonly treasury: string;
}

export interface BackingParameters {
  readonly offeringPublicId: string;
  readonly units: string;
  readonly tinybars: string;
  readonly purchaseIntentId: string;
}

export interface BackingIntent extends SignatureDialogRequest {
  readonly idempotencyKey: string;
  readonly purchaseIntentId: string;
  readonly units: bigint;
  readonly tinybars: bigint;
  readonly weibarHex: `0x${string}`;
  readonly treasury: string;
  readonly parameters: BackingParameters;
}

type ViewOf<Kind extends BackingViewKind, Extra = object> = Readonly<{ kind: Kind } & Extra>;

export type BackingView =
  | ViewOf<"offering_unavailable">
  | ViewOf<"choosing", { message?: string }>
  | ViewOf<"prepared", { intent: BackingIntent }>
  | ViewOf<"payment_submitted", { intent: BackingIntent; transactionHash: `0x${string}` }>
  | ViewOf<"payment_outcome_unknown", { intent: BackingIntent; message: string }>
  | ViewOf<"allocation_pending", { intent: BackingIntent }>
  | ViewOf<"complete", { intent: BackingIntent }>
  | ViewOf<"refused", { intent: BackingIntent; outcome: RelayOutcome; message: string }>;

export type UnitsValidation = Readonly<{ ok: true; units: bigint } | { ok: false; message: string }>;

export type TransferResult =
  | Readonly<{ kind: "hash"; hash: string }>
  | Readonly<{ kind: "no_hash" }>
  | Readonly<{ kind: "declined" }>;

export interface TransferRequest {
  readonly method: "eth_sendTransaction";
  readonly params: readonly [Readonly<{ from: string; to: string; value: `0x${string}` }>];
}

const treasuryPattern = /^0x[0-9a-f]{40}$/u;
const wholeUnitsPattern = /^(?:0|[1-9][0-9]*)$/u;
const transactionHashPattern = /^0x[0-9a-f]{64}$/u;
const tinybarsPerHbar = 100_000_000n;
const weibarsPerTinybar = 10n ** 10n;
const finalPhases: ReadonlySet<SignatureResult["phase"]> = new Set(["complete", "rejected", "failed", "unknown"]);

const unknownMessage = "The outcome is unknown. The transfer may already be on chain, so nothing is sent again.";
const refusalMessages: Readonly<Record<Exclude<RelayOutcome, "ACCEPTED" | "transport_failure" | "unexpected_response">, string>> = Object.freeze({
  REPLAYED: "The backend had already seen this command. Nothing was sent again.",
  CONFLICT: "The backend reported a conflicting command. Nothing was sent.",
  REJECTED: "The backend refused the command. No BACKER authority admitted it, so nothing was sent.",
  UNSUPPORTED_TYPE: "The backend does not accept this command type. Nothing was sent.",
  not_configured: "This host has no command relay configured. Nothing left the browser.",
});

export function readBackingOffering(projection: BackingProjection | null | undefined): BackingOffering | null {
  if (projection === null || projection === undefined) return null;
  if (projection.state !== "OPEN") return null;
  const treasury = projection.fundingTreasuryAddress;
  if (typeof treasury !== "string" || !treasuryPattern.test(treasury)) return null;
  let terms: OfferingTerms;
  try {
    terms = createOfferingTerms(projection.definition.terms);
  } catch {
    return null;
  }
  return Object.freeze({
    offeringPublicId: projection.offeringPublicId,
    subjectPublicId: projection.subjectPublicId,
    terms,
    maturityAt: projection.definition.maturityAt,
    treasury,
  });
}

export function validateUnits(offering: BackingOffering, input: string): UnitsValidation {
  const { minimumPurchaseUnits, maximumNoteUnits } = offering.terms;
  const message = `Choose a whole number of units between ${minimumPurchaseUnits} and ${maximumNoteUnits}.`;
  if (!wholeUnitsPattern.test(input)) return Object.freeze({ ok: false, message });
  const units = BigInt(input);
  if (units < minimumPurchaseUnits || units > maximumNoteUnits) return Object.freeze({ ok: false, message });
  return Object.freeze({ ok: true, units });
}

export function paymentTinybars(offering: BackingOffering, units: bigint): bigint {
  return units * offering.terms.noteUnitPriceTinybars;
}

export function weibarQuantity(tinybars: bigint): `0x${string}` {
  return `0x${(tinybars * weibarsPerTinybar).toString(16)}`;
}

export function createBackingIntent(
  offering: BackingOffering,
  units: bigint,
  nowMilliseconds: number,
  randomBytes?: RandomBytes,
): BackingIntent {
  const validation = validateUnits(offering, units.toString());
  if (!validation.ok) throw new RangeError(validation.message);
  const tinybars = paymentTinybars(offering, units);
  const purchaseIntentId = createCommandNonce(randomBytes);
  const idempotencyKey = createCommandNonce(randomBytes);
  const { issuedAt, expiresAt } = createCommandTimestamps(nowMilliseconds);
  const parameters: BackingParameters = Object.freeze({
    offeringPublicId: offering.offeringPublicId,
    units: units.toString(),
    tinybars: tinybars.toString(),
    purchaseIntentId,
  });
  const canonicalParametersHash = keccak256(new TextEncoder().encode(canonicalizeRequirements(parameters))).slice(2);
  const payload = parseExternalPreparePayload({
    operationKind: "HEDERA_FUNDING",
    subjectPublicId: offering.subjectPublicId,
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: offering.treasury,
    canonicalParametersHash,
    idempotencyKey,
    expiresAt,
  });
  return Object.freeze({
    type: "external.prepare",
    canonicalPayloadBytes: new TextEncoder().encode(canonicalizeRequirements(payload)),
    issuedAt,
    expiresAt,
    title: "Prepare the funding intent",
    description: "Signs one external.prepare command for HEDERA_FUNDING over the selected units. It sends no HBAR.",
    idempotencyKey,
    purchaseIntentId,
    units,
    tinybars,
    weibarHex: weibarQuantity(tinybars),
    treasury: offering.treasury,
    parameters,
  });
}

function viewForRelayOutcome(outcome: RelayOutcome, phase: SignatureResult["phase"], intent: BackingIntent): BackingView {
  if (outcome === "transport_failure" || outcome === "unexpected_response") {
    return Object.freeze({ kind: "payment_outcome_unknown", intent, message: unknownMessage });
  }
  if (outcome === "ACCEPTED") {
    return phase === "complete"
      ? Object.freeze({ kind: "prepared", intent })
      : Object.freeze({ kind: "payment_outcome_unknown", intent, message: unknownMessage });
  }
  return Object.freeze({ kind: "refused", intent, outcome, message: refusalMessages[outcome] });
}

export function viewAfterSignature(result: SignatureResult, intent: BackingIntent): BackingView {
  if (!finalPhases.has(result.phase)) {
    throw new TypeError("a backing view is derived only from a final signature result");
  }
  if (result.phase === "rejected") {
    return Object.freeze({ kind: "choosing", message: "The signature was declined. Nothing was relayed or sent." });
  }
  if (result.phase === "unknown") {
    return Object.freeze({ kind: "payment_outcome_unknown", intent, message: unknownMessage });
  }
  if (result.outcome === null) {
    return result.phase === "failed"
      ? Object.freeze({ kind: "choosing", message: "Signing did not complete: the request expired, MetaMask was on another network or had no account, or MetaMask reported an error. Nothing was relayed or sent." })
      : Object.freeze({ kind: "payment_outcome_unknown", intent, message: unknownMessage });
  }
  return viewForRelayOutcome(result.outcome, result.phase, intent);
}

export function transferRequest(view: BackingView, from: string): TransferRequest {
  if (view.kind !== "prepared") {
    throw new TypeError("a transfer is requested only after the funding command is accepted");
  }
  return Object.freeze({
    method: "eth_sendTransaction",
    params: [Object.freeze({ from, to: view.intent.treasury, value: view.intent.weibarHex })] as const,
  });
}

export function isCurrentBackingIntent(offering: BackingOffering, intent: BackingIntent): boolean {
  const validation = validateUnits(offering, intent.units.toString());
  return validation.ok
    && intent.treasury === offering.treasury
    && intent.tinybars === paymentTinybars(offering, intent.units)
    && intent.weibarHex === weibarQuantity(intent.tinybars)
    && intent.parameters.offeringPublicId === offering.offeringPublicId
    && intent.parameters.units === intent.units.toString()
    && intent.parameters.tinybars === intent.tinybars.toString();
}

export function viewAfterTransfer(view: BackingView, result: TransferResult): BackingView {
  if (view.kind !== "prepared") {
    throw new TypeError("a transfer result applies only to a prepared funding intent");
  }
  switch (result.kind) {
    case "declined":
      return view;
    case "no_hash":
      return Object.freeze({ kind: "payment_outcome_unknown", intent: view.intent, message: unknownMessage });
    case "hash":
      if (!transactionHashPattern.test(result.hash)) {
        throw new TypeError("a submitted transfer is identified by a lower-case transaction hash");
      }
      return Object.freeze({ kind: "payment_submitted", intent: view.intent, transactionHash: result.hash as `0x${string}` });
  }
}
