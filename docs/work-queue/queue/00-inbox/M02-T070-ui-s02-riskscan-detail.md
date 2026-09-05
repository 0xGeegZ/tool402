# M02-T070 — UI-S02 RiskScan detail

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T040 accepted; M02-T010 accepted; M02-T020 accepted; M02-T030 accepted; M02-T050 accepted; M02-T060 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-010-002, D-M02-020-002, D-M02-030-002, D-M02-050-002, and D-M02-060-002 accepted
- Owner: when activated, the implementation lane owns `apps/web/src/app/explore/riskscan/page.tsx`, `apps/web/src/components/riskscan/detail/**`, `apps/web/src/components/discovery/riskscan-discovery-card.tsx`, `apps/web/tests/riskscan-detail.test.mjs`, and `apps/web/tests/landing-explore.test.mjs`; the root owns the manifest, ledger, this card, and queue records.
- Human actions: none for local detail delivery; live configuration, payment, deployment, and evidence remain separate human-authorized work.

## Scope

Create a truthful, server-rendered RiskScan detail surface on the accepted Explore UI. It may link from the local discovery card and describe the accepted Quick input, result dispositions, and configuration-dependent API boundary. It must not add an action, request, price, payment state, wallet, account, provider, metric, receipt, evidence, mock result, external link, or claim of live availability.

The local manifest is [UI-S02](../../../ui/UI-S02.md), the selected local boundary is recorded in the [local UI ledger](../../../ui/IMPORT-LEDGER.md), and the implementation plan is [UI-S02 RiskScan detail plan](../../../superpowers/plans/2026-09-05-m02-ui-s02-riskscan-detail.md).

## Validation

- Commit the local UI-S02 manifest and plan before adaptation.
- RED/GREEN static tests cover one main landmark, one heading, the only local detail/back links, accepted input/result/configuration copy, and the exclusion of interactive/payment/mock surfaces.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- Run a production webpack build and browser-check desktop and narrow viewport layouts.

## Completion transition

Inbox record created at 2026-09-05T07:02:44Z after all named dependencies were accepted and the local manifest, plan, ownership boundary, human-action boundary, and concrete validation commands were recorded. It may move to ready only after root revalidates its disjoint paths and local references.
