# M29-T010 — Shell accessibility amendment

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M02-T020 accepted; M11-T020 accepted
- Owner: The root owns this card, `docs/specs/m29-shell-accessibility-amendment.md`,
  `docs/superpowers/plans/2026-09-07-m29-shell-accessibility-amendment.md`,
  `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/ui/UI-S00.md`,
  `docs/ui/IMPORT-LEDGER.md`, queue state, catalog, ownership, decisions,
  reviews, commits, and pushes. Proposed implementation paths are only
  `apps/web/src/app/globals.css` and
  `apps/web/tests/shell-accessibility.test.mjs`.
- Human actions: none. This local visual-accessibility amendment grants no
  authority over identity, provider, wallet, signer, payment, account,
  transaction, reserve, allocation, clearing, ATS, HCS, payout, deployment,
  or any external action.

## Scope

Add the smallest global reduced-motion rule to the accepted shared shell and
prove that it preserves visible keyboard focus, labeled shared landmarks, and
non-overflowing desktop/narrow rendering. It is an explicit amendment to the
accepted UI-S00 shell boundary, not a reopening of route behavior or a new UI
archive import.

The local contract is the [M29 shell accessibility amendment](../../../specs/m29-shell-accessibility-amendment.md), the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md), the accepted shell manifest is [UI-S00](../../../ui/UI-S00.md), and execution is in the [M29 implementation plan](../../../superpowers/plans/2026-09-07-m29-shell-accessibility-amendment.md).

## Candidate ready requirements

- The local contract, source-record amendment, UI-S00 amendment record, plan,
  card, catalog, ownership, decision, and state records are committed before a
  RED test or stylesheet change.
- M02-T020 (UI-S00) and M11-T020 remain accepted locally. M27 remains an inbox-only CORE
  authority intake; no CORE_P0 card is currently runnable without a missing
  authority or proof.
- The two declared Web paths are disjoint from every active card and are the
  entire implementation boundary.
- The contract fixes the normal and reduced-motion behavior, rejects
  overflow-masking, and requires viewport and keyboard verification before
  code.
- An independent review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A test-only RED contract must precede the stylesheet change and prove the
  absent motion-preference behavior while protecting the shared focus and
  landmark seams.
- Focused command: `node --test apps/web/tests/shell-accessibility.test.mjs`
  from the repository root under Node 22.21.1.
- Web/root typecheck, test, build, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled guard, real-browser runtime
  checks, independent task review, and two fresh clean module-review
  generations must pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T14:32:00Z after a fresh root rescan confirmed that no
CORE_P0 implementation card is runnable: authenticated commands await the
secret-free authority packet, and holder distribution awaits verified
reserve/snapshot capability. The accepted UI-S00 and M11 shared-shell context
permit this disjoint POLISH amendment under the local priority rule.

This inbox state authorizes only committed local authority and independent
design review. It does not authorize RED/code, route business changes, or any
identity, provider, wallet, signer, payment, account, transaction, reserve,
allocation, clearing, ATS, HCS, payout, deployment, or external behavior.

## Design review

Independent review of committed authority `c69480e` completed clean. It
confirmed both declared dependencies are accepted, M27 remains the only blocked
CORE_P0 intake, every local path resolves, the amendment is isolated to one
stylesheet rule and one focused test, and the browser tooling/version floor is
available for final runtime evidence. No Critical, Important, or Minor finding
remains.

## Ready transition

Ready at 2026-09-07T14:41:35Z after a fresh root rescan confirmed that
M02-T020 and M11-T020 remain accepted, no active card owns either declared Web
path, the committed authority is resolvable, the local guard is enabled, no
CORE_P0 card is runnable, and no human action is required for this deterministic
local amendment.

This ready state authorizes only root activation followed by the specified
test-only RED and minimal stylesheet GREEN. It does not authorize route
business changes or any identity, provider, wallet, signer, payment, account,
transaction, reserve, allocation, clearing, ATS, HCS, payout, deployment, or
external behavior.

## Activation

Activated at 2026-09-07T14:43:11Z after a fresh post-ready root rescan
confirmed this is the sole ready card, both dependencies remain accepted, no
active ownership conflict exists, the committed authority is resolvable, the
local guard is enabled, and no human action blocks this deterministic local
scope. This activation authorizes only the specified test-only RED followed by
the minimal stylesheet GREEN and verification.
