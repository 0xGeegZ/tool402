# S42-T010 — Dashboard campaign continuation

## State

- Tier: CORE_P0
- Queue state: 20-active
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

The minimum implementation contract is
`docs/specs/s42-dashboard-campaign-continuation.md`.

## RED activation

The repository owner explicitly authorized S42 implementation in this PR. At
control head `04c589eabc960d02c82e07f9c9fa1f6e3522305a`, S42-T010 moves to
`20-active` only for durable RED in
`apps/web/tests/dashboard-campaign.test.mjs`. Every production source path
remains prohibited until that test has one expected absence failure and the
root records RED acceptance.

## Candidate GREEN boundary

After RED acceptance, only these paths may be activated:

- `apps/web/src/lib/dashboard-campaign.ts`;
- `apps/web/src/components/dashboard/dashboard-campaign.tsx`; and
- `apps/web/src/app/dashboard/page.tsx`.

It may reuse the existing server-only dashboard session reader and existing
public RiskScan projection reader. It may not amend the dashboard auth
protocol, session layout gate, wallet session, public APIs, Convex schema or
functions, provider deploy state, package files, or lockfile.

## Verification and boundary

The RED contract must prove that a matching signer produces the campaign view
model and that an absent, malformed, or different signer cannot produce one.
S42 is read-only and server-rendered: no generic offering enumeration, address
display, browser storage, wallet request, signature, command, relay,
transaction, deployment, or external write is authorized.
