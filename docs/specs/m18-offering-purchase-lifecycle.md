# M18 requirements-bound purchase lifecycle contract

## Delivery boundary

This contract adds the smallest pure Core state-machine boundary needed before
future funding, allocation, and ATS adapters can be specified truthfully. It
models the legal lifecycle of a single purchase that starts from an accepted
requirements-bound offering quote.

It does not validate an external payment, reserve capacity, persist an intent,
construct a signer request, prompt a wallet, configure an asset, submit a
transaction, allocate a note, issue a refund, reconcile a network outcome, or
prove any live fact. State names are local workflow labels, never evidence that
their correspondingly named external event occurred.

## Public surface

`packages/core/src/offering-purchase-lifecycle.ts` exports the following
through `@tool402/core`:

```ts
export interface OfferingPurchaseSnapshot {
  readonly termsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly paymentTinybars: Tinybar;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

export type OfferingPurchaseDraft = OfferingPurchaseSnapshot & {
  readonly state: "draft";
};
export type OfferingPurchaseAwaitingPayment = OfferingPurchaseSnapshot & {
  readonly state: "awaiting_payment";
};
export type OfferingPurchaseExpired = OfferingPurchaseSnapshot & {
  readonly state: "expired";
};
export type OfferingPurchasePaymentSubmitted = OfferingPurchaseSnapshot & {
  readonly state: "payment_submitted";
};
export type OfferingPurchasePaymentRejected = OfferingPurchaseSnapshot & {
  readonly state: "payment_rejected";
};
export type OfferingPurchasePaymentOutcomeUnknown = OfferingPurchaseSnapshot & {
  readonly state: "payment_outcome_unknown";
};
export type OfferingPurchasePaymentConfirmed = OfferingPurchaseSnapshot & {
  readonly state: "payment_confirmed";
};
export type OfferingPurchaseAllocationPending = OfferingPurchaseSnapshot & {
  readonly state: "allocation_pending";
};
export type OfferingPurchaseAllocationSubmitted = OfferingPurchaseSnapshot & {
  readonly state: "allocation_submitted";
};
export type OfferingPurchaseAllocationOutcomeUnknown = OfferingPurchaseSnapshot & {
  readonly state: "allocation_outcome_unknown";
};
export type OfferingPurchaseRefundRequired = OfferingPurchaseSnapshot & {
  readonly state: "refund_required";
};
export type OfferingPurchaseRefundSubmitted = OfferingPurchaseSnapshot & {
  readonly state: "refund_submitted";
};
export type OfferingPurchaseRefundOutcomeUnknown = OfferingPurchaseSnapshot & {
  readonly state: "refund_outcome_unknown";
};
export type OfferingPurchaseComplete = OfferingPurchaseSnapshot & {
  readonly state: "complete";
};
export type OfferingPurchaseRefunded = OfferingPurchaseSnapshot & {
  readonly state: "refunded";
};
export type OfferingPurchaseManualReconciliation = OfferingPurchaseSnapshot & {
  readonly state: "manual_reconciliation";
};

export type OfferingPurchaseState =
  | OfferingPurchaseDraft
  | OfferingPurchaseAwaitingPayment
  | OfferingPurchaseExpired
  | OfferingPurchasePaymentSubmitted
  | OfferingPurchasePaymentRejected
  | OfferingPurchasePaymentOutcomeUnknown
  | OfferingPurchasePaymentConfirmed
  | OfferingPurchaseAllocationPending
  | OfferingPurchaseAllocationSubmitted
  | OfferingPurchaseAllocationOutcomeUnknown
  | OfferingPurchaseRefundRequired
  | OfferingPurchaseRefundSubmitted
  | OfferingPurchaseRefundOutcomeUnknown
  | OfferingPurchaseComplete
  | OfferingPurchaseRefunded
  | OfferingPurchaseManualReconciliation;

export type OfferingPurchaseEvent =
  | { readonly type: "open"; readonly observedAt: string }
  | { readonly type: "expire"; readonly observedAt: string }
  | { readonly type: "payment_submitted"; readonly observedAt: string }
  | { readonly type: "payment_rejected" }
  | { readonly type: "payment_outcome_unknown" }
  | { readonly type: "payment_confirmed" }
  | { readonly type: "allocation_pending" }
  | { readonly type: "allocation_submitted" }
  | { readonly type: "allocation_outcome_unknown" }
  | { readonly type: "refund_required" }
  | { readonly type: "refund_submitted" }
  | { readonly type: "refund_outcome_unknown" }
  | { readonly type: "complete" }
  | { readonly type: "refunded" }
  | { readonly type: "manual_reconciliation" };

export function createOfferingPurchase(
  quote: OfferingRequirementsQuote,
): OfferingPurchaseDraft;
export function transitionOfferingPurchase(
  state: OfferingPurchaseState,
  event: OfferingPurchaseEvent,
): OfferingPurchaseState;
```

