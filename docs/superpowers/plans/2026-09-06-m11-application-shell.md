# M11 Application Workspace Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Add a truthful guest `/dashboard` workspace shell and local
navigation entry without faking a Sign session or financial data.

**Architecture:** A server page composes a focused workspace component
subtree with the existing primitives. The only shared-shell amendment is a
new `Workspace` `next/link` in the local navigation component. The page has no
client state or runtime data source.

**Tech Stack:** Next.js 16.3.4 with Cache Components, React 19.2.8,
TypeScript 5.9.3, Tailwind CSS 4.3.3, and the built-in Node test runner.

**Spec:** `docs/specs/m11-application-shell.md`

## Global Constraints

- Work in the current repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Preserve `cacheComponents: true`; add no dependency, client component,
  fetch, runtime configuration, storage, timer, analytics, or remote resource.
- Own only dashboard/workspace paths, focused workspace tests, the constrained
  local-navigation amendment, and its corresponding navigation assertion in
  `apps/web/tests/landing-explore.test.mjs`; do not modify landing, Explore,
  RiskScan, API, Agent, core, backend, layout, or package metadata.
- Render a guest/unconfigured state only. Do not add an identity or
  authenticated-session state, account, wallet, provider, balance, position,
  notification, activity, payment, result, receipt, evidence, transaction, or
  live status.

---

### Task 1: Guest workspace route and navigation

**Files:**

- Create: `apps/web/src/app/dashboard/page.tsx`
- Create: `apps/web/src/components/workspace/workspace-shell.tsx`
- Create: `apps/web/src/components/workspace/workspace-navigation.tsx`
- Create: `apps/web/src/components/workspace/workspace-overview.tsx`
- Modify: `apps/web/src/components/discovery/local-navigation.tsx`
- Create: `apps/web/tests/workspace-shell.test.mjs`
- Modify: `apps/web/tests/landing-explore.test.mjs`

**Interfaces:**

- Consumes: existing `Badge`, `Card`, `Link`, and local navigation.
- Produces: a static `/dashboard` route plus one `Workspace` global-navigation
  link, with exact local route-map links.

- [ ] **Step 1: Write the failing workspace contract**

  Add `apps/web/tests/workspace-shell.test.mjs`. Read the page, workspace
  components, and local navigation. Assert a single dashboard `main`/`h1`,
  `Workspace preview` and guest/unconfigured language, exact links to
  `/explore`, `/explore/riskscan`, and `/explore/riskscan/tool-loop`, and one
  navigation entry `{ href: "/dashboard", label: "Workspace" }`. Assert that
  the owned sources contain no `"use client"`, fetch, environment access,
  storage, `currentUser`, `connectWallet`, `signOut`, balance, position,
  payment, result, receipt, evidence, transaction, external URL, or live
  claim. The explanatory statement that no session is connected is required,
  not a fabricated session state. Amend the accepted navigation assertion only
  to allow the exact new `/dashboard` Workspace link.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/workspace-shell.test.mjs
  ```

  Expected: FAIL because the dashboard route, workspace components, and
  navigation link do not exist.

- [ ] **Step 3: Implement the minimal static shell**

  Create the server page and focused workspace components. Use existing
  primitives to state the preview boundary and offer only the three local
  route-map links. Style semantic `Link` elements directly instead of nesting
  the button primitive. Add the one `Workspace` global-navigation item and its
  constrained accepted-test amendment. Do not add a Sign control or dynamic
  data.

- [ ] **Step 4: Turn the contract GREEN and verify the browser**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/workspace-shell.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build --workspace=@tool402/web -- --webpack
  ```

  Use the Next development loop at `/dashboard` on desktop and 390px widths.
  Confirm local route-map links work, keyboard focus is visible, there is no
  horizontal overflow, and framework/browser diagnostics are clear.

- [ ] **Step 5: Commit the implementation**

  Inspect only owned paths, run the enabled guard and whitespace check, then
  commit:

  ```text
  feat: Add Application Workspace Shell
  ```

## Root-owned integration after Task 1

1. Obtain independent task review, resolve valid findings with TDD and scoped
   re-review, then run root clean-install/typecheck/test/lint and the Webpack
   build.
2. Run queue/reference/whitespace checks and the enabled guard. Re-run the
   Next development loop after any correction.
3. If clean, accept the card, commit root evidence, push, and verify remote
   `main`.
