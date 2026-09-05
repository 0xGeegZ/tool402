# M05 RiskScan machine-readable Tool Directory contract

## Delivery boundary

This contract adds one local machine-readable discovery endpoint for exactly
one existing tool descriptor: RiskScan Quick. It provides static capability and
input metadata plus a fail-closed local configuration summary. It does not
register a tool with an external directory, discover a live service, validate a
facilitator, initiate payment, execute RiskScan, or establish settlement,
verification, finality, evidence, result, deployment, or live availability.

The endpoint's configuration summary is derived only from the accepted local
RiskScan x402 configuration parser. It proves that a supplied environment passes
that parser in a controlled process; it does not prove a configured runtime,
recipient, facilitator, network support, payment path, or any external fact.

## Public discovery boundary

`GET /api/tools` returns status `200`, content type JSON, and `cache-control:
no-store`. With Cache Components enabled, the asynchronous route must await
`connection()` before reading `process.env`; it must not export a legacy
`dynamic` segment configuration. The runtime boundary prevents a build-time
environment snapshot from being presented as current discovery configuration.
The route reads `process.env` only by passing it to the local directory response
builder; all deterministic descriptor construction is testable with an explicit
`NodeJS.ProcessEnv` argument.

The response has exactly this top-level shape:

```ts
{
  version: "v1",
  tools: [/* exactly one RiskScan descriptor */],
}
```

The one descriptor has all of:

```ts
{
  id: "riskscan.quick",
  name: "RiskScan Quick",
  request: {
    method: "POST",
    path: "/api/riskscan",
    contentType: "application/json",
  },
  input: {
    type: "object",
    required: ["requestRef", "subjectRef", "context", "declarations"],
    properties: {
      requestRef: { type: "string", minLength: 1, maxLength: 96 },
      subjectRef: { type: "string", minLength: 1, maxLength: 160 },
      context: { type: "string", minLength: 1, maxLength: 280 },
      declarations: {
        type: "object",
        additionalProperties: false,
        required: ["identity", "pricing", "limitations", "evidence"],
        properties: {
          identity: { type: "boolean" },
          pricing: { type: "boolean" },
          limitations: { type: "boolean" },
          evidence: { type: "boolean" },
        },
      },
    },
  },
  limitations: [
    "quick_assessment_only",
    "caller_declarations_are_not_external_verification",
  ],
  payment: /* one local configuration state below */,
}
```

The required top-level keys, closed declaration object, declaration keys, and
string limits describe the accepted local RiskScan Quick input boundary. The
descriptor must not claim that a request is accepted, paid, settled, verified,
or completed merely because discovery returns it.

## Configuration summary

The builder invokes only `readRiskScanX402Configuration(environment)`. It must
not invoke a facilitator, startup/usable configuration check, payment wrapper,
RiskScan handler, network, clock, random source, or any backend/durable-store
operation.

- When the parser returns `null`, `payment` is exactly
  `{ state: "configuration_required" }`.
- When the parser returns an EVM configuration, `payment` is exactly:

  ```ts
  {
    state: "locally_configured",
    protocol: "x402",
    network: configuration.network,
    price: configuration.price,
  }
  ```

- When the parser returns a native Hedera testnet configuration, `payment` is
  exactly:

  ```ts
  {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: configuration.price.asset,
    amount: configuration.price.amount,
  }
  ```

Neither state exposes a recipient, facilitator URL, credential, secret, account,
wallet, fee payer, payment header/payload, transaction, receipt, evidence
reference, or result. `locally_configured` describes parser output only and is
never a claim of network/facilitator support or live availability.

## Scope and ownership

Only these implementation paths belong to this card:

- `apps/web/src/lib/tool-directory.ts`
- `apps/web/src/app/api/tools/route.ts`
- `apps/web/tests/tool-directory-api.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file
ownership, decisions, and integration evidence. The accepted RiskScan Quick
and x402 API boundaries are dependencies, not owned changes. Existing RiskScan
route/source/tests, UI behavior, core/back-end persistence, generated output,
package metadata, lockfile, runtime configuration, external directory
registration, accounts, wallets, payment/settlement/finality actions,
deployment, verification/evidence capture, and live evidence are excluded.

## Acceptance evidence

- A web test proves the pure builder/response helper returns the exact one-tool
  response shape, JSON/no-store headers, required/closed input-declaration
  metadata, and no extra tool. Source-level contract coverage proves the route
  awaits `connection()` before passing `process.env` to the helper and exports
  no legacy `dynamic` configuration; browser runtime verification proves the
  route itself responds under a real Next request.
- Tests prove absent or malformed configuration fails closed to
  `configuration_required`; a controlled valid parser configuration yields only
  local protocol/network metadata plus its EVM price or native asset/amount.
- Tests prove a serialized response never leaks a recipient, facilitator URL,
  credential, payment payload/header, account, wallet, transaction, receipt,
  evidence reference, or result.
- Tests prove directory construction and route handling make no network,
  payment, RiskScan, backend/durable-store, clock, random, or state-changing
  call.
- Web and root typecheck/test/lint, production Webpack build, queue/reference
  checks, independent task review, and two fresh final Standards/Spec review
  generations pass.
- No external registration, configured-runtime assertion, payment/settlement,
  verification/finality/evidence/result, deployment, or live claim is added.
