# M03 RiskScan payment-state provenance contract

## Purpose

This contract hardens the in-process trust chain that leads to a `RiskScanVerifiedSettlement`. It makes `payment_required` and `payment_pending` issued capabilities rather than structurally trusted objects, so only the accepted lifecycle transitions can mint a verified-settlement capability.

It does not authenticate an external payment, call a payment adapter, parse a protocol response, persist data, create a wallet or account, sign or settle a payment, record a receipt or evidence artifact, expose API/UI state, or make a live claim.

## Issued-state boundaries

`startRiskScanRequest` is the sole issuer of `RiskScanPaymentRequired`. Its result must be frozen and registered in a private identity registry before it is returned.

`markRiskScanPaymentPending` accepts only that exact issued required-state object. It must reject a literal, a reflective copy, a cast, or any other structurally matching object. Its result must be frozen and registered in a separate private identity registry before it is returned.

`createRiskScanVerifiedSettlement` accepts only that exact issued pending-state object. It must reject a literal, a reflective copy, a cast, or a mutation attempt even when visible fields match a genuine pending state. It retains the existing exact `requestRef` correlation check after proving pending-state provenance.

`markRiskScanUnavailable` accepts only an issued required state. `markRiskScanPaymentFailed` accepts only an issued required or issued pending state. These failure transitions preserve their current returned shapes and remain non-capability terminal values.

The public `RiskScanPaymentRequired` and `RiskScanPaymentPending` fields are readonly because their issued instances are frozen. No new public function, storage mechanism, or dependency is introduced.

## Retained behavior

A legitimate `startRiskScanRequest` → `markRiskScanPaymentPending` → `createRiskScanVerifiedSettlement` path continues to support the accepted execution-failure, receipt/evidence binding, and completion capabilities.

This card deliberately does not add single-use or idempotency semantics: an issued pending state may still mint more than one verified settlement exactly as the existing lifecycle permits. Retrying or deduplicating settlement transitions needs its own local contract.

## Failure semantics

An unissued required state must fail before it can become pending. An unissued pending state must fail before it can mint a verified settlement. The rejection must not inspect caller-controlled visible fields as proof of provenance.

No rejected input may create a registered capability, mutate a previously issued capability, or produce a completed, receipt, evidence, or external-payment claim.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/core/src/risk-scan.ts`
- `packages/core/test/risk-scan.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. Backend, API, UI, persistence, configuration, dependencies, and live resources are excluded.

## Acceptance evidence

- Core tests prove the issued required and pending states are frozen.
- Core tests reject forged and reflective-copy required states at the pending transition.
- Core tests reject forged and reflective-copy pending states at the verified-settlement transition.
- Existing valid lifecycle, execution-failure, receipt/evidence binding, and completion regressions remain green.
- `npm run typecheck --workspace @tool402/core`
- `npm run test --workspace @tool402/core`
- `npm run lint --workspace @tool402/core`
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.
