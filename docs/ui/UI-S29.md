# UI-S29 Application shell visual reconciliation manifest

## Purpose

UI-S29 brings the shared Tool402 header, truthful scope banners, desktop
navigation, mobile navigation, home link, and provider CTA into the selected
prepared visual language. It is the first shell pass in the human-directed
full-application visual program and does not import the prepared source tree.

## Local targets

The slice may amend only:

- `apps/web/src/app/layout.tsx`;
- `apps/web/src/components/discovery/local-navigation.tsx`;
- `apps/web/tests/landing-explore.test.mjs`;
- `apps/web/tests/workspace-shell.test.mjs`; and
- `apps/web/tests/guided-demo-route.test.mjs` only at its frozen navigation
  assertion.

## Visual and route contract

The shell retains its two current truthful testnet/local-boundary strips. The
logo remains an accessible link to `/`; the desktop header keeps exactly the
four existing local navigation hrefs (`/explore`, `/#how-it-works`, `/demo`,
and `/provider`) and the existing `/provider/deploy` CTA. At narrow widths the
desktop links do not wrap: a compact Explore link and an accessible menu
trigger reveal the same local navigation and the existing CTA in a right-side
sheet. No external or invented route is added.

The active path treatment, hover/focus styles, compact header sizing, and
desktop/mobile breakpoint follow the selected prepared shell's hierarchy. The
mobile trigger has an accessible name; links close the sheet. Existing local
copy continues to describe testnet and local-route boundaries only.

## Explicit exclusions

No new navigation destination, data read, mock/prototype claim, account,
wallet, provider, payment, transaction, deployment, external URL, asset,
dependency, global CSS file, analytics, configuration, or backend/Agent/Core
behavior is allowed. The two truthful strips must not be removed or replaced
with the prepared source's mock-data language.

## Acceptance evidence

- A durable RED test proves the compact mobile menu and exact current route
  map are absent before source work.
- Focused tests prove the exact links, CTA, home link, two truthful strips,
  mobile accessible control, no external href, and unchanged content
  boundaries.
- Desktop and 390px browser checks prove no overflow, no wrapped desktop nav,
  keyboard operation of the menu, visible focus, and that every CTA resolves
  to the declared local route.
- Web typecheck, focused tests, whitespace, queue/reference checks, local
  guard, and independent task/module review are clear before integration.
