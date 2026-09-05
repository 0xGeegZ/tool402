# M03 RiskScan settlement observer contract

## Purpose

This contract adds a deliberately narrow, single-process observation seam to the protected RiskScan Quick handler. When an explicitly supplied server-owned consumer is present, it may receive a genuine in-process `RiskScanVerifiedSettlement` only after the installed x402 server reports a successful, configured-network, after-handler settlement for a valid protected Quick response.

The observer is disabled when no consumer is supplied. In that default path it must issue no payment state and preserve the existing protected Quick behavior. A supplied server-owned consumer has the local type `(settlement: RiskScanVerifiedSettlement) => void | Promise<void>`.

The protected route explicitly selects the installed Exact authorization payment flow. The observer is not compatible with an upfront or other pre-handler flow: that would settle before the private Quick handler can bind its generated response bytes. A later contract must define a different correlation design before it may use such a flow.

This is not durable settlement provenance, replay protection, persistence, receipt or evidence capture, completion, an API/UI state, an external payment assertion, or a live claim. Process restart, multiple instances, timeouts, and duplicate requests can lose observation; a later local contract must define any durable behavior before relying on it.

## Issuance and correlation boundaries

Only a private protected-handler closure may issue a pending state. The directly callable `runRiskScanQuick` helper remains an assessment-only function and must never issue `payment_required`, `payment_pending`, or `RiskScanVerifiedSettlement` values.

After the x402 wrapper has verified a request and the private Quick handler has produced a valid successful response, the observer may create a core `payment_required` state and advance it to the issued `payment_pending` capability. It must use only the accepted core lifecycle functions.

The route must declare the authorization flow in its accepted payment requirements, so settlement is after the handler. It must not rely only on a scheme default that could change to a pre-handler flow.

The observer derives a SHA-256 digest from the exact in-process `payment-signature` header string selected for the v2 request. It pairs that header digest with a digest of the exact protected Quick response bytes. These values may exist only in a closure-local transient map; they must never be returned, logged, persisted, included in an error, or exposed to a caller.

At most one active entry may exist for one header digest. A duplicate active header must never overwrite the first entry. If an after-settlement event carries a different response digest for that header, the entry is discarded without issuing a settlement capability. This fail-closed policy prevents cross-binding; it is not exactly-once processing or replay protection.

## Settlement observation

Before consuming an active entry, the observer requires all of the following:

- x402 v2 input and the selected in-process payment-signature representation;
- `phase === "after-handler"`;
- `result.success === true`;
- both the matched requirements network and settlement result network equal the configured network;
- a string transaction reference whose trimmed value is non-empty; and
- an exact response-byte digest match.

It atomically removes the entry before creating the core verified-settlement capability, uses the pending state's exact `requestRef`, and passes the trimmed transaction reference as `settlementRef`. It then awaits only the supplied server-owned consumer with that exact capability inside its internal failure boundary. A consumer can therefore continue the accepted core lifecycle in-process; the observer itself retains no result after the callback resolves.

Any observer, core, digest, or consumer failure is caught internally and emits no log. It cannot alter the x402 response status, body, or payment headers.

## Cleanup

Entries expire after a fixed bounded local timeout. The observer also removes the relevant entry on settlement failure, verified-payment cancellation, non-after-handler phase, an invalid or mismatched settlement result, missing response bytes, response-digest mismatch, or any observer/core/consumer exception.

Cleanup is fail-closed: a duplicate or cancellation may discard an otherwise valid in-flight entry, but it must never cause that entry to bind to another request.

## Scope and ownership

This card owns only:

- `apps/web/src/lib/riskscan-x402.ts`
- `apps/web/tests/riskscan-api.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. Route shape, UI behavior, runtime configuration, dependencies, persistence, backend projection, payment clients, accounts, wallets, funded or live actions, receipts, evidence, deployment, and submission are excluded.

## Acceptance evidence

- A valid v2 protected Quick request with a successful same-network after-handler settlement delivers exactly one usable core verified-settlement capability to the supplied consumer, without changing its response status/body/payment headers.
- The emitted accepted requirements select the authorization flow; a changed scheme default cannot turn the observer into a pre-handler correlation path.
- Unsigned requests, invalid Quick input, direct Quick calls, failed/cancelled settlements, wrong phase/network, blank or non-string transaction references, response mismatch, duplicate in-flight header input, timeout cleanup, and synchronous or rejected-Promise consumer/core failures emit no capability and leave no cross-binding path.
- The tests prove the callback receives a genuine accepted core capability, not a structurally similar object.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npm run build --workspace @tool402/web`
- `npm run typecheck`, `npm run test`, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.
