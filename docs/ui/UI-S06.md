# UI-S06 public product landing manifest

## Delivery boundary

UI-S06 turns the existing root route into a fuller static public landing. It
uses only committed local tokens, primitives, logo, and mascot artwork. It
adds a clear hero, a three-step `how-it-works` section, a concise RiskScan
introduction, and local-navigation CTAs to existing pages.

## Local targets

The slice may amend `apps/web/src/app/page.tsx` and
`apps/web/src/components/landing/landing-hero.tsx`, add components under
`apps/web/src/components/landing/`, and add focused landing tests. It does
not amend the accepted landing/Explore test.

## Truthfulness and authority boundary

UI-S06 renders no data adapter, client request, authentication, account,
wallet, provider, balance, price, payment state, settlement, result, receipt,
evidence, metric, testimonial, partner, external link, deployment, or live
claim. Its CTAs only navigate to committed local routes. It does not change
the global layout/navigation or any existing RiskScan interaction.

## Acceptance evidence

- Focused source contracts cover semantic landmarks, accessible local CTAs,
  required explanatory content, decorative-image treatment, and the exclusion
  boundary.
- Desktop and narrow browser checks cover hierarchy, local navigation,
  keyboard focus, and overflow.
- Web/root quality, build, queue, guard, independent review, and two clean
  module-review generations pass before acceptance.
