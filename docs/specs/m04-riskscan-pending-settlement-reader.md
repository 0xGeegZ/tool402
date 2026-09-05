# M04 RiskScan internal pending-settlement reader contract

## Delivery boundary

This contract adds one internal Convex query that makes a coherent candidate settlement record available to a future server-owned reconciliation consumer. It is read-only and internal-only: it adds no public query, mutation, action, HTTP handler, generated API output, API route, browser client, runtime configuration, or deployment.

The query runs against a configured store only when a configured Convex runtime invokes it. Its local tests prove registration and controlled handler decisions. They do not prove that a store is configured, a record is durable in an external environment, a payment or transaction occurred, settlement was verified, finality was reached, evidence was captured, a result completed, or any behavior is live.

## Internal query boundary

`readRiskScanPendingSettlementCandidate` accepts exactly one argument:

- `attemptId`: `v.id("riskScanSettlementAttempts")`.

It first loads that attempt from `riskScanSettlementAttempts`. If the attempt is absent, it returns `null` without a record-index query. Otherwise it accepts the loaded attempt only when it is a non-array object whose `_id`, `operation`, `state`, `network`, and `candidateSettlementRef` are own enumerable data properties and every descriptor owns its `value` field through `Object.hasOwn(descriptor, "value")`. Inherited properties, non-enumerable properties, accessors, and inherited descriptor-prototype values are unsafe and must not invoke a getter.

An eligible stored attempt has:

- an opaque nonempty string `_id` exactly equal to `attemptId`;
- `operation` exactly `risk_scan_settlement`;
- `state` exactly `pending_reconciliation`;
- `network` exactly `eip155:` followed by a nonzero decimal chain ID; and
- `candidateSettlementRef` as an opaque one to 160 character value matching `[A-Za-z0-9:_-]` exactly.

Any present but unsafe or ineligible attempt must throw `new RangeError("RiskScan settlement attempt is not eligible for pending-settlement read")` before a record-index query. The query derives both network and transaction reference only from this accepted attempt and never receives them from a caller.

## Record lookup and result

For an eligible attempt, the query first reads `riskScanSettlementRecords` through `by_attempt`, equality-constraining `attemptId` and taking at most two rows. It then reads the same table through `by_network_and_transaction_ref`, equality-constraining the derived network and candidate transaction reference and taking at most two rows.

- If both bounded lookups return no rows, return `null`.
- If both return exactly one safe record with the same opaque nonempty ID, both rows exactly match the canonical candidate relationship, and their `observedAt` values are exactly equal, return the candidate projection using that agreed timestamp.
- If either lookup returns two rows, only one lookup returns a row, the two rows have different IDs, either record is malformed or unsafe, a required field differs, a finality boundary is present, or a record is not `pending_verification`, throw `new RangeError("RiskScan pending settlement record conflicts with a different durable record")`.

Each acceptable record must be a non-array object whose `_id`, `attemptId`, `network`, `transactionRef`, `verificationState`, and `observedAt` are own enumerable data properties and whose descriptors each own `value` through `Object.hasOwn(descriptor, "value")`. It must not own `finalityBoundary`, including an `undefined`, non-enumerable, or accessor-backed boundary. The record must match all of:

```ts
{
  attemptId,
  network: storedAttempt.network,
  transactionRef: storedAttempt.candidateSettlementRef,
  verificationState: "pending_verification",
  observedAt: the same nonnegative bigint at most 9223372036854775807n in both indexed rows,
}
```

For one coherent candidate, return exactly:

```ts
{
  recordId: Id<"riskScanSettlementRecords">,
  network,
  transactionRef,
  verificationState: "pending_verification",
  observedAt,
}
```

`recordId` is opaque. `transactionRef` and `observedAt` remain candidate metadata: the returned projection does not assert a transaction, payment, settlement, verification, finality, receipt/evidence, result, or live state.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/backend/convex/riskscan-pending-settlement-reader.ts`
- `packages/backend/tests/risk-scan-pending-settlement-reader.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. The accepted schema and candidate settlement-attempt/record writers are dependencies, not owned changes. Public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

## Acceptance evidence

- A backend test proves the export is exactly one internal query with the exact attempt-ID argument validator and a null-or-candidate-projection return validator.
- Controlled handler tests prove absent attempt and absent record behavior, strict descriptor safety without getter reads, descriptor-prototype-pollution regressions restored in `finally`, bounded ordered dual-index reads, exact candidate projection, and generic rejection for every duplicate, divergence, mismatch, unsafe row, or finality boundary.
- The query performs no insert, patch, replace, delete, scheduling, action, network, clock, random, or other-table access.
- Backend and root typecheck/test/lint, production Webpack build, queue/reference checks, independent task review, and two fresh final Standards/Spec review generations pass.
- No public command, generated output, API/UI wiring, runtime configuration, deployed-store assertion, payment payload/signature, credential, wallet/account material, settlement/finality claim, receipt/evidence record, result, or live claim is added.
