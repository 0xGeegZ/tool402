# M02 RiskScan backend projection contract

## Delivery boundary

This contract defines a pure local projection from an accepted RiskScan lifecycle state into a serializable read model. It does not persist data, define a Convex query or mutation, expose an HTTP endpoint, create a payment challenge, verify a settlement, retrieve evidence, make a network call, or claim that any service is live.

## Input and output

`projectRiskScanLifecycle` accepts the exported `RiskScanLifecycleState` union from `@tool402/core`. It returns a fresh read model with the original `state`, `requestRef`, `subjectRef`, and `context`.

The projection carries only fields the input state already carries:

- `unavailable` and `payment_failed` retain their explicit `reason`.
- `payment_required` and `payment_pending` have no result, receipt, evidence, settlement, or invented pricing field.
- `execution_failed` retains the verified `settlementRef` and explicit `reason`, but no completed artifacts.
- `completed` retains its settlement, structured result, receipt, and evidence references. Its reasons and limitations are copied into fresh arrays.

The projection must not infer a state transition, synthesize an identifier, add a score, attach pricing, or turn an unavailable state into a usable tool.

## Public boundary

The backend package may export the read-model type and pure projection function. Its source imports the core lifecycle type only. It adds no generated API output, database schema, Convex function, credential, public state-changing command, protocol adapter, or I/O dependency.

## Acceptance evidence

- Tests exercise all six lifecycle states through the public backend entry point.
- Tests show non-completed projections do not expose a result, receipt, or evidence reference.
- A completed projection copies nested result arrays rather than sharing mutable array references.
- Backend typecheck, test, lint, local-reference guard, and independent review pass.

Persistence, query functions, request ingestion, payment verification, and live evidence are separate local tasks.
