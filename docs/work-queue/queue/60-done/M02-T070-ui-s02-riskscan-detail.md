# M02-T070 — UI-S02 RiskScan detail

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted; M02-T010 accepted; M02-T020 accepted; M02-T030 accepted; M02-T050 accepted; M02-T060 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-010-002, D-M02-020-002, D-M02-030-002, D-M02-050-002, D-M02-060-002, and D-M02-070-002 accepted
- Owner: accepted delivery record comprises `apps/web/src/app/explore/riskscan/page.tsx`, `apps/web/src/components/riskscan/detail/**`, `apps/web/src/components/discovery/riskscan-discovery-card.tsx`, `apps/web/tests/riskscan-detail.test.mjs`, and `apps/web/tests/landing-explore.test.mjs`; the root owns this card, the manifest, ledger, and queue records.
- Human actions: none for local detail delivery; live configuration, payment, deployment, and evidence remain separate human-authorized work.

## Scope

Create a truthful, server-rendered RiskScan detail surface on the accepted Explore UI. It may link from the local discovery card and describe the accepted Quick input, result dispositions, and configuration-dependent API boundary. It must not add an action, request, price, payment state, wallet, account, provider, metric, receipt, evidence, mock result, external link, or claim of live availability.

The local manifest is [UI-S02](../../../ui/UI-S02.md), the selected local boundary is recorded in the [local UI ledger](../../../ui/IMPORT-LEDGER.md), and the implementation plan is [UI-S02 RiskScan detail plan](../../../superpowers/plans/2026-09-05-m02-ui-s02-riskscan-detail.md).

## Validation

- RED/GREEN static tests cover one main landmark, one heading, the only local detail/back links, accepted input/result/configuration copy, and the exclusion of interactive/payment/mock surfaces.
- Root Node 22.21.1 typecheck and 43-test suite pass.
- The production webpack build, local-reference guard, queue check, and Next compile/error/route checks pass.
- Desktop and narrow browser navigation plus narrow accessibility audit pass.

## Completion transition

Accepted at 2026-09-05T07:55:54Z after root verification, independent task reviews, final standards/spec review, and scoped re-review of the final type-only fix. The delivered surface remains descriptive only; live configuration, payment, deployment, and evidence remain separate human-authorized work.
