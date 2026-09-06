# M09 Browser RiskScan Directory inspection contract

## Delivery boundary

This contract adds one client-only Directory inspection island to the existing
static `/explore` route. An explicit user action derives only the browser's
current origin and delegates once to the accepted public
`discoverRiskScanQuick` Agent boundary. That boundary owns the one
credential-free directory `GET`; the browser never constructs an endpoint,
header, request body, or payment material.

The surface projects only the accepted, strictly validated RiskScan Quick
descriptor: its stable identity and name, the bounded input names and limits,
the two known limitations, and the already-safe local configuration summary.
It never reads or renders the descriptor's request object, a recipient,
facilitator, credential, payment header or payload, wallet/account/signer,
result, receipt, evidence, or raw response data.

## Browser behavior

The static Explore page mounts one client component. It begins in `idle`. On
an explicit `Inspect local directory` activation, the component synchronously
locks duplicate activation, enters `inspecting`, constructs
`new URL(window.location.origin)`, and calls `discoverRiskScanQuick` once. It
releases the lock in `finally`.

The only terminal states are:

```text
directory_unavailable
directory_invalid
tool_selected
```

- `directory_unavailable` says the local directory could not be read and that
  no RiskScan request was sent.
- `directory_invalid` says the local directory response could not be used and
  that no RiskScan request was sent.
- `tool_selected` renders the fixed RiskScan Quick identity, its bounded input
  contract, and the exact known limitations. Selecting the descriptor is not a
  claim that a service is available, that a request is accepted, or that a
  payment occurred.

For a `configuration_required` summary, the surface says local configuration
is required before a challenge can be offered and exposes no action. For an
EVM local summary, it may render only its fixed `x402` protocol, canonical
network, and exact price. For a native Hedera testnet local summary, it may
render only fixed `x402`, `hedera:testnet`, the canonical asset identifier,
and the exact atomic amount—without conversion, recipient, facilitator, or
payment control. Every configuration display is parser-derived local metadata,
not a live network or facilitator assurance.

UI-S05 is the local intended-behavior amendment for this new island. It
supersedes UI-S01's original no-client-request, price, and payment-state
prohibitions only for the island's one public Agent directory `GET` and the
strictly parser-derived configuration-summary fields above. UI-S01's static
Explore card and every other original prohibition remain unchanged.

All loading and terminal feedback uses a polite live region. The component
performs no automatic fetch, retry, timer, polling, storage, analytics,
environment/configuration read, external navigation, or navigation to an
action as a consequence of discovery.

## Explicit exclusions

This task does not modify the accepted Agent directory implementation or its
tests, API routes, x402 helpers, Quick execution flow, core, backend, durable
state, existing static UI-S01 card, ToolLoop route, Try route, runtime
configuration, or external services. It does not issue a `POST`, decode or
display a protocol header/payload, create a payment client, sign, access a
wallet/account/key/signer/provider, construct a recipient/facilitator/price
request, execute RiskScan, create a result, persist data, deploy, or make a
live claim.

HA-X402-HEDERA-001 remains PENDING and grants no authority for configuration,
accounts, funding, signing, payment, transactions, deployment, or live proof.

## Acceptance evidence

- RED/GREEN tests prove the public Agent subpath performs exactly one
  controlled directory `GET`, never a `POST`, and projects only the bounded
  descriptor details/configuration metadata.
- Focused client tests prove current-origin targeting, duplicate-inspection
  locking, exact truthful states, live feedback, native atomic metadata,
  exclusion boundaries, and preservation of the static UI-S01 card.
- Root Node 22.21.1 clean-install/typecheck/test/lint, production Webpack
  build, queue/reference checks, and enabled local-reference guard pass.
- Desktop and narrow browser checks perform one actual local directory `GET`,
  zero RiskScan `POST`s, and render only the local configuration-required
  directory state without framework or browser errors. Native configuration is
  controlled test evidence only.
- Independent task review and two fresh clean Standards/Specification
  module-review generations pass before acceptance.
