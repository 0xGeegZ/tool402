# UI-S43 provider command center manifest

## Intent

Use the existing Tool402 warm canvas, dark type, lavender panels, purple actions, and green verified treatment to prioritise a provider's next understanding over a dense record report.

## Fixed loaded regions

In this order after the page header:

1. A hero whose title is derived from the admitted offering state: `Campaign in progress` for `DRAFT`/`ASSET_PENDING`, `Campaign prepared` for `READY`, `Campaign ready` for `OPEN`, and `Campaign closed` for `CLOSED`. It includes the raw state and explicit `Not live` scope label.
2. An offering stage with the raw state, a directory stage that is complete only when its independent projection is loaded, and `Backer issuance`. The latter says `Unavailable in this demo`.
3. `Activity & proof` and `Campaign snapshot` as paired desktop cards.
4. `Economics`, `Capacity`, `Governance`, and `Trust details` cards.

The hero's decorative illustration is optional, static, and aria-hidden. It must not contain campaign data or substitute for status copy.

## Content ownership

Every displayed value comes from the existing loaded offering/directory projection or existing local route. The evidence row values and Hashscan link remain governed by UI-S17. `Not live` and issuance-unavailable copy are fixed truthfulness labels, not new state. A non-loaded directory stage renders its existing exact outcome sentence and cannot use a verified/complete treatment; the existing `CLOSED` next action has no control.

## Breakpoints

Desktop pairs activity/snapshot and shows four supporting cards. At narrow widths all regions are one column and the progress rail remains readable with no horizontal overflow.
