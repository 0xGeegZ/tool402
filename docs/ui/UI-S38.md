# UI-S38 Back this tool entry card manifest

## Delivery boundary

UI-S38 adds one entry card to the aside of both tool detail pages so a person
can reach the accepted backer funding route from the tool they are reading
about. Today `/explore/riskscan/back` is reachable by its address only, which
the [UI-S18 manifest](./UI-S18.md) left as a later decision that owns its own
file. This is that file.

The card is a server component that renders from a projection its page hands
it. With no projection, or with an offering whose state is not `OPEN`, it
renders a no-offering variant with no control. With an `OPEN` offering it
renders four terms tiles and one internal link. It is presentation plus one
internal link. No fetch, client behaviour, state, capacity figure, wallet, or
route changes.

## Local targets

The slice may add or amend only:

- one new `apps/web/src/components/backing/back-tool-card.tsx`;
- one new `apps/web/tests/back-tool-card.test.mjs`;
- the aside block of
  `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`, which mounts
  the card once as the first aside child; and
- the aside block of
  `apps/web/src/components/entitycheck/detail/entitycheck-detail.tsx`, which
  mounts the card once as the first aside child.

Both amendments are to accepted cards' owned paths (M02-T070 and S25-T010
for RiskScan, S23-T010 for EntityCheck) and each needs its own root
integration reservation. The accepted `riskscan-detail.test.mjs` and
`entitycheck-detail.test.mjs` scan a fixed file list that does not include the
new card file, and both detail pages pass `projection={null}` in this slice,
so neither test's href list or forbidden-word scan changes and neither test is
amended.

## Card contract

`BackToolCard` takes exactly `{ tool, href, projection }`: `tool` is the
display name (`RiskScan` or `EntityCheck France`), `href` is the funding route
for the tool or absent, and `projection` is the accepted `BackingProjection`
or `null`. It reads the offering through the accepted `readBackingOffering`
export of `backing-state.ts` and renders the open variant only when that read
succeeds, `projection.state` is exactly `OPEN`, and `href` is present. Every
other input renders the no-offering variant.

Open variant, in order:

- title `Back <tool>` with the badge `Open offering`;
- the fixed description "Fund note units with HBAR. A disclosed
  {reserveShareBps/100}% of qualifying usage revenue funds capped
  distributions under the offering terms.";
- four tiles from `definition.terms` and `maturityAt` through the accepted
  `DetailList`: `Minimum` as `{minimumPurchaseUnits} units ·
{minimumPurchaseUnits × noteUnitPriceTinybars as HBAR}`, `Unit price` as
  HBAR, `Revenue share` as a percentage, and `Maturity` as the ISO date;
- one full-width primary link labelled `Back <tool>` to `href`, followed by
  the hint "MetaMask · Hedera Testnet · one signature, one HBAR transfer."; and
- the footer "Terms {version} · not a projected return. No payout amount or
  timeline is promised."

No-offering variant: title `Back <tool>` with the badge `No open offering`
and the fixed description "{tool} has no open offering. This card opens the
funding flow once an issuer's offering is OPEN." It renders no link, button,
or disabled control, because a control that cannot act is a claim the page
cannot back.

HBAR and percentage formatting use the accepted `formatHbar` and
`formatShare` exports; no floating-point value participates.

Both detail pages mount `<BackToolCard>` as the first child of their aside.
RiskScan passes `href="/explore/riskscan/back"`; EntityCheck passes no `href`,
because no EntityCheck funding route exists, so its card renders the
no-offering variant until a later card adds the route and the offering. Both
pages pass `projection={null}` in this slice: the page-level read of an `OPEN`
offering is the same later runtime boundary the S18 card names, and this
slice supplies no projection of its own.

## Explicit exclusions

Do not add a fetch, `use client`, a form, a button, capacity, remaining,
raised, funded, progress, or balance figures, a countdown, an external link,
an EntityCheck funding route, a catalog card change, a header change, a
dependency, or any change to `backing-state.ts`, `backing-flow.tsx`, the
back page, or the discovery cards.

## Acceptance evidence

- A durable test-only RED commit precedes source changes and fails because
  `back-tool-card.tsx` does not exist and neither aside mounts it.
- `back-tool-card.test.mjs` proves by source scan that the card imports
  `readBackingOffering`, `formatHbar`, and `formatShare` from the accepted
  state module, branches on `state === "OPEN"`, renders every fixed literal
  above in both variants, renders exactly one `href` and it is the `href`
  prop, contains no `use client`, `fetch(`, `<form`, `<button`, `https://`,
  or the literals `remain`, `raised`, `funded`, `balance`, `progress`; and
  that each detail component mounts `<BackToolCard` exactly once as the first
  aside child with `projection={null}`, RiskScan with the back route href and
  EntityCheck without one.
- The accepted `riskscan-detail.test.mjs` and `entitycheck-detail.test.mjs`
  pass unchanged.
- Web typecheck, test, lint, build, root typecheck, test, lint,
  `queue:check`, and the local-reference guard pass.
- Browser check at desktop and 390px on both detail routes: the card renders
  first in the aside in its no-offering variant, the aside stacks below the
  main column at narrow widths, and no horizontal overflow appears.
