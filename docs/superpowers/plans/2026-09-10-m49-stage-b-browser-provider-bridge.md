# M49 Stage-B browser/provider bridge implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one fail-closed, human-clicked browser bridge that turns the
accepted fixed Factory calldata into one session-only candidate only after
strict receipt and Mirror corroboration.

**Architecture:** A fixed public execution projection rehashes the complete
accepted M42 record before passing it to M44. An injected EIP-1193/fetch bridge
makes at most one send, validates its receipt, resolves a real returned Mirror
transaction id with bounded public reads, and returns a candidate. The existing
deploy wizard captures that candidate only in session state and leaves the
separate attach-candidate signature manual.

**Tech Stack:** Next.js 16.3.4, React 19, TypeScript, viem 2.56.1, existing
official Factory artifact, Node 22.21.1 tests with injected provider/fetch
fakes.

**Spec:** `docs/specs/m49-stage-b-browser-provider-bridge.md`

## Global constraints

- Preserve M42's exact real preimage and digest
  `1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9`.
- Keep M47's six-field command projection and S16 display literal separate;
  neither becomes Factory input.
- Use only M44's accepted Factory artifact/viem helpers. Do not modify M44
  helper or test source, packages, lockfile, Backend/Convex, environment,
  routes, or submission documentation.
- Tests inject EIP-1193, receipt, fetch, and clock/wait dependencies and make
  no real provider/RPC/Mirror/account request or transaction.
- A page-session controller takes a synchronous mutex before any provider
  request. `eth_sendTransaction` occurs at most once per page session after a
  returned hash; any same-tick or later post-hash invocation is inert. Any
  post-hash uncertainty is terminal `submission_unknown`; never resend.
- HA-ATS-STAGE-B-001 remains the sole authority for an actual wallet click,
  public observation, candidate attachment, or live action.
- Preserve S22/S24 active scopes. M49 has CORE_P0 precedence over S26's
  inbox-only signing-island reservation.

## Task 1: Write durable RED contracts

**Files:**

- Create: `apps/web/tests/stage-b-ats-create-execution-projection.test.mjs`
- Create: `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`
- Create: `apps/web/tests/ats-create-action.test.mjs`
- Modify: `apps/web/tests/ats-contracts-bundle-gate.test.mjs`
- Modify: `apps/web/tests/deploy-stage-signing.test.mjs`

- [ ] Add an absent execution-projection contract that requires the complete
  closed M42 literal, JCS/Keccak rehash, deep freeze/detachment, fixed issuer
  and public issuer-account id, and no Backend/S16/M47/caller source.
- [ ] Add an absent bridge contract with fake provider/receipt/fetch/wait. It
  must prove chain/signer rejection before a send, valid EIP-55 normalization,
  a synchronous same-tick lock, exactly one fixed send, bounded receipt reads,
  Factory-emitter validation before M44 event decoding, and no resend after
  every post-hash failure branch.
- [ ] Add exact Mirror fake documents that prove the bounded three-cycle public
  reads, paths/options, own-data transaction envelope without following
  pagination links,
  returned-id-only normalization, and correlation of hash, chain, result,
  status, issuer, Factory, timestamp, event emitter, and decoded address. Add
  every malformed, ambiguous, timeout, byte-cap, and mismatch vector as
  no-candidate `submission_unknown`.
- [ ] Add a client-action contract for explicit click only, a synchronous
  single-controller lock, a post-hash latch that blocks later clicks after a
  timeout, safe local feedback, and callback-only candidate handling. Amend
  bundle/signing tests only for accepted new bridge wiring.
- [ ] Run the focused command from M49's card. Confirm RED failures occur only
  because the two M49 source modules and accepted UI wiring are absent. Commit
  only durable RED tests.

## Task 2: Implement the frozen execution projection

**Files:**

- Create: `apps/web/src/lib/ats/stage-b-ats-create-execution-projection.ts`
- Modify: `apps/web/tests/stage-b-ats-create-execution-projection.test.mjs`

- [ ] Implement one detached deep-frozen projection with only the complete
  known M42 configuration, fixed issuer EVM/account identity, and M42 Mirror
  base. Recompute the canonical digest before returning.
- [ ] Do not export a generic parser, accept input, import private Backend
  source, make a network call, or expose it as a command/authority projection.
- [ ] Run its focused test and unaffected M42/M44/M47 tests. Commit the narrow
  GREEN projection.

## Task 3: Implement the one-shot provider and Mirror bridge

**Files:**

- Create: `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`
- Modify: `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`

- [ ] Require exact chain and one valid normalized signer before building M44
  calldata. Send exactly `{ from, to, data, value: "0x0" }` once only after
  explicit invocation through the session controller.
- [ ] Implement bounded receipt polling and reject wrong/missing hash, status,
  Factory target, non-Factory/multiple event emitters, or decoded event result.
- [ ] Implement the three fixed public Mirror reads as at most three read-only
  cycles with abort/byte/JSON/own-data/identity checks and never follow links. Normalize
  only a real returned `transaction_id`; never synthesize it.
- [ ] Return only the closed safe outcome union. Preserve no-candidate/no-
  attach/no-resend behavior on every post-hash failure.
- [ ] Run focused bridge/M44 tests and Web typecheck. Commit the narrow GREEN
  bridge.

## Task 4: Wire manual UI and session-only candidate state

**Files:**

- Modify: `apps/web/src/components/provider/deploy/ats-create-action.tsx`
- Modify: `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`
- Modify: `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`
- Modify: `apps/web/tests/ats-create-action.test.mjs`
- Modify: `apps/web/tests/ats-contracts-bundle-gate.test.mjs`
- Modify: `apps/web/tests/deploy-stage-signing.test.mjs`

- [ ] Pass the accepted fixed issuer to WalletIsland and enable the action only
  after stage 2 is done, an exact session exists, and no candidate exists.
- [ ] Keep one controller in `AtsCreateAction` across renders. Call the bridge
  only on its click handler, lock before the first await, leave the action
  disabled after every post-hash terminal result, map only safe local results,
  and report a candidate through a callback.
- [ ] Store the candidate only in `DeployStageSigning` state. It unlocks the
  existing attach-candidate signature but never automatically requests it.
- [ ] Retain direct Factory artifact bundle evidence through the new dependency
  graph. Do not add persistence, interval, provider discovery, environment
  access, Backend imports, or automatic action.
- [ ] Run focused UI tests, relevant S15/S16/S21 regressions, Web typecheck,
  and an isolated browser smoke with fake/no-action state. Commit the narrow
  GREEN UI wiring.

## Task 5: Verify, review, and prepare the human gate

**Files:** No production change expected.

- [ ] Run focused M49/M44/S15/S16/S21 suites, complete Web tests, Web/root
  typecheck and lint, queue validation, whitespace, and the enabled local
  reference guard under Node 22.21.1.
- [ ] Obtain independent task and module reviews from the RED base. Resolve
  Critical/Important findings through the implementer/re-review loop.
- [ ] If clear, accept M49 and prepare—not execute—a prefilled
  HA-ATS-STAGE-B-001 packet naming the accepted commit/host, one send, bounded
  Mirror observation, one manual attach signature, a later human-selected
  bounded fee cap, and no positive verification/lifecycle/deployment claim.
