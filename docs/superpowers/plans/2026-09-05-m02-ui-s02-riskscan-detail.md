# UI-S02 RiskScan Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a truthful, server-rendered RiskScan detail route that exposes only the accepted local capability and API boundaries.

**Architecture:** Compose a new `/explore/riskscan` route from small presentational detail components and existing Card/Badge primitives. The page reads no runtime configuration and makes no request; the existing Explore card receives a local detail link only after the route is present.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, Tailwind CSS 4.3.3, Node test runner.

**Spec:** [UI-S02 RiskScan detail manifest](../../ui/UI-S02.md)

## Global Constraints

- Preserve Cache Components and the accepted local UI-S00 tokens/primitives.
- Describe only accepted RiskScan Quick and API behavior in conditional, non-live terms.
- Do not add a form, submit action, client fetch, price, wallet, payment state, provider, account, metric, receipt, evidence, external link, mock result, analytics, hosted font, credential, or dependency.
- Keep all route and component rendering server-side; UI-S03 owns any future request and paid-state interaction.
- Use TDD for structural/truthfulness expectations and browser-check desktop and narrow viewports.

## File Structure

- `apps/web/src/app/explore/riskscan/page.tsx`: one main landmark that composes the detail page.
- `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`: capability, input, result, and configuration-boundary presentation.
- `apps/web/src/components/discovery/riskscan-discovery-card.tsx`: labeled local link into the committed detail route.
- `apps/web/tests/riskscan-detail.test.mjs`: static route, accessibility, local-navigation, and truthfulness expectations.
- `apps/web/tests/landing-explore.test.mjs`: amend the former no-detail-link expectation so it permits only the committed local detail link.

## Tasks

### Task 1: Lock the detail boundary with failing static expectations

**Files:**
- Create: `apps/web/tests/riskscan-detail.test.mjs`
- Modify: `apps/web/tests/landing-explore.test.mjs`

**Interfaces:**
- Consumes: existing `readAppFile` test helper pattern and accepted local route `/explore`.
- Produces: assertions for `RiskScanDetailPage`, `RiskScanDetail`, and the only permitted detail href `/explore/riskscan`.

- [ ] **Step 1: Write the failing detail-route test**

```js
const [page, detail, discoveryCard] = await Promise.all([
  readAppFile("src/app/explore/riskscan/page.tsx"),
  readAppFile("src/components/riskscan/detail/riskscan-detail.tsx"),
  readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
]);
const sources = [page, detail, discoveryCard].join("\n");
const requiredLimitation =
  "Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.";
const sourcesWithoutRequiredLimitation = [page, detail.replace(requiredLimitation, ""), discoveryCard].join("\n");

assert.equal((page.match(/<main\b/g) ?? []).length, 1);
assert.equal((detail.match(/<h1\b/g) ?? []).length, 1);
assert.match(page, /<RiskScanDetail\s*\/>/);

for (const input of ["requestRef", "subjectRef", "context", "identity", "pricing", "limitations", "evidence"]) {
  assert.match(detail, new RegExp(`\\b${input}\\b`));
}
for (const disposition of ["needs_disclosure", "disclosures_reported"]) {
  assert.match(detail, new RegExp(`\\b${disposition}\\b`));
}

assert.match(detail, /Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record\./);
assert.match(detail, /The endpoint remains unavailable until its host supplies valid supported configuration\./);
assert.match(detail, /href=["']\/explore["']/);
assert.match(discoveryCard, /href=["']\/explore\/riskscan["']/);

const hrefs = [...sources.matchAll(/href=["']([^"']+)["']/g)].map(([, href]) => href);
assert.deepEqual(hrefs, ["/explore", "/explore/riskscan"]);
assert.doesNotMatch(sources, /<(?:form|button|input|select|textarea)\b/i);
assert.doesNotMatch(sources, /\bon[A-Z][A-Za-z]+\s*=|\baction\s*=/);
assert.doesNotMatch(sources, /["']use client["']|fetch\(|process\.env\b/i);
assert.doesNotMatch(sources, /https?:\/\/|mailto:|target=/i);
assert.doesNotMatch(sources, /\$\d|\b(?:price|cost|fee|amount)\b|\b(?:USD|USDC|EUR|ETH)\s*\d|\b\d+(?:\.\d+)?\s*(?:USD|USDC|EUR|ETH)\b/iu);
assert.doesNotMatch(sources, /\b(?:request will be accepted|request accepted|guaranteed acceptance|submit request)\b/i);
assert.doesNotMatch(
  sources,
  /\b(?:pay now|wallet connected|payment complete|receipt available|evidence (?:available|recorded|verified)|provider configured|account connected|metric available|mock(?:ed)?|fixture|sample result|available now|live)\b/i,
);
assert.doesNotMatch(sourcesWithoutRequiredLimitation, /\b(?:wallet|payment|provider|account|metric|receipt)\b/i);
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test --workspace @tool402/web -- tests/riskscan-detail.test.mjs`

