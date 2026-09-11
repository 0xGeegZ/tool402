# S36 Provider Signature Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the existing actionable signature request without changing its command or wallet behavior.

**Architecture:** `ProviderDeployStages` derives the already existing control for `enabledStage` and renders a small, conditional handoff that calls the same `onActivate(index)` callback as the stage card.

**Tech Stack:** Next.js, React, TypeScript, Node test runner.

**Spec:** `docs/ui/UI-S36.md`

## Global Constraints

- No command, wallet/provider, relay, authority, data, API, payment,
  transaction, ATS, deployment, or live behavior change.
- Reuse `providerDeployStageControl`; do not duplicate its state semantics.

### Task 1: Write the RED contract

**Files:**
- Create: `apps/web/tests/provider-deploy-signature-handoff.test.mjs`

- [ ] Transpile the real stages component with its local imports stubbed.
- [ ] Assert the actionable first stage renders one handoff and that its button
  calls `onActivate(0)`.
- [ ] Assert blocked and in-progress states render no handoff.
- [ ] Run `npm run test --workspace=@tool402/web -- tests/provider-deploy-signature-handoff.test.mjs` and observe the missing-handoff failure.

### Task 2: Render the handoff

**Files:**
- Modify: `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`
- Test: `apps/web/tests/provider-deploy-signature-handoff.test.mjs`

- [ ] Derive the existing eligible stage control once from `enabledStage`.
- [ ] Render the conditional handoff after the list using the existing callback.
- [ ] Preserve the exact existing stage-card controls and all no-live boundaries.
- [ ] Re-run the focused test until green.

### Task 3: Verify and prepare review

- [ ] Run focused Web tests, Web typecheck/lint, root lint, queue/reference/
  whitespace checks, and the local guard.
- [ ] Render `/provider/deploy` in a non-interacting browser session and verify
  the handoff is visible only with an actionable stage.
- [ ] Review the diff and open a draft PR for independent review; do not claim
  a live signature or accepted authority result.
