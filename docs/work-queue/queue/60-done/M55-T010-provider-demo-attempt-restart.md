# M55-T010 — Deploy another provider tool

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: none.
- Owner: root integrator for documentation, readiness, path reservations,
  activation, review, integration, commits, and pushes.
- Human actions: documentation only in this refinement; no wallet, signature,
  authority provisioning, transaction, environment deployment, or live action.

Dependencies here describe documentation intake, not source readiness.
Resolve implementation prerequisites/overlaps through the startup gate first.

## Purpose and packet

An authorized provider can deploy another tool, even with all prefilled fields
unchanged, while earlier tools remain intact. This replaces the demo-attempt
framing; the filename remains for reference compatibility.

Read the [handoff](../../evidence/M55-T010-delegation.md) first, then the
[specification](../../../specs/m55-provider-demo-attempt-restart.md) and
[plan](../../../superpowers/plans/2026-09-12-m55-deploy-another-tool.md).
They fix allocation authorization, selected-tool routes, ownership, ATS/receipt
binding, Directory isolation, candidate paths, and acceptance A1–A12. Product
decisions do not depend on rediscovering the conversation.

## Candidate-ready requirements

- Refresh exact head/base and preserve the already requested continuation,
  local HTTP-auth, and root-env integrations.
- Verify accepted foundation/validation/workspace/integration gates and
  prerequisite behavior. Resolve active overlaps by final acceptance/release
  or a documented root-owned scoped transfer with co-review; never silently
  commandeer M51, M53, M54, S26, S36, S42, or B04 paths.
- At Task 1 readiness, record exact source/test ownership in this card and
  control records. That `10-ready` reservation was promoted to the accepted
  Task 1 Green scope below; Tasks 2–6 plan candidates remain inactive.
- Task 1 independent readiness is clear in
  [its review](../../evidence/M55-T010-task1-independent-readiness-review.md).
  The [test-only activation](../../evidence/M55-T010-task1-activation.md)
  authorizes its four new focused tests only. Root must review their intended
  failures before authorizing any Task 1 GREEN path.

The [independent RED review](../../evidence/M55-T010-task1-red-review.md) is
clear. Only the twelve Task 1 paths recorded in the readiness review may now
receive minimal Green implementation; all Task 2–6 paths remain excluded.

The first independently reviewable slice is Task 1 only. Its exact candidate
paths, retained predecessor owners, and the Tasks 2–6 block map are recorded
in [the Task 1 readiness review](../../evidence/M55-T010-task1-readiness-review.md).
The historical move of this card to `10-ready` reserved only
`provider-tool-identity.ts`, `provider-tool-identity.test.mjs`, Core's
`index.ts`, `provider_tools.ts`, `provider_session_ingress.ts`, Backend
`schema.ts`/`http.ts`, `provider-tools.test.mjs`,
`provider-session-ingress.test.mjs`, `provider-tools-server.ts`, the new
`/api/provider/tools` route, and `provider-tools-api.test.mjs`. It reserves no
ATS, receipt, Directory, or UI path: each later plan task still requires an
exact scoped transfer/release and its own readiness/RED cycle.

The new protected route correctly causes M41's closed HTTP-route inventory to
fail. Its existing test is not one of the twelve Task 1 paths. The independent
review and root test-only activation in
[the supplemental record](../../evidence/M55-T010-task1-http-route-supplement.md)
authorize only its one expected-route entry; all its other M41 assertions and
every other M41 path remain retained.

Task 1 Green is accepted in [its exact-head review](../../evidence/M55-T010-task1-green-review.md).
The accepted slice supplies allocation and protected owner reads only; it does
not surface a dashboard button. The owner-directed
[Tasks 2–6 activation](../../evidence/M55-T010-tasks2-6-activation.md) now
records the exact predecessor transfers, retained legacy branches, and required
joint compatibility reviews for the remaining serial slices.

## Completion

The [refinement review](../../evidence/M55-T010-refinement-review.md) is clear
at `cdf7d847`: the documentation packet is ready for delegation. The startup
gate above remains mandatory for the implementation agent.

Refinement is complete when packet/control records agree, reference/queue/
whitespace checks pass, independent documentation review is clear, and docs
are committed/pushed. This card is `20-active`: Task 1 Green is accepted and
Tasks 2–6 now proceed serially under the recorded narrow transfers. The
accepted Task 1 source is not evidence that the new-tool button or an
end-to-end deployment is available.

Implementation completion requires the plan's exact-head tests/reviews and
separate browser, CI, deployment, and human-testnet evidence. A committed
specification is not proof that the new-tool button works.

## Acceptance

M55-T010 is accepted by the repository operator's ruling of 2026-09-12 on the
delivered work already merged on `main` at `07beeffe`. Task 1 was already
accepted by D-M55-010-008. Tasks 2 to 6, activated serially by D-M55-010-009,
were delivered through pull request #100 at merge commit `62da3c1d`, with the
packet formalization integrated earlier through pull request #97 at merge
commit `5f21fc90`. The selected-tool boundary exists on `main` as
`packages/backend/convex/provider_tools.ts`,
`packages/backend/convex/provider_tool_authority.ts`,
`packages/backend/convex/provider_tool_receipts.ts`, and
`packages/backend/convex/provider_session_ingress.ts`, with the dashboard
listing at `apps/web/src/components/dashboard/provider-tool-list.tsx`. Verification is the merged-`main` state at `07beeffe`: the complete Web suite passes 547 of 548 with no failure and one skip, Web typecheck is clean, and the Web build renders 37 of 37 routes. The
acceptance stands in place of the per-task GREEN and joint compatibility review
records that were never written separately: every seam M55 borrowed from
M51-T010, M53-T010, M54-T010, S26-T010, S36-T010, S42-T010, and B04-T010 is
accepted in the same ruling and against the same merged state, so no transfer
remains open. It releases every M55 path reservation and grants no wallet
signature, transaction, Directory publication, authority provisioning,
environment mutation, or live action.
