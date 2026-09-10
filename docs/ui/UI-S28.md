# UI-S28 Provider overview visual reconciliation manifest

## Purpose

UI-S28 is a truth-first POLISH slice for the existing `/provider` route. It
adapts the selected prepared Provider overview composition to the current
server-rendered offering and Directory projections. It does not import the
prepared prototype's simulated funding, task, revenue, account, or activity
data.

## Local targets

The slice may amend only:

- `apps/web/src/app/provider/page.tsx`;
- `apps/web/src/components/provider/status/provider-status.tsx`; and
- `apps/web/tests/provider-visual-reconciliation.test.mjs`.

The page keeps its current server-side `readProviderProjections` call and the
status component keeps the current closed presentation states. Existing
provider-status reader/state tests remain their accepted S17 contract and are
not amended by this slice.

## Visual and copy contract

At wide widths the route follows the selected Provider overview rhythm: an
eyebrow, clear Provider workspace title, succinct supporting copy, two local
actions, a rounded purple next-action band, a three-column current-state grid,
one RiskScan provider card, evidence and term details, and the existing
truthful footer. At narrow widths every region stacks with no clipped content.

The primary provider action is an internal `/provider/deploy` link labelled
`Prepare a tool offering`; the secondary action is the current local
`/explore/riskscan` route. The provider card may identify RiskScan as the
current tool offering and link only to `/provider/deploy`. The state grid may
render only the existing returned offering, Directory, and next-action
outcomes. It must never render a simulated funding amount, number of units,
paid tasks, usage revenue, portfolio/account state, notifications, activity,
or a live/publication assertion.

## Explicit exclusions

Do not change the projection reader/state module, deploy wizard, route map,
navigation, shared/global CSS, assets, dependencies, API, Agent, Core,
Backend, payment, wallet, provider, transaction, deployment, or live
behavior. Do not add an external link, a new route, client state, polling,
fetching, storage, analytics, mock fixture, generated metric, or claim beyond
the current projection outcomes.

## Acceptance evidence

- A focused RED test commits before source work and fails only because the
  Provider overview visual hierarchy is absent.
- Focused tests prove one main and h1, current local CTA hrefs, a named
  next-action region, a three-column wide state grid that stacks on mobile, a
  local RiskScan offering card, current evidence/term regions, no shadowed
  large cards, and no mock metrics/copy.
- Desktop and 390px browser checks prove no horizontal overflow, visible
  keyboard focus, intentional heading wrapping, usable CTAs, stacked cards,
  and a single truthful footer landmark.
- Web typecheck, focused tests, whitespace, queue/reference checks, and an
  independent task/module review are clear before integration.
