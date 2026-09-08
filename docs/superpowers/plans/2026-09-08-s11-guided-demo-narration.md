# Guided Demo Narration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static `/demo` route that lets a presenter open the nine
accepted local product screens in a truthful order.

**Architecture:** A server page owns the single landmark and route heading. A
server presentational component owns one fixed array of nine route-map cards.
The existing local navigation receives one exact `/demo` entry so the route is
reachable without changing any other navigation behavior.

**Tech Stack:** Next.js App Router, React server components, TypeScript,
existing local `Card`, `Badge`, and Next `Link` primitives, and Node's built-in
test runner.

**Spec:** `docs/ui/UI-S11.md`

## Global Constraints

- Touch only `apps/web/src/app/demo/page.tsx`,
  `apps/web/src/components/demo/guided-demo-steps.tsx`,
  `apps/web/tests/guided-demo-route.test.mjs`, and the explicitly reserved
  `/demo` navigation/assertion set.
- The route is server-rendered and contains exactly one `main` and one `h1`.
- The nine ordered hrefs and their copy are exactly the UI-S11 table values.
- Every link is a local Next `Link`; no external link, client directive,
  fetch, timer, storage, environment read, analytics, provider, payment, or
  transaction behavior is permitted.
- Do not claim live availability, a performed action, a result, payment,
  receipt, evidence, deployment, Sign/session, funding, offering, allocation,
  clearing, snapshot, payout, or ATS capability.
- Preserve existing local navigation entries exactly; add only
  `{ href: "/demo", label: "Demo" }`.
- No dependency, package, stylesheet, layout, route-business, configuration,
  identity, payment, deployment, or submission change is allowed.

---

### Task 1: Durable guided-demo RED contract

**Files:**

- Create: `apps/web/tests/guided-demo-route.test.mjs`
- Test: `apps/web/tests/guided-demo-route.test.mjs`

**Interfaces:**

- Consumes: the exact nine rows in `docs/ui/UI-S11.md`.
- Produces: a source contract that later reads the new page/component and the
  existing local-navigation source without invoking runtime behavior.

- [ ] **Step 1: Write the failing source-contract test**

    const finalPaths = [
      "src/app/demo/page.tsx",
      "src/components/demo/guided-demo-steps.tsx",
    ];

    test("requires the exact guided-demo source before GREEN", async () => {
      assert.deepEqual(await Promise.all(finalPaths.map(fileExists)), [true, true]);
    });

Add GREEN-only assertions after the source-presence check for the exact ordered
hrefs `/`, `/explore`, `/explore/riskscan`, `/explore/riskscan/try`,
`/explore/riskscan/tool-loop`, `/dashboard`, `/dashboard/riskscan`,
`/dashboard/riskscan/compatibility`, and `/dashboard/riskscan/preflight`.
They must also require one `main`, one `h1`, the exact nine title/observation
strings from UI-S11, a named `GuidedDemoSteps` import, the exact `/demo`
navigation object, and no forbidden runtime or copy terms.

- [ ] **Step 2: Run the test to verify RED**

    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
      node --test apps/web/tests/guided-demo-route.test.mjs

Expected: one failure reporting the two missing final source paths; GREEN-only
assertions skip while both paths are absent.

- [ ] **Step 3: Commit the RED contract only**

    git add apps/web/tests/guided-demo-route.test.mjs
    git commit -m "test: Add Guided Demo Route Contract"

### Task 2: Static route map and one navigation entry

**Files:**

- Create: `apps/web/src/app/demo/page.tsx`
- Create: `apps/web/src/components/demo/guided-demo-steps.tsx`
- Modify: `apps/web/src/components/discovery/local-navigation.tsx`
- Modify: `apps/web/tests/landing-explore.test.mjs`
- Modify: `apps/web/tests/workspace-shell.test.mjs`
- Test: `apps/web/tests/guided-demo-route.test.mjs`
- Test: `apps/web/tests/landing-explore.test.mjs`
- Test: `apps/web/tests/workspace-shell.test.mjs`

**Interfaces:**

- Consumes: the Task 1 contract and the exact UI-S11 route/copy table.
- Produces: a static `/demo` route and one global local-navigation entry.

- [ ] **Step 1: Implement the page and fixed step component**

    <main className="py-6 sm:py-12">
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="max-w-2xl space-y-3">
          <Badge variant="secondary">Guided demo</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Take the guided tour</h1>
          <p className="text-lg leading-8 text-muted-foreground">Open the local product screens in a clear demonstration order.</p>
        </header>
        <GuidedDemoSteps />
      </article>
    </main>

`GuidedDemoSteps` contains one fixed `as const` nine-row array matching the
UI-S11 table exactly. It renders an ordered list of existing `Card` elements;
each item has one title, one expected-observation paragraph, and one semantic
local `Link` to its row's `href`. It receives no props and has no client
directive or runtime call.

- [ ] **Step 2: Add only the reserved local navigation entry**

    { href: "/demo", label: "Demo" },

Insert it after the existing Workspace entry. Update only the existing
navigation assertions so their exact allowed href set becomes `/`, `/explore`,
`/dashboard`, and `/demo`.

- [ ] **Step 3: Run focused GREEN verification**

    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
      node --test apps/web/tests/guided-demo-route.test.mjs apps/web/tests/landing-explore.test.mjs apps/web/tests/workspace-shell.test.mjs

Expected: all focused tests pass and no unrelated source path changes.

- [ ] **Step 4: Commit the static route implementation**

    git add apps/web/src/app/demo/page.tsx \
      apps/web/src/components/demo/guided-demo-steps.tsx \
      apps/web/src/components/discovery/local-navigation.tsx \
      apps/web/tests/guided-demo-route.test.mjs \
      apps/web/tests/landing-explore.test.mjs \
      apps/web/tests/workspace-shell.test.mjs
    git commit -m "feat: Add Guided Demo Route"

### Task 3: Complete verification and independent review

**Files:**

- Test: `apps/web/tests/guided-demo-route.test.mjs`
- Test: `apps/web/tests/landing-explore.test.mjs`

**Interfaces:**

- Consumes: the committed static route and navigation entry.
- Produces: acceptance evidence only; no new product source.

- [ ] **Step 1: Run Web and root verification**

    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build --workspace @tool402/web
    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck
    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test
    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
    PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run queue:check
    git diff --check

- [ ] **Step 2: Verify the route in a browser**

At desktop and narrow viewports, open `/demo`; verify the exact nine local
links, visible keyboard focus, reduced-motion respect, no horizontal overflow,
and no framework or browser diagnostics. Open one target link and return using
the local navigation. Record only that static local navigation rendered; do
not claim any narrated product action occurred.

- [ ] **Step 3: Obtain independent task and module reviews, then accept**

Record the exact commit, focused/full validation, browser observations, and
review verdicts. Move S11 only after the reviewers find no Critical finding.

## Self-review

- UI-S11's route, copy, static-server, and exclusion requirements map to Tasks
  1 and 2; its validation requirements map to Task 3.
- The only accepted-source overlap is named in Task 2 and has a corresponding
  focused assertion amendment.
- No placeholder, dynamic route, provider, payment, or human narration action
  appears in this plan.
