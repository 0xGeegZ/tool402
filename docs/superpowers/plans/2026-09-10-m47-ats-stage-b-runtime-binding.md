# M47 ATS Stage-B runtime binding implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local `ATS_CREATE` stage-2 command path bind the accepted
real M42 configuration, while preserving the canonical preimage/digest and
leaving M33 zero-enabled.

**Architecture:** A private Convex helper compares M32's already normalized,
durably revalidated command context to the complete immutable M42 real-issuer
projection before M33 or durable state. A separate public Web projection
contains only the M26 fields necessary for stage-2 signing. The existing S16
synthetic display literal remains display-only.

**Tech Stack:** TypeScript, Convex internal mutations, Next.js 16, viem 2.56.1,
Node 22.21.1 tests.

**Spec:** `docs/specs/m47-ats-stage-b-runtime-binding.md`

## Global constraints

- Preserve the accepted M42 real preimage and digest exactly; any discrepancy
  stops for an explicit human configuration decision.
- Do not enable M33, provision an authority row, access environment/config,
  prompt a wallet, call a provider/SDK/RPC, create an attempt/asset/candidate,
  or invoke a transaction.
- The server owns authorization. The browser projection is public, frozen
  routing data only and cannot be accepted as authority.
- Do not modify README.md or docs/submission/README.md; submission evidence
  placeholders change only after independently verified evidence exists.
- Preserve M46-T040's active EntityCheck paths and all unrelated work.

## Task 1: Define the durable RED contracts

**Files:**

- Create: `packages/backend/tests/stage-b-ats-create-runtime-binding.test.mjs`
- Modify: `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- Create: `apps/web/tests/stage-b-ats-create-command-projection.test.mjs`
- Modify: `apps/web/tests/command-bridge.test.mjs`
- Modify: `apps/web/tests/deploy-stage-signing.test.mjs`

- [ ] Add a Backend contract importing the absent private binding. Use a valid
  M32-normalized `ATS_CREATE` fixture and assert success only for the exact
  M42 real signer/principal/ISSUER/authority-version/payload tuple. Assert
  rejection for the synthetic digest, each context drift, each payload drift,
  and signer/owner mismatch.
- [ ] Add a durable-admission assertion proving the binding executes before
  M33/replay/idempotency work and that current zero-enabled M33 still rejects
  without any durable write.
- [ ] Add a Web contract importing the absent public projection and requiring
  exactly the six public M26 fields, deep freezing, the real M42 digest, and
  no owner/private descriptor/parameter value.
- [ ] Amend the bridge tests so stage 2 must construct exactly the real M42
  payload without a `projection` input, while stages 1/3/4 retain their
  accepted behavior. Add a source assertion that the bridge does not import
  the S16 display literal, contains no `projection` input, and preserves only
  its module-private neutral campaign subject in stages 1 and 4. Pass a
  synthetic surplus `projection` from the JavaScript fixture and prove stage 2
  still emits the real M42 fields. Amend the signing-island source assertion
  to pass no stage-2 projection while preserving its S16 display-state use.
- [ ] Run the focused Backend and Web commands. Confirm RED fails only for the
  absent M47 binding/projection and intentional old bridge behavior; commit
  the RED contract.

## Task 2: Implement the private server-side binding

**Files:**

- Create: `packages/backend/convex/stage_b_ats_create_runtime_binding.ts`
- Modify: `packages/backend/convex/external_prepare_command_admission.ts`

- [ ] Implement one private closed-record binding helper. It obtains the M42
  real projection, validates the existing normalized context and all fixed
  M26 payload fields, and throws on any drift.
- [ ] Insert exactly one call in the `ATS_CREATE` mutation after existing M32
  context/durable-authority revalidation and before M33 or replay/idempotency
  access. Do not change non-ATS behavior or the M33 manifest.
- [ ] Run the focused Backend tests plus Backend typecheck. Confirm every RED
  vector passes and M33 remains zero-enabled; commit the narrow GREEN.

## Task 3: Implement the public command projection and bridge switch

**Files:**

- Create: `apps/web/src/lib/ats/stage-b-ats-create-command-projection.ts`
- Modify: `apps/web/src/lib/wallet/command-bridge.ts`
- Modify: `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`

- [ ] Implement the exact frozen six-field public M26 projection from the
  accepted real M42 record. Do not import Backend/private source or export an
  owner, descriptor, parameter, RPC/Mirror, authority, or secret value.
- [ ] Make stage 2 use that module directly and remove the caller-provided
  stage-2 projection input. Replace the bridge's former S16-derived subject
  with its one private neutral subject literal used only for stages 1 and 4.
  Preserve the S16 literal for display-only state.
- [ ] Update the signing island to stop passing a stage-2 projection. Do not
  invoke signing, relay, provider, or wallet code as part of this task.
- [ ] Run the focused Web tests, Web typecheck, and relevant S15/S16/S21
  regressions. Commit the narrow GREEN.

## Task 4: Verify and review the completed local binding

**Files:** No production file changes expected.

- [ ] Run Backend/Web/root typechecks, focused suites, relevant workspace
  suites, lint, queue validation, whitespace, and the enabled local-reference
  guard under Node 22.21.1.
- [ ] Create the task review package from the recorded pre-Task-1 base and
  obtain an independent task review. Resolve any Critical/Important finding
  through the implementer/re-review loop.
- [ ] Obtain a fresh module review. If clear, record acceptance, update the
  Stage-B draft only with already-known current M44/M47 prerequisites, and
  move the card through the normal completion records.
