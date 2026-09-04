# M02-T040 — UI-S01 landing and Explore

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M01-T040 accepted; M02-T020 accepted
- Integration evidence: D-M01-FOUND-001 and D-M02-020-002 accepted
- Owner: implementation lane owns `apps/web/src/app/page.tsx`, `apps/web/src/app/explore/page.tsx`, `apps/web/src/components/landing/**`, `apps/web/src/components/discovery/**`, and focused UI-S01 tests; the root owns the local UI record, this card, and queue records.
- Human actions: none

## Scope

Create the first honest landing and Explore surfaces from the accepted local shell. They may introduce read-only discovery copy and one locally scoped RiskScan discovery item, but no price, wallet, payment, provider, account, metric, evidence, external link, request action, detail route, paid state, mock result, or claim of live availability.

The local manifest is [UI-S01](../../../ui/UI-S01.md), its selected slice is recorded in the [local UI ledger](../../../ui/IMPORT-LEDGER.md), and the implementation plan is [UI-S01 landing and Explore plan](../../../superpowers/plans/2026-09-04-m02-ui-s01-landing-explore.md).

## Validation

- Commit the minimum local UI-S01 manifest before adaptation.
- RED/GREEN route and component expectations cover the landing and Explore surfaces.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- Run a production build and browser-check desktop and narrow viewport layouts.

## Completion transition

Active at 2026-09-04T22:00:05Z after the local UI manifest, plan, dependency, and disjoint-owned-path preflight. RiskScan detail and paid-state UI remain separate work until their typed domain states are ready.
