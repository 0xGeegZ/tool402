# M15 Guest RiskScan Quick Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Make the accepted pure RiskScan Quick disclosure assessment useful
inside the guest Dashboard without issuing a request or creating a Sign,
payment, or live capability.

**Architecture:** A static server route composes one client island. The island
collects three intentionally blank request fields and four caller-reported
declarations, then calls the public `assessRiskScanQuick` core function once
on a deliberate valid submit. It maps only bounded local assessment or
invalid-input feedback; it makes no network call.

**Tech Stack:** Next.js 16.3.4 with Cache Components, React 19.2.8,
TypeScript 5.9.3, Node 22.21.1, npm workspaces, and the built-in Node test
runner.

**Spec:** `docs/specs/m15-guest-riskscan-quick-preflight.md`

## Global constraints

- Work in the current repository workspace; local policy prohibits a worktree
  without explicit human direction.
- Reuse only the public `@tool402/core` Quick export. Do not change accepted
  Core source/tests or import Agent, API, sender, fetcher, URL, or browser
  request behavior.
- Start no assessment until an explicit valid form submission. Keep all text
  controls blank by default; preserve the explicit caller declaration state.
- Do not add a Sign/session/provider, identity, account, wallet, signer,
  balance, recipient, facilitator, payment client, transaction, settlement,
  receipt, evidence, deployment, storage, configuration, analytics, external
  link, or live claim.
- A disclosure preflight is local preparation only; it never verifies a claim
  or represents a request, payment, service, evidence, or availability.

---

### Task 1: Write focused RED contracts

**Files:**

- Create: `apps/web/tests/riskscan-quick-preflight.test.mjs`

- [ ] Import the planned local state module and prove exact blank/no-default
  input construction, caller declaration handling, public-core assessment,
  fixed successful/invalid feedback, and no request behavior.
- [ ] Read the planned route/island/navigation sources and assert one server
  route, one client island, exact required controls, public Core use, no
  Agent/API/fetch boundary, and the constrained Workspace link.
- [ ] Run the focused test and observe RED because the route/island/state
  sources do not exist.

### Task 2: Implement the minimal guest preflight surface

**Files:**

- Create: `apps/web/src/app/dashboard/riskscan/preflight/page.tsx`
- Create: `apps/web/src/components/riskscan/preflight/riskscan-quick-preflight.tsx`
- Create: `apps/web/src/components/riskscan/preflight/riskscan-quick-preflight-state.ts`
- Modify: `apps/web/src/components/workspace/workspace-navigation.tsx`
- Modify: `apps/web/tests/workspace-shell.test.mjs`

- [ ] Add the static route with one `main`, one `h1`, and one island.
- [ ] Add the semantic blank form, core-only local evaluation, and bounded
  polite outcomes without a sender or request.
- [ ] Add one Workspace route-map `Link` and its narrow test assertion.
- [ ] Re-run the focused test to GREEN.

### Task 3: Verify the bounded browser delivery

- [ ] Run `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`, and root quality commands with
  Node 22.21.1.
- [ ] Run the production Webpack build, queue/reference/whitespace checks, and
  the enabled local guard.
- [ ] In the existing local browser server, exercise an incomplete and an
  all-reported preflight at desktop and narrow widths. Verify no request is
  issued, truthful fixed feedback, local navigation, focus, overflow, and
  diagnostics.
- [ ] Obtain independent task review and two fresh clean module-review
  generations before accepting the card.
