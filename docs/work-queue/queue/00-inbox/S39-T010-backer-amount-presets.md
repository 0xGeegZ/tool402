# S39-T010 — Backer amount presets and funding rail

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: S18-T010 accepted, M16-T010 accepted, S15-T010 accepted; the
  root sequences this card after S26-T010 (header wallet control and shared
  session) when S26 is integrated first, so the Funding section positions the
  shared session row rather than the island. S26-T010 does not block the
  card: if this card is accepted first, S26 moves the island mount under its
  own reservation and the position inside the Funding section is preserved.
  S38-T010 is a sibling in this batch and neither card blocks the other: they
  share no path.
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly the UI-S39 local targets: new
  `apps/web/src/components/backing/backing-presentation.ts`,
  `apps/web/src/components/backing/backing-step-rail.tsx`, and
  `apps/web/tests/backing-presentation.test.mjs`; and, each under a root
  integration reservation, the units card, Funding section, wallet island
  mount position, and header of
  `apps/web/src/components/backing/backing-flow.tsx`, the header of
  `apps/web/src/app/explore/riskscan/back/page.tsx`, and the source-path list
  and required-literal assertions of `apps/web/tests/backing-route.test.mjs`.
- Human actions: none. This change creates no authority, wallet permission,
  payment, provider, configuration, account, transaction, deployment, or live
  behaviour. Relaying and allocation remain gated exactly as the S18 card
  records.

## Scope

The accepted backer route asks for a number of note units in a text input and
leaves the HBAR amount to a helper line. A backer thinks in HBAR; units are
the accounting. This card puts three preset amounts derived from the offering
terms (one, five, and ten times the minimum, clamped to the maximum) in front
of that input, keeps the input as a `Custom` path so any whole number within
the accepted bounds stays reachable, shows the HBAR amount as the primary
readout, adds a four-step rail that follows the accepted view kinds, folds the
wallet control into the Funding section, and adds a `Back to RiskScan` link.
`backing-state.ts` is untouched: the bounds, the integer amount, the command,
the transfer, and every refusal are the accepted S18 contract.

No specification carries a backing tier or level. The presets are derived from
terms at render time, are labelled by amount only, and carry no name or perk,
because note units are homogeneous and a named tier would imply rights the
offering does not grant.

Requested by the human operator on 2026-09-11 as the picker half of the
"make backing a project easy" request. The design canvas that settled the
chips, readout, rail, and Funding section is
https://claude.ai/code/artifact/e48c5878-d745-40ad-9e30-6ccdca5ea9a3
(artboards "1 · Choose amount" through "Exit · Refused"). The canvas's
Hashscan links, allocation summary, and `complete` artboard do not ship: no
accepted card owns a transaction or asset read, and UI-S18 keeps `complete`
unreachable.

The local contract is the
[UI-S39 backer amount presets and funding rail manifest](../../../ui/UI-S39.md).
The accepted slices it builds on are the
[UI-S18 backer funding manifest](../../../ui/UI-S18.md), the
[UI-S15 wallet island and command relay manifest](../../../ui/UI-S15.md), and
the
[M16 offering terms and revenue math specification](../../../specs/m16-offering-terms-and-revenue-math.md),
recorded in the [local UI slice ledger](../../../ui/IMPORT-LEDGER.md). Its
siblings are the [UI-S26 manifest](../../../ui/UI-S26.md) and the
[UI-S38 manifest](../../../ui/UI-S38.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are
  committed before any source change.
- The three new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox, including S38-T010's
  `back-tool-card.tsx` and S26-T010's `wallet-session.tsx`.
- Every amended path belongs to S18-T010; each amendment needs an explicit
  root integration reservation before source changes, limited to the units
  card, the Funding section, the island mount position, the flow header, the
  page header link, and the route test's path list and literal assertions.
  The root decides at activation whether the island mount is this card's or
  S26-T010's.
- The two module exports, the preset derivation, the rail table, the chip
  and readout copy, the rule that the `name="units"` input stays the single
  source of truth, and the two `What happens next` sentences are fixed in the
  manifest before code, so no state kind, retry, link, or figure can be added
  while the slice is built.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because `backing-presentation.ts` and `backing-step-rail.tsx` do not exist
  and the flow renders no chip.
- Focused tests prove `presetUnits` on the manifest's four term vectors,
  `railPosition` on every row of the manifest's table, and by source scan
  the chips, the input as source of truth, the hidden input while a preset
  is selected, the default minimum, the `formatHbar` and `paymentTinybars`
  readout, one rail and one island mount inside the Funding section, the
  `payment_submitted`-only list, and the absence of every excluded literal.
- The amended `backing-route.test.mjs` keeps every accepted required literal
  and forbidden-literal scan and passes.
- Web typecheck, test, lint, and build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Browser checks at desktop and 390px are limited to the unavailable state,
  the back link, visible focus, the polite live region, and no horizontal
  overflow, as the S18 card records for a machine without an offering.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation over the accepted state module. It adds no
state kind, lifecycle label, retry, resend, second transfer, transaction
link, Hashscan or mirror-node reference, balance, capacity, remaining,
raised, funded, or progress figure, countdown, `complete` view, evidence
link, external link, named tier or perk, per-preset price, dependency, or
change to `backing-state.ts`, the signature dialog, the wallet island
internals, the relay, or any API route. The manifest's exclusions govern;
this card does not restate them.
