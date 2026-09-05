# M04-T010 — RiskScan durable-schema foundation and indexes

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T030 accepted; M02-T010 accepted; M03-T020 accepted; M03-T030 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-010-002, D-M03-020-002, and D-M03-030-002 accepted
- Owner: the accepted implementation scope was `packages/backend/convex/schema.ts` and `packages/backend/tests/risk-scan-schema.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for local schema declarations and tests. Any external store configuration, account, wallet, payment, settlement, deployment, or live evidence remains human-authorized.

## Scope

Define only the narrow durable RiskScan record shapes and lookup indexes needed by later local write, reconciliation, projection, and evidence cards. This establishes the schema boundary without creating a writer, reader, generated API output, runtime configuration, external connection, or live assertion.

The local contract is [M04 RiskScan durable schema](../../../specs/m04-riskscan-durable-schema.md); its executable delivery steps are in the [M04 durable schema plan](../../../superpowers/plans/2026-09-05-m04-riskscan-durable-schema.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or schema declarations.
- M01-T030, M02-T010, M03-T020, and M03-T030 are accepted locally, their integration evidence is recorded, and no active lane owns the two reserved backend paths.
- The card records CORE_P0 priority, exact table/index boundaries, opaque-value restrictions, verification boundary, human-action boundary, and concrete validation commands.
- The delivery excludes generated API output, queries, mutations, actions, writes, reads, package or lockfile changes, backend projection changes, API/UI behavior, runtime configuration, external stores, payment payloads, credentials, accounts, wallets, deployment, and live claims.

## Validation

- RED/GREEN backend tests import the default schema and assert the exact six-table structure, field validator shapes, and declared indexes.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Root `npm run typecheck`, `npm run test`, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Ready transition

Ready at 2026-09-05T13:27:57Z after the root revalidated all accepted dependencies and their recorded integration evidence, the committed local specification and plan, no active lane, disjoint two-file backend ownership, no pending human action, concrete executable validation, and queue validation. No writer, reader, generated API, external connection, payment action, deployment, or live claim is included.

## Activation

Activated at 2026-09-05T13:28:56Z after a fresh queue rescan confirmed the pushed ready state, no active lane, and the same disjoint backend ownership boundary. Task 1 starts with its schema-export RED contract. No writer, reader, generated API, external action, payment, wallet/account action, deployment, or live claim is authorized.

## Completion transition

Accepted at 2026-09-05T13:44:15Z. The schema began from an observed missing-module RED and reached a Green export contract. Independent task review found that the first test renamed Convex's exported `bigint` validator type; the scoped fix restores exact exported-form assertions and passed a fresh clean re-review. Root verification passed Node 22.21.1 typecheck, the 65-test suite, lint, queue validation, whitespace, the enabled local-reference guard, and a production Webpack build. The default Turbopack build remains host-blocked by an internal port-bind `EPERM`, reproduced outside the sandbox; the accepted diff contains only backend schema/test paths and no web build input. Two fresh clean Standards/Spec review generations found no Critical, Important, or Minor finding. `MODULE_BASE` was `38d5beef2309ffe7e43d3c8f97448ca6ea0e89a1`; `MODULE_HEAD` was `9c02594d4f522972db77ae0c580c25c71b8d090c`. No writer, reader, generated API, external connection, payment action, settlement assertion, account/wallet action, deployment, or live claim was added.
