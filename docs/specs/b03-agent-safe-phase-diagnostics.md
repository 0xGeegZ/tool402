# B03 Agent safe phase diagnostics and non-payable preflight

## Delivery boundary

B03-T020 adds a closed, non-sensitive phase diagnostic at the Agent CLI edge
and an opt-in preflight path. It does not modify the existing payment library's
outcome union, requests, signing, retry, settlement, or result parsing.

## Diagnostic contract

One invocation may emit exactly one additional diagnostic line:

```text
RISKSCAN_PAY_DIAGNOSTIC <CODE>
```

`<CODE>` is exactly one of:

```text
CONFIGURATION_INVALID
DIRECTORY_FAILED
QUOTE_DECLINED
INITIAL_REQUEST_OR_CHALLENGE_FAILED
PAYMENT_PAYLOAD_OR_SIGNING_FAILED
SIGNED_RETRY_FAILED
SETTLEMENT_OR_RESULT_FAILED
PAID
TERMINAL_UNEXPECTED_FAILURE
PREFLIGHT_GUARD_REACHED
```

The output must never include an error message, stack, environment value, key,
account, payment payload, payment header, request secret, signer material, raw
response body, or raw remote error. The original normal B03 outcome output and
exit behavior remain unchanged except for the added closed diagnostic line.

## Phase mapping

- Configuration/input rejection maps to `CONFIGURATION_INVALID`.
- Directory selection failure maps to `DIRECTORY_FAILED`.
- Policy-declined quote maps to `QUOTE_DECLINED`.
- Initial unsigned request, missing/malformed challenge, or challenge/quote
  mismatch maps to `INITIAL_REQUEST_OR_CHALLENGE_FAILED`.
- Payment-payload construction or signer failure maps to
  `PAYMENT_PAYLOAD_OR_SIGNING_FAILED`.
- Signed retry transport failure maps to `SIGNED_RETRY_FAILED`.
- Settlement decode or result parsing failure maps to
  `SETTLEMENT_OR_RESULT_FAILED`.
- A verified normal paid outcome maps to `PAID`.
- An uncategorized local failure maps to `TERMINAL_UNEXPECTED_FAILURE`.

## Explicit non-payable preflight

`--preflight` is opt-in and never the default payment behavior. It may only:

1. read the normal non-secret service input and policy;
2. issue one Directory GET;
3. issue one unsigned initial request;
4. decode the existing payment-required challenge and exact-match it to the
   accepted quote; then
5. emit `PREFLIGHT_GUARD_REACHED` and exit 0.

It must stop structurally before payer/key access, signer resolution, payment
factory invocation, payload creation, payment-header encoding, signed retry,
settlement decoding, result parsing, or a second request. Any other diagnostic
in preflight exits nonzero.

## Explicit exclusions

Do not modify `apps/agent/src/riskscan-tool-payment.ts`, package metadata,
lockfiles, public exports, environment files, README.md,
`docs/submission/README.md`, or any Web/Backend path. Do not execute a
preflight, payment, provider action, wallet action, transaction, deployment,
or external request as part of this card.
