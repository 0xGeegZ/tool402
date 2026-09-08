# B03 RiskScan Agent payment client contract

## Purpose

The judged agentic-payments criterion requires a platform or agent to complete
a real paid request end to end. No component in this repository can pay.
`apps/agent` stops at `payment_required` by the accepted M05 challenge-
observation contract, which forbids it from creating, replaying, or decoding a
payment, and nothing imports a client scheme or a signer.

Three of the four steps already work against the live route: the Agent
discovers `riskscan.quick` in the Tool Directory, evaluates the native quote
against a caller-supplied budget policy, and receives the `402` challenge. This
contract adds the fourth: sign the challenge and retry.

## Delivery boundary

This contract adds one Agent payment module and one CLI entry point. It does
not amend the accepted M05 challenge-observation contract, which keeps its
observe-only behavior unchanged. It adds no browser payment client, no wallet
or provider integration, no durable storage, no read surface, no receipt or
evidence binding, and no key material in the repository.

The payer account, its key, the recipient, and the facilitator are runtime
values supplied by a human outside this repository. This contract creates no
account, funds nothing, and authorizes no deployment or submission.

## Injected signer

The module never reads an environment variable, file, or credential store. It
takes a signing capability as a required parameter, in the same required-
injection style as the accepted M23 and M24 boundaries. A caller that has no
signer cannot construct the module, so no default or ambient credential path
exists.

The CLI entry point is the only place that reads runtime configuration, and it
reads it from the process environment at the edge, passes the constructed
signer inward, and never logs, echoes, serializes, or persists a key.

## Its own request cycle

The module performs its own request rather than consuming the M05 outcome,
because that accepted contract returns a bare `payment_required` and must not
decode the challenge. The cycle is: discover, evaluate the quote against the
policy, request, decode the challenge, create the payment payload, retry with
the payment header, and return.

The budget policy gates the payment. When
`evaluateDiscoveredRiskScanNativeQuote` returns `declined`, the module returns
that decision and never signs. Declining is a first-class outcome, not an
error: an agent that pays whatever it is asked is not exercising a policy.

## Closed outcome union

The module returns exactly one of:

```ts
| { kind: "directory_unavailable" }
| { kind: "directory_invalid" }
| { kind: "input_invalid" }
| { kind: "quote_declined"; reason: RiskScanNativeQuoteDeclineReason }
| { kind: "transport_failure" }
| { kind: "unavailable" }
| { kind: "challenge_invalid" }
| { kind: "payment_failed"; reason: string }
| { kind: "paid"; settlementRef: string; assessment: RiskScanQuickResult }
| { kind: "unexpected_response" }
```

Only `paid` carries a settlement reference, and only when the protected
response is `200` and the settlement header reports success with a nonblank
transaction. Every other path returns without a settlement reference. No
outcome carries a key, header, payload, or signature.

## Two client requirements the contract fixes

Both were observed against the live facilitator and are recorded here so an
implementer does not rediscover them.

A default client refuses to pay in native HBAR. Client spend controls admit
only assets that `findDefaultAsset` recognizes, and the Hedera default is
USDC, not `0.0.0`. The module must set an explicit allowed-asset entry for the
configured asset with a per-payment cap, and that cap must come from the same
caller policy that gates the quote, never from a hidden default.

The scheme must be registered through the builder form. The configuration form
`new x402Client({ schemes: [...] })` throws `No client registered for x402
version: 2`; only `.register("hedera:*", ...)` produces a usable client.

## CLI entry point

One script exposed as an npm script in the Agent workspace. It reads the
service base URL, the payer account, the payer key, and the budget policy from
the environment, constructs the signer, runs the module once, prints a
human-readable trace of the four steps, and exits nonzero on any outcome other
than `paid`.

It prints the settlement reference on success. It never prints the key, the
payment header, the signed transaction, or any environment value.

## Acceptance evidence

- A discovery failure, an invalid input, a declined quote, a transport failure,
  a `503`, a malformed challenge, and a failed settlement each return their
  own outcome, and none returns `paid` or a settlement reference.
- A declined quote never constructs a payment payload and never signs.
- The module cannot be constructed without a signer.
- The accepted M05 challenge-observation module is unchanged, and its
  observe-only outcome union is unchanged.
- Source-boundary checks prove no environment read, credential read, logging of
  key or header material, or persistence inside the module.
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  the enabled local-reference guard, independent task review, and a fresh
  module-review generation.
- One human-authorized live exercise against the designated facilitator on
  Hedera testnet, corroborated on the public mirror node, recorded as evidence
  with no secret material.

## Human boundary

Creating or funding the payer account, supplying its key to the runtime,
choosing the recipient and facilitator, running the live exercise, deploying,
recording the video, and submitting all remain human-only actions tracked in
the runtime human-actions record.
