# UI-S34 public documentation manifest

## Purpose

UI-S34 introduces a small documentation surface for the implemented RiskScan
and Provider journeys. It translates the selected PREP-UI-001 Provider
RiskScan information hierarchy into truthful static guidance; it does not
reuse the reference's prototype metrics, funding figures, task activity,
account views, status tabs, revenue events, evidence feed, or settings.

## Local targets

The slice may amend only:

- `apps/web/src/app/docs/page.tsx` (new);
- `apps/web/src/app/docs/riskscan/page.tsx` (new);
- `apps/web/src/app/docs/providers/page.tsx` (new);
- `apps/web/src/components/docs/documentation-home.tsx` (new);
- `apps/web/src/components/docs/riskscan-guide.tsx` (new);
- `apps/web/src/components/docs/provider-riskscan-guide.tsx` (new);
- `apps/web/src/components/discovery/local-navigation.tsx`;
- `apps/web/src/components/landing/landing-footer.tsx`;
- `apps/web/tests/public-documentation.test.mjs` (new);
- `apps/web/tests/landing-explore.test.mjs`; and
- `apps/web/tests/product-landing.test.mjs`;
- `apps/web/tests/workspace-shell.test.mjs`; and
- `apps/web/tests/guided-demo-route.test.mjs`.

The only added route targets are `/docs`, `/docs/riskscan`, and
`/docs/providers`. Documentation links may otherwise use only existing local
routes: `/explore`, `/explore/riskscan`, `/explore/riskscan/tool-loop`,
`/provider`, `/provider/deploy`, and `/demo`.

## Visual and copy contract

`/docs` has one clear title, a local/testnet boundary, and two guide cards.
The guide pages have one H1, a concise identity band, static in-page anchors,
flat topic cards, and a desktop table of contents. The Provider guide follows
the selected Provider RiskScan rhythm, but replaces prototype tabs and
statistics with reference material for the real local wizard and Provider
route.

RiskScan documentation describes its bounded Quick input and output facts,
including the required nested declarations object, and the existing descriptor
and conditional endpoint boundary. Provider documentation names the five-step
local preview, identifies the first four editable steps and final review/sign
surface, points readers to the read-only projection, and states that the ATS
control is conditionally gated. Every section distinguishes a local preview,
request challenge, signature, or admission from a payment, settlement,
campaign, or deployed asset.

“Pricing and target agent customers” and “Funding and revenue-note terms” may
appear only as the two fixed current wizard labels. They do not permit an
amount, economics, availability, funding/revenue event, payout, or return
claim.

## Explicit exclusions

Do not add reference mock data, user or provider identity, metrics, funding,
price, task, revenue, payout, return, account, wallet, payment, transaction,
receipt, evidence, active/public offer, configuration value, secret,
external link, client component, fetch, form, search/filter state, dependency,
asset, API, Agent, Core, Backend, wallet/provider, deployment, or live
behavior. The two fixed wizard labels above are the sole textual exception and
may not carry a quantitative or capability assertion.

## Acceptance evidence

- A durable test-only RED precedes source changes.
- Focused tests prove only the declared routes and internal hrefs, the current
  RiskScan input/declaration contract, the Provider five-step/boundary copy,
  static source boundary, focus treatment, responsive composition markers,
  and no prohibited claims.
- Browser comparison at 1440px and 390px records one H1 per route, no
  horizontal overflow, readable wrapped anchors, visible keyboard focus, and
  flat no-shadow cards.
- Focused Web tests, Web/root typecheck and test, lint, queue/reference/
  whitespace checks, and independent task/module review are clear before
  acceptance.
