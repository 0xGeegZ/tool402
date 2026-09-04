# UI-S00 local shell and token manifest

## Delivery boundary

UI-S00 adapts only a locally verified visual token, primitive, and logo slice. The source material remains outside the repository in an ignored quarantine area; neither its archive nor a bulk extracted tree is committed. This manifest records the local target boundary without storing source identifiers, URLs, or clone information.

## Selected local targets

The slice may add a global stylesheet, a local class-composition helper, presentational Button/Card/Badge primitives, and a logo component with the selected local logo assets. It may update the root layout only to load the stylesheet and provide a truthful application frame.

The visual system uses the selected warm-surface, purple, green, coral, yellow, border, radius, focus, and typography token patterns. It uses Tailwind CSS 4.3.3 with the Tailwind PostCSS adapter 4.3.3, plus `clsx` 2.1.1 and `tailwind-merge` 3.6.0 for local class composition. No component-runtime library, animation library, analytics package, hosted font, theme provider, toast system, charting package, or UI CLI belongs to this slice.

## Truthfulness boundary

UI-S00 must not render tool listings, price, balances, payment state, provider/backer data, metrics, evidence, authentication, onboarding, external links, or a CTA that implies an unavailable action. It must not add a detail route, payment route, mock adapter, mock data, external request, credential, or provider integration.

## Acceptance evidence

- The stylesheet loads from the root layout and preserves the existing Next Cache Components setting.
- Button, Card, Badge, and Logo have focused structural tests and accessible labels where applicable.
- The static shell remains truthful at desktop and narrow viewport widths.
- Web typecheck, test, production build, local-reference guard, and browser diagnostics pass.

UI-S01 may compose this shell into landing and Explore surfaces. RiskScan detail and paid-state UI remain blocked until their typed domain states exist.
