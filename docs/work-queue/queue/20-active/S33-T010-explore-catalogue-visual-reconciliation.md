# S33-T010 — Explore catalogue visual reconciliation

## State

- Tier: POLISH
- Queue state: 20-active (corrective RED only)
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

## RED acceptance and minimal Green authority

Independent RED review at 85f99346077d1dadb4e728eefe5ac31df2f08934 is clear.
The two focused tests changed only within their reservation and fail only for
the absent catalogue/intro/card presentation. The root may now amend only:

- apps/web/src/app/explore/page.tsx
- apps/web/src/components/discovery/explore-catalog.tsx
- apps/web/src/components/discovery/riskscan-discovery-card.tsx
- apps/web/src/components/discovery/entitycheck-discovery-card.tsx
- apps/web/tests/explore-catalog.test.mjs
- apps/web/tests/explore-visual-reconciliation.test.mjs

No behavior, data, route, wallet, provider, payment, transaction, deployment,
or live capability path is authorized.

## Task review

Independent review at a56687ef538c5bd23eb1add95df723271e55d87c is clear. The
final source remains confined to the declared presentation set and matching
visual test; local routes/listings, quiet placeholder, no-faux-control and
no-prohibited-claim boundaries, compact no-shadow cards, headings, focus, and
reduced motion hold. Focused 2/2, Web 333/333, typecheck, lint, queue, and
whitespace are clear under Node 22.21.1. Root browser evidence records
1440px/390px captures, no horizontal overflow, and axe 0 violations/incomplete;
the reviewer could not rerun browser evidence because its sandbox denied a
Next port bind. Source is frozen pending independent module review.

## Module-review correction

The canonical-main module review blocks the source on the unsupported
machine-payment phrase and an incomplete no-runtime proof. D-S33-010-006
reopens only `apps/web/tests/explore-visual-reconciliation.test.mjs` to write
durable corrective RED. D-S33-010-007 additionally reserves only the matching
`machine-payable` assertion in `apps/web/tests/landing-explore.test.mjs` after
the fresh RED review found it would otherwise block Green. The Explore page
and every other source path remain frozen until a fresh independent RED review
accepts both test deltas and authorizes the supporting-sentence replacement
and matching assertion alone.

## Rebuilt exact-head review

The previous-branch review evidence is non-ancestral after the clean S33
rebuild. At `51dc20e`, fresh review confirms the two intended failures are
only the old page sentence but blocks incomplete JSX static-boundary coverage.
D-S33-010-008 keeps only the focused visual test and the exact matching
landing assertion in corrective RED; production remains frozen.

## Corrective RED acceptance

Independent RED review at `2f26d7185c991eb8b1f6e3c4054ee2960fe2faad` is
clear. D-S33-010-009 authorizes only the Explore supporting-sentence literal
in `apps/web/src/app/explore/page.tsx`; the two matching assertions are
already RED. No other source/test path or behavior is authorized.

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
