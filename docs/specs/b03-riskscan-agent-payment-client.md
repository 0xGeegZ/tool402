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
not amend the accepted M05 challenge-observation contract, whose source and
tests remain byte-for-byte unchanged. It adds no browser payment client, no
wallet or provider integration, no durable storage, no read surface, no receipt
or evidence binding, and no key material in the repository.

The payer account, its key, the recipient, and the facilitator are runtime
values supplied by a human outside this repository. This contract creates no
account, funds nothing, and authorizes no deployment or submission.

## Construction and injected dependencies

The only public construction boundary is:

```ts
createRiskScanQuickPaymentAgent({
  signer,
  directoryFetcher,
  requestSender,
  paymentClientFactory,
}).pay(serviceBase, input, policy)
```

`signer` is a required `ClientHederaSigner`. `directoryFetcher` and
`requestSender` each have the exact `(target: URL, init: RequestInit) =>
Promise<Response>` shape. The implementation exports these exact narrow types:

```ts
type RiskScanPaymentSender = (
  target: URL,
  init: RequestInit,
) => Promise<Response>;

type RiskScanPaymentClient = {
  getPaymentRequiredResponse(
    getHeader: (name: string) => string | null | undefined,
  ): PaymentRequired;
  createPaymentPayload(paymentRequired: PaymentRequired): Promise<PaymentPayload>;
  encodePaymentSignatureHeader(paymentPayload: PaymentPayload): Record<string, string>;
  getPaymentSettleResponse(
    getHeader: (name: string) => string | null | undefined,
  ): SettleResponse;
};

type RiskScanPaymentClientFactory = (
  signer: ClientHederaSigner,
  policy: Readonly<{
    network: "hedera:testnet";
    asset: string;
    maximumAmount: string;
  }>,
) => RiskScanPaymentClient;
```

`paymentClientFactory` receives only the injected signer and the frozen
B03 policy snapshot, and returns only these x402 operations:

```ts
getPaymentRequiredResponse
createPaymentPayload
encodePaymentSignatureHeader
getPaymentSettleResponse
```

Construction validates every dependency synchronously and rejects an absent or
malformed signer, sender, fetcher, or factory before any I/O. There is no
default signer, global `fetch`, ambient credential path, or fallback.

The B03 policy snapshot has exactly `network`, `asset`, and `maximumAmount`.
It accepts only canonical `hedera:testnet`, a canonical Hedera asset identifier,
and a canonical atomic integer maximum. The module creates a fresh
frozen snapshot after its one Directory GET, passes that exact snapshot to
`evaluateRiskScanNativeQuote`, and passes the same snapshot to the factory only
after the quote is eligible. The eligibility result's `amount` is the quoted
price, not the cap, and never substitutes for `maximumAmount`.

The library never reads an environment variable, file, or credential store;
never logs; never dynamically imports; and never starts a child process or
persists a value. It owns its strict local input snapshot rather than calling
or changing M05's private input/challenge boundary.

The CLI entry point is the only place that reads runtime configuration and
parses a payer key. It passes the constructed signer inward and never logs,
echoes, serializes, or persists a key. A missing or malformed runtime value
returns only a fixed safe diagnostic code; caught error text is never written
to stdout or stderr.

## Its own request cycle

The module performs its own request rather than consuming the M05 outcome,
because that accepted contract returns a bare `payment_required` and must not
decode the challenge. It calls `discoverRiskScanQuick` once with the injected
Directory fetcher, then calls the pure Core `evaluateRiskScanNativeQuote` on
that same selection's payment quote and the frozen B03 policy snapshot. It
does not call `evaluateDiscoveredRiskScanNativeQuote`, the M05 challenge helper,
or the ToolLoop flow. Its cycle is exactly one Directory GET, one unsigned POST,
challenge decoding, payload creation, and one signed retry. It never makes a
second unsigned request or a second signed retry.

The budget policy gates the payment. When `evaluateRiskScanNativeQuote` returns
`declined`, the module returns
that decision after its one Directory GET and before it constructs a client,
creates a payload, invokes the signer's payment-signing method, or retries.
Declining is a first-class
outcome, not an error: an agent that pays whatever it is asked is not exercising
a policy.

The decoded x402 requirement must be version 2, scheme `exact`, network
`hedera:testnet`, and have an asset and atomic amount exactly equal to the
already evaluated eligible quote. A challenge with another network, scheme,
asset, or amount is invalid before signing, even if its amount would be within
the caller's cap.

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
| {
    kind: "payment_failed";
    reason:
      | "payment_payload_rejected"
      | "settlement_rejected"
      | "payment_response_invalid";
  }
| { kind: "paid"; settlementRef: string; assessment: RiskScanQuickResult }
| { kind: "unexpected_response" }
```

Only `paid` carries a settlement reference, defined exactly as the accepted
settlement header's nonblank transaction value, and only when the protected
response is `200`, the settlement header reports success on
`hedera:testnet` (the accepted quote network), and the returned assessment
exactly matches `assessRiskScanQuick(frozenInput)` field-for-field:
`requestRef`, `subjectRef`, `context`, `disposition`, ordered `reasons`, and
ordered `limitations`.
Every other path returns without a settlement reference. No outcome carries a
key, header, payload, signature, caught error text, or SDK diagnostic.

## Two client requirements the contract fixes

Both were observed against the live facilitator and are recorded here so an
implementer does not rediscover them.

A default client refuses to pay in native HBAR. Client spend controls admit
only assets that `findDefaultAsset` recognizes, and the Hedera default is
USDC, not `0.0.0`. The production client factory must set an explicit
allowed-asset entry for the configured asset with a per-payment cap, and that
cap must be the same `maximumAmount` already accepted by the caller policy,
never a hidden default.

The production factory is exactly:

```ts
new x402Client()
  .register("hedera:*", new ExactHederaScheme(signer))
  .setSpendControls({
    maxAmountPerPayment: false,
    allowedAssets: [{ network: "hedera:testnet", asset, maxAmountPerPayment }],
  });
```

wrapped by `new x402HTTPClient(...)`. The builder registration is required: the
configuration form `new x402Client({ schemes: [...] })` does not produce a
usable version-2 client.

## CLI entry point

One script exposed as `riskscan:pay` in the Agent workspace runs
`src/riskscan-pay-cli.ts`. It reads the service base URL, input, budget policy,
payer account, and payer key from the environment; constructs the signer; and
runs the module once. It prints only a fixed human-readable phase/outcome trace
and exits nonzero on any outcome other than `paid`.

It prints the settlement reference on success. It never prints the key, a
payment header, payload, signed transaction, any environment value, or caught
error text.

## Acceptance evidence

- A discovery failure, invalid dependency construction, invalid input, declined
  quote, initial or retry transport failure, `503`, malformed/mismatched
  challenge, factory failure, malformed payment response, and failed settlement
  each return their fixed outcome, and none returns `paid` or a settlement
  reference.
- A declined quote makes exactly one Directory GET and never constructs a
  client, creates a payment payload, invokes the signer's payment-signing
  method, or retries.
- The module cannot be constructed without a valid signer, two request seams,
  and payment-client factory.
- The accepted M05 challenge-observation module is unchanged, and its
  observe-only outcome union is unchanged.
- Source-boundary checks prove no environment/credential/filesystem/process
  access, logger/console access, default fetch, dynamic import, or persistence
  inside the library. A sentinel thrown by a signer or SDK cannot enter an
  outcome, stdout, or stderr.
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
