# S18-T010 — Backer funding route

## State

- Tier: PRIZE_OPTIONAL
- Queue state: 00-inbox
- Dependencies: M02-T020 accepted, M11-T020 accepted, M16-T010 accepted, M18-T010 accepted, M29-T010 accepted, S15-T010 (this batch), M40-T010 (this batch), M43-T010 (this batch)
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly `apps/web/src/app/explore/riskscan/back/page.tsx`,
  `apps/web/src/components/backing/backing-flow.tsx`,
  `apps/web/src/components/backing/backing-state.ts`,
  `apps/web/tests/backing-state.test.mjs`, and
  `apps/web/tests/backing-route.test.mjs`. All five are new files. This card
  amends no accepted file, adds no dependency, and needs no root integration
  reservation.
- Human actions: none for local delivery, where the route renders its
  unavailable state with no offering projection and no wallet. Relaying a
  signed command additionally needs the `HA-CAMPAIGN-CONVEX-001` row, and a
  verified unit allocation additionally needs `HA-ATS-STAGE-B-001`, both
  requested by the
  [HI-002 intake card](HI-002-campaign-deploy-reinstatement.md). Neither is
  complete, and this card marks neither complete. `HEDERA_FUNDING` is already a
  member of the accepted external prepare operation kinds, so this card needs
  no part of `HA-COMMAND-AUTHORITY-002`; it needs instead an enabled `BACKER`
  authority row, which no row in HI-002 currently provisions.

## Scope

The approved design gives a backer one path: connect MetaMask, choose note
units, sign `external.prepare` with kind `HEDERA_FUNDING`, send the exact HBAR
to the funding treasury on chain 296, and wait. Nothing in the accepted
repository renders that path, and the accepted `x402` client cannot serve it
because it signs only with a Hiero private key.

Add one route at `/explore/riskscan/back`, one client flow component, and one
pure state module with a closed outcome union. The flow reuses the sibling
wallet island for provider selection, the chain gate, the typed-data signature,
and the relay; it reuses the accepted M16 terms values for units and amounts
and the accepted M18 lifecycle vocabulary for its labels. It computes no
capacity of its own, holds no key, and treats a wallet callback as a
submission, never as a payment.

The approved shape is the backer view of the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md).
The local contract is the
[UI-S18 backer funding manifest](../../../ui/UI-S18.md), and the accepted slice
history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The three source paths and two focused test paths are new files under one new
  component directory and one new route segment, disjoint from every accepted
  card's owned paths and from every sibling card in this batch.
- The wallet island, the signature dialog, and the command relay are the
  sibling slice's, recorded in the
  [UI-S15 wallet island and command relay manifest](../../../ui/UI-S15.md).
  This card consumes them and adds no second provider selection, chain gate,
  nonce source, typed-data builder, or relay route. Its signature phases are
  that dialog's phases; it declares none of its own.
- The accepted
  [HA-COMMAND-AUTHORITY-001 decision](../../evidence/HA-COMMAND-AUTHORITY-001-decision.md)
  requires a `BACKER` role for `HEDERA_FUNDING` and records no address
  restriction on it. The route therefore performs no local signer comparison:
  any connected address may request a signature, the server remains the only
  authority, and with no enabled `BACKER` row the relay refuses and the route
  renders that refusal rather than a funded state.
- The closed view-state union, its mapping to the accepted
  [M18 purchase lifecycle labels](../../../specs/m18-offering-purchase-lifecycle.md),
  the picker bounds, and the exact weibar conversion are fixed in the manifest
  before code, so no branch and no arithmetic can be added while the slice is
  implemented.
- This card owns no attach path. The sibling normalizer card admits
  `external.attachCandidate` only from an `ISSUER` authority, so a backer
  cannot attach the transaction that a backer sent. The route therefore stops
  at `payment_submitted` holding the locally observed transaction reference and
  offers no attach signature. Opening that path is a human command-authority
  question, not a decision this card may take.
- The card owns no data source. The offering projection is supplied to the flow
  by its caller; with no projection, absent configuration, or a `null`
  projection, the route renders its unavailable state. No fixture, sample, or
  placeholder offering ships in this slice. No accepted record and no sibling
  card in this batch carries a lowercase `0x` treasury address — the accepted
  directory record carries Hedera account identifiers only — so the funding
  path stays unreachable until a human decision or a later card supplies that
  field.

## Verification

- A durable test-only RED commit precedes every source change and fails because
  the declared route, flow, and state paths do not exist.
- Focused tests prove the closed view-state union, its exact mapping to the
  accepted lifecycle labels and to the sibling attempt states, and that every
  additional message is copy carried by an existing kind rather than a new one.
- Focused tests prove the picker bounds: the minimum purchase units and maximum
  note units read from the projection's terms, the refusal of a selection
  outside them before any amount is computed, and the absence of any
  remaining-capacity, percentage-funded, or amount-raised claim, none of which
  the projection carries.
- Focused tests prove the amount is the selected units multiplied by the
  accepted note unit price and that the transfer value is exactly that tinybar
  amount multiplied by ten to the tenth, rendered as a minimal hexadecimal
  quantity, with no floating-point arithmetic anywhere in the module.
- Focused tests prove that terms the accepted M16 constructor rejects reach the
  unavailable state instead of throwing past the closed union.
- Focused tests prove the canonical parameters preimage, its field set, its
  digest through the accepted Core canonicalizer, and the sixty-four lowercase
  hexadecimal characters without the `0x` prefix that the accepted external
  prepare payload grammar requires.
- Focused tests prove the preimage member types: `offeringPublicId` and
  `purchaseIntentId` as JSON strings and `units` and `tinybars` as canonical
  decimal strings, because the accepted canonicalizer rejects `bigint`.
- Focused tests prove the route refuses to send a transfer unless the
  projection supplies an explicit lowercase `0x` funding treasury address, and
  that no address is ever derived, converted, defaulted, or completed from a
  Hedera account identifier.
- Focused tests prove the order of the two confirmations: no transfer is
  requested before an accepted command exists, and a returned transaction hash
  moves the view to `payment_submitted` and never to a verified kind.
- Focused tests prove nothing retries: a wallet that returns without a hash, a
  relay transport failure, and an unexpected response each reach the unknown
  kind, which offers no automatic resend and no second charge.
- Focused tests prove the route renders no held or allocated unit count, no
  balance, no Hedera account identifier, no explorer link, and no verified
  reference unless the projection carries a verified record, and that the
  design canvas's simulation controls and sample values are absent from the
  source.
- `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Browser evidence is limited to what a machine without MetaMask, without a
  configured backend, and without an offering can produce: the unavailable
  state, the picker's validation message, visible keyboard focus, the polite
  live region, and no horizontal overflow at narrow widths. No connected,
  signed, submitted, verified, or allocated browser claim is made by this card.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card renders an intent and a submission. It verifies no payment, allocates
no unit, and advances no offering, attempt, or directory state. Its exclusions
are the manifest's truthfulness and authority boundary, which governs; this
card does not restate them.
