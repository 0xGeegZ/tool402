# S34 Public Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish truthful, static RiskScan and Provider documentation that is reachable from the current local navigation and footer.

**Architecture:** Three server-rendered App Router pages compose focused static documentation components with existing Tool402 primitives and footer. The guides describe the current descriptor, UI routes, provider wizard, and boundaries; they do not fetch data or duplicate runtime behavior.

**Tech Stack:** Next.js App Router, React server components, Tailwind CSS, Node test runner.

**Spec:** `docs/specs/s34-public-documentation.md`

## Global Constraints

- Use only existing local route targets and existing Tool402 UI primitives.
- Add no dependency, global CSS, asset, client component, fetch, form, state, storage, or external URL.
- Never expose configuration values or claim a payment, settlement, campaign, ATS asset, funding, payout, or return; the two current wizard labels containing Pricing, Funding, and revenue-note are labels only, never economic facts.
- Preserve visible focus, reduced-motion compatibility, semantic heading order, and 1440px/390px no-overflow behavior.

---

### Task 1: Establish the documentation contract

**Files:**
- Create: `apps/web/tests/public-documentation.test.mjs`
- Modify: `apps/web/tests/landing-explore.test.mjs`
- Modify: `apps/web/tests/product-landing.test.mjs`
- Modify: `apps/web/tests/workspace-shell.test.mjs`
- Modify: `apps/web/tests/guided-demo-route.test.mjs`

**Interfaces:**
- Consumes: UI-S34 local targets and the existing `Link`, `PageHeader`, `Card`, `Badge`, and `LandingFooter` presentation contracts.
- Produces: A static source contract for the documentation routes and their two shared-shell links.

- [ ] **Step 1: Write the failing documentation-route assertions**

```js
const docs = await readAppFile("src/app/docs/page.tsx")
assert.match(docs, /<DocumentationHome\s*\/>/)
await assert.rejects(readAppFile("src/app/docs/providers/page.tsx"))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@tool402/web -- tests/public-documentation.test.mjs`

Expected: FAIL because the route and components do not exist.

- [ ] **Step 3: Add the static boundary assertions**

```js
assert.doesNotMatch(source, /["']use client["']|\bfetch\s*\(|https?:\/\//i)
assert.doesNotMatch(source, /funding raised|paid tasks|usage revenue|payout|return/i)
```

- [ ] **Step 4: Commit the test-only RED**

```bash
git add apps/web/tests/public-documentation.test.mjs apps/web/tests/landing-explore.test.mjs apps/web/tests/product-landing.test.mjs apps/web/tests/workspace-shell.test.mjs apps/web/tests/guided-demo-route.test.mjs
git commit -m "test: define public documentation contract"
```

### Task 2: Add the documentation entry point and RiskScan guide

**Files:**
- Create: `apps/web/src/app/docs/page.tsx`
- Create: `apps/web/src/app/docs/riskscan/page.tsx`
- Create: `apps/web/src/components/docs/documentation-home.tsx`
- Create: `apps/web/src/components/docs/riskscan-guide.tsx`
- Test: `apps/web/tests/public-documentation.test.mjs`

**Interfaces:**
- Consumes: existing `PageHeader`, `Card`, `Badge`, `Link`, and `LandingFooter` components.
- Produces: `/docs` and `/docs/riskscan`, each with one H1 and only local route links.

- [ ] **Step 1: Create the two route files**

```tsx
export default function DocsPage() {
  return <><main><DocumentationHome /></main><LandingFooter /></>
}
```

- [ ] **Step 2: Render the factual RiskScan guide**

```tsx
<h2 id="request-shape">Request shape</h2>
<code>POST /api/riskscan</code>
<p>The required declarations object is caller-supplied. Configuration is host-specific; an unavailable response is not a payment result.</p>
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm run test --workspace=@tool402/web -- tests/public-documentation.test.mjs`

Expected: PASS with the local docs/risk guide route, local links, field names, and no-runtime boundary confirmed.

- [ ] **Step 4: Commit the entry point and RiskScan guide**

```bash
git add apps/web/src/app/docs apps/web/src/components/docs/documentation-home.tsx apps/web/src/components/docs/riskscan-guide.tsx apps/web/tests/public-documentation.test.mjs
git commit -m "docs: add RiskScan documentation"
```

