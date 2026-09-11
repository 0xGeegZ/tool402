# S33-T010 — Explore catalogue visual reconciliation

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: S20-T010, S23-T010, S25-T010, and S31-T010 accepted.
- Owner: The root owns queue records, the UI ledger, decisions, reviews,
  commits, and pushes. Candidate implementation paths are exactly those
  declared by UI-S33.
- Human actions: none. This work creates no payment, wallet, provider,
  account, transaction, deployment, or live action.

## Scope

Reconcile /explore with the selected PREP-UI-001 catalogue direction while
retaining only the two current local tools and the quiet accepted placeholder.
The local UI-S33 manifest fixes the visual anatomy, copy bounds, source paths,
and exclusions.

## Candidate ready requirements

- This card, UI-S33, the ledger row, catalog row, ownership record, State
  record, decision, and plan are committed before source or test changes.
- No active card owns the five existing source/test paths. S20 and S23 are
  accepted historical owners only; this card needs an explicit new reservation.
- The starting catalogue remains static, has exactly two real entries and one
  placeholder, and its focused test baseline passes under Node 22.21.1.
- A fresh independent readiness review must accept the candidate scope before
  a separate activation can permit durable RED.

## RED activation authority

Independent activation at c541039d6d7a0cc98cdc1ced8d3e9f4ff997db08 is clear:
the ready records are intact, former visual owners are historical and
disjoint, the static baseline passes under Node 22.21.1, and no source
collision exists. S33-T010 is active only for durable RED in:

- apps/web/tests/explore-catalog.test.mjs
- apps/web/tests/explore-visual-reconciliation.test.mjs (new)

## RED and GREEN boundary

Only the two named focused test paths are authorized to create durable RED.
No source path is authorized. Only a fresh independent RED review may
authorize minimal presentation Green in the exact UI-S33 path set.

## Ready authority

Independent readiness review is clear at
dec98bb22fc8a3e2403a426fa5639130bb053cf4: every dependency is accepted,
there is no active source collision, all five existing targets are present, the
new visual test is absent, and the Node 22.21.1 Explore baseline passes 1/1.
S33-T010 moves to 10-ready only. A separate independent activation is still
required before either test path can enter durable RED.

## Verification

The final cycle requires focused RED/GREEN evidence, desktop and 390px local
browser captures beside the selected reference capture, visible keyboard focus,
no overflow, Web/root validation, queue/whitespace checks, and independent
task plus module review.

## Boundary

This is a visual composition slice only. The static local catalogue remains
noninteractive and truthful; no data source, route behavior, or capability is
changed.
