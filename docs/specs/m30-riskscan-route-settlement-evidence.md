# M30 RiskScan route settlement-evidence contract

## Purpose

The accepted M03 settlement observer is unreachable from the public route.
`handleRiskScanPost` constructs its protected handler with no options, and
`RiskScanPostOptions` exposes only a facilitator client, so
`onVerifiedSettlement` is always absent and no after-settle hook is ever
registered. A live paid request therefore settles on the ledger and issues no
local capability at all. The accepted observer is exercised only by tests that
call `createRiskScanProtectedHandler` directly.

This contract closes that seam. It gives the route one server-owned consumer
and one bounded in-process sink that holds the verified settlements the
observer issues. It is the minimum change that makes the accepted observer
reachable in the deployed path.

## Delivery boundary

This contract does not add durable storage, a public read surface, a lifecycle
projection, receipt or evidence binding, a payment client, a signer, an
account, a funded action, a transaction, a deployment, or a live claim. It does
not reopen the M03 correlation rules, the M04 persistence modules, or the
protected route's status, body, or payment headers.

Two follow-on boundaries are named here and delivered by neither this contract
nor any accepted card. A verified settlement is not a
`RiskScanLifecycleState`: reaching the `completed` state requires
`bindRiskScanReceiptEvidence` and `completeRiskScanRequest`, whose receipt and
evidence references have no local producer, so `projectRiskScanLifecycle`
cannot yet be applied to observer output. Exposing recorded evidence through a
route would publish caller-supplied `requestRef`, `subjectRef`, and `context`
values and requires its own privacy contract first.

## Consumer seam

`RiskScanPostOptions` gains one optional member with the type the accepted
observer already defines:

```ts
export interface RiskScanPostOptions {
  facilitatorClient?: FacilitatorClient;
  onVerifiedSettlement?: (
    settlement: RiskScanVerifiedSettlement,
  ) => void | Promise<void>;
}
```

`handleRiskScanPost` resolves the consumer before constructing a handler. When
the caller supplies `onVerifiedSettlement`, that consumer is used unchanged.
When the caller supplies none, the server-owned default recorder defined below
is used. The default applies on both construction paths, so the deployed route
and a test that injects only a facilitator client observe the same wiring.

Handler selection follows the resolved consumer. A call that supplies neither
option uses the per-configuration handler cache, whose handler is constructed
with the default recorder; because that recorder is a stable module-level
function, one cached handler per configuration remains correct. A call that
supplies either option constructs a fresh handler carrying the resolved
consumer, so a caller's consumer can never be replaced by the default through a
cache hit.

A supplied consumer must not be wrapped, retried, or observed. Its return value
is discarded by the accepted observer, and a synchronous throw or a rejected
promise must not change the protected response.

## Server-owned evidence sink

A new Web module owns the default recorder and its sink. The sink holds only
the accepted core `RiskScanVerifiedSettlement` capability objects the observer
issues. It derives nothing, and it stores no payment header, payload,
signature, digest, response body, facilitator response, or configuration value.

The sink is bounded to at most 50 entries. When a fifty-first settlement
arrives the oldest entry is evicted first, so a long-lived process cannot grow
without limit. The sink is process-local and non-durable: a restart, a second
instance, or a redeploy loses its contents. This is deliberately not a durable
record and must never be described as one.

The module exposes exactly three functions:

- `recordRiskScanVerifiedSettlement(settlement)` appends one settlement and
  applies the bound. It is the default consumer.
- `readRiskScanSettlementEvidence()` returns a fresh array snapshot, so a
  caller cannot mutate the sink through the returned value.
- `clearRiskScanSettlementEvidence()` empties the sink. It exists so tests can
  isolate, and no route calls it.

No function logs, serializes, or returns anything beyond the stored
capabilities, and no caller outside this module may append to the sink.

## Acceptance evidence

- A protected request that settles successfully through an injected
  facilitator, with no `onVerifiedSettlement` supplied, appends exactly one
  genuine core verified settlement to the module sink, and the recorded value
  is accepted by `bindRiskScanReceiptEvidence` as a real capability rather than
  a structurally similar object.
- An unsigned request, an invalid Quick body, and a failed settlement append
  nothing.
- An explicitly supplied consumer receives the settlement and the module sink
  stays empty, proving the default does not run alongside a caller's consumer.
  This holds whether or not a facilitator client accompanies it: a consumer
  supplied alone must not be discarded by a cache hit.
- The protected response status, body, and payment headers are unchanged from
  the accepted M03 behavior in every case above.
- The sink never exceeds 50 entries, evicts oldest first, and returns a
  snapshot whose mutation does not affect later reads.
- `readRiskScanX402Configuration`, the challenge, the unavailable path, and the
  directory summary are unchanged.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npm run build --workspace @tool402/web`
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  the enabled local-reference guard, independent task review, and a fresh
  module-review generation.

## Human boundary

This contract adds no external authority. Choosing a recipient or facilitator,
supplying runtime configuration, deploying the service, creating a signer,
signing or submitting a payment, and recording live evidence all remain
human-only actions tracked in the runtime human-actions record.
