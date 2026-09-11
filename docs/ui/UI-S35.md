# UI-S35 public documentation expansion manifest

## Purpose

UI-S35 turns the useful parts of the prepared documentation information
architecture into current Tool402 documentation. It adds an HTTP API reference
and FAQ without treating the prototype's MCP, mock account, funding, payment,
or activity material as product truth.

## Local targets

The slice may amend only:

- `apps/web/src/app/docs/api/page.tsx` (new);
- `apps/web/src/app/docs/faq/page.tsx` (new);
- `apps/web/src/components/docs/api-reference.tsx` (new);
- `apps/web/src/components/docs/documentation-faq.tsx` (new);
- `apps/web/src/components/docs/documentation-home.tsx`;
- `apps/web/src/components/landing/landing-footer.tsx`;
- `apps/web/tests/documentation-expansion.test.mjs` (new); and
- `apps/web/tests/public-documentation.test.mjs`.

The existing `apps/web/tests/product-landing.test.mjs` is a candidate only
under D-S35-010-005. It must not change until an independent scope review
authorizes its two exhaustive footer-link assertions and its direct API-route
denial to recognize the three new Docs routes.

The only new route targets are `/docs/api` and `/docs/faq`. The new static
links may target only `/docs`, `/docs/api`, and `/docs/faq`.

## Visual and copy contract

The two pages share the accepted Docs headline rhythm, flat cards, warm
surface, and local focus styling. API reference is the exact public label;
MCP is omitted because no current public MCP route is established. Endpoint
content stays descriptive: the API may be unavailable without host-specific
configuration, and a 402 response is not a completed payment. The FAQ names
the current testnet, caller-supplied RiskScan, and Provider/ATS boundaries.

The footer adds a Docs group matching the prepared hierarchy but links only to
the three real local pages. It does not copy unavailable API & MCP or FAQ
prototype links before their local routes exist.

## Explicit exclusions

Do not add a request form, runner, fetch, API client, MCP server/client,
runtime/configuration read, price, payment header, account, wallet, signer,
transaction, deployment, campaign, asset, funding, payout, return, metric,
mock state, external link, dependency, asset, global CSS, analytics, storage,
or client component. No statement may imply API availability, payment success,
or an active ATS campaign.

## Acceptance evidence

- Test-only RED precedes source changes and proves the exact routes,
  components, home links, and footer group are initially absent.
- Focused GREEN proves the API/FAQ content, local route map, static boundary,
  and banned capability vocabulary.
- Browser captures at 1440px and 390px confirm Docs cards/footer links,
  readable wrapping, visible focus, and no horizontal overflow.
- Focused Web tests, typecheck, lint, queue/whitespace checks, and independent
  task/module review are clear before acceptance.
