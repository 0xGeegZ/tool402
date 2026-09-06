# M09 Browser RiskScan Directory inspection implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for the one bounded task.

**Goal:** Make the accepted RiskScan Quick Directory inspectable from Explore
without turning discovery into request execution or payment behavior.

**Architecture:** The root exposes the existing Agent directory module through
one public subpath. The static Explore page mounts a new client island. After
an explicit action, it constructs only the current-origin URL and delegates
once to `discoverRiskScanQuick`. A local state/projection helper renders the
bounded selection or truthful directory failure, while keeping the existing
UI-S01 static card unchanged.

**Tech stack:** Node 22.21.1, TypeScript 5.9.3, Next.js 16.3.4 with Cache
Components enabled, React 19.2.8, and the built-in Node test runner.

**Spec:** `docs/specs/m09-native-directory-discovery.md`

## Global constraints

- Work in the current repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Preserve `cacheComponents: true`; do not add an external dependency, cache
  policy, remote resource, request-time server read, or runtime configuration.
- Expose only `@tool402/agent/riskscan-tool-directory`; do not modify accepted
  Agent source/tests, API/x402, core, backend, Try, ToolLoop, or UI-S01 static
  card source.
- The client constructs only `new URL(window.location.origin)` after an
  explicit action and calls `discoverRiskScanQuick` once. It must not directly
  call `fetch`, build a route/header/body, read environment/configuration, or
  handle a protocol header/payload.
- Render only idle, inspecting, directory failures, and a bounded selected
  descriptor projection. Never add a RiskScan request, payment action,
  availability, result, paid/settled/completed state, storage, retry/timer,
  wallet, account, signer, provider, recipient, facilitator, deployment, or
  live behavior.
- Native metadata is display-only: canonical network, asset, and atomic amount
  exactly as the Agent returned them. Do not convert, total, or infer value.

---

### Task 1: Public Directory inspection island

**Files:**

- Modify: `apps/agent/package.json`
- Modify: `apps/web/src/app/explore/page.tsx`
- Create: `apps/web/src/components/discovery/riskscan-directory-discovery.tsx`
- Create: `apps/web/src/components/discovery/riskscan-directory-state.ts`
- Create: `apps/web/tests/riskscan-directory-discovery.test.mjs`
- Modify: `apps/web/tests/landing-explore.test.mjs`

**Interfaces:**

- Consumes: `discoverRiskScanQuick(serviceBase, fetcher?)` only from the public
  `@tool402/agent/riskscan-tool-directory` subpath, existing UI primitives,
  and the browser current origin.
- Produces: one Explore client island that renders a bounded directory selection
  or a truthful no-request failure state.

- [ ] **Step 1: Write failing public-boundary and client contracts**

  Create the focused test first. Dynamically import the public directory
  subpath and use its real function with a controlled native directory sender.
  Assert exactly one credential-free `GET /api/tools`, zero RiskScan `POST`,
  and selected safe native metadata. Assert that directory failure exposes no
  selected descriptor.

  Read the static Explore page, new island/state source, and existing static
  UI-S01 card. Assert server/client separation, preserved static card,
  current-origin construction, one public Agent call, synchronous lock and
  disabled control, exact truthful messages, selected projection, polite live
  feedback, and no direct fetch/endpoint/header/body/configuration/payment
  action/wallet/result/storage/retry/external/live behavior.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/riskscan-directory-discovery.test.mjs
  ```

  Expected: FAIL because the public subpath and new Explore island/state/test
  surfaces do not exist. Record the precise missing-module or file failure
  before production code.

- [ ] **Step 3: Implement the minimal public package and client island**

  Add only the public Agent directory export. Mount the new client island from
  the existing static Explore page. On a button action, lock synchronously,
  construct `new URL(window.location.origin)`, call the public discovery
  function once, and project only safe fixed descriptor/configuration values.
  Keep UI-S01's static card source unchanged. Do not add a dependency, direct
  browser I/O, payment/request control, or a route/action link.

- [ ] **Step 4: Turn contracts GREEN and verify the browser**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/riskscan-directory-discovery.test.mjs apps/web/tests/landing-explore.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build --workspace=@tool402/web -- --webpack
  ```

  Use the Next development loop at `/explore` on desktop and narrow widths.
  Confirm one actual local directory `GET`, zero RiskScan `POST`, a truthful
  configuration-required selected state, and clear framework/browser errors.
  Inspect only owned paths, stage them, run the enabled reference guard and
  whitespace check, then commit the implementation with:

  ```text
  feat: add Directory inspection to Explore
  ```

## Root-owned integration after Task 1

1. Create the immutable task-review package from the active-card base through
   the implementation commit. Obtain independent task review and resolve every
   valid finding with a TDD correction and scoped re-review.
2. Run root Node 22.21.1 clean-install/typecheck/test/lint, production Webpack
   build, queue/reference/whitespace checks, and the Next development loop.
3. Obtain two fresh Standards/Specification module-review generations against
   the exact unchanged module diff. Resolve every valid finding with a scoped
   TDD correction and restart clean generations.
4. If every result is clean, move the card to `60-done`, record only local
   evidence, commit root acceptance, push, and verify remote `main`.
