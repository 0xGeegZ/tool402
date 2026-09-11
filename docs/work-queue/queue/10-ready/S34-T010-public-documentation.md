# S34-T010 — Public RiskScan and Provider documentation

## State

- Tier: POLISH
- Queue state: 10-ready
- Dependencies: S28-T010, S29-T010, S31-T010, and S33-T010 accepted.
- Owner: The root owns queue records, the UI ledger, decisions, reviews,
  commits, and pushes. Candidate implementation paths are exactly those
  declared by UI-S34.
- Human actions: none. This work creates no configuration, payment, wallet,
  signer, command, transaction, funding, deployment, or live action.

## Scope

Document the existing RiskScan and Provider routes in a small static public
surface. The reference's Provider RiskScan visual hierarchy is adapted only
for page rhythm, identity, topic grouping, and responsive navigation. Its
mock facts and unavailable behaviors are excluded.

The local UI-S34 manifest and S34 specification fix the exact source paths,
route targets, product facts, and exclusions.

## Candidate ready requirements

- This card, UI-S34, S34 specification, ledger row, catalog row, ownership
  record, State record, DECISIONS ledger row, decision, and plan are committed
  before test or source changes.
- No active card owns the candidate source/test paths. S28, S29, S31, and S33
  are accepted historical owners only; this task needs its own reservation.
- The starting app has no `/docs` route or documentation components, and the
  existing shared-navigation/footer test baseline passes under Node 22.21.1.
- The two existing four-entry local-navigation assertions in
  `workspace-shell.test.mjs` and `guided-demo-route.test.mjs` are named
  future test targets because a Docs link changes that exact list; no other
  assertion in those files is eligible.
- A fresh independent readiness review must accept the candidate scope before
  a separate activation can permit durable RED.

## Ready authority

Independent readiness at `3f52a4941354321ed5d5dd57a0f44b93f72bce48` is
clear. S34-T010 is 10-ready only. No source or test path is active; a fresh
independent activation must confirm this authority remains intact before it
can reserve the five declared test paths for durable RED.

## RED and Green boundary

Only the focused test paths may enter durable RED after explicit activation.
No source path is authorized until an independent RED review accepts the
minimal Green scope. The eventual Green may touch only the UI-S34 paths and
may not alter existing route behavior, projection reads, API/Agent/Core/Backend
logic, payment, wallet, provider, command, transaction, deployment, or live
capability.

## Verification

The final cycle requires focused RED/GREEN evidence, 1440px and 390px local
browser captures, keyboard focus and no-overflow checks, Web/root validation,
queue/whitespace checks, and independent task plus module review.
