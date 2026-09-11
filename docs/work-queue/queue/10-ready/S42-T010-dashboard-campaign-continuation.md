# S42-T010 — Dashboard campaign continuation

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: none. S42 consumes the already-merged dashboard-session and
  offering-projection read boundaries without modifying their active source or
  test paths; S24-T010's historical dashboard restriction is superseded only
  by the explicit state decision for this card.
- Owner: the root owns this card, specification, queue records, implementation,
  validation, and integration. No source or test path is active while this card
  remains in `10-ready`.
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

## Candidate source and test boundary

A later RED and GREEN cycle may reserve only:

- `apps/web/src/lib/dashboard-campaign.ts`;
- `apps/web/src/components/dashboard/dashboard-campaign.tsx`;
- `apps/web/src/app/dashboard/page.tsx`; and
- `apps/web/tests/dashboard-campaign.test.mjs`.

It may reuse the existing server-only dashboard session reader and existing
public RiskScan projection reader. It may not amend the dashboard auth
protocol, session layout gate, wallet session, public APIs, Convex schema or
functions, provider deploy state, package files, or lockfile.

## Readiness

At control head `7b748286389d66904320b7b33e64a175325f80e5`, the root confirmed
that all candidate paths are absent, no active card owns them, and the full Web
baseline is green under Node 22.21.1 (422 pass, 1 skipped). The Node 20 runner
cannot load the existing TypeScript test imports and is not a valid baseline.
S42-T010 is ready only; a separate owner-directed activation may reserve the
focused test for durable RED. Production source remains prohibited.

## Acceptance requirements

Before source work, the root records a test-only RED activation. A durable RED
must prove that a matching signer produces the campaign view model and that an
absent, malformed, or different signer cannot produce one. Only then may the
declared source paths be activated.

Acceptance requires focused and complete Web validation, lint, production
build, queue/reference/whitespace checks, a non-signing browser confirmation,
and a final scope review.

## Boundary

This is a read-only, server-rendered dashboard continuation surface. It does
not enumerate arbitrary offerings, expose an address, persist browser data,
make an external write, change an offering state, request a provider, sign,
or submit anything. S24's historical guest-only presentation restriction is
superseded only by this card after its gates are satisfied.
