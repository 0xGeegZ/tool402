# S22-T010 — Public landing source-to-current reconciliation

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: a secret-free local evidence record confirms the first complete
  Provider campaign / ATS rehearsal under `HA-ATS-STAGE-B-001`; every local
  CORE_P0 card actually exercised by that rehearsal is accepted; and both
  `HA-PUBLIC-DEPLOY-001` and `HA-DEMO-VIDEO-001` remain pending.
- Owner: The root owns queue state, catalog, ownership, the local UI ledger,
  decisions, reviews, commits, and pushes. This intake owns only this card,
  `docs/ui/UI-S22.md`, `docs/ui/IMPORT-LEDGER.md`, and the root control
  records. A post-rehearsal comparison must name exact source/test paths before
  a readiness review can reserve them.
- Human actions: the existing Stage B action supplies the rehearsal evidence;
  this card creates no wallet/provider/ATS authority. Public deployment and
  demo recording remain human-owned downstream actions.

## Scope

After the first complete Provider campaign / ATS rehearsal, compare the
selected `PREP-UI-001` landing visual slice with the current local `/` route.
Bring the public landing substantially back toward that selected prepared
visual direction without redesigning it from scratch or bulk-importing any
source material.

The reconciliation retains compatible visual hierarchy, illustrations,
branding, spacing, section composition, and responsive intent. It maps every
surviving CTA to a current committed local route and replaces or removes every
mock, deferred, unsupported, or untruthful element. It does not turn a visual
reference into a claim that a capability has been live-proven when it has not.

The local [UI-S22 manifest](../../../ui/UI-S22.md) is the source boundary for
this slice. Its visual-reference alias is already recorded in the local UI
ledger; no external source identifier, URL, archive, or full extracted tree
may be committed here.

## Required intake before readiness

This card stays in `00-inbox` until the trigger is recorded. Once it is, the
root performs a fresh source-to-current comparison and commits a narrow UI-S22
ledger amendment that names:

1. the selected compatible sections and local visual assets;
2. the exact landing source and focused test paths;
3. the current route target for every CTA; and
4. each omitted prepared element and the truthful reason for omitting it.

Only then may an independent readiness review decide whether a dependency-safe
RED/implementation slice exists. The comparison cannot reopen unrelated
routes, import a general archive, or substitute fake product states for the
rehearsed flow.

## Acceptance criteria

- A fresh comparison proves the landing has been assessed against the selected
  `PREP-UI-001` visual slice and records only local, reviewable scope.
- The implementation preserves compatible prepared visual intent while every
  visible route, CTA, statement, and status reflects current local truth.
- No mock/deferred testimonial, metric, provider, payment, transaction,
  account, receipt, evidence, or live-availability claim survives unless the
  then-current repository independently proves it.
- Responsive desktop and narrow-viewport layouts, keyboard navigation,
  semantic landmarks, reduced motion, and visible focus receive browser
  verification.
- The slice is accepted before `HA-PUBLIC-DEPLOY-001` or
  `HA-DEMO-VIDEO-001` is executed, with the usual spec/RED/GREEN/independent
  review/quality/guard cycle.

## Boundary

This is a public-landing POLISH intake only. It creates no design source copy,
runtime/configuration path, provider/wallet interaction, payment, transaction,
deployment, or video action. The first rehearsal, public deployment, recording,
and submission remain distinct human-owned actions.
