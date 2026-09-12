# M55-T010 — Deploy another provider tool

## State

- Tier: CORE_P0
- Queue state: 00-inbox
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
  commandeer M51, M53, S26, S36, S42, or B04 paths.
- Record exact source/test ownership in this card and control records;
  candidate paths in the plan are not active reservations.
- Obtain fresh independent readiness and root activation for RED only.
  Review intended failures before authorizing the declared GREEN paths.

## Completion

Refinement is complete when packet/control records agree, reference/queue/
whitespace checks pass, independent documentation review is clear, and docs
are committed/pushed. This does not move the card to 10-ready, 20-active, or
60-done.

Implementation completion requires the plan's exact-head tests/reviews and
separate browser, CI, deployment, and human-testnet evidence. A committed
specification is not proof that the new-tool button works.
