# S24-T010 — Dashboard workspace source-to-current reconciliation

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: M11-T020 accepted. Eligibility is deferred until a secret-free
  local evidence record confirms the first complete Provider campaign / ATS
  rehearsal under `HA-ATS-STAGE-B-001`, S22-T010 is accepted, every local
  CORE_P0 card represented by the dashboard is accepted, and both
  `HA-PUBLIC-DEPLOY-001` and `HA-DEMO-VIDEO-001` remain pending.
- Owner: The root owns queue state, catalog, ownership, the local UI ledger,
  decisions, reviews, commits, and pushes. This intake owns only this card,
  `docs/ui/UI-S24.md`, `docs/ui/IMPORT-LEDGER.md`, and the root control
  records. A post-rehearsal comparison must name exact source/test paths before
  a readiness review can reserve them.
- Human actions: the existing Stage B action supplies the rehearsal evidence;
  this card creates no wallet/provider/ATS authority. Public deployment and
  demo recording remain human-owned downstream actions.

## Scope

After UI-S22 is accepted, compare the selected `PREP-UI-001` dashboard visual
slice with the current local `/dashboard` route. Bring the guest workspace
substantially back toward that selected prepared visual direction without
redesigning it from scratch or bulk-importing source material.

The reconciliation retains compatible visual hierarchy, illustrations,
branding, spacing, section composition, and responsive intent. It makes the
workspace purpose, available local journeys, next actions, and deliberate
unavailable states easy to understand. Every surviving CTA maps to a current
committed local route; every mock, deferred, unsupported, or untruthful element
is replaced, explicitly unavailable, or removed.

The local [UI-S24 manifest](../../../ui/UI-S24.md) is the source boundary for
this slice. Its visual-reference alias is already recorded in the local UI
ledger; no external source identifier, URL, archive, or full extracted tree may
be committed here.

## Required intake before readiness

This card stays in `00-inbox` until its trigger is recorded. Once it is, the
root performs a fresh source-to-current comparison and commits a narrow UI-S24
ledger amendment that names:

1. the selected compatible dashboard sections and local visual assets;
2. the exact workspace source and focused test paths;
3. the current route target for every CTA and clear unavailable state; and
4. each omitted prepared element and the truthful reason for omitting it.

Only then may an independent readiness review decide whether a dependency-safe
RED/implementation slice exists. The comparison cannot reopen unrelated routes,
import a general archive, or invent account, session, wallet, provider, balance,
payment, transaction, evidence, or live state.

## Acceptance criteria

- A fresh comparison proves the dashboard has been assessed against the
  selected `PREP-UI-001` workspace visual slice and records only local,
  reviewable scope.
- The implementation preserves compatible prepared visual intent while the
  workspace purpose, each CTA, statement, status, and unavailable state reflect
  current local truth.
- No mock/deferred account, wallet, provider, balance, payment, transaction,
  receipt, evidence, metric, testimonial, or live-availability claim survives
  unless the then-current repository independently proves it.
- Responsive desktop and narrow-viewport layouts, keyboard navigation,
  semantic landmarks, reduced motion, and visible focus receive browser
  verification.
- The slice is accepted before `HA-PUBLIC-DEPLOY-001` or
  `HA-DEMO-VIDEO-001` uses `/dashboard`, with the usual
  spec/RED/GREEN/independent-review/quality/guard cycle.

## Boundary

This is a guest-dashboard POLISH intake only. It creates no design source copy,
runtime/configuration path, provider/wallet interaction, payment, transaction,
deployment, or video action. The first rehearsal, public deployment, recording,
and submission remain distinct human-owned actions.
