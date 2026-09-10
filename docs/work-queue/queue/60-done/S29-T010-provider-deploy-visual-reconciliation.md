# S29-T010 — Provider deploy visual reconciliation

## State

- Tier: POLISH
- Queue state: 60-done
- Dependencies: S16-T010 accepted; S30-T010 and S28-T010 accepted. S31-T010
  retains its disjoint shared-shell source scope.
- Owner: The root owns queue state, catalog, ownership, UI ledger, decisions,
  reviews, commits, and pushes. The proposed source/test paths are exactly
  those listed in UI-S29.
- Human actions: none. This presentation work creates no wallet, signature,
  provider, payment, command, transaction, campaign deployment, or live action.

## Scope

Bring the actual existing Provider deploy wizard into the selected RiskScan
Provider visual direction. Preserve its local editable values and every S16
behavioral boundary. The selected reference's six prototype metrics, account
surfaces, activity, tabs, external routes, and status claims are incompatible
and are omitted.

The local [UI-S29 manifest](../../../ui/UI-S29.md) fixes the exact visual,
copy, target, and truthfulness boundary. The existing selected reference alias
`PREP-UI-001` in the local ledger is the only visual authority; no source
archive, URL, or source tree is tracked here.

## Candidate ready requirements

- UI-S29, this card, ledger, catalog, ownership, state, and decision records
  are committed before test or source changes.
- The listed components may change only presentational markup/classes/copy/local
  links. Their existing imports, fields, initial values, validation, state
  transitions, handlers, wallet/signature, and ATS boundaries remain fixed.
  `provider-deploy-state.ts`, `campaign-fixture.ts`,
  `ats-create-configuration.ts`, `ats-create-action.tsx`,
  `directory-record-literal.ts`, the command bridge, and their behavior tests
  remain accepted and unmodified.
- No active lane owns the page, wizard, stages, signing component, or the new
  focused visual test.
- A fresh independent readiness review, durable focused RED, and independent
  RED review accept exact GREEN before source is amended.

## Test-only RED activation

The independent readiness review at `7e2b294` is clear. D-S29-010-003 permits
only the new `apps/web/tests/provider-deploy-visual-reconciliation.test.mjs`
to establish the visual contract. The page, wizard, stages, and signing
components remain source-prohibited until a separate independent RED review
accepts an exact GREEN scope.

## GREEN authorization

The independent RED review at `222703b` is clear: the focused contract fails
once only for the absent footer hierarchy, while the unchanged S16/S21/M47/M44
behavior suite passes 47/47. D-S29-010-004 therefore permits only the four
presentation components named above and the focused visual test for minimal
GREEN. Existing behavior tests are verification-only and remain unamendable.

## Acceptance

S29-T010 is accepted at source `dc9f010`. The independent review is clear;
the focused S29/S16/S21/M47/M44 suite passes 48/48, Web typecheck,
queue/whitespace, and 1440px/390px browser checks are clear. The page adds
only the selected `PREP-UI-001` presentation direction: local return, RiskScan
identity, local editable/testnet boundary, compact purple step progress, flat
surfaces, and the existing shared footer. All S16 behavior and every
wallet/signature/ATS boundary remain unchanged.

## Verification

- A durable focused test-only RED precedes source changes.
- Focused S29 visual and S16 route/state tests, Web typecheck, whitespace,
  queue/reference checks, and the enabled local-reference guard pass.
- Browser checks at desktop and 390px cover the actual local route, keyboard
  focus, semantic landmarks, reduced motion, and no horizontal overflow.
- Independent task and module review report no Critical finding.

## Boundary

This is a Provider deploy presentation slice only. It neither changes nor
asserts form behavior, signature/wallet operation, ATS configuration, command
handling, payment, transaction, deployment, publication, or live availability.
