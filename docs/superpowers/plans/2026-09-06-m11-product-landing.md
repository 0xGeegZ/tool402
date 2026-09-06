# M11 Public Product Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Deliver a readable, truthful Tool402 public landing with clear local
routes and a how-it-works explanation.

**Architecture:** The root route remains a server component. A focused landing
component subtree composes existing primitives and committed mascot imagery.
All CTAs are `next/link` navigation to existing local routes; no client data
or external behavior is introduced.

**Tech Stack:** Next.js 16.3.4 with Cache Components, React 19.2.8,
TypeScript 5.9.3, Tailwind CSS 4.3.3, and the built-in Node test runner.

**Spec:** `docs/specs/m11-product-landing.md`

## Global Constraints

- Work in the current repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Preserve `cacheComponents: true`; add no dependency, client fetch, runtime
  configuration, remote resource, or request-time server read.
- Touch only root-page/landing paths and focused landing tests; do not modify
  layout, navigation, Explore, RiskScan, API, Agent, core, or backend paths.
- Use only existing local routes for CTAs and make no claim about payment,
  availability, account/session, provider, result, metric, evidence, or live
  deployment.

---

### Task 1: Static public landing

**Files:**

- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/landing/landing-hero.tsx`
- Create: `apps/web/src/components/landing/landing-sections.tsx`
- Create: `apps/web/src/components/landing/landing-footer.tsx`
- Create: `apps/web/tests/product-landing.test.mjs`
- Modify: `apps/web/tests/landing-explore.test.mjs`

**Interfaces:**

- Consumes: existing `Badge`, `Button`, `Card`, `Logo`, local mascot image,
  and Next `Link`.
- Produces: one static root landing with a single heading, `how-it-works`
  section, and exact local CTA targets.

- [ ] **Step 1: Write the failing landing contract**

  Add `apps/web/tests/product-landing.test.mjs`. Read the root page and landing
  source files. Assert one `main`/`h1`, Tool402 and RiskScan copy,
  `id="how-it-works"`, and exactly `/explore`, `/explore/riskscan`, and
  `/explore/riskscan/try` CTA hrefs. Assert that the landing subtree is not a
  client component and excludes fetch, API route strings, wallet, account,
  provider, price, payment, result, metric, testimonial, external URL, and
  live-claim copy. Narrow the old UI-S01 test so it continues to protect only
  its static Explore sources.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/product-landing.test.mjs apps/web/tests/landing-explore.test.mjs
  ```

  Expected: FAIL because the required landing sections and focused test source
  do not exist.

- [ ] **Step 3: Implement the smallest complete landing**

  Keep the root route server-rendered. Compose a warm hero, three explanatory
  steps, bounded RiskScan introduction, local CTA group, and small footer from
  existing primitives and the committed mascot. Use semantic headings and
  ordinary `Link` elements; do not change global navigation or any non-owned
  route.

- [ ] **Step 4: Turn the contract GREEN and verify the browser**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/product-landing.test.mjs apps/web/tests/landing-explore.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build --workspace=@tool402/web -- --webpack
  ```

  Use the Next development loop at `/` on desktop and 390px widths. Confirm
  each CTA reaches its local route, keyboard focus is visible, there is no
  horizontal overflow, and framework/browser diagnostics are clear.

- [ ] **Step 5: Commit the implementation**

  Inspect only owned paths, run the enabled guard and whitespace check, then
  commit:

  ```text
  feat: Add Product Landing
  ```

## Root-owned integration after Task 1

1. Obtain independent task review, resolve valid findings with TDD and scoped
   re-review, then run root clean-install/typecheck/test/lint and the Webpack
   build.
2. Run queue/reference/whitespace checks and the enabled guard. Re-run the
   Next development loop after any correction.
3. If clean, accept the card, commit root evidence, push, and verify remote
   `main`.
