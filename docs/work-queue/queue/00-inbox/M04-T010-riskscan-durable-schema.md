# M04-T010 — RiskScan durable-schema foundation and indexes

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T030 accepted; M02-T010 accepted; M03-T020 accepted; M03-T030 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-010-002, D-M03-020-002, and D-M03-030-002 accepted
- Owner: the proposed implementation scope is `packages/backend/convex/schema.ts` and `packages/backend/tests/risk-scan-schema.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
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
