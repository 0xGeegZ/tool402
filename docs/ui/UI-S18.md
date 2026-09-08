# UI-S18 backer funding manifest

## Delivery boundary

No accepted surface lets a backer fund anything. UI-S18 adds the backer view of
the approved
[campaign deploy flow](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md):
one route at `/explore/riskscan/back` where a holder chooses note units, signs
one `external.prepare` command with kind `HEDERA_FUNDING`, and sends that exact
HBAR amount to the funding treasury on chain 296. The slice renders an intent
and a submission: it verifies no transfer, holds no key, allocates no unit, and
advances no offering, attempt, or directory state.

## Local targets

The slice may add `apps/web/src/app/explore/riskscan/back/page.tsx`,
`apps/web/src/components/backing/backing-flow.tsx`,
`apps/web/src/components/backing/backing-state.ts`,
`apps/web/tests/backing-state.test.mjs`, and
`apps/web/tests/backing-route.test.mjs`. It changes no existing route,
component, stylesheet, test, or shared UI source, and adds no dependency.

Provider selection, the chain gate, nonce and timestamp generation, the
EIP-712 request, the signature dialog, and the relay route belong to the
[UI-S15 wallet island and command relay manifest](UI-S15.md). UI-S18 consumes
them unchanged, declares no second copy of any of them, and takes its signature
phases from that dialog. Units and amounts come from the accepted offering
economics, the state labels from the accepted
[M18 purchase lifecycle](../specs/m18-offering-purchase-lifecycle.md), and
presentation from the accepted tokens and the accepted `button`, `card`, and
`badge` primitives. UI-S18 adds no navigation entry: the route is reachable by
its address only, and linking it from an accepted surface is a later decision
that owns its own file.

## Required selection behavior

The offering projection is supplied to the flow by its caller. The slice owns
no fetch, no projection parser, and no fixture: with no projection it renders
`offering_unavailable` and nothing else, as it does for terms the accepted
`createOfferingTerms` constructor rejects. The picker accepts a whole number of
units bounded below by `definition.terms.minimumPurchaseUnits` and above by
`definition.terms.maximumNoteUnits`. A selection outside those bounds is a
validation message on the picker, not a state, and no amount is computed for
it. The payable amount is the selected units multiplied by
`definition.terms.noteUnitPriceTinybars`, in tinybars and in integer arithmetic
only; no floating-point value participates in an amount.

The accepted `calculateAllocation` is not invoked, because its
`confirmedAllocatedUnits` input is a count the projection does not carry.
Remaining capacity is therefore not derivable here: the canvas copy `Minimum 10
units. 975 units remain.` renders without its second sentence, and the amount
raised, percentage funded, and days to maturity tiles are omitted. The terms tiles
— unit price, minimum, payout cap, terms version — render from `definition.terms`
and maturity from `definition.maturityAt`, and the slice hard-codes no amount.

The reserve disclosure renders with its figure substituted from the terms: "A
disclosed {reserveShareBps/100}% of qualifying usage revenue funds capped
distributions under the offering terms. This is not a projected return. No payout
amount or timeline is promised." The acknowledgement is an explicit unchecked
control whose payout cap figure is substituted the same way: "I understand this is
a testnet experiment with no real funds, that units are allocated only after the
issuer signs, and that the payout cap is {payoutCapTinybars as HBAR}." Terms v1
renders 20% and 1,500 HBAR. The primary control stays disabled until the selection
is valid, the acknowledgement is checked, and a wallet is connected, and its hint
reads "Two confirmations: one signature, one HBAR transfer."

## Required funding behavior

The signed command is the accepted `external.prepare` payload with
`operationKind` `HEDERA_FUNDING`, `network` `hedera:testnet`, `chainId` 296,
and `expectedTarget` the funding treasury the projection names.
`canonicalParametersHash` is the Keccak-256 of the UTF-8 bytes of the text that
Core's accepted RFC 8785 JCS canonicalizer `canonicalizeRequirements` produces
for exactly `{ offeringPublicId, units, tinybars, purchaseIntentId }`,
submitted as sixty-four lowercase hexadecimal characters with the `0x` prefix
removed, as the accepted payload grammar requires. `offeringPublicId` and
`purchaseIntentId` are JSON strings; `units` and `tinybars` are canonical
decimal strings, because that canonicalizer accepts no `bigint`.
`purchaseIntentId` is generated once per intent with the canonical
twenty-two-character base64url grammar and appears only inside those
parameters; the payload `idempotencyKey` stays the separate M26 field the
accepted normalizer verifies.

