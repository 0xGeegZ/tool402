# M24-T010 — Protected replay claim

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M01-T030 accepted; M22-T010 accepted; M23-T010 accepted
- Owner: `packages/backend/src/ingress/protected-replay-claim.ts` and
  `packages/backend/tests/protected-replay-claim.test.mjs` are proposed
  implementation paths. The root owns this card, local specification, import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, commits, and pushes.
- Human actions: none for this injectable local adapter. A configured durable
  claim store, deployment, or live replay proof remains a separately authorized
  future human boundary.

## Scope

Create the smallest internal replay-claim adapter after M23. It accepts only a
same-process M23 verified capability, forwards its canonical replay identity to
one injected claim boundary, and returns a new minimal same-process capability
only after literal `claimed`.

The local contract is [M24 protected replay claim](../../../specs/m24-protected-replay-claim.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M24 protected replay claim plan](../../../superpowers/plans/2026-09-07-m24-protected-replay-claim.md).

This is the smallest missing adapter between accepted cryptographic ingress
verification and a later closed-command/generic-durable-attempt chain. It does
not claim that a store is durable or configured, and it does not reopen M04
RiskScan persistence or reconciliation behavior.

## Candidate ready requirements

- The local contract, neutral import-ledger row, plan, card, catalog,
  ownership, decision, and state records are committed before a RED test or
  source change.
- M01-T030, M22-T010, and M23-T010 remain accepted locally. M23 is the sole
  verified-capability authority; this card cannot construct, re-verify, or
  structurally accept a capability.
- The only proposed source/test paths are disjoint internal backend paths, with
  no public backend-barrel, Convex, schema, M04, Agent, Web/UI, or package
  ownership overlap.
- The sequence is verified-capability membership, one injected claim attempt,
  literal `claimed`, then a frozen claimed capability. Every other input or
  outcome fails closed and no command is parsed.
- The delivery has no storage implementation, configuration, environment,
  key, clock, network, database client, external action, or live claim.
- An independent review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A durable test-only RED contract precedes source and proves exact M23
  membership, one canonical injected call, literal-outcome handling,
  forged/copy rejection before a claim attempt, frozen claimed membership, and
  no prohibited boundary expansion.
- The focused command is
  `node --test packages/backend/tests/protected-replay-claim.test.mjs` from
  the repository root under Node 22.21.1.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations must pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T09:04:51Z after a fresh source-to-runtime rescan found
accepted M22/M23 supplies closed replay identity plus same-process cryptographic
verification, while the next protected successor lacks a bounded claim handoff.
This inbox state authorizes only committed local authority and independent design
review. It authorizes neither RED/code nor storage, commands, generic attempts,
ATS, payment, funding, allocation, clearing, HCS, account, wallet, signer,
transaction, deployment, or live behavior.

## Design review

An independent authority review of committed `c5672f01c01ba180037e762750f781ee509c459f`
completed clean. It confirmed exact M23 `WeakSet` membership precedes every
identity read or injected call, only literal `claimed` can mint a frozen
private-membership output, the injected seam does not pretend to prove durable
storage or live behavior, and the scope, ownership, references, and RED/GREEN
plan remain bounded. No Critical, Important, or Minor finding remains.

## Ready transition

Ready at 2026-09-07T09:20:41Z after a fresh post-review rescan confirmed
M01-T030, M22-T010, and M23-T010 remain accepted; committed authority and local
references resolve; no active owner conflicts with the two proposed backend
paths; the local guard is enabled; and no human blocker applies to deterministic
local work. This ready state authorizes only root activation followed by the
specified test-only RED and minimal internal adapter. It does not authorize
storage, configuration, Convex, HTTP/commands, generic attempts, ATS, payment,
funding, account/wallet action, deployment, or a live claim.
