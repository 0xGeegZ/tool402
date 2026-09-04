# UI-S01 landing and Explore manifest

## Delivery boundary

UI-S01 composes the accepted local shell and primitives into two static discovery surfaces: the landing route and `/explore`. It adapts a selected local visual pattern for a compact navigation, a warm hero composition, a decorative mascot asset, and a single read-only RiskScan discovery card. It does not copy a full route tree, mock data layer, adapter, provider surface, or product workflow.

## Local targets

The slice may update the root layout and landing route, add the `/explore` route, add local landing/discovery components, add focused UI-S01 tests, and add one selected decorative asset under `apps/web/public/brand/`. It uses the existing local Logo, Button, Card, Badge, `cn`, and token system without adding a dependency.

The landing explains the product direction in present-tense local terms only. Explore identifies one RiskScan discovery item and its bounded-assessment purpose. Navigation links only between the two committed local routes.

## Truthfulness boundary

UI-S01 must not render or imply a request action, price, wallet, payment state, provider, account, metric, evidence, external link, detail route, paid state, mock result, or live availability. It must not add a client-side adapter, API request, authentication, analytics, hosted font, or credential.

## Acceptance evidence

- The two routes have one main landmark and one clear page heading each.
- Navigation is labeled and links only to committed local routes.
- The discovery card is descriptive and read-only; it presents no unavailable action or economic claim.
- Focused static tests, web typecheck, production build, local-reference guard, and desktop/narrow browser checks pass.

RiskScan detail and paid-state UI remain separate work until typed domain states and their own contracts are ready.
