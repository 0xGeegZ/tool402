# M11-T010 — Public product landing

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T040 accepted; M02-T020 accepted
- Owner: `apps/web/src/app/page.tsx`, `apps/web/src/components/landing/**`,
  `apps/web/tests/product-landing.test.mjs`, and the constrained
  `apps/web/tests/landing-explore.test.mjs` amendment are this card's
  implementation paths. The root owns this card, local specification/UI
  manifest/ledger, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, and pushes.
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