A transfer is requested only after the relay reports the command accepted. Its
value is exactly that tinybar amount multiplied by ten to the tenth, rendered
as a minimal hexadecimal quantity and sent by `eth_sendTransaction` to the
treasury address. That address must arrive in the projection as an explicit
lowercase `0x` and forty hexadecimal characters, never derived, converted,
defaulted, or completed from a Hedera account identifier: with no such address
the route renders `offering_unavailable` and sends nothing.

The backer cannot attach the resulting transaction: the accepted authority
admits `external.attachCandidate` only from an `ISSUER`, so the route offers no
attach signature, holds the returned hash as a local reference, and stops at
`payment_submitted`.

## Required state behavior

The view state is a closed union of exactly eight kinds:

```text
offering_unavailable | choosing | prepared | payment_submitted
payment_outcome_unknown | allocation_pending | complete | refused
```

| Kind                      | Accepted lifecycle label  | Attempt state observed by this slice |
| ------------------------- | ------------------------- | ------------------------------------ |
| `prepared`                | `awaiting_payment`        | `PREPARED`                           |
| `payment_submitted`       | `payment_submitted`       | `PREPARED`                           |
| `payment_outcome_unknown` | `payment_outcome_unknown` | none                                 |
| `allocation_pending`      | `allocation_pending`      | none                                 |
| `complete`                | `complete`                | none                                 |
| `refused`                 | none                      | none                                 |

`offering_unavailable` and `choosing` precede the lifecycle and map to no
label. `refused` carries every closed refusal the relay can return, including
unauthorized, conflicted, and expired, as copy rather than as further kinds. A
wallet that returns without a hash, a transport failure, and an unexpected
response all reach `payment_outcome_unknown`, which offers no resend: nothing
in this slice retries, because the transfer may already be on chain.
`complete` is declared and unreachable here, because reading a note balance back
is a Mirror Node and asset read that no accepted card owns. The route stops at
`allocation_pending`, and the canvas tile labelled "Units you hold" is
relabelled "Units requested" and renders only the requested units until an
allocation is verified.

## Truthfulness and authority boundary

A connected wallet is not an authority, a signature is not a payment, a
submitted transfer is not a settled one, and a paid backer holds no unit until
the issuer's verified allocation says so. No kind may be presented as funded,
paid, settled, verified, allocated, or live on a wallet callback.

The design canvas's simulation controls, its `(sample)` Hedera account and
balance tiles, its "Live testnet" badge, its raised and percentage-funded
figures, its note address, and its "View verified evidence" link are
illustrative and must not ship; an evidence link renders only for a reference
the projection carries as verified. The account and balance tiles are excluded
for the reason UI-S15 excludes them: no accepted card owns that Mirror read.

The slice adds no key, seed, session, account, storage, analytics, timer,
environment read, dependency, or facilitator access, and asserts no receipt,
settlement, clearing, payout, deployment, or live claim.

## Acceptance evidence

- Focused contracts cover the closed eight-kind union, the mapping above, the
  picker bounds and validation message, the integer amount, the weibar
  conversion, the canonical parameters preimage and its prefix-free digest, the
  refusal to send without an explicit treasury address, the ordering of the two
  confirmations, and the absence of any retry, second charge, or attach
  signature.
- A focused route contract covers the unavailable state for a missing
  projection, rejected terms, and a missing treasury address, the omitted
  capacity and progress figures, and the absence of the canvas's simulation
  controls and sample values from the source.
- Browser checks are limited to what a machine without MetaMask, a configured
  backend, or an offering can produce: the unavailable state, the validation
  message, visible keyboard focus, the polite live region, and no horizontal
  overflow at narrow widths.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
