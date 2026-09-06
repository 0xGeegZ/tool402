# M13 Browser Native Quote Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Make the accepted Agent native quote compatibility boundary visible
in the guest Dashboard without creating a Sign, payment, or live capability.

**Architecture:** A static server route composes one client island. The island
collects three intentionally blank policy values, then delegates once to the
public Agent native quote evaluator with the current origin and an injected
browser fetcher. The Agent alone performs and validates the bounded Directory
GET. The UI maps only its bounded outcomes and locks duplicate submissions.

**Tech Stack:** Next.js 16.3.4 with Cache Components, React 19.2.8,
TypeScript 5.9.3, Node 22.21.1, npm workspaces, and the built-in Node test
runner.

**Spec:** `docs/specs/m13-browser-native-quote-compatibility.md`

## Global constraints

- Work in the current repository workspace; local policy prohibits a worktree
  without explicit human direction.
- Reuse only the public
  `@tool402/agent/riskscan-tool-native-quote-evaluation` boundary. Do not
  duplicate directory validation or alter accepted Agent/Core/API sources.
- Start no network read until an explicit user submission. Pass the injected
  `window.fetch.bind(window)` only to the public Agent boundary; do not build
  an endpoint, request init, header, body, or POST.
- Do not choose a policy default, store the form, read configuration, add a
  Sign/session/provider, or create account/wallet/signer/payment/transaction/
  settlement/result/receipt/evidence/deployment/live behavior.
- A locally eligible outcome is compatibility only, never consent or payment
  authority.

---

### Task 1: Write focused RED contracts

**Files:**

- Create: `apps/web/tests/riskscan-native-quote-compatibility.test.mjs`

- [ ] Import only the public Agent native-quote subpath. Supply a controlled
  native Directory descriptor and assert one exact `GET /api/tools`, zero
  POSTs, and an `eligible` outcome.
- [ ] Import the planned local state module and assert fixed messages for
  idle/evaluating, Directory failure, unavailable native summary, every
  decline, and eligible compatibility.
- [ ] Read the planned route/island/navigation sources and assert one server
  route, one client island, exactly three required blank form controls,
  current-origin/injected-Agent delegation, duplicate-submit locking, the
  constrained Workspace link, and the no-authority boundary.
- [ ] Run the focused test and observe RED because the route/island/state
  sources do not exist.

### Task 2: Implement the minimal guest compatibility surface

**Files:**

- Create: `apps/web/src/app/dashboard/riskscan/compatibility/page.tsx`
- Create: `apps/web/src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx`
- Create: `apps/web/src/components/riskscan/native-quote/riskscan-native-quote-state.ts`
- Modify: `apps/web/src/components/workspace/workspace-navigation.tsx`
- Modify: `apps/web/tests/workspace-shell.test.mjs`

- [ ] Add the static route with one `main`, one `h1`, and one island.
- [ ] Add the semantic no-default form and a ref-backed duplicate-submit lock.
  Construct exactly `{ network, asset, maximumAmount }` from submitted values,
  then invoke the public Agent evaluator once with current origin and the
  injected browser fetcher.
- [ ] Map only the bounded outcome union to fixed polite messages. Make the
  eligible message explicitly non-authorizing.
- [ ] Add the one Workspace route-map `Link` and its narrow test assertion.
- [ ] Re-run the focused test to GREEN.

### Task 3: Verify the bounded browser delivery

- [ ] Run `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`, and the root quality commands with
  Node 22.21.1.
- [ ] Run the production Webpack build, queue/reference/whitespace checks, and
  the enabled local guard.
- [ ] In the existing local browser server, exercise the route at desktop and
  narrow widths. Verify one local GET and no POST, truthful unavailable/native
  summary feedback for current configuration, local navigation, focus,
  overflow, and diagnostics.
- [ ] Obtain independent task review and two fresh clean module-review
  generations before accepting the card.
