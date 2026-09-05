# M02 x402-protected RiskScan API contract

## Delivery boundary

This contract adds one configuration-aware `POST /api/riskscan` service boundary around the accepted RiskScan Quick assessment. It uses the local x402 v2 server integration only when all required runtime configuration is present. It does not commit a wallet, key, recipient, facilitator URL, payment payload, account, deployed address, live result, settlement, receipt, or testnet evidence.

The accepted EVM configuration remains supported. The current native Hedera
testnet extension is defined by [M06 RiskScan Hedera testnet x402 compatibility](m06-riskscan-hedera-x402.md); it is an additional closed configuration family,
not a replacement for EVM, and retains the same protected route and local
fail-closed behavior.

## Runtime configuration

The protected boundary requires all four nonblank values at runtime:

- `RISKSCAN_X402_PAY_TO`: an EVM recipient address;
- `RISKSCAN_X402_FACILITATOR_URL`: an HTTPS facilitator URL without credential userinfo;
- `RISKSCAN_X402_NETWORK`: an EVM CAIP-2 network identifier;
- `RISKSCAN_X402_PRICE`: a positive dollar-denominated exact price.

No default recipient, network, price, or facilitator is committed. Missing or invalid configuration produces an explicit JSON `503` unavailable response with no payment header and does not run the assessment handler.

## Request and response behavior

With valid configuration, the route uses the exact EVM x402 v2 server scheme and a route configuration keyed exactly to `/api/riskscan`.

- An unsigned request receives the payment protocol's `402` response with a nonempty `PAYMENT-REQUIRED` header; the Quick handler does not run.
- A validly authorized request parses a RiskScan Quick input and returns only the deterministic Quick result. A malformed request produces an explicit client error and does not settle a payment.
- The integration settles only after a successful handler response. It does not fabricate payment success, a receipt, evidence, a transaction, or a completed lifecycle state.
- Before the x402 resource server receives a settlement result, the local facilitator boundary must convert a malformed `success: true` result into a normal settlement failure. A successful result must carry both the configured and accepted network plus a nonblank string transaction reference; a wrong network or blank/non-string transaction must never release the protected Quick response.

The local test configuration must disable startup synchronization and must never call a live facilitator, wallet, or network.

## Public boundary

The web package owns the App Router handler and a server-only configuration/protection factory. It may depend on the local core package and the pinned x402 Next, core, and EVM integration packages. It must not expose configuration to browser code, add a client wallet, create an account, log a payment payload, or make a local configuration error look paid.

## Acceptance evidence

- Tests prove missing or malformed configuration returns `503` without a payment header or Quick result.
- Tests prove a valid local configuration yields `402` and `PAYMENT-REQUIRED` for an unsigned request without running the handler or calling a live service.
- Tests prove the local Quick handler maps only a valid Quick input to the Quick result; malformed input is not settled when reached through the wrapper.
- Tests prove wrong-network, blank-transaction, and non-string-transaction settlement successes return a non-success response without releasing the Quick result.
- Web typecheck/test, production webpack build, local-reference guard, and independent review pass.

Providing a testnet recipient, selecting a facilitator, funding/signing a payment, deploying the route, and capturing settlement/evidence are later human-authorized actions.
