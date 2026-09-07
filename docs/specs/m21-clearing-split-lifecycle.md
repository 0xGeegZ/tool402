# M21 clearing-split lifecycle contract

## Delivery boundary

This contract adds the smallest pure Core lifecycle between an accepted local
paid-task result and a future revenue-clearing adapter. It carries only the
immutable task correlation needed to represent whether a split is required,
submitted, ambiguous, or locally marked confirmed.

It does not calculate an allocation, create a split intent in storage, prove
a receipt, or make a transfer. Every state and event in this module is a local
workflow label. In particular, `split_confirmed` records a controlled local
event only; a later durable adapter must independently establish any external
receipt, finality, allocation, or accounting fact before choosing that event.

## Public API

`packages/core/src/clearing-split-lifecycle.ts` exports this public surface
through `@tool402/core`:

```ts
export interface ClearingSplitSnapshot {
  readonly taskRef: string;
  readonly offeringVersion: string;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

export type ClearingSplitRequired = ClearingSplitSnapshot & {
  readonly state: "split_required";
};
export type ClearingSplitSubmitted = ClearingSplitSnapshot & {
  readonly state: "split_submitted";
};
export type ClearingSplitOutcomeUnknown = ClearingSplitSnapshot & {
  readonly state: "split_outcome_unknown";
};
export type ClearingSplitConfirmed = ClearingSplitSnapshot & {
  readonly state: "split_confirmed";
};

export type ClearingSplitState =
  | ClearingSplitRequired
  | ClearingSplitSubmitted
  | ClearingSplitOutcomeUnknown
  | ClearingSplitConfirmed;

export type ClearingSplitEvent =
  | { readonly type: "submit" }
  | { readonly type: "confirm" }
  | { readonly type: "outcome_unknown" }
  | { readonly type: "non_execution_proven" };

export function createClearingSplit(
  result: PaidTaskResultValid,
): ClearingSplitRequired;
export function transitionClearingSplit(
  state: ClearingSplitState,
  event: ClearingSplitEvent,
): ClearingSplitState;
```

`PaidTaskResultValid` and `RequirementsDigest` remain accepted public Core
types. The implementation adds no dependency, runtime configuration, adapter,
or new numeric brand.

## Capability handoff and immutable snapshot

`createClearingSplit` starts only from the exact issued `result_valid` state
emitted by the accepted paid-task lifecycle. A copied, forged, proxied,
accessor-backed, or caller-made lookalike must reject before any caller field
is trusted. An issued paid-task state at any other lifecycle point must also
reject.

The implementation may add one narrow, non-barrel capability-transfer helper
to the paid-task lifecycle source. It must identify an issued `result_valid`
state without normal property reads, consume that exact source only after
successful validation, and return a fresh frozen snapshot. The helper is an
internal Core seam used only by this lifecycle; it is not a new public API.

Each successful start consumes its exact result source, so the same issued
result cannot open a second split lifecycle. A rejected start leaves the valid
source available. Every split state is a frozen issued identity, not a
structural record; a copied, forged, proxied, or mutable lookalike cannot
transition. Each state contains exactly `state`, `taskRef`,
`offeringVersion`, `requirementsDigest`, and `expiresAt`; it retains no raw
requirements, amount, terms, recipient, asset, network, account, transaction,
receipt, result, or external identifier.

Events are closed ordinary records with exactly one enumerable data field,
`type`; missing, extra, inherited, nonenumerable, symbol, accessor-backed, or
reflection-failing event shapes reject. Event handling must not invoke a
caller-defined accessor. This strict local event shape prevents a state change
from being hidden behind coercion or a permissive default.

## Legal transitions

Only these transitions are legal:

```text
issued paid-task result_valid --createClearingSplit--> split_required
split_required --submit--> split_submitted
split_submitted --confirm--> split_confirmed
split_submitted --outcome_unknown--> split_outcome_unknown
split_outcome_unknown --confirm--> split_confirmed
split_outcome_unknown --non_execution_proven--> split_required
```

`split_confirmed` is terminal. An unknown outcome cannot be submitted again
or replaced directly. It can return to `split_required` only after the
explicit `non_execution_proven` event; this module does not prove that event,
query a ledger, or retry anything itself. This preserves a reconciliation
boundary instead of silently treating ambiguity as non-execution.

Every successful transition consumes its exact issued predecessor only after
its successor is issued. A rejected event or malformed event leaves the exact
source usable. All skipped, duplicate, terminal, cross-state, or structural
copy transitions fail closed. The implementation reads no clock, environment,
storage, or network.

The prior paid-task `result_valid` label is also local workflow state, not a
receipt or settlement proof. Starting this lifecycle therefore means only
that a future split workflow is represented; it does not authorize or assert
a financial operation.

## Explicit exclusions

This module does not parse protocol input; calculate an 80/20 allocation;
validate price, recipient, asset, network, maturity, payment, result,
settlement, receipt, finality, non-execution, or accounting; create a durable
attempt, persistence record, idempotency record, clearing intent, or audit
event; or perform a payment, funding, allocation, ATS, transfer, clearing,
HCS, payout, deployment, or live action. It does not use a wallet, signer,
key, account, transaction, external service, or secret.

The generic durable external-attempt model, broader closed-boundary schemas,
configuration, ATS boundary, receipt verification, settlement, allocation,
clearing transfer, HCS evidence, and holder distribution remain separately
specified work. This contract does not make any of them eligible or complete.

## Acceptance evidence

- A test-only RED commit must precede every production source, narrow
  paid-task handoff amendment, or barrel-export commit for this card. It must
  observe the absent public split API and types; post-hoc chronology is not a
  substitute.
- Focused tests prove exact frozen snapshots, issued-result-only start,
  rejected-source preservation, successful source consumption, every legal
  transition, skipped/duplicate/terminal rejection, unknown-outcome retry
  blocking, non-execution return, structural-copy/proxy rejection, malformed
  event rejection without accessor invocation, and no retained external data.
- A compile-time fixture proves the public state/event surface retains the
  accepted digest brand and rejects incompatible state/event access.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
