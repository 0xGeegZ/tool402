# M11-T010 — Public product landing

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted; M02-T020 accepted
- Owner: `apps/web/src/app/page.tsx`, `apps/web/src/components/landing/**`,
  and `apps/web/tests/product-landing.test.mjs` are this card's implementation
  paths. The root owns this card, local specification/UI manifest/ledger, plan,
  queue state, catalog, ownership, decisions, reviews, integration evidence,
  and pushes.
- Human actions: none for the static public landing.

## Scope

Replace the minimal root landing with a complete, honest public introduction
to Tool402 and the bounded RiskScan journey. It provides ordinary local links
to existing Explore, RiskScan, and local Try routes plus a clear how-it-works
section. It uses only local visual resources already committed in the
repository.

The card does not modify global navigation, create a Sign flow, fetch data,
make an external call, or represent a live payment, account, wallet, provider,
metric, testimonial, result, evidence, deployment, or service availability.

The local contract is [M11 public product landing](../../../specs/m11-product-landing.md),
its UI boundary is [UI-S06](../../../ui/UI-S06.md), the local UI ledger is
[UI import ledger](../../../ui/IMPORT-LEDGER.md), and execution is in the
[M11 product landing plan](../../../superpowers/plans/2026-09-06-m11-product-landing.md).

## Candidate ready requirements

- The local contract, UI-S06 manifest/ledger row, and implementation plan are
  committed before a RED test or code change.
- Every dependency remains accepted locally; no active card owns the root-page
  or landing paths.
- The card records exact local CTA targets, semantic/accessibility criteria,
  truthfulness boundary, tier, human boundary, and concrete validation.

## Validation

- RED/GREEN tests prove landing structure, truthful copy, exact local links,
  and the exclusion boundary while preserving UI-S01's static Explore checks.
- Web/root quality, production build, queue/reference/whitespace checks,
  enabled local guard, desktop/narrow browser checks, independent task review,
  and two fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T10:16:37Z after the user confirmed the full public
landing is product scope and a fresh rescan found accepted Web/UI foundations,
no active owner of the root landing paths, and no human action needed for a
static local presentation. This inbox card authorizes only its local
contract/manifest/plan record; it authorizes neither RED/code nor external or
live behavior.

## Design review correction

The independent readiness review found that this card unnecessarily reserved
the accepted landing/Explore test and named a button primitive that cannot
represent a navigation link. The card now owns only its focused landing test
and styles semantic local links directly. UI-S01's accepted test stays
unchanged for this lane; M11-T020 owns the distinct navigation assertion
amendment. The corrected card requires scoped clean re-review before ready.

## Ready transition

Ready at 2026-09-06T10:35:41Z after the independent readiness review and its
scoped clean re-review found accepted Web/UI dependencies, exact existing CTA
routes, a focused landing-only test boundary, semantic local links, and
disjoint root-page/landing ownership. No active card owns these paths. This
ready state authorizes only the local static landing RED/GREEN contract; it
does not authorize authentication, account, wallet, payment, result, evidence,
deployment, or live behavior.

## Acceptance

Accepted at 2026-09-06T11:57:55Z after a fresh queue rescan confirmed the
accepted Web/UI dependencies and no conflicting active owner of root-page or
landing paths.

- `MODULE_BASE` is `68da461a33d0f670536644f9a703ccb95a329e64`; `MODULE_HEAD`
  is `3b94a9b97705e41683bd13fe367438332e2555f6`. M11-T010-scoped commits are
  `05f8212` and `3b94a9b`; concurrent M10 and M11 workspace paths remain
  disjoint.
- The focused landing contract, root clean-install dry run, root
  typecheck/test/lint, production Webpack build with Cache Components,
  queue/reference/whitespace checks, and enabled local-reference guard passed
  under Node 22.21.1. The build retains only the pre-existing optional x402
  package-resolution warning outside this card's paths.
- Desktop and narrow browser checks verified the static landing, all three
  local CTAs, visible keyboard focus, no horizontal overflow, zero axe
  violations, and no framework or browser errors.
- Independent task review found a muted-copy contrast gap, heading hierarchy
  issue, and focused-test gap. The root corrected the owned landing paths and
  its scoped re-review was clean. Two fresh clean Standards/Specification
  module-review generations at `3b94a9b` found no Critical, Important, or
  Minor finding.

This acceptance covers only a static local landing. It grants no authority for
authentication, session, account, wallet, provider, payment, settlement,
result, evidence, deployment, or live behavior.

## Activation

Activated at 2026-09-06T10:37:51Z after a fresh queue rescan confirmed the
pushed 10-ready state, accepted Web/UI dependencies, scoped clean readiness
re-review, exact existing CTA routes, disjoint root-page/landing paths, and no
human blocker for a static local presentation. The lane starts with its focused
landing RED contract in the current repository workspace under the local
worktree policy. No authentication, account, wallet, payment, result,
evidence, deployment, or live behavior is authorized.
