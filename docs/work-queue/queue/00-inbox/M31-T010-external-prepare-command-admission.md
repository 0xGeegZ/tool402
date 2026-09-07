# M31-T010 — External-prepare command admission handoff

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M25-T010 accepted; M26-T010 accepted; M30-T010 accepted
- Owner: This is a root-owned inbox authority card. It owns this card, the
  M31 specification and plan, the proposed focused backend test and internal
  ingress source, and root-integrator queue records. The root owns state,
  catalog, ownership, decisions, reviews, commits, and pushes.
- Human actions: No new human action is required for this deterministic local
  handoff. HA-COMMAND-AUTHORITY-001 supplies the already accepted future
  replay/idempotency semantics as local design context only; it grants no
  configuration access, durable storage, provider call, or external action.

## Scope

After M30 accepted, the next smallest CORE_P0 boundary is a same-process
adapter that runs M30 itself and supplies its successful detached result to
one injected atomic-admission boundary. It closes the unsafe gap where a
structural normalized DTO could otherwise be passed as authenticated input.

The local contract is the
[M31 external-prepare command admission handoff](../../../specs/m31-external-prepare-command-admission.md),
and execution is constrained by the
[M31 implementation plan](../../../superpowers/plans/2026-09-07-m31-external-prepare-command-admission.md).

This card does not implement a durable replay/idempotency store or generic
attempt; it defines and exercises one atomic handoff seam only. A later
separately reviewed persistence card must own Convex schema/functions and
prove the durable transaction. ATS target/parameter authority remains a
separate later human-sensitive gate.

## Candidate ready requirements

- M25-T010, M26-T010, and M30-T010 remain accepted locally.
- The local specification, neutral import-ledger row, plan, card, catalog,
  ownership, decision, and state records are committed before a RED test or
  source change.
- The only candidate implementation paths are one new internal backend ingress
  source and one focused backend test. It must not modify M24 through M30,
  RiskScan persistence/reconciliation, the backend public barrel, a package or
  lockfile, Convex, Web/UI, Agent, configuration, or generated output.
- The contract invokes M30 from M25 claimed input, validates one callable
  injected atomic boundary before M30 work, creates a frozen detached snapshot,
  calls the boundary at most once, maps only four exact status tokens, and
  accepts only a strict direct synchronous result. It never awaits, probes,
  invokes, retains, or propagates an outcome's `then`; an indistinguishable
  transparent proxy may be accepted only as detached status data, never as
  async-completion provenance.
- A fresh independent review of the amended synchronous-only M31 authority is
  clean: no Critical, Important, or Minor finding remains.

## Validation

- A test-only RED contract precedes source and proves M30-only authentication,
  pre-normalizer non-callable rejection, exact frozen snapshot/result shapes,
  one atomic-boundary invocation, hostile result isolation including all four
  hostile normally reflected async forms plus fulfilled native/async-function
  results, and no retry. It does not claim host-level rejected-Promise
  handling.
- The focused command is
  `node --test packages/backend/tests/external-prepare-command-admission.test.mjs`
  from the repository root under Node 22.21.1.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations must pass before
  acceptance.

## Inbox transition

Recorded at 2026-09-07T20:49:29Z after a fresh post-M30 source-to-runtime
rescan found no active, ready, or existing inbox CORE_P0 card. M30 provides a
strict authentication result but its DTO is structural, while M24 supplies an
unrelated ingress replay seam and no durable command handoff. The narrow M31
adapter therefore consumes M30 itself and delegates the complete future
replay/idempotency decision to one injection.

This inbox state authorizes only committed local authority and independent
design review. It authorizes neither RED/code nor Convex, storage, replay or
idempotency claim, generic attempt, `PREPARED` state, configuration, ATS,
provider, wallet, funding, payment, transaction, deployment, or live behavior.

## Async-outcome amendment

Recorded at 2026-09-07T21:06:27Z after independent authority review identified
that generic promise awaiting can assimilate an injected hostile thenable. The
authority now requires M24's accepted native-Promise intrinsic pattern: direct
descriptor-safe validation first; otherwise captured
`NativePromise.prototype.then`, primitive-status-or-null resolution inside its
callback, and no retry. This held M31 in `00-inbox` pending a fresh clean
authority re-review; it rejects direct thenables, proxy-wrapped promises,
species-poisoned promises, and delayed-thenable fulfillment.

