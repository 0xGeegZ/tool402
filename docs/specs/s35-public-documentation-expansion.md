# S35 — Public documentation expansion

## Goal

Extend the accepted static documentation surface with useful, truthful pages
for the current HTTP boundary and frequently asked product-boundary questions.
Make those pages discoverable from the Docs home and a dedicated Docs column in
the existing footer.

## Routes and content

- `/docs/api` is titled **API reference**. It documents only the existing
  `GET /api/tools` descriptor boundary and `POST /api/riskscan` request
  boundary, including `requestRef`, `subjectRef`, `context`, and the required
  four-boolean `declarations` object. It says x402 configuration is
  host-specific and an unavailable result is possible. It must not carry the
  label “API & MCP”: the current product exposes no public MCP server.
- `/docs/faq` answers product-boundary questions with current facts: Tool402
  is a testnet prototype; RiskScan evaluates caller-supplied declarations;
  a `402` boundary is not proof of a completed payment; and Provider preview,
  review, or signature does not create a deployed ATS asset or public campaign.
- `/docs` adds cards for the two new pages. The existing RiskScan and Provider
  guides remain unchanged in subject matter.
- The footer gains a **Docs** navigation group with only real local routes:
  Documentation (`/docs`), API reference (`/docs/api`), and FAQ (`/docs/faq`).
  The existing Provider documentation link remains under For providers.

## Visual and interaction contract

- Reuse the current `PageHeader`, `Badge`, `Card`, `Link`, and footer
  primitives, the warm canvas, flat cards, visible focus treatment, and the
  established Docs spacing rhythm.
- The API reference uses clear endpoint/topic cards; the FAQ uses factual
  question/answer cards. Neither page includes a form, a code runner, a
  request control, a search field, or client-side state.
- At 1440px the footer has a distinct Docs group without clipping; at 390px
  all footer groups and Docs cards remain readable without horizontal overflow.

## Explicit exclusions

Do not add an MCP server, MCP claim, API client, request execution, fetch,
environment/configuration read, wallet, signer, payment attempt, transaction,
deployment, campaign, asset, funding, payout, return, metric, mock result,
account, external URL, dependency, asset, global CSS, analytics, storage, or
client component. Do not publish API configuration values, price, header, or
payment-success claims.

## Verification

- A durable test-only RED proves the two absent routes/components, home-card
  links, and the three real footer links before source work starts.
- GREEN tests prove local-only hrefs, factual API/FAQ boundaries, no MCP
  wording, no interactive/runtime surface, visible focus, and no prohibited
  positive capability claim.
- Verify focused tests, Web typecheck/test/lint, queue/whitespace checks, and
  1440px/390px browser captures before independent task and module review.
