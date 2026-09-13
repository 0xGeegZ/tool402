# S42-T010 — Dashboard campaign continuation

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: none. S42 consumes the already-merged dashboard-session and
  offering-projection read boundaries without modifying their active source or
  test paths; S24-T010's historical dashboard restriction is superseded only
  by the explicit state decision for this card.
- Owner: the root owns this card, specification, queue records, implementation,
  validation, and integration. The only active path is the focused durable RED
  contract below; production source remains prohibited.
- Human actions: a real wallet connection and dashboard sign-in remain
  user-initiated. This card does not request either action and creates no
  signature, command, relay, transaction, deployment, or live authority.

## Scope

After a valid signed dashboard session exists, the dashboard must show the
current RiskScan provider campaign only when the durable projection's canonical
signer is exactly the canonical address sealed in that session. A missing,
unavailable, malformed, or signer-mismatched projection renders no campaign
card. It never renders another wallet's campaign.

The first slice intentionally covers the only current Provider campaign,
`riskscan_revenue_note_demo`. Its card shows the durable campaign title and
state and offers the existing local Provider workspace as the continuation
route. It does not claim that every possible future offering can be listed.

The dashboard home replaces its historical guest workspace shell with this
authenticated campaign surface. It does not mount the guest overview or local
journey cards as a fallback. The obsolete unmounted workspace shell, overview,
and navigation components, with their source-only historical tests, are
removed. The existing child routes remain unchanged.

The minimum implementation contract is
`docs/specs/s42-dashboard-campaign-continuation.md`.

## RED activation

The repository owner explicitly authorized S42 implementation in this PR. At
control head `04c589eabc960d02c82e07f9c9fa1f6e3522305a`, S42-T010 moves to
`20-active` only for durable RED in
`apps/web/tests/dashboard-campaign.test.mjs`. Every production source path
remains prohibited until that test has one expected absence failure and the
root records RED acceptance.

## RED acceptance and GREEN boundary

At control head `54507e6cfadbd3bf6c7f0f4ace318831fac1c846`, the focused
Node 22.21.1 contract has exactly one expected absence failure for
`apps/web/src/lib/dashboard-campaign.ts`; its matching-signer and fail-closed
cases skip until that adapter exists. The root may now activate only the three
declared source paths below, alongside the focused test. No other source or
test path is authorized.

The activated paths are:

- `apps/web/src/lib/dashboard-campaign.ts`;
- `apps/web/src/components/dashboard/dashboard-campaign.tsx`; and
- `apps/web/src/app/dashboard/page.tsx`.

It may reuse the existing server-only dashboard session reader and existing
public RiskScan projection reader. It may not amend the dashboard auth
protocol, session layout gate, wallet session, public APIs, Convex schema or
functions, provider deploy state, package files, or lockfile.

## Verification and boundary

The RED contract proves that a matching signer produces the campaign view model
and that an absent, malformed, or different signer cannot produce one. S42 is
read-only and server-rendered: no generic offering enumeration, address
display, browser storage, wallet request, signature, command, relay,
transaction, deployment, or external write is authorized.

## Dynamic dashboard amendment

The repository owner directs this follow-up after the durable campaign reader
landed. The focused `dashboard-campaign.test.mjs` may define the contract that
`/dashboard` describes the signed campaign surface. After that RED contract is
observed, only `apps/web/src/app/dashboard/page.tsx` may remove the historical
workspace mount. No child route, session/auth protocol, projection reader,
wallet action, or external authority may change.

## Obsolete workspace cleanup amendment

The repository owner directs this follow-up after confirming that
`WorkspaceShell`, `WorkspaceOverview`, and `WorkspaceNavigation` have no
runtime consumer. The root may remove those three unmounted components and the
obsolete tests that read their implementation directly. Existing child-route
tests may stop reading `WorkspaceNavigation`, but must preserve their route and
island assertions. This cleanup does not alter `/dashboard` behavior, local
child routes, session/auth, projection reads, wallet actions, or external
authority.

## Empty campaign amendment

The repository owner directs the signer-owned dashboard to render one static
empty campaign card when the existing projection cannot yield that signer’s
campaign. The focused `dashboard-campaign.test.mjs` may define this contract;
after its expected RED result, only the already-reserved
`apps/web/src/components/dashboard/dashboard-campaign.tsx` may render the
card. It may use only the existing `/provider/deploy` and `/explore/riskscan`
links. No new query, retry, wallet action, session behavior, provider command,
or external authority is authorized.

## Acceptance

S42-T010 is accepted by the repository operator's ruling of 2026-09-12 on the
delivered work already merged on `main` at `07beeffe`. The dynamic and
empty-campaign amendments that `S42_DYNAMIC_DASHBOARD_AMENDMENT` and
`S42_EMPTY_CAMPAIGN_AMENDMENT` directed were delivered by commit `c8446477`,
integrated through pull request #113 at merge commit `fbf456ad`, with the badge
placement refinement in commit `078a09b3`. The declared surface exists on
`main` as `apps/web/src/components/dashboard/dashboard-campaign.tsx` with its
focused contract `apps/web/tests/dashboard-campaign.test.mjs`. Verification is the merged-`main` state at `07beeffe`: the complete Web suite passes 547 of 548 with no failure and one skip, Web typecheck is clean, and the Web build renders 37 of 37 routes. The
acceptance stands in place of the separate RED and GREEN records the
amendments would otherwise have produced, releases every S42 source and test
reservation, and authorizes no session, wallet, command, payment, transaction,
deployment, or external authority.
