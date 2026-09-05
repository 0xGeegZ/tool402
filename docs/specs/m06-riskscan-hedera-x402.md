# M06 RiskScan Hedera testnet x402 compatibility contract

## Delivery boundary

This contract extends the accepted RiskScan x402 service boundary with one
native Hedera testnet configuration family. It preserves the existing EVM
configuration family and keeps the same protected `POST /api/riskscan` route,
the same Quick handler, and the same after-handler settlement observer
boundary.

The delivery creates a locally testable unsigned Hedera v2 `402` challenge
only when a controlled facilitator advertises the exact native capability with
a nonblank fee-payer value. It does not create a client signer, access a
wallet, key, account, or environment-derived secret; submit, fund, or settle a
transaction; call a live facilitator in a test; deploy a route; or claim a
live payment, result, finality, receipt, evidence, or compatibility proof.

## Runtime configuration

`readRiskScanX402Configuration` returns exactly one of two closed, trimmed
configuration shapes, or `null`.

The preserved EVM shape is:

```ts
{
  kind: "evm";
  payTo: `0x${string}`;
  facilitatorUrl: string;
  network: `eip155:${number}`;
  price: `$${string}`;
}
```

It requires the existing recipient, HTTPS facilitator URL without userinfo,
EVM CAIP-2 network, and positive dollar price. Native Hedera fields must be
blank or absent, so an accidental mixed configuration fails closed.

The new native testnet shape is:

```ts
{
  kind: "hedera";
  payTo: `${number}.${number}.${number}`;
  facilitatorUrl: string;
  network: "hedera:testnet";
  price: { asset: `${number}.${number}.${number}`; amount: `${bigint}` };
}
```

It requires these nonblank runtime values:

- `RISKSCAN_X402_PAY_TO`: a canonical, non-native Hedera account id;
- `RISKSCAN_X402_FACILITATOR_URL`: an HTTPS URL without userinfo;
- `RISKSCAN_X402_NETWORK`: exactly `hedera:testnet`;
- `RISKSCAN_X402_HEDERA_ASSET`: a canonical Hedera asset id; and
- `RISKSCAN_X402_HEDERA_AMOUNT`: a canonical positive atomic integer.

`RISKSCAN_X402_PRICE` must be blank or absent for the Hedera family. The
native family uses the exact atomic `{ asset, amount }` price form and supplies
no default asset, decimals, recipient, facilitator, or network. This prevents
a dollar parser or a hidden default token from changing what a future human
authorizes.

An EVM configuration cannot select a Hedera network, and a Hedera
configuration cannot select EVM, mainnet, an alias, an invalid asset, zero or
non-canonical amount, credentials in the facilitator URL, or a mixed price
family. Parsing configuration remains local validation only; it never proves a
route, account, asset, facilitator, or payment capability.

## Server protection and capability gate

The web workspace adds `@x402/hedera@2.25.0`, matching the existing x402 v2
package family. It loads only `ExactHederaScheme` from
`@x402/hedera/exact/server` when the parsed configuration has `kind:
"hedera"`. It registers that scheme for `hedera:testnet` with the existing
server/Next adapter and exact `{ asset, amount }` requirements. The EVM branch
continues to load and register its existing exact scheme.

Before the native branch can issue a challenge, the supplied facilitator
capability response must contain an exact v2 `exact` kind for `hedera:testnet`
whose `extra.feePayer` is a nonblank string. The server returns the same
capability object to the x402 server after this check, so its native
fee-payer value is included in the emitted requirement. Missing, malformed,
wrong-version, wrong-scheme, wrong-network, or blank-fee-payer capability
data prevents handler construction; `handleRiskScanPost` maps that local
failure to the established `503` unavailable response without a payment
header.

The native exact scheme supports the already-explicit `authorization` flow.
The existing settlement observer therefore remains after-handler only and
must still require v2, exact configured-network equality, successful result,
a nonblank transaction reference, matching response bytes, and its normal
single-process cleanup. This card does not add a signed request or exercise
the observer with an external payment.

## Discovery and Consumer Agent summary

The Tool Directory continues to expose one RiskScan Quick descriptor and no
recipient, facilitator URL, fee-payer, credential, header, payload,
transaction, receipt, evidence, or result. Its configured `payment` summary
has exactly one of these forms:

```ts
{ state: "configuration_required" }

{
  state: "locally_configured";
  protocol: "x402";
  network: `eip155:${number}`;
  price: `$${string}`;
}

{
  state: "locally_configured";
  protocol: "x402";
  network: "hedera:testnet";
  asset: `${number}.${number}.${number}`;
  amount: `${bigint}`;
}
```

The existing Consumer Agent discovery module validates and safely clones the
new native summary with the same exact-record, no-accessor, no-inheritance,
no-extra-property rules as the EVM summary. It continues to make only its
single unsigned directory `GET`, has no native client, signer, payment-header,
or result capability, and does not inspect the selected descriptor in the
accepted challenge-observation module.

## Acceptance evidence

- Parser tests prove preserved EVM behavior; strict native testnet parsing;
  absent defaults; no mixed configuration; canonical positive atomic amount;
  and malformed configuration returning `null`.
- Controlled native-facilitator tests prove the exact advertised capability
  produces an unsigned v2 `402` with `hedera:testnet`, exact asset/amount,
  and fee-payer data; Quick, verification, and settlement do not run.
- Missing, malformed, mismatched, or fee-payer-free native capability yields
  `503` without a payment header or Quick output.
- Tool Directory and Consumer Agent tests prove the native summary is safely
  emitted, accepted, cloned, and rejected when malformed or hostile, without
  leaking private configuration values.
- Tests and source-boundary checks prove no private key, client signer,
  client scheme, fetch payment helper, wallet/account action, signing,
  network call from tests, transaction submission, receipt/evidence/result
  handling, or live claim is introduced.
- The web/agent targeted suites, root clean-install/typecheck/test/lint,
  production Webpack build, queue validation, local-reference guard, targeted
  local runtime exercise, independent task review, and two fresh module-review
  generations pass before acceptance.

## Human boundary and follow-up

Creating or funding accounts, associating a token, choosing real recipient or
facilitator values, configuring a deployed environment, creating a client
signer, signing or submitting a payment, verifying an on-ledger transaction,
and recording live evidence are all separate human-authorized actions. A
future Consumer Agent payment card may begin only after this server boundary
is accepted and a matching human action is recorded.
