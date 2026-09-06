# M19 requirement-bound paid-task lifecycle contract

## Delivery boundary

This contract adds the smallest pure Core workflow that distinguishes a quoted
paid task, a local payment signal, execution, a valid result signal, and
ambiguous or failed outcomes before any durable outcome, clearing split, ATS,
or external adapter is specified.

It creates a task-local requirements snapshot. It deliberately does not reuse
the accepted offering-purchase quote: that quote models a funding allocation,
whereas this contract models service usage. `offeringVersion` is an opaque
local correlation value, not proof that an offering, asset, account, or
recipient exists.

## Public surface

`packages/core/src/paid-task-lifecycle.ts` exports the following through
`@tool402/core`:

```ts
export interface PaidTaskInput {
  readonly taskRef: string;
  readonly offeringVersion: string;
  readonly requirements: unknown;
  readonly expiresAt: string;
}

export interface PaidTaskSnapshot {
  readonly taskRef: string;
  readonly offeringVersion: string;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

export type PaidTaskQuoted = PaidTaskSnapshot & {
  readonly state: "quoted";
};
export type PaidTaskExpired = PaidTaskSnapshot & {
  readonly state: "expired";
};
export type PaidTaskPaymentSubmitted = PaidTaskSnapshot & {
  readonly state: "payment_submitted";
};
export type PaidTaskPaymentRejected = PaidTaskSnapshot & {
  readonly state: "payment_rejected";
};
export type PaidTaskPaymentOutcomeUnknown = PaidTaskSnapshot & {
  readonly state: "payment_outcome_unknown";
};
export type PaidTaskPaymentSettled = PaidTaskSnapshot & {
  readonly state: "payment_settled";
};
export type PaidTaskExecutionStarted = PaidTaskSnapshot & {
  readonly state: "execution_started";
};
export type PaidTaskResultValid = PaidTaskSnapshot & {
  readonly state: "result_valid";
};
export type PaidTaskExecutionFailed = PaidTaskSnapshot & {
  readonly state: "execution_failed";
};
export type PaidTaskResponseOutcomeUnknown = PaidTaskSnapshot & {
  readonly state: "response_outcome_unknown";
};

export type PaidTaskState =
  | PaidTaskQuoted
  | PaidTaskExpired
  | PaidTaskPaymentSubmitted
  | PaidTaskPaymentRejected
  | PaidTaskPaymentOutcomeUnknown
  | PaidTaskPaymentSettled
  | PaidTaskExecutionStarted
  | PaidTaskResultValid
  | PaidTaskExecutionFailed
  | PaidTaskResponseOutcomeUnknown;

export type PaidTaskEvent =
  | { readonly type: "expire"; readonly observedAt: string }
  | {
      readonly type: "payment_submitted";
      readonly observedAt: string;
      readonly requirements: unknown;
    }
  | { readonly type: "payment_rejected" }
  | { readonly type: "payment_outcome_unknown" }
  | { readonly type: "payment_settled" }
  | { readonly type: "execution_started" }
  | { readonly type: "result_valid" }
  | { readonly type: "execution_failed" }
  | { readonly type: "response_outcome_unknown" };

export function createPaidTask(input: PaidTaskInput): Promise<PaidTaskQuoted>;
export function transitionPaidTask(
  state: PaidTaskState,
  event: PaidTaskEvent,
): Promise<PaidTaskState>;
```

`RequirementsDigest` is the accepted public Core type. No new dependency,
runtime configuration, or adapter is introduced.

## Local snapshot and provenance

`createPaidTask` accepts an opaque `taskRef` and `offeringVersion`, each a
trimmed nonblank string of at most 96 characters. It accepts untrusted
requirements only through the existing canonicalization/hash boundary, stores
only the resulting digest, requires the canonical UTC form
`YYYY-MM-DDTHH:mm:ss.sssZ` for `expiresAt`, and returns one frozen issued
`quoted` state. It retains no raw requirements object, payment amount,
recipient, asset, network, result, receipt, or external identifier.

Every state is a frozen issued identity, not a structural data record. A
copied, forged, proxied, accessor-backed, or caller-made lookalike is not an
issued state and cannot transition. A successful transition consumes exactly
its issued predecessor only after its successor is safely issued. A rejected
event, hash failure, or rejected read leaves the exact source usable.
Concurrent or reentrant use of one issued source while an asynchronous
requirements hash is pending rejects. The transition lock is released on every
success or failure.

## Legal transitions

Only these transitions are legal:

```text
quoted --expire--> expired
quoted --payment_submitted--> payment_submitted
payment_submitted --payment_rejected--> payment_rejected
payment_submitted --payment_outcome_unknown--> payment_outcome_unknown
payment_submitted --payment_settled--> payment_settled
payment_settled --execution_started--> execution_started
execution_started --result_valid--> result_valid
execution_started --execution_failed--> execution_failed
execution_started --response_outcome_unknown--> response_outcome_unknown
```

`expire` requires an explicit canonical `observedAt` at or after `expiresAt`.
`payment_submitted` requires an explicit canonical `observedAt` strictly
before `expiresAt` and an exact re-hash match of the complete submitted
requirements object against the task snapshot digest. Reordered object keys
may match; any changed, added, removed, malformed, or hostile field rejects.
No clock is read.

`payment_settled`, `execution_started`, and `result_valid` are local workflow
labels carried only by caller-supplied events. They do not validate or prove a
payment, settlement, finality, service execution, response, receipt, or result
outside this process. `result_valid` is the earliest future handoff state for a
separately specified split workflow; `payment_settled` alone never authorizes
a split.

`expired`, `payment_rejected`, `payment_outcome_unknown`, `result_valid`,
`execution_failed`, and `response_outcome_unknown` have no outgoing transition
in this module. Both unknown states are terminal and fail closed: this contract
does not retry, replace, reconcile, refund, or split. A later durable,
evidence-bound workflow owns any safe recovery.

## Explicit exclusions

This module does not semantically parse payment requirements; validate price,
recipient, asset, network, payability, or result content; create a payment
attempt; deduplicate across calls or durable records; verify a settlement,
receipt, finality, or service response; read a clock, environment, storage, or
network; use a wallet, signer, account, transaction, ATS, clearing split,
refund, HCS, payout, deployment, or live evidence. It makes no funding,
allocation, revenue, or external-success claim.

## Acceptance evidence

- A test-only RED commit must precede every production source or barrel-export
  commit for this card. It must capture the missing public API before GREEN;
  no post-hoc chronology substitute is permitted.
- Focused tests prove frozen minimal snapshots, canonical expiry, full-object
  requirements drift, every legal edge, execute-before-settlement rejection,
  result-before-execution rejection, source consumption only after success,
  rejected-transition preservation, structural-copy rejection, reentrant and
  concurrent transition rejection, duplicate events, and terminal unknown
  retry rejection.
- A compile-time fixture proves the public state/event surface retains the
  accepted digest brand and rejects incompatible types.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
