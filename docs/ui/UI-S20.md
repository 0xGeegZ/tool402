# UI-S20 Explore marketplace catalog manifest

## Delivery boundary

UI-S20 reshapes the accepted static `/explore` route from a single stacked
discovery card into a marketplace catalog. The route renders one page heading,
one static filter rail whose rows and counts derive from a local catalog
constant, and one tool card grid. The grid holds exactly one real tool card,
the accepted RiskScan discovery card, and one truthful empty-state tile that
says further tools appear once their journey is accepted. No mock tool,
placeholder product, or invented provider is rendered.

The accepted UI-S05 directory inspection island leaves `/explore`. It remains
mounted, unchanged, as the first section of the accepted UI-S09 guest
workbench at `/dashboard/riskscan`, which is its RiskScan-specific home. The
island's source, state module, and Agent boundary are not modified.

The approved layout is the "D · Marketplace grid" artboard of the local
design canvas, https://claude.ai/code/artifact/39a1a9c6-86ae-4d5f-9d94-526e3c663d9e,
which the human operator reviewed on 2026-09-09.

## Local targets

The slice may amend or add only:

- `apps/web/src/app/explore/page.tsx`: the heading block, the two-column
  catalog layout, and the removal of the `RiskScanDirectoryDiscovery` mount;
- one new server component, `apps/web/src/components/discovery/explore-catalog.tsx`,
  holding the frozen local catalog constant, the filter rail, the count line,
  the grid, and the empty-state tile;
- `apps/web/src/components/discovery/riskscan-discovery-card.tsx`: presentation
  only, adopting the tool card anatomy below while keeping its single
  `/explore/riskscan` link, its read-only nature, and the sentence
  `This surface is descriptive only.`;
- `apps/web/tests/landing-explore.test.mjs`: the Explore assertions that name
  the directory island mount move to the catalog assertions below; the
  navigation, landing, and truthfulness assertions are unchanged;
- `apps/web/tests/riskscan-directory-discovery.test.mjs`: the one assertion
  that the Explore page mounts the island is replaced by the assertion that
  the guest workbench mounts it and the Explore page does not; every other
  island contract is unchanged; and
- one new focused test, `apps/web/tests/explore-catalog.test.mjs`.

The root records the Explore page, the discovery card, and the two accepted
tests as narrow integration reservations because they belong to the accepted
M02-T040, M02-T070, and M09-T010 records. The M09 contract and UI-S05
manifest are amended by one root-recorded sentence each: the island's
accepted mount is the guest workbench rather than `/explore`.

## Catalog contract

The catalog constant is a frozen local array with one entry:

- id `riskscan`, name `RiskScan`, category `Risk assessment`, status
  `In discovery`, access `Read-only preview`, href `/explore/riskscan`, and
  the accepted UI-S01 description sentence.

The heading block renders an outline `Marketplace` badge, the `h1`
`Explore tools`, and one lede sentence: `Bounded, machine-payable tools with
an inspectable journey. Start with what each one covers.`

The filter rail renders three labelled groups, `Category`, `Status`, and
`Access`. Each group lists only the values present in the catalog constant
with their counts, preceded in `Category` by an `All tools` row carrying the
total. Rows are static text, not controls; no row with a count of zero is
rendered. The rail collapses above the grid below the `lg` breakpoint.

The count line renders `1 tool` derived from the constant. No sort, search,
or pagination control is rendered.

The tool card anatomy is: a decorative inline SVG icon tile using the
secondary token, the status badge, the tool name, the category line, the
description, and a footer with the sentence `This surface is descriptive
only.` on the left and a `View details` link on the right. The whole card is
the one link to `/explore/riskscan`.

The empty-state tile is a dashed-border tile with a decorative plus icon,
the line `More tools to come`, and the sentence `New tools appear here once
their journey is accepted.` It contains no link or control.

## Explicit exclusions

Do not add a second tool entry, a mock provider, a price, a network, a
balance, a rating, a review, a metric, a sort or search control, a filter
that changes state, client state, fetch, storage, timers, configuration,
identity, session, wallet, signer, payment, provider, receipt, evidence,
result, transaction, deployment, or external link.

Do not modify `riskscan-directory-discovery.tsx`,
`riskscan-directory-state.ts`, the guest workbench, the Agent directory
boundary, the RiskScan detail route, or any navigation entry.

## Acceptance evidence

- A durable test-only RED commit precedes source changes and fails because
  the catalog component and its test targets do not exist.
- Focused tests prove the Explore page stays a server component, mounts the
  catalog component and the discovery card, and no longer mounts the
  directory island; that the guest workbench still mounts the island; that
  the catalog constant has exactly one entry with the fixed fields; that the
  rail renders no zero-count row and no interactive element; that the only
  hrefs on the page are `/explore/riskscan` and the accepted navigation
  entries; and that the empty-state tile contains no link or control.
- The accepted landing, navigation, and UI-S01 truthfulness assertions pass
  unchanged.
- `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Desktop and narrow browser checks show the two-column catalog at desktop
  width, the rail stacked above the grid at narrow width, one main landmark,
  one `h1`, visible keyboard focus on the card link, and no horizontal
  overflow.
