# M49-T010 independent RED review

## Scope

Two independent current-head reviews at clean canonical
`dcd60d8d37a3491a900bc007ee882fc83858554c` reviewed the durable M49 RED
contract. The working diff changes exactly these authorized test paths:

- `apps/web/tests/stage-b-ats-create-execution-projection.test.mjs`
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`
- `apps/web/tests/ats-create-action.test.mjs`
- `apps/web/tests/ats-contracts-bundle-gate.test.mjs`
- `apps/web/tests/deploy-stage-signing.test.mjs`

No production source, queue/control-plane path, package, lockfile,
configuration, environment, provider, wallet, RPC, network, transaction,
Mirror, candidate, verification, lifecycle, deployment, or live boundary
changed. `git diff --check` is clear.

## Verified contract

- The new execution projection must freeze and rehash the full accepted M42
  real-issuer configuration to
  `1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9`, while
  rejecting S16 display and M47 command projections or any private Backend
  import.
- The future browser bridge uses injected EIP-1193 provider, fetch, and wait
  seams only. It validates the fixed chain and issuer before a send, makes one
  exact Factory request, synchronously blocks concurrent sends, and latches
  every post-hash outcome until reload.
- Receipt handling validates the exact hash, successful status, fixed Factory
  event emitter, and a single qualifying event before M44 decoded-address
  handling. The bounded Mirror resolver uses only fixed-origin, read-only
  injected requests and accepts only one returned canonical transaction id.
- Every caller override, malformed/ambiguous observation, or terminal failure
  produces no candidate and never resends. The UI contract remains explicit
  human-click-only and cannot attach a candidate itself.

## Focused RED result

Under Node 22.21.1:

```text
28 tests: 8 pass, 6 intended failures, 14 skipped
```

The six failures are limited to the absent M49 execution-projection/bridge
source modules and their intended UI wiring/feedback/controller work. All
provider, receipt, Mirror, and wait interactions are injected fakes; no live
authority is introduced.

## Verdict

**CLEAR — authorize GREEN only for the exact M49-T010 implementation surface
recorded in its card and FILE-OWNERSHIP.** The five RED test paths may change
only to complete that scope. Every other path and all actual provider, wallet,
RPC, network, transaction, public Mirror, candidate-attachment, verification,
lifecycle, deployment, and live action remain prohibited. `HA-ATS-STAGE-B-001`
remains the separate human execution gate.
