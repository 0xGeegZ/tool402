# M02 RiskScan request lifecycle contract

## Delivery boundary

This contract defines pure in-process domain behavior only. It does not assess a real subject, fetch external data, persist a request, emit an HTTP response, create a payment challenge, verify settlement with a facilitator, produce live evidence, or make a deployment claim.

## Input

A request has three opaque, trimmed strings:

- `requestRef`: 1–96 characters and supplied by the caller for correlation.
- `subjectRef`: 1–160 characters describing the subject to assess.
- `context`: 1–280 characters describing the bounded assessment request.

Blank, oversized, or structurally unsupported input is rejected before a lifecycle starts. The contract does not interpret the subject or context, assign a score, quote a price, or promise an outcome.

## Lifecycle

For valid input, the initial state is `payment_required`. The complete state union is:

- `unavailable`: a terminal, explicit reason means the request cannot proceed and exposes no payment challenge, result, receipt, or evidence reference.
- `payment_required`: the request is valid and awaits a future payment adapter; it has no result, receipt, or evidence reference.
- `payment_pending`: a future payment adapter reports an in-progress settlement; it has no result, receipt, or evidence reference.
- `payment_failed`: a terminal, explicit payment failure reason; it has no result, receipt, or evidence reference.
- `execution_failed`: a terminal, explicit execution failure after a verified settlement; it has no result, receipt, or evidence reference.
- `completed`: the sole state carrying a structured assessment result, receipt, and evidence reference.

Every state preserves the original `requestRef`. A completed state may be constructed only from a verified settlement correlation for the same request.

## Completion invariants

A completed state requires nonblank, matching `requestRef`, `settlementRef`, `resultRef`, `receiptRef`, and `evidenceRef` correlations. Its result contains at least one nonblank salient reason and at least one nonblank input or limitation statement. The opaque references are typed local values, not proof that a payment, result, receipt, or evidence record exists outside this process.

## Public boundary

The core package exports explicit types and pure constructors or transitions for validation, initial payment-required state, payment-pending state, payment failure, execution failure after verified settlement, and completed state. It must reject an attempted completion without a verified settlement correlation. It must not import I/O, framework, database, protocol, network, payment SDK, or adapter modules.

## Acceptance evidence

- Table-driven tests reject invalid input and preserve a valid request reference.
- A valid request produces only `payment_required` with no completed artifacts.
- Unavailable, pending, payment-failed, and execution-failed states expose no result, receipt, or evidence reference.
- Completion fails without verified settlement and succeeds only with all required correlations, reasons, and limitations.
- Focused core typecheck, test, lint, and existing pure-boundary tests pass.

Payment mapping, persistence, API exposure, UI detail/paid states, and live settlement/evidence are follow-on work with their own local specifications and authority checks.
