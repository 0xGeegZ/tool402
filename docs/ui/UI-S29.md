# UI-S29 Provider deploy visual reconciliation manifest

## Purpose

UI-S29 is a truth-first POLISH slice for the existing `/provider/deploy`
wizard. It adapts the selected `PREP-UI-001` Provider RiskScan reference's route hierarchy,
tool identity, flat panels, progress rhythm, and footer to the current local,
editable S16 provider flow without importing prototype metrics, account data,
tabs, or unavailable routes.

## Local targets

The slice may amend only:

- `apps/web/src/app/provider/deploy/page.tsx`;
- `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`;
- `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`;
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`; and
- `apps/web/tests/provider-deploy-visual-reconciliation.test.mjs`.

It preserves every existing field, initial value, validation, step order,
step-transition rule, acknowledgment, review, wallet island, signature dialog,
stage-state derivation, configuration projection, and disabled ATS action.

## Visual and copy contract

The page has one main/h1, an internal return link to `/provider`, a concise
RiskScan identity header, a local/editable-preview boundary label, the existing
five-step progress control, a large flat form surface, the existing review and
signing regions, and the shared truthful footer. At wide widths the header
aligns its local route/context beside the title; at narrow widths it stacks.
The progress control remains a five-step native button navigation, but follows
the reference's compact horizontal tab rhythm.

The page may state that values are local and editable and that a preview is not
a public offer. It must not claim funding, units, paid tasks, revenue, ATS
readiness, a provider account, a live listing, a completed signature, an
accepted command, an on-chain asset, publication, or deployment.

## Explicit exclusions

Do not add prototype metrics, activity, portfolio, account/notification
surfaces, status tabs, external/unavailable routes, new client state, fetch,
storage, analytics, assets, dependencies, global/shared CSS/navigation,
fixture/state/configuration edits, wallet/provider/signature/ATS behavior,
Agent/Core/Backend/payment changes, transaction, deployment, or live action.

## Acceptance evidence

- A focused RED test commits before source work and fails only because the
  required visual hierarchy is absent.
- Focused tests preserve all S16 form names, existing navigation/validation,
  local CTA hrefs, truthful copy, flat retained Cards, visible focus, motion
  reduction, and the unchanged wallet/stage boundaries.
- Desktop and 390px browser checks prove no horizontal overflow, an intentional
  heading wrap, usable progress controls/CTAs, stacked fields, an unclipped
  review/signing surface, and one footer landmark.
- Web typecheck, focused S16/S29 tests, whitespace, queue/reference checks,
  and independent task/module review are clear before integration.