`OfferingRequirementsQuote`, `RequirementsDigest`, `NoteUnits`, and `Tinybar`
are accepted public Core types. The module adds one public barrel export only.
No additional dependency, runtime configuration, or adapter is introduced.

## Immutable purchase snapshot

`createOfferingPurchase` produces only the `draft` state. Every issued state
exposes the same immutable snapshot: terms version, requested units, payment
amount, requirements digest, and expiry. It retains no raw requirements object
or canonical requirements text. Issued states are frozen local values. A
structural copy or a caller-made lookalike is not an issued state and cannot be
transitioned.

Before it reads any quote field, the constructor requires the exact issuance
identity of a quote emitted by the accepted quote module. A structural copy,
proxy, forged record, or mutable JavaScript lookalike rejects; none can create
an issued purchase state or alter the expiry retained for transitions. This
narrow verifier is internal to Core and is not a new public barrel surface.

This typed local constructor consumes an accepted local quote, not untrusted
protocol input. A later dependency-correct schema boundary owns closed parsing,
unknown-field rejection, and external account/asset/recipient semantics.

## Legal transitions

The states are `draft`, `awaiting_payment`, `expired`, `payment_submitted`,
`payment_rejected`, `payment_outcome_unknown`, `payment_confirmed`,
`allocation_pending`, `allocation_submitted`, `allocation_outcome_unknown`,
`refund_required`, `refund_submitted`, `refund_outcome_unknown`, `complete`,
`refunded`, and `manual_reconciliation`.

Only these transitions are legal:

```text
draft --open--> awaiting_payment
awaiting_payment --expire--> expired
awaiting_payment --payment_submitted--> payment_submitted
payment_submitted --payment_rejected--> payment_rejected
payment_submitted --payment_outcome_unknown--> payment_outcome_unknown
payment_submitted --payment_confirmed--> payment_confirmed
payment_confirmed --allocation_pending--> allocation_pending
allocation_pending --allocation_submitted--> allocation_submitted
allocation_pending --refund_required--> refund_required
allocation_pending --manual_reconciliation--> manual_reconciliation
allocation_submitted --complete--> complete
allocation_submitted --allocation_outcome_unknown--> allocation_outcome_unknown
refund_required --refund_submitted--> refund_submitted
refund_required --manual_reconciliation--> manual_reconciliation
refund_submitted --refunded--> refunded
refund_submitted --refund_outcome_unknown--> refund_outcome_unknown
```

`open` and `payment_submitted` each require their explicit `observedAt` to be
strictly before the bound expiry. `expire` requires its explicit `observedAt`
to be at or after that expiry. All use the accepted canonical UTC format and no
clock is read. A quote that has expired before `open` is rejected rather than
turned into a payment-capable state.

`payment_outcome_unknown`, `allocation_outcome_unknown`, and
`refund_outcome_unknown` are terminal, fail-closed states in this local
contract. A future reconciliation workflow must establish any later safe
outcome; this module never retries or replaces an ambiguous external action.

Every successful transition consumes its exact issued source state. A consumed
state cannot be used to create any other successor, including a successor with
a different legal event. A rejected transition does not consume its source, so
a caller may still present a valid later event. All unspecified transitions,
duplicate events, events from terminal states, and transitions of a structural
copy reject.

The local `payment_confirmed`, `complete`, and `refunded` labels carry no
receipt, transaction reference, account, allocation, or result. A later
adapter must independently establish any external fact before it may choose a
corresponding transition. This state machine alone does not make that adapter
or fact exist.

## Explicit exclusions

This module does not parse a protocol payload or account/asset configuration;
read a clock, environment, storage, or network; create a durable attempt;
perform a payment, funding, allocation, ATS, transfer, clearing, HCS, or payout
action; handle a wallet, signer, key, account, transaction, settlement,
receipt, deployment, or live evidence.

## Acceptance evidence

- Focused RED/GREEN tests prove snapshotting, public exports, every legal edge,
  expired/open timing, source consumption after a successful transition,
  rejected-transition non-consumption, all illegal skipped or duplicate edges,
  terminal unknown behavior, structural-copy rejection, and frozen outputs.
- A compile-time fixture proves the public state surface accepts the existing
  quote and retains the distinct monetary/unit/digest types.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
