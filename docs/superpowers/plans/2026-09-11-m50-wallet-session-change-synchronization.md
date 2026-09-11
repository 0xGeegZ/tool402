# M50 wallet session change synchronization implementation plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` with
> one implementer and an independent reviewer. Root owns all queue transitions,
> activation, acceptance, integration, commits, and pushes.

**Goal:** Synchronize an already-connected MetaMask session when the user
changes account or chain, without adding a wallet capability or performing a
wallet action.

**Architecture:** Extend the existing narrow EIP-1193 provider type with an
optional, cleanup-capable event seam. The wallet island subscribes only after
an explicit connect, hides child content on a native change event, and invokes
the existing passive `readCurrentSession` state boundary.

**Tech stack:** React 19, TypeScript, existing native EIP-1193 provider seam,
Node 22.21.1 injected-fake tests.

**Spec:** `docs/specs/m50-wallet-session-change-synchronization.md`

## Global constraints

- Do not add Wagmi or any dependency.
- Do not change `wallet-state.ts`, deploy-stage signing, command construction,
  relaying, configuration, packages, or lockfiles.
- Do not perform discovery outside explicit Connect/Retry, account selection,
  a chain switch, a signature, a relay, a network call, or a transaction.
- Treat native event payloads as untrusted hints; re-read the existing passive
  provider state instead.
- Preserve no-storage, no-polling, no-auto-connect, MetaMask-only behavior.

## Task 1: Establish durable RED contracts

**Files:**

- Modify: `apps/web/tests/wallet-state.test.mjs`
- Create: `apps/web/tests/wallet-session-sync.test.mjs`

- [ ] Replace the historical no-effect assertion with an exact requirement for
  the approved event synchronization wiring, while retaining the no-storage,
  no-Wagmi, click-only-discovery, and closed-state checks.
- [ ] Add injected-provider RED tests that require registration only for
  `accountsChanged` and `chainChanged`, exact cleanup, inert post-cleanup
  handlers, and no provider request from the helper callback.
- [ ] Add static component assertions for immediate non-actionable state before
  the existing passive session reader, with no account-request or chain-switch
  method in event handling.
- [ ] Run the focused wallet command and confirm RED fails solely because the
  event helper and component wiring are absent. Commit only the two test paths.

## Task 2: Add the native event seam

**Files:**

- Modify: `apps/web/src/lib/wallet/metamask-provider.ts`
- Modify: `apps/web/tests/wallet-session-sync.test.mjs`

- [ ] Add only optional EIP-1193 event listener types plus one exported helper
  that subscribes to the two declared events when both registration and removal
  support exist.
- [ ] Use no event payload, no request, no global browser access, no timer, and
  no provider fallback.
- [ ] Make cleanup idempotent and prevent a retained listener from calling the
  callback after cleanup.
- [ ] Run the focused helper/wallet tests and commit the narrow source change.

## Task 3: Wire passive session re-evaluation

**Files:**

- Modify: `apps/web/src/components/wallet/wallet-connect.tsx`
- Modify: `apps/web/tests/wallet-state.test.mjs`
- Modify: `apps/web/tests/wallet-session-sync.test.mjs`

- [ ] Subscribe only while the already-selected provider is mounted.
- [ ] On either event, synchronously enter the existing connecting state so
  child actions unmount, then call `readCurrentSession` and render its closed
  result only if the same provider remains current.
- [ ] Remove listeners on local disconnect/unmount; leave the existing
  Connect/Retry and user-clicked chain-switch paths untouched.
- [ ] Run focused wallet/deploy tests, Web typecheck, and the complete Web test
  suite. Commit only the approved four-path surface.

## Task 4: Verify and accept

- [ ] Root independently reviews the exact diff against M50, its specification,
  ownership, and the retained S15/S16/M49 boundaries.
- [ ] Run targeted wallet/deploy tests, complete Web tests, typecheck, lint,
  `queue:check`, reference guard, whitespace, and the enabled Git guard.
- [ ] Perform browser confirmation without invoking a signature, relay, or
  transaction. Record only observed safe state behavior.
- [ ] Commit root acceptance records, push the verified fast-forward result to
  canonical main, and do not execute a Stage 1 signature without a fresh,
  explicit matching human authorization.