Expected: FAIL because the detail route and component do not exist.

- [ ] **Step 3: Amend the Explore test for the sole local detail link**

Keep the current no-interaction assertion, but permit one `next/link` with the exact href `/explore/riskscan`; reject every other new Explore-card href. The detail test above independently proves that the back link and discovery link are the only hrefs across this slice.

- [ ] **Step 4: Run the focused tests to verify they remain RED**

Run: `npm run test --workspace @tool402/web -- tests/riskscan-detail.test.mjs tests/landing-explore.test.mjs`

Expected: FAIL because the detail route, component, and permitted Explore-card link do not yet exist.

### Task 2: Implement the minimal server-rendered detail surface

**Files:**
- Create: `apps/web/src/app/explore/riskscan/page.tsx`
- Create: `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`
- Modify: `apps/web/src/components/discovery/riskscan-discovery-card.tsx`
- Modify: `apps/web/tests/landing-explore.test.mjs`
- Test: `apps/web/tests/riskscan-detail.test.mjs`

**Interfaces:**
- Consumes: `Card`, `Badge`, `Link`, and the accepted RiskScan Quick/API contracts.
- Produces: `RiskScanDetail()` as a server-rendered component and a local `/explore/riskscan` page route.

- [ ] **Step 1: Add the page composition with exactly one main landmark**

```tsx
import { RiskScanDetail } from "../../../components/riskscan/detail/riskscan-detail";

export default function RiskScanDetailPage() {
  return (
    <main className="py-6 sm:py-12">
      <RiskScanDetail />
    </main>
  );
}
```

- [ ] **Step 2: Implement the presentational detail component**

```tsx
export function RiskScanDetail() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/explore">Back to Explore</Link>
      <header><h1>RiskScan</h1></header>
      <section aria-labelledby="riskscan-inputs">...</section>
      <section aria-labelledby="riskscan-results">...</section>
      <section aria-labelledby="riskscan-availability">...</section>
    </article>
  );
}
```

Use semantic lists for the accepted input fields and result dispositions. Render `requestRef`, `subjectRef`, `context`, `identity`, `pricing`, `limitations`, and `evidence`; render `needs_disclosure` and `disclosures_reported`; and retain this non-certifying limitation exactly: `Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.` The availability section must state exactly `The endpoint remains unavailable until its host supplies valid supported configuration.` It must not render configuration values, a price, a payment state, or an action.

- [ ] **Step 3: Add the single local detail link from the discovery card**

```tsx
<Link href="/explore/riskscan" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
  View RiskScan details
</Link>
```

Amend the UI-S01 static test so it continues to reject every unrelated route while allowing this exact committed detail link.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npm run test --workspace @tool402/web -- tests/riskscan-detail.test.mjs tests/landing-explore.test.mjs`

Expected: PASS with the sole added navigation target `/explore/riskscan` and no interactive/request/payment surface.

- [ ] **Step 5: Run full web validation and browser checks**

Run: `npm run typecheck --workspace @tool402/web`

Run: `npm run test --workspace @tool402/web`

Run: `cd apps/web && npx --no-install next build --webpack`

Verify at desktop and narrow widths that the heading, lists, cards, and back link remain readable without horizontal overflow.

- [ ] **Step 6: Commit the accepted UI-S02 implementation**

```bash
git add apps/web/src/app/explore/riskscan/page.tsx apps/web/src/components/riskscan/detail/riskscan-detail.tsx apps/web/src/components/discovery/riskscan-discovery-card.tsx apps/web/tests/riskscan-detail.test.mjs apps/web/tests/landing-explore.test.mjs
git commit -m "feat: Add RiskScan Detail Surface"
```

## Plan Self-Review

- Spec coverage: Task 1 locks every declared input, result, limitation, configuration, navigation, interaction, runtime, external-link, price, acceptance-claim, and false-state boundary; Task 2 supplies the server-rendered route, local detail component, navigation, tests, validation, and browser checks.
- Placeholder scan: no placeholder action or unspecified file remains; the rendered content is bounded by the manifest's concrete capability, input, result, and configuration sections.
- Type consistency: the plan exports `RiskScanDetail`, imports it from the route, and uses only existing UI primitives and `next/link`.
