# M46-T030 implementation plan — x402-protected EntityCheck API

Execute [M46-T030](../../work-queue/queue/20-active/M46-T030-entity-check-x402-api.md)
against the committed [EntityCheck API contract](../../specs/m46-entity-check-x402-api.md),
the accepted [RiskScan API contract](../../specs/m02-riskscan-x402-api.md),
and the accepted [Hedera compatibility contract](../../specs/m06-riskscan-hedera-x402.md).

## Boundaries

The durable RED phase may create only
`apps/web/tests/entitycheck-api.test.mjs`. It must leave
`apps/web/tests/riskscan-api.test.mjs` byte-identical and must not add source,
configuration, package, lockfile, payment, wallet, network, or live behavior.
A fresh independent RED review is required before any GREEN source path.

The GREEN scope, if authorized, is exactly the shared server-only factory,
the EntityCheck handler, the App Router entry point, and the root-reserved
behaviour-preserving RiskScan extraction named by the card. The RiskScan module
must preserve every existing export, accepted response, cache boundary,
configuration rule, Hedera capability check, and settlement observer semantic.

## RED contract

Write table-driven handler tests with injected dependencies. They must prove:

1. missing or malformed x402 configuration returns `503` without a payment
   header and without any source read;
2. missing EntityCheck source configuration returns the same closed `503`;
3. a valid unsigned challenge returns `402` with `PAYMENT-REQUIRED` and makes
   no source read;
4. an authorised malformed body returns `400` and is not settled;
5. each source-unavailable outcome returns `503` and is not settled;
6. a bounded injected `read` result returns `200` and settles only after the
   result is produced; and
7. wrong-network and blank-transaction settlement outcomes do not release a
   result.

Also assert the static route boundary: POST is the only registration and
`process.env` reaches the implementation only through the handler entry point.
The RED suite must fail only because the declared production modules are absent.

## GREEN sequence

1. Extract configuration parsing, scheme loading, native capability check,
   protected handler cache, optional observer, unavailable response, and
   settlement wrapper from `riskscan-x402.ts` into a route-parameterised
   factory. Make cache ownership route-instance-local.
2. Rebuild the RiskScan export surface by delegating to that factory without
   changing its observed API or test file.
3. Add an EntityCheck-specific handler that parses the core request only after
   protection, obtains the accepted injected source reader, maps unavailable
   outcomes to closed `503` responses, assesses a `read` result with core, and
   registers no settlement observer.
4. Add the thin `/api/entitycheck` POST entry point that passes runtime
   environment only to the handler. Do not export configuration to client code.

## Verification

Run the focused EntityCheck and unchanged RiskScan tests first, then the Web
suite/typecheck/build and root quality commands under Node 22.21.1. Inspect the
final diff for the exact declared paths, run queue/reference/whitespace/local
guard checks, then obtain a task review and two fresh module reviews before
acceptance.
