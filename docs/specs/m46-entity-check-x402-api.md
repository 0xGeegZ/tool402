# M46 x402-protected EntityCheck API contract

## Delivery boundary

This contract adds one configuration-aware `POST /api/entitycheck` service
boundary around the EntityCheck source reader and core assessment, and
extracts the accepted RiskScan x402 protection into one route-agnostic
factory so that both routes share one implementation. It does not commit a
wallet, key, recipient, facilitator URL, payment payload, account, deployed
address, live result, settlement record, receipt, or testnet evidence.

## Shared factory

A new server-only module `apps/web/src/lib/x402-protected-route.ts` receives
the behaviour now inside the accepted `riskscan-x402.ts`: configuration
parsing for the EVM and native Hedera families, the settlement-validating
facilitator client, native Hedera capability assertion, the optional
settlement observer, the protected handler cache, and the unavailable
response. It is parameterised by an environment variable prefix, a route
path, a route description, a request evaluator, and an optional observer
callback.

`riskscan-x402.ts` keeps every existing export with identical behaviour by
delegating to the factory with prefix `RISKSCAN_X402`, path `/api/riskscan`,
and the accepted Quick evaluator and settlement recorder. The accepted
`riskscan-api.test.mjs` passes unchanged.

## EntityCheck configuration

The protected boundary reads the same closed configuration families under the
prefix `ENTITYCHECK_X402`: `ENTITYCHECK_X402_PAY_TO`,
`ENTITYCHECK_X402_FACILITATOR_URL`, `ENTITYCHECK_X402_NETWORK`,
`ENTITYCHECK_X402_PRICE`, and for the native family
`ENTITYCHECK_X402_HEDERA_ASSET` and `ENTITYCHECK_X402_HEDERA_AMOUNT`, with the
accepted M02 and M06 validation rules. No default is committed.

## Request and response behavior

- Missing or invalid x402 configuration, or `null` source configuration,
  produces an explicit JSON `503` with no payment header; no challenge is
  issued for a request the service could not fulfil.
- With valid configuration, an unsigned request receives the protocol `402`
  with a nonempty `PAYMENT-REQUIRED` header; no source read runs.
- A validly authorised request is parsed with `parseEntityCheckRequest`. A
  malformed body returns an explicit `400` and is not settled.
- A valid request performs one source read. A `registry_unavailable` or
  `sanctions_unavailable` outcome returns an explicit JSON `503` naming only
  the outcome kind; because the handler response is not successful, the
  integration does not settle.
- A `read` outcome returns the core assessment result as JSON with status
  `200`, and only then does the integration settle.
- The settlement-validating facilitator rules from M02 and M06 apply
  unchanged: a wrong network or blank transaction never releases the result.
- This route passes no settlement observer. Durable settlement evidence for
  EntityCheck is a separate later card; nothing here records, fabricates, or
  implies a receipt or evidence record.

The local test configuration disables startup synchronisation and never calls
a live facilitator, wallet, network, registry, or sanctions source.

## Public boundary

The web package owns the App Router handler at
`apps/web/src/app/api/entitycheck/route.ts`, the EntityCheck route module
`apps/web/src/lib/entity-check-x402.ts`, and the shared factory. They may depend on the local core package, the source
reader, and the pinned x402 packages already in the lockfile. They must not
expose configuration to browser code, log a payment payload, or make a
configuration or source error look paid.

## Acceptance evidence

- The accepted RiskScan API tests pass unchanged after the extraction.
- Tests prove `503` without a payment header for missing x402 configuration
  and for missing source configuration.
- Tests prove `402` with `PAYMENT-REQUIRED` for an unsigned request with no
  source read.
- Tests prove `400` for malformed input, `503` for each unavailable source
  outcome with no settlement, and `200` with the core result for a `read`
  outcome using an injected fetch fixture.
- Tests prove wrong-network and blank-transaction settlement results do not
  release the result.
- Web typecheck, test, lint, production build, local-reference guard, and
  independent review pass.

Providing a recipient, selecting a facilitator, funding or signing a payment,
deploying the route, and capturing settlement or evidence remain human-owned
actions.
