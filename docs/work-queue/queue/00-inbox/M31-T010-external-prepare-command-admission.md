# M31-T010 — External-prepare command admission handoff

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M25-T010 accepted; M26-T010 accepted; M30-T010 accepted
- Owner: This is a root-owned inbox authority record. It owns this card, the
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
  accepts asynchronous results only through captured native-Promise intrinsics.
  Direct thenables, proxy-wrapped promises, species-poisoned promises, and
  delayed-thenable fulfillment must fail closed without retry.
- An independent review of the committed M31 authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A test-only RED contract precedes source and proves M30-only authentication,
  pre-normalizer non-callable rejection, exact frozen snapshot/result shapes,
  one atomic-boundary invocation, hostile result isolation including all four
  non-native/hostile async forms, and no retry.
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
callback, and no retry. This keeps M31 in `00-inbox` pending a fresh clean
authority re-review and rejects direct thenables, proxy-wrapped promises,
species-poisoned promises, and delayed-thenable fulfillment.
