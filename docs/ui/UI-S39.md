# UI-S39 Backer amount presets and funding rail manifest

## Delivery boundary

UI-S39 makes the accepted backer funding route easier to complete without
changing what it does. The accepted UI-S18 route asks a backer to type a
number of note units, read a helper line, and work out the HBAR amount before
anything else happens. This slice puts three preset amounts derived from the
offering terms in front of that input, shows the resulting HBAR amount as the
primary readout, places a four-step rail above the cards that follows the
accepted view kinds, and folds the wallet control into the Funding section so
the decisions read top to bottom: amount, acknowledgement, wallet, sign.

It is presentation over the accepted state module. `backing-state.ts` is not
amended; the closed eight-kind union, the picker bounds, the integer amount,
the command payload, the transfer, and every refusal and unknown outcome are
exactly the UI-S18 contract.

## Local targets

The slice may add or amend only:

- one new `apps/web/src/components/backing/backing-presentation.ts`;
- one new `apps/web/src/components/backing/backing-step-rail.tsx`;
- one new `apps/web/tests/backing-presentation.test.mjs`;
- the units card, the Funding section, the wallet island mount position, and
  the header of `apps/web/src/components/backing/backing-flow.tsx`;
- the header of `apps/web/src/app/explore/riskscan/back/page.tsx`, which
  gains one `Back to RiskScan` link to `/explore/riskscan`; and
- the source-path list and required-literal assertions of
  `apps/web/tests/backing-route.test.mjs`.

The three amendments are to S18-T010's owned paths and each needs its own
root integration reservation. If S26-T010 (header wallet control and shared
session) is accepted first, its reservation on the island mount expression of
`backing-flow.tsx` takes precedence: this slice then positions the shared
session row inside the Funding section and mounts no island of its own.

## Preset contract

`backing-presentation.ts` is a pure module with two exports and no React
import.

- `presetUnits(terms)` returns the ascending, de-duplicated list of
  `minimumPurchaseUnits × 1`, `× 5`, and `× 10` that are at most
  `maximumNoteUnits`, as `bigint`. Terms v1 (1 HBAR per unit, minimum 10,
  maximum 1,000) yield `[10n, 50n, 100n]`; a maximum of 30 yields `[10n]`.
  The list is never empty, because the accepted terms constructor already
  requires the minimum to be at most the maximum.
- `railPosition(kind, signing)` maps the accepted view kind and whether the
  signature dialog is open to `{ current, done }` over the steps `1` Choose
  amount, `2` Sign command, `3` Send HBAR, `4` Allocation:

  | Kind                                                                 | signing | current | done |
  | -------------------------------------------------------------------- | ------- | ------- | ---- |
  | `offering_unavailable`, `choosing`, `refused`                        | false   | 1       | 0    |
  | `choosing`                                                           | true    | 2       | 1    |
  | `prepared`                                                           | any     | 3       | 2    |
  | `payment_submitted`, `payment_outcome_unknown`, `allocation_pending` | any     | 4       | 3    |
  | `complete`                                                           | any     | 4       | 4    |

  `complete` is mapped for closure and stays unreachable, as UI-S18 records.

## Control contract

The units card is retitled `Choose amount` with the description "Whole note
units at {noteUnitPriceTinybars as HBAR} each. Minimum
{minimumPurchaseUnits} units." It renders, in order:

- one chip per preset unit count, labelled with the HBAR amount from the
  accepted `paymentTinybars` and `formatHbar` as primary text and
  `{units} units` as secondary text, the first suffixed `minimum`, followed by
  one `Custom` chip whose secondary text is `{minimumPurchaseUnits} to
{maximumNoteUnits} units`. Chips are a radio group; the minimum chip is
  selected on load so the form is valid before any interaction.
- the accepted `name="units"` input, which stays the single source of truth:
  selecting a preset chip writes its count into the input, and selecting
  `Custom` reveals the input for typing. The input is hidden while a preset is
  selected and keeps its accepted validation message and bounds.
- the readout `{amount} for {units} note units`, where `{amount}` is the
  accepted integer product rendered through `formatHbar`, or `—` while the
  selection is invalid.
- the accepted acknowledgement control with its exact UI-S18 sentence.

The Funding section keeps its heading, lifecycle badge, live sentence, primary
control, and two-confirmation hint, and gains in order: the wallet control
between the live sentence and the primary control, and, only in the
`payment_submitted` kind, an ordered list titled `What happens next` with
exactly two items: "Mirror Node records the transfer. The request moves to
allocation_pending." and "The issuer signs the allocation. Units are issued to
the connected address." Both are descriptions of later steps other cards own,
not claims about this transfer.

The rail renders once above the cards from `railPosition`, marks done steps
with a check, the current step with the primary colour, and later steps in
muted text, and is `aria-hidden` because the lifecycle badge and live sentence
already announce the state.

## Explicit exclusions

Do not add a state kind, a lifecycle label, a retry, a resend, a second
transfer, a transaction link, a Hashscan or mirror-node reference, a balance,
a capacity, remaining, raised, funded, or progress figure, a countdown, a
`complete` view, an evidence link, an external link, a named tier or perk, a
per-preset price, a dependency, a change to `backing-state.ts`, the signature
dialog, the wallet island internals, the relay, or any API route.

## Acceptance evidence

- A durable test-only RED commit precedes source changes and fails because
  `backing-presentation.ts` and `backing-step-rail.tsx` do not exist and the
  flow renders no chip.
- `backing-presentation.test.mjs` proves `presetUnits` on terms v1, a maximum
  below five times the minimum, a maximum between five and ten times the
  minimum, and a minimum equal to the maximum; proves `railPosition` on every
  row of the table above; and proves by source scan that the flow renders one
  chip per preset plus `Custom`, writes the selected preset into the
  `name="units"` input, hides that input while a preset is selected, selects
  the minimum by default, renders the readout through `formatHbar` and
  `paymentTinybars`, mounts the rail once and the wallet island once inside
  the Funding section, renders the `What happens next` list only under
  `payment_submitted`, and contains none of the excluded literals.
- The amended `backing-route.test.mjs` lists the two new source paths, keeps
  every accepted required literal and forbidden-literal scan, and passes.
- Web typecheck, test, lint, build, root typecheck, test, lint,
  `queue:check`, and the local-reference guard pass.
- Browser checks are limited to what a machine without an offering can
  produce, as UI-S18 records: the unavailable state, the back link, visible
  keyboard focus, the polite live region, and no horizontal overflow at 390px.
