# S34 — Public documentation surface

## Goal

Add a small, server-rendered documentation surface that explains the current
Tool402 RiskScan and Provider paths without presenting configuration,
payment, command admission, or ATS work as a completed public capability.

## Routes

- `/docs` is the documentation entry point. It orients readers to the two
  current guides and links only to existing local routes.
- `/docs/riskscan` documents RiskScan Quick: descriptor discovery, bounded
  input shape, caller-declaration result boundary, conditional x402 endpoint,
  and the existing detail, ToolLoop, and guided-demo routes.
- `/docs/providers` documents the local RiskScan Provider flow: a five-step
  local preview, read-only Provider projection, signed-command
  boundary, and conditionally gated ATS revenue-note control.

## Product facts

- RiskScan Quick is described as a bounded assessment of caller-supplied
  declarations. It is not an external service, payment, or evidence
  verification.
- `GET /api/tools` exposes the current descriptor. Its RiskScan Quick
  endpoint is `POST /api/riskscan` with `requestRef`, `subjectRef`, `context`,
  and a required `declarations` object containing four booleans:
  `identity`, `pricing`, `limitations`, and `evidence`.
- A usable x402 configuration is host-specific. Without it, RiskScan returns
  the existing unavailable boundary. Documentation must not expose variable
  values, facilitator URLs, accounts, prices, payment headers, or a payment
  success claim.
- The Provider wizard is a five-step local preview: Tool details, Interface
  and capability, Pricing and target agent customers, Funding and revenue-note
  terms, and Review and sign. The first four steps carry editable fields; the
  final review/sign surface is not an editable form.
- The two terms containing Pricing, Funding, and revenue-note are frozen
  existing wizard labels only. They do not permit an amount, economics,
  availability, funding state, revenue event, payout, or return claim.
- Provider projections at `/provider` are read-only. A signed command,
  admitted command, local preview, or conditionally gated Factory control is
  not an ATS deployment, asset, public campaign, funding, payment, payout, or
  return.

## Visual and interaction contract

- Reuse the existing warm canvas, `PageHeader`, cards, badges, local header,
  and `LandingFooter`; add no dependency, global CSS, image asset, client
  component, mock data, metric, or external link.
- The two guide pages use a reference-shaped identity band, clear section
  hierarchy, compact in-page anchor navigation, flat cards, and a sticky
  desktop table of contents. At narrow widths anchors wrap and content stays
  single-column.
- Add `Docs` to the shared local navigation, targeting `/docs`. Add
  `Provider documentation` to the existing Provider footer links, targeting
  `/docs/providers`.
- All links must target existing local routes. Focus remains visible, heading
  order is semantic, decorative visuals are omitted, and no documentation
  control changes application state.

## Explicit exclusions

Do not add a client data read, fetch, environment read, local storage,
analytics, form, mock offering, search, filter, account, wallet, signer,
payment attempt, transaction, deployment, funding, issuance, payout, revenue,
return, external URL, hosted asset, route handler, API/Agent/Core/Backend
change, or live-capability claim. The exact existing wizard labels “Pricing
and target agent customers” and “Funding and revenue-note terms” are the sole
copy exception; they may not add a quantitative or capability assertion.

## Verification

- A test-only RED first proves the three new routes/components and both
  navigation integrations are absent.
- Focused static tests then prove the exact local route map, input fields,
  conditional configuration wording, five provider steps, conditionally gated ATS
  boundary, static/no-runtime source boundary, visible focus classes, and
  prohibited-claim exclusions.
- Existing navigation and footer contracts are amended only for the two new
  local links, including the exact local-navigation entry assertions in
  `workspace-shell.test.mjs` and `guided-demo-route.test.mjs`.
- Verify with focused Web tests, Web typecheck, lint, queue and whitespace
  checks, and browser captures at 1440px and 390px with no horizontal
  overflow, readable anchors, intentional heading wraps, and visible keyboard
  focus.
