# Browser ToolLoop RiskScan Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the accepted local ToolLoopAgent discovery-to-challenge journey
truthfully inspectable from one new browser route.

**Architecture:** The root exposes the existing Agent composition through a
narrow package subpath and makes the Web workspace transpile that local package.
A static Next page mounts one client form. On submit the form constructs only
the browser's current-origin `URL`, delegates once to the accepted Agent flow,
and renders its opaque terminal union without payment or result capability.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3, Next.js 16.3.4 with Cache
Components enabled, React 19.2.8, and the built-in Node test runner.

**Spec:** `docs/specs/m08-browser-tool-loop-journey.md`

## Global Constraints

- Work in the current repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Preserve `cacheComponents: true`; add no `instant`, request-time read,
  Suspense workaround, cache policy, external dependency, or remote resource.
- Expose only `@tool402/agent/riskscan-tool-flow`; do not modify accepted Agent
  source/tests or import its directory/challenge internals into the Web code.
- The client may construct only `new URL(window.location.origin)` in its submit
  handler and invoke `runRiskScanQuickFlow` once. It must not directly call
  `fetch`, construct an endpoint/header, read configuration, or handle payment
  material.
- Render only `idle`, `submitting`, and the seven accepted terminal outcomes.
  Never add result, paid, settled, completed, receipt, evidence, persistence,
  wallet, account, signer, provider, price, network, recipient, facilitator,
  deployment, or live behavior.
- The root alone owns package metadata, lockfile, queue/UI ledgers, reviews,
  integration evidence, commits outside the owned Web paths, and pushes.

---

### Task 1: Browser ToolLoop package and route surface

**Files:**

- Modify: `apps/agent/package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/web/next.config.ts`
- Modify: `package-lock.json`
- Create: `apps/web/src/app/explore/riskscan/tool-loop/page.tsx`
- Create: `apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx`
- Modify: `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`
- Create: `apps/web/tests/riskscan-tool-loop.test.mjs`
- Modify: `apps/web/tests/riskscan-detail.test.mjs`

**Interfaces:**

- Consumes: `runRiskScanQuickFlow(serviceBase, input, directoryFetcher?,
  challengeSender?)` from the public `@tool402/agent/riskscan-tool-flow`
  subpath, the accepted Quick input fields, existing Card/Button components,
  and the browser current origin.
- Produces: `/explore/riskscan/tool-loop`, one `RiskScanToolLoop` client
  component, and a truthful `idle | submitting | RiskScanToolFlowOutcome`
  presentation state.

- [ ] **Step 1: Write failing package, route, and boundary contracts**

  Create `apps/web/tests/riskscan-tool-loop.test.mjs` first. It must dynamically
  import `@tool402/agent/riskscan-tool-flow` and use its real
  `runRiskScanQuickFlow` export with injected controlled senders. Assert the
  native safe directory yields exactly one `GET /api/tools`, then a controlled
  `402` yields exactly one `POST /api/riskscan` and only
  `{ kind: "payment_required" }`; assert a directory failure makes no POST.

  Read the new page/component and current detail component. Assert the page is
  server-rendered and mounts `<RiskScanToolLoop />`, while the client component
  has all seven bounded form fields, derives `new URL(window.location.origin)`,
  calls only `runRiskScanQuickFlow`, disables duplicate submit, renders all
  seven outcomes with fixed truthful copy, and receives a local detail link.
  Reject direct `fetch`, literal API route construction, headers, payment
  parsing/display, environment/configuration, wallet/account/signer/provider,
  price/network/recipient/facilitator, result/receipt/evidence, storage,
  retry/timer, external URL, and paid/settled/completed claims.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/riskscan-tool-loop.test.mjs
  ```

  Expected: FAIL because the Agent public subpath and new page/component do not
  exist. Record the exact missing export/module or file failure before writing
  production code.

- [ ] **Step 3: Implement the minimal package and browser composition**

  Add the Agent export map exactly as:

  ```json
  {
    "exports": {
      "./riskscan-tool-flow": "./src/riskscan-tool-flow.ts"
    }
  }
  ```

  Add the local Agent workspace dependency to Web, add only
  `transpilePackages: ["@tool402/agent"]` beside the existing Cache Components
  setting, and regenerate the root lockfile under Node 22.21.1 without adding
  an external dependency. Build a static route that mounts the client form.
  In the handler, create `new URL(window.location.origin)`, call
  `runRiskScanQuickFlow` once with the bounded form input, and set the opaque
  returned outcome. Use fixed local text for the seven outcomes and add one
  local detail link; do not alter the accepted Try route or Agent source.

- [ ] **Step 4: Turn contracts GREEN and verify the Next route**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/riskscan-tool-loop.test.mjs apps/web/tests/riskscan-detail.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build --workspace @tool402/web -- --webpack
  ```

  Use the Next development loop against the new route at desktop and narrow
  widths. Confirm the actual configuration-absent local path produces the
  explicit unavailable state, without framework or browser errors. Inspect
  only the owned paths, stage the code/test changes, run the enabled reference
  guard and cached whitespace check, then commit the implementation with:

  ```text
  feat: add browser ToolLoop journey
  ```

  Report the observed RED, Green commands, browser outcome, exact changed
  paths, commit SHA, self-review, and the preserved non-payment boundary.

## Root-owned integration after Task 1

1. Create the immutable task-review package from the active-card base through
   the implementation commit. Obtain independent task review and resolve every
   valid finding with a TDD correction and scoped re-review.
2. Run root Node 22.21.1 clean-install/typecheck/test/lint, production Webpack
   build, queue/reference/whitespace checks, and the Next development loop.
3. Obtain two fresh Standards/Spec module-review generations against the exact
   unchanged module diff. Resolve every valid finding with a scoped TDD
   correction and restart clean generations.
4. If every result is clean, move the card to `60-done`, record only local
   evidence, commit root acceptance, push, and verify remote `main`.