### Task 3: Add the Provider RiskScan guide and shared links

**Files:**
- Create: `apps/web/src/app/docs/providers/page.tsx`
- Create: `apps/web/src/components/docs/provider-riskscan-guide.tsx`
- Modify: `apps/web/src/components/discovery/local-navigation.tsx`
- Modify: `apps/web/src/components/landing/landing-footer.tsx`
- Modify: `apps/web/tests/landing-explore.test.mjs`
- Modify: `apps/web/tests/product-landing.test.mjs`
- Modify: `apps/web/tests/workspace-shell.test.mjs`
- Modify: `apps/web/tests/guided-demo-route.test.mjs`
- Test: `apps/web/tests/public-documentation.test.mjs`

**Interfaces:**
- Consumes: the existing provider route targets `/provider` and `/provider/deploy`, plus the five fixed provider wizard labels.
- Produces: `/docs/providers`, a `Docs` header link to `/docs`, and a footer link to `/docs/providers`.

- [ ] **Step 1: Render the static Provider guide**

```tsx
<h2 id="provider-workflow">Provider workflow</h2>
<p>The first four wizard steps contain the documented local editable fields; Review and sign is a non-editable review/sign surface. A review or signature is not an ATS deployment.</p>
<h2 id="ats-boundary">ATS boundary</h2>
<p>The current revenue-note control is conditionally gated and does not create an asset by itself.</p>
```

- [ ] **Step 2: Add the two declared local links**

```tsx
{ href: "/docs", label: "Docs" }
<Link href="/docs/providers">Provider documentation</Link>
```

- [ ] **Step 3: Run focused tests to verify they pass**

Run: `node --test apps/web/tests/public-documentation.test.mjs apps/web/tests/landing-explore.test.mjs apps/web/tests/product-landing.test.mjs apps/web/tests/workspace-shell.test.mjs apps/web/tests/guided-demo-route.test.mjs`

Expected: PASS with exactly the two new local links and no source/runtime boundary regression.

- [ ] **Step 4: Commit the Provider guide and navigation**

```bash
git add apps/web/src/app/docs/providers apps/web/src/components/docs/provider-riskscan-guide.tsx apps/web/src/components/discovery/local-navigation.tsx apps/web/src/components/landing/landing-footer.tsx apps/web/tests/public-documentation.test.mjs apps/web/tests/landing-explore.test.mjs apps/web/tests/product-landing.test.mjs apps/web/tests/workspace-shell.test.mjs apps/web/tests/guided-demo-route.test.mjs
git commit -m "docs: add provider guide navigation"
```

### Task 4: Verify the presentation and finish the slice

**Files:**
- Verify: `apps/web/src/app/docs/**`
- Verify: `apps/web/src/components/docs/**`
- Verify: `apps/web/tests/public-documentation.test.mjs`

**Interfaces:**
- Consumes: completed static documentation routes and existing shell primitives.
- Produces: browser evidence and review-ready S34 documentation source.

- [ ] **Step 1: Run focused and workspace validation**

Run: `node --test apps/web/tests/public-documentation.test.mjs apps/web/tests/landing-explore.test.mjs apps/web/tests/product-landing.test.mjs apps/web/tests/workspace-shell.test.mjs apps/web/tests/guided-demo-route.test.mjs && npm run typecheck --workspace=@tool402/web && npm run lint && npm run queue:check && git diff --check`

Expected: PASS with no whitespace errors.

- [ ] **Step 2: Capture desktop and mobile routes**

Run: use the local browser at `/docs`, `/docs/riskscan`, and `/docs/providers` at 1440px and 390px.

Expected: one H1 per route, no horizontal overflow, readable in-page anchors, and visible keyboard focus.

- [ ] **Step 3: Request independent task and module review**

Expected: review confirms that the diff remains within UI-S34, every link is local, and no forbidden runtime or capability claim is introduced.

- [ ] **Step 4: Commit the accepted documentation slice**

```bash
git add docs/work-queue docs/ui docs/specs docs/superpowers/plans
git commit -m "docs: record public documentation acceptance"
```
