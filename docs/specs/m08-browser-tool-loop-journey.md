# M08 Browser ToolLoop RiskScan journey contract

## Delivery boundary

This contract adds one browser-visible presentation of the accepted local
ToolLoopAgent discovery-to-challenge flow. It lets an observer submit the
existing bounded Quick fields from a new local route. The browser derives its
service base only from its current origin and calls the accepted
`runRiskScanQuickFlow` boundary once.

The flow therefore performs the existing credential-free directory `GET` and,
only after accepted discovery, the existing unsigned RiskScan `POST`. The
browser renders only the opaque terminal union returned by the Agent. It does
not inspect a selected descriptor, a protocol header, or a payment summary.

## Browser and package boundary

`@tool402/agent` exposes only the public `./riskscan-tool-flow` subpath for
this surface. The Web workspace consumes that local package through its
declared workspace dependency and transpiles it as part of the existing Next
application. Cache Components stays enabled; the new route is a static server
page whose interactive form is a client component. No route uses request-time
data, an opt-out, a cache change, or server configuration.

The browser component creates `new URL(window.location.origin)` only in its
submit handler. It calls `runRiskScanQuickFlow(serviceBase, input)` exactly
once and stores only one of these bounded terminal outcomes:

```text
directory_unavailable
directory_invalid
input_invalid
transport_failure
unavailable
payment_required
unexpected_response
```

The component has only `idle`, `submitting`, and one terminal outcome view.
It locks duplicate submission while submitting. It does not introduce a
success/result state because the accepted Agent flow does not return one.

## Required truthful rendering

The route uses the same bounded inputs as the accepted Try route:
`requestRef`, `subjectRef`, `context`, plus boolean `identity`, `pricing`,
`limitations`, and `evidence` declarations. It renders accessible, fixed
copy for each outcome:

- Directory failures say no RiskScan request was sent.
- `input_invalid` says the input was rejected and no RiskScan request was
  sent.
- `transport_failure`, `unavailable`, and `unexpected_response` say that no
  payment or result is confirmed or shown.
- `payment_required` says a payment challenge was returned and no payment was
  made in the browser.

A controlled test-only native directory followed by an unsigned `402` maps
only to `payment_required`. In a real local browser with configuration absent,
the actual directory `GET` is followed by the local API's explicit unavailable
response. Neither path is a payment, settlement, result, receipt, evidence,
or live claim.

## Explicit exclusions

This task does not modify accepted Agent source or tests, x402 helpers, API
routes, core, backend, durable state, UI-S03 request flow, runtime
configuration, or external services. It does not display or decode a payment
header or payload; read environment variables; add a recipient, facilitator,
price, network, wallet, account, signer, provider, client payment action,
retry, timer, storage, analytics, receipt, evidence, result, deployment, or
external link.

HA-X402-HEDERA-001 remains PENDING. It authorizes and unblocks no payment
client, account action, signing, transaction, or live proof.

## Acceptance evidence

- RED/GREEN Web tests prove public Agent package access, exact controlled
  GET-then-POST composition, no POST on directory failure, and bounded opaque
  outcomes.
- Focused route/component tests prove exact Quick inputs, current-origin
  targeting, duplicate-submit locking, all seven terminal states, accessible
  feedback, local detail navigation, and the exclusion boundary.
- Root Node 22.21.1 clean-install/typecheck/test/lint, Webpack production
  build, queue/reference checks, and enabled local guard pass.
- The Next development loop proves the new desktop and narrow browser route
  renders without framework or browser errors and observes the actual local
  configuration-absent unavailable state. Controlled `402` remains test-only
  evidence.
- Independent task review and two fresh clean Standards/Spec module-review
  generations pass before acceptance.
