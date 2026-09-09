# UI-S23 Explore EntityCheck entry manifest

## Delivery boundary

UI-S23 adds the second real tool to the accepted UI-S20 Explore marketplace
catalog and one server-rendered detail route for it at `/explore/entitycheck`.
The catalog constant gains one frozen entry, the filter rail gains one
category row from that entry, the count line becomes `2 tools`, and the grid
renders the RiskScan card, the EntityCheck card, and the unchanged empty-state
tile. The rail stays static text; no filter changes state.

The detail route follows the accepted UI-S02 pattern: descriptive,
implementation-backed, derived only from the M46 core and API contracts.

## Local targets

The slice may amend or add only:

- `apps/web/src/components/discovery/explore-catalog.tsx`: the second catalog
  entry and the second card mount, under a root integration reservation;
- one new `apps/web/src/components/discovery/entitycheck-discovery-card.tsx`
  with the UI-S20 tool card anatomy and the single link `/explore/entitycheck`;
- `apps/web/src/app/explore/entitycheck/page.tsx` and its `loading.tsx`;
- `apps/web/src/components/entitycheck/detail/entitycheck-detail.tsx`;
- `apps/web/tests/entitycheck-detail.test.mjs`, new;
- `apps/web/tests/explore-catalog.test.mjs`: the one-entry assertions become
  two-entry assertions, under a root integration reservation;
- `apps/web/tests/route-loading-skeletons.test.mjs`: one loader row for the
  new route, under a root integration reservation; and
- `apps/web/tests/landing-explore.test.mjs`: only if its Explore href
  assertions constrain the page, under a root integration reservation.

## Catalog contract

The second entry is: id `entitycheck`, name `EntityCheck`, category
`Counterparty verification`, status `In discovery`, access
`Read-only preview`, href `/explore/entitycheck`, and the description
`A bounded lookup of a French company's public registry record with a
sanctions screen, cited to its sources.`

The rail's `Category` group renders `All tools 2`, `Risk assessment 1`, and
`Counterparty verification 1`; `Status` renders `In discovery 2`; `Access`
renders `Read-only preview 2`. Rows remain static text.

The EntityCheck card uses the UI-S20 anatomy with a decorative building icon
tile, the status badge, the name, the category line, the description, and the
footer sentence `This surface is descriptive only.` with a `View details` link.

## Detail contract

The detail page has one `main` landmark, one `h1` `EntityCheck France`, a back
link to `/explore`, a capability summary, an input-contract list
(`requestRef`, `jurisdiction`, `query`, optional `registrationNumber`), a
result-boundary list for `found`, `ambiguous`, and `not_found` with the three
screen values, a sources list naming the French registry API and the OFAC
SDN list, the exact baseline limitation, and a configuration-boundary notice
that the API returns unavailable until its host supplies both x402 and source
configuration.

## Explicit exclusions

Do not add a form, submit action, client fetch, price, wallet, payment state,
provider, account, metric, receipt, evidence, external link, mock result,
live-availability claim, client component, filter that changes state, sort,
search, or a third tool entry.

## Acceptance evidence

- A durable test-only RED commit precedes source changes.
- Focused tests prove the two-entry catalog with the fixed fields, the rail
  rows above, no interactive element, the only page hrefs being
  `/explore/riskscan`, `/explore/entitycheck`, and the accepted navigation
  entries, and the detail page's fixed regions with no form or external link.
- Web typecheck, test, build, root typecheck, test, lint, `queue:check`, and
  the local-reference guard pass.
- Desktop and narrow browser checks show the three-tile grid, the stacked
  rail, one main landmark, one `h1`, visible focus, and no horizontal
  overflow.
