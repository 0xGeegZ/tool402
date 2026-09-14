# S48-T010 — Landing message clarity

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M11-T010, S22-T010, and S43-T010 accepted.
- Raised by: repository owner, 2026-09-14. The owner requests a draft PR
  against `dev` that makes the public landing understandable to a first-time
  visitor without changing its visual direction or product behaviour.
- Owner: root integrator. The root owns this card, its specification, UI
  manifest, queue records, focused contracts, implementation, review, and
  draft PR.
- Human actions: none. This presentation-only slice does not create a wallet,
  signature, payment, transaction, publication, deployment, or submission.

## Scope

The exact message contract is defined by
[`s48-landing-message-clarity`](../../../specs/s48-landing-message-clarity.md)
and [`UI-S48`](../../../ui/UI-S48.md). S48 may amend only the landing hero,
sections, footer, the root `metadata` object, and the two focused landing
contracts named there.

The `layout.tsx` amendment is limited to `metadata`. S26 retains its active
header and shell-wrapper reservation; S48 must not change either region.
Existing layout, styles, illustrations, links, destination routes, navigation,
wallet/session behaviour, APIs, configuration, data, and dependencies remain
unchanged.

## Intake

The owner approved the proposed developer-first message and a `dev`-based
draft PR. The root readiness review is recorded in
[`S48-T010-ready-review`](../../evidence/S48-T010-ready-review.md): accepted
dependencies, the exact static scope, and the Node 22 focused baseline are
clear. S48 is ready; no source or test path is active until a separate RED
activation.

## RED activation

At ready source `b1c4d995`, the root moves S48 to `20-active` for
`apps/web/tests/product-landing.test.mjs` and
`apps/web/tests/public-landing-reconciliation.test.mjs` only. The activation
record is [`S48-T010-red-activation`](../../evidence/S48-T010-red-activation.md).
Production copy remains frozen until the focused test fails for the approved
message contract and that RED result is recorded.

## Boundary

This card changes English public copy only. It must present Tool402 as a
marketplace for tools AI agents can pay to use, distinguish concrete current
tool states without inventing availability, and keep the Hedera testnet scope
clear. It cannot add a price, budget UI, global spending cap, payment action,
claim of independent verification, compliance certification, live publication,
or any visitor interaction.
