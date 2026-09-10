# S22-T010 source-to-current comparison

## Comparison boundary

The selected local landing visual slice is represented only by the existing
`PREP-UI-001` alias. This record selects a narrow translation into the current
public root route; it neither imports a source tree nor changes any product
behavior.

## Compatible visual direction

- A clear illustrated two-column hero with an orientation-first headline and
  local navigation actions.
- A concise three-step explanatory composition.
- A static first-tool orientation section for the current RiskScan surface.
- A trust/disclaimer treatment that is explicit about current local scope.
- A fuller landing-only footer and the existing responsive rhythm.

## Current CTA map

| Landing action | Current local target |
|---|---|
| Explore tools | `/explore` |
| Inspect RiskScan | `/explore/riskscan` |
| Try RiskScan | `/explore/riskscan/try` |
| Guided demo | `/demo` |

## Candidate implementation scope

The independent readiness review may assess only:

- `apps/web/src/app/page.tsx`;
- `apps/web/src/components/landing/landing-hero.tsx`;
- `apps/web/src/components/landing/landing-sections.tsx`;
- `apps/web/src/components/landing/landing-footer.tsx`;
- `apps/web/tests/product-landing.test.mjs`;
- `apps/web/tests/landing-explore.test.mjs`;
- `apps/web/tests/public-landing-reconciliation.test.mjs`; and
- at most `apps/web/public/brand/hero-trio.png` and
  `apps/web/public/brand/mascot-coin-stack.png`.

Global layout, navigation, CSS, backend/API, provider/ATS, configuration,
packages, README, and submission documentation are excluded.

## Omitted material

The landing may not retain or introduce mock multi-tool catalog data, activity
or financial figures, funding/backer/revenue/payout claims, payment badges,
evidence links, unavailable routes, publishing or account CTAs, wallet or
provider states, transaction states, testimonials, hosted fonts, or a blanket
integration claim.

## Result

The candidate scope is disjoint from the active M46 and M47 lanes. It is ready
for independent S22 readiness review; source work remains prohibited until a
separate activation accepts a focused RED contract.
