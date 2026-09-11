# S35 Public Documentation Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a truthful static API reference, FAQ, Docs-home links, and Docs footer column.

**Architecture:** Two server-rendered App Router pages compose new static Docs components with existing primitives. The Docs home and existing footer expose the new local routes; no HTTP request or client behavior is introduced.

**Tech Stack:** Next.js App Router, React server components, Tailwind CSS, Node test runner.

**Spec:** `docs/specs/s35-public-documentation-expansion.md`

## Global Constraints

- Use only existing UI primitives and local route links.
- Add no dependency, global CSS, asset, client component, fetch, form, storage, API client, or MCP behavior.
- Do not disclose configuration/price values or claim payment, settlement, campaign, asset, funding, payout, return, deployment, or live availability.
- Preserve semantic headings, visible focus, and 1440px/390px no-overflow layout.

---

### Task 1: Establish the extended documentation RED contract

**Files:**
- Create: `apps/web/tests/documentation-expansion.test.mjs`
- Modify: `apps/web/tests/public-documentation.test.mjs`

**Interfaces:**
- Consumes: UI-S35 route map and the accepted static Docs contracts.
- Produces: Executable proof that `/docs/api`, `/docs/faq`, their components,
  home links, and the Docs footer group are initially absent.

- [ ] **Step 1: Write the failing route and footer assertions**

```js
assert.equal(await fileExists("src/app/docs/api/page.tsx"), true)
assert.match(footer, /<p className="text-sm font-semibold">Docs<\/p>/)
```

- [ ] **Step 2: Run the contract and observe RED**

Run: `node --test apps/web/tests/documentation-expansion.test.mjs`

Expected: FAIL only because the two routes/components, Docs-home cards, and
footer Docs group are absent.

- [ ] **Step 3: Freeze the static/truth boundary in the existing Docs test**

```js
assert.doesNotMatch(docs, /\b(?:MCP|fetch\s*\(|use client|https?:\/\/|payment success)\b/i)
```

- [ ] **Step 4: Commit durable RED**

```bash
git add apps/web/tests/documentation-expansion.test.mjs apps/web/tests/public-documentation.test.mjs
git commit -m "test: define expanded documentation contract"
```

### Task 2: Add the static API reference and FAQ

**Files:**
- Create: `apps/web/src/app/docs/api/page.tsx`
- Create: `apps/web/src/app/docs/faq/page.tsx`
- Create: `apps/web/src/components/docs/api-reference.tsx`
- Create: `apps/web/src/components/docs/documentation-faq.tsx`
- Test: `apps/web/tests/documentation-expansion.test.mjs`

**Interfaces:**
- Consumes: `PageHeader`, `Badge`, `Card`, `Link`, and `LandingFooter`.
- Produces: Two server-rendered static routes that explain current API and
  product boundaries without exposing or executing them.

- [ ] **Step 1: Compose both route files with one main landmark**

```tsx
export default function ApiDocumentationPage() {
  return <><main><ApiReference /></main><LandingFooter /></>
}
```

- [ ] **Step 2: Render the two endpoint facts and FAQ boundaries**

```tsx
<code>GET /api/tools</code>
<code>POST /api/riskscan</code>
<p>A 402 boundary is not proof of a completed payment.</p>
```

- [ ] **Step 3: Run the focused contract and observe GREEN**

Run: `node --test apps/web/tests/documentation-expansion.test.mjs`

Expected: PASS with routes, endpoint fields, testnet boundaries, and no MCP or
runtime surface.

- [ ] **Step 4: Commit the two Docs pages**

```bash
git add apps/web/src/app/docs/api apps/web/src/app/docs/faq apps/web/src/components/docs/api-reference.tsx apps/web/src/components/docs/documentation-faq.tsx apps/web/tests/documentation-expansion.test.mjs
git commit -m "docs: add API reference and FAQ"
```

### Task 3: Link the new real pages from Docs home and footer

**Files:**
- Modify: `apps/web/src/components/docs/documentation-home.tsx`
- Modify: `apps/web/src/components/landing/landing-footer.tsx`
- Modify: `apps/web/tests/documentation-expansion.test.mjs`
- Modify: `apps/web/tests/public-documentation.test.mjs`

`apps/web/tests/product-landing.test.mjs` is a later candidate only if the
complete Web suite proves that its exhaustive footer map cannot recognize the
three real Docs routes. A fresh independent scope review must authorize the
exact assertion correction before that test changes.

**Interfaces:**
- Consumes: `/docs`, `/docs/api`, and `/docs/faq` as committed local routes.
- Produces: Two Docs-home cards and a three-link Docs footer navigation group.

- [ ] **Step 1: Add cards for the two committed routes**

```tsx
{ href: "/docs/api", title: "API reference", action: "Read the API reference" }
{ href: "/docs/faq", title: "FAQ", action: "Read the FAQ" }
```

- [ ] **Step 2: Add only real Docs footer links**

```tsx
<nav aria-label="Documentation links">
  <Link href="/docs">Documentation</Link>
  <Link href="/docs/api">API reference</Link>
  <Link href="/docs/faq">FAQ</Link>
</nav>
```

- [ ] **Step 3: Run focused tests and observe GREEN**

Run: `node --test apps/web/tests/documentation-expansion.test.mjs apps/web/tests/public-documentation.test.mjs`

Expected: PASS with each footer destination resolvable and every Docs source
static/local.

- [ ] **Step 4: Commit the navigation integration**

```bash
git add apps/web/src/components/docs/documentation-home.tsx apps/web/src/components/landing/landing-footer.tsx apps/web/tests/documentation-expansion.test.mjs apps/web/tests/public-documentation.test.mjs
git commit -m "docs: link public documentation"
```

### Task 4: Verify and accept the documentation extension

**Files:**
- Verify: `apps/web/src/app/docs/**`
- Verify: `apps/web/src/components/docs/**`
- Verify: `apps/web/src/components/landing/landing-footer.tsx`
- Verify: `apps/web/tests/documentation-expansion.test.mjs`

**Interfaces:**
- Consumes: Completed static documentation and footer route map.
- Produces: Review-ready S35 evidence.

- [ ] **Step 1: Run focused and Web validation**

Run: `node --test apps/web/tests/documentation-expansion.test.mjs apps/web/tests/public-documentation.test.mjs && npm run typecheck --workspace=@tool402/web && npm run test --workspace=@tool402/web && npm run lint && npm run queue:check && git diff --check`

Expected: PASS with no whitespace errors.

- [ ] **Step 2: Capture local desktop and mobile evidence**

Run: inspect `/docs`, `/docs/api`, and `/docs/faq` at 1440px and 390px.

Expected: Docs cards and footer group render without horizontal overflow; focus
is visible and route text wraps intentionally.

- [ ] **Step 3: Request independent task and module review**

Expected: Review confirms exact UI-S35 scope, truthful copy, static sources,
and local-only links.

- [ ] **Step 4: Commit acceptance evidence**

```bash
git add docs/work-queue docs/ui docs/specs docs/superpowers/plans
git commit -m "docs: accept public documentation expansion"
```