## Superseded native-Promise design review

Two fresh independent authority reviews of committed
`b9e379234916357af39e6c2a1b55adbebc91f4ad` completed clean. They confirmed
the amendment accepts direct outcomes only after descriptor-safe exact-shape
validation and asynchronous outcomes only via the captured native-Promise
intrinsic, with primitive-status-or-null resolution inside the callback. The
four hostile async forms fail closed after exactly one boundary call and no
retry. The M30-authenticated injection-only scope, consumed dependencies,
ownership, and local references remain bounded. No Critical, Important, or
Minor finding remains.

## Ready transition

Ready at 2026-09-07T21:16:02Z after a fresh post-review root rescan confirmed
M25-T010, M26-T010, and M30-T010 remain accepted; this is the sole eligible
ready card; committed authority and local references resolve; no active owner
conflicts with the two proposed backend paths; the local guard is enabled; and
no human blocker applies to deterministic local work. This ready state
authorizes only root activation followed by the specified test-only RED and
minimal internal adapter. It does not authorize storage, configuration, Convex,
generic attempts, ATS, provider/wallet action, funding, payment, transaction,
deployment, or live behavior.

## Async-feasibility correction

Recorded at 2026-09-07T21:27:50Z during a final implementation-feasibility
review before RED. A native Promise exposes no provenance for how it settled:
an arbitrary native promise may already have assimilated a thenable and still
be observationally identical to one created from a direct result. A bare
native-Promise bridge also permits a species-poisoned promise whose original
value is a valid status. Therefore the preceding native-Promise-only wording
cannot both accept arbitrary asynchronous outcomes and enforce its stated
thenable-rejection guarantee.

The initial safe local ruling was to narrow M31 to an exact synchronous direct
result only. It never reads, awaits, or assimilates a boundary outcome's
`then`; the later clarification below states the portable limit of that
guarantee. Any future durable asynchronous boundary requires a separately
accepted adapter-owned or branded completion protocol with explicit timeout and
recovery semantics. This correction returns M31 to `00-inbox` for fresh
independent authority review; the prior ready/activation records remain
historical only and authorize no code.

## Synchronous-port clarification

Recorded at 2026-09-07T21:33:00Z after the amended-authority review found that
portable reflection cannot prove that a transparent proxy/polluted-prototype
value presenting the exact direct status shape is not a Promise/thenable. M31
therefore makes the narrower truthful guarantee: it never awaits, probes,
invokes, retains, or propagates an outcome's `then`, and copies only approved
primitive status into a fresh frozen result. An indistinguishable value is
treated as detached data only, never as asynchronous-completion provenance.

The synchronous port requires failures to throw synchronously or return an
invalid direct value. Rejected/asynchronous returns are out of contract; M31
does not claim to observe or suppress host-level unhandled rejection behavior.
The card remains in `00-inbox` pending fresh review of this clarification.

## Direct-data wording correction

Recorded at 2026-09-07T21:47:47Z after a fresh test-plan review found that the
clarification still described known Promise forms too categorically. The
authority now says only normally reflected promise/thenable forms that fail the
exact direct representation return `null`; any indistinguishable exact status
shape is detached data only, never async-completion provenance. This narrow
wording correction remains within the synchronous port and requires one fresh
clean authority re-review before ready.

## Activation

Activated at 2026-09-07T21:19:00Z after a fresh post-ready root rescan at
pushed `cb339a3901a4408aaaccaec6287e88e06a517453` confirmed M31-T010 is the
sole ready card; M25-T010/M26-T010/M30-T010 remain accepted; no active owner
conflicts with the bounded backend paths; committed authority and local
references resolve; the local guard is enabled; and no human blocker applies.
This activation authorizes only the specified test-only RED followed by the
minimal internal adapter. It does not authorize storage, configuration, Convex,
generic attempts, ATS, provider/wallet action, funding, payment, transaction,
deployment, or live behavior.
