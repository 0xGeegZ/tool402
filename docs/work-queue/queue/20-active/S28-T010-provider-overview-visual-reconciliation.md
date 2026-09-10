# S28-T010 — Provider overview visual reconciliation

## State

- Tier: POLISH
- Queue state: 20-active (test-only RED)
- Dependencies: S17-T010 accepted; S30-T010 accepted. S31-T010 retains its
  disjoint shared-shell source scope.
- Owner: The root owns queue state, catalog, ownership, UI ledger, decisions,
  reviews, commits, and pushes. The proposed source/test paths are exactly
  those listed in UI-S28.
- Human actions: none. This presentation work creates no account, provider,
  wallet, payment, transaction, campaign deployment, or live action.

## Scope

Bring the existing `/provider` overview into the selected Provider reference
direction while preserving its actual server-side offering/Directory
projections and every closed state. Retain only current local routes. The
primary provider CTA opens the already available local deploy wizard; it does
not publish, deploy, or create a campaign.

The local [UI-S28 manifest](../../../ui/UI-S28.md) fixes the exact visual,
copy, target, and truthfulness boundary. The existing selected reference alias
in the local ledger is the only visual authority; no source archive, URL, or
source tree is tracked here.

## Candidate ready requirements

- UI-S28, this card, the ledger, catalog, ownership, state, and decision
  records are committed before test or source changes.
- S17's projection reader/status-state paths remain accepted and unmodified.
- No active lane owns `provider/page.tsx`, `provider-status.tsx`, or the new
  focused visual-reconciliation test.
- A fresh independent readiness review, durable focused RED, and independent
  RED review accept the exact GREEN scope before source is amended.

## RED authorization

The independent readiness review at
`7314962c1a25d5584e46705d6f50193d99c73375` is clear. D-S28-010-002 permits
only the new `apps/web/tests/provider-visual-reconciliation.test.mjs` to define
the absent visual hierarchy. The Provider page and status component remain
prohibited until a fresh independent RED review accepts exact GREEN.

## Verification

- A durable focused test-only RED precedes source changes.
- Focused Provider visual and S17 status tests, Web typecheck, whitespace,
  queue/reference checks, and the enabled local-reference guard pass.
- Browser checks at desktop and 390px cover the actual local route, keyboard
  focus, semantic landmarks, reduced motion, and no horizontal overflow.
- Independent task and module review report no Critical finding.

## Boundary

This is a Provider overview presentation slice only. It neither changes nor
asserts projection reads, deploy-wizard behavior, campaign creation,
publication, Agent, payment, wallet, provider, account, transaction,
deployment, or live availability.
