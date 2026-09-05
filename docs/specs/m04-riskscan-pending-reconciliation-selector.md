# M04 RiskScan internal pending-reconciliation selector contract

## Delivery boundary

This contract adds one internal Convex query that selects one narrow candidate
attempt for a future server-owned reconciliation consumer. It is read-only and
internal-only: it adds no public query, mutation, action, HTTP handler,
generated API output, API route, browser client, runtime configuration, or
deployment.

The supplied cutoff is an explicit internal input. Comparing a stored timestamp
to that cutoff does not read a clock and does not establish that a retry is due,
that reconciliation occurred, or that any runtime is configured. Local tests
prove registration and controlled handler decisions only. They do not prove a
configured store, external persistence, payment, settlement, transaction
verification, finality, evidence, result completion, deployment, or live
behavior.

## Internal query boundary

`selectRiskScanPendingReconciliationAttempt` accepts exactly one argument:

- `beforeOrAt`: `v.int64()`.

For the controlled handler boundary, `beforeOrAt` must be a nonnegative
`bigint` at most `9223372036854775807n`. Any other direct handler input must
throw `new RangeError("RiskScan reconciliation cutoff is invalid")` before a
table query.

The query reads only `riskScanSettlementAttempts` through
`by_state_and_next_reconciliation`. It first equality-constrains `state` to
`pending_reconciliation`, then bounds `nextReconciliationAt` to values at or
before `beforeOrAt`, and takes at most two rows. It must not use any other
table, index, filter, ordering call, or database operation.

- Return `null` only when that bounded index result is empty.
- A non-empty result is acceptable only when it contains exactly one safe
  stored attempt.
- Two rows, an unsafe row, or an ineligible row must throw
  `new RangeError("RiskScan pending reconciliation selector encountered an unsafe durable attempt")`.

The selected attempt must be a non-array object whose `_id`, `operation`,
`state`, `network`, `candidateSettlementRef`, and `nextReconciliationAt` are
own enumerable data properties. Each property descriptor must itself own its
`value` field through `Object.hasOwn(descriptor, "value")`. Inherited
properties, non-enumerable properties, accessors, and inherited
descriptor-prototype values are unsafe and must not invoke a getter.

An eligible selected attempt has all of:

- an opaque nonempty string `_id`;
- `operation` exactly `risk_scan_settlement`;
- `state` exactly `pending_reconciliation`;
- `network` exactly `eip155:` followed by a nonzero decimal chain ID;
- `candidateSettlementRef` as an opaque one to 160 character value matching
  `[A-Za-z0-9:_-]` exactly; and
- `nextReconciliationAt` as a nonnegative `bigint` at most
  `9223372036854775807n` and at or before `beforeOrAt`.

For one eligible stored attempt, return exactly:

```ts
{ attemptId: Id<"riskScanSettlementAttempts"> }
```

`attemptId` is opaque. The returned projection does not expose a network,
transaction reference, cutoff, request identifier, payment material, or any
verification, settlement, finality, evidence, result, or live-state claim.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/backend/convex/riskscan-pending-reconciliation-selector.ts`
- `packages/backend/tests/risk-scan-pending-reconciliation-selector.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file
ownership, decisions, and integration evidence. The accepted schema, candidate
attempt writer, settlement-record writer, and pending-settlement reader are
dependencies, not owned changes. Public backend exports, generated output,
package metadata, lockfile, runtime configuration, API/UI behavior,
external-store proof, accounts, wallets, payment/settlement/finality actions,
deployment, verification/evidence capture, and live evidence are excluded.

## Acceptance evidence

- A backend test proves the export is exactly one internal query with the exact
  cutoff argument validator and null-or-opaque-attempt-ID return validator.
- Controlled handler tests prove invalid-cutoff rejection before querying,
  empty-index null behavior, exact ordered bounded index clauses, one safe
  candidate projection, and generic rejection for two rows or every unsafe or
  ineligible selected row.
- Tests cover own-data descriptor safety without getter reads, descriptor-
  prototype-pollution regressions restored in `finally`, opaque IDs, network
  and reference boundaries, timestamp boundaries, and no writes or other-table
  access.
- The query performs no insert, patch, replace, delete, scheduling, action,
  network, clock, random, or other-table access.
- Backend and root typecheck/test/lint, production Webpack build,
  queue/reference checks, independent task review, and two fresh final
  Standards/Spec review generations pass.
- No public command, generated output, API/UI wiring, runtime configuration,
  deployed-store assertion, payment payload/signature, credential,
  wallet/account material, settlement/finality claim, receipt/evidence record,
  result, or live claim is added.
