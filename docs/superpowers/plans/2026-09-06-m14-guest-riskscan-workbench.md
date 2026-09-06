# M14 Guest RiskScan Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Present the accepted RiskScan discovery, compatibility, and unsigned
ToolLoop boundaries as one coherent guest Dashboard workbench without adding
session, payment, or live behavior.

**Architecture:** A static Dashboard route renders one server workbench
component. The workbench uses labelled sections to compose the existing
Directory, native-compatibility, and ToolLoop client islands in their fixed
inspect-before-act order. No accepted component or underlying Agent/Core/API
boundary changes.

**Tech Stack:** Next.js 16.3.4 with Cache Components, React 19.2.8,
TypeScript 5.9.3, Node 22.21.1, npm workspaces, and the built-in Node test
runner.

**Spec:** `docs/specs/m14-guest-riskscan-workbench.md`

## Global constraints

- Work in the current repository workspace; local policy prohibits a worktree
  without explicit human direction.
- Reuse the accepted local UI components only. Do not alter their behavior,
  public Agent boundaries, Agent/Core/API source, or their focused tests.
- Keep the new route and workbench server-rendered. Do not add `use client`,
  direct fetch/API/request construction, configuration, storage, timers/retry,
  analytics, external links, or persistence.
- Do not add a Sign/session/provider, identity, account, wallet, signer,
  balance, recipient, facilitator, payment client, transaction, settlement,
  result, receipt, evidence, deployment, or live claim.
- Present the final ToolLoop section as an unsigned challenge boundary only;
  do not imply a payment or result.

---

### Task 1: Write focused RED contract

**Files:**

- Create: `apps/web/tests/guest-riskscan-workbench.test.mjs`

- [ ] Read the planned route/workbench/navigation sources and assert exactly
  one static route `main` and `h1`, one workbench composition, the labelled
  Directory → compatibility → ToolLoop sequence, and the constrained Workspace
  workbench link.
- [ ] Assert that route/workbench sources add no client directive, direct
  network/API/request behavior, configuration, storage, timers/retry,
  Sign/session/account/wallet/provider/signer behavior, payment client,
  persistence, external link, or live claim.
- [ ] Run the focused test and observe RED because the planned route/workbench
  sources do not exist.

### Task 2: Implement the minimal guest workbench

**Files:**

- Create: `apps/web/src/app/dashboard/riskscan/page.tsx`
- Create: `apps/web/src/components/workspace/guest-riskscan-workbench.tsx`
- Modify: `apps/web/src/components/workspace/workspace-navigation.tsx`
- Modify: `apps/web/tests/workspace-shell.test.mjs`

- [ ] Add the static route with one `main`, one `h1`, and one workbench.
- [ ] Add the server workbench with three labelled sections in exact
  inspect-before-act order, each containing its accepted island unchanged.
- [ ] Add one local Workspace route-map `Link` and its narrow test assertion.
- [ ] Re-run the focused test to GREEN.

### Task 3: Verify the bounded browser delivery

- [ ] Run `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`, and the root quality commands with
  Node 22.21.1.
- [ ] Run the production Webpack build, queue/reference/whitespace checks, and
  the enabled local guard.
- [ ] In the existing local browser server, exercise the route at desktop and
  narrow widths. Verify each existing interaction remains reachable, local
  navigation, focus, overflow, and diagnostics.
- [ ] Obtain independent task review and two fresh clean module-review
  generations before accepting the card.
