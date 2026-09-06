# UI-S09 guest RiskScan workbench manifest

## Delivery boundary

UI-S09 adds one static guest Dashboard workbench that composes the three
already accepted local RiskScan interactions into an inspect-before-act path.
It reuses existing local layout, typography, Card, Badge, Button, and semantic
Link primitives through their accepted components; it creates no new product
state or client interaction behavior.

## Local targets

The slice may add `apps/web/src/app/dashboard/riskscan/page.tsx`,
`apps/web/src/components/workspace/guest-riskscan-workbench.tsx`, and a focused
workbench test. It may make one constrained Workspace route-map link amendment
and its corresponding focused assertion amendment.

## Truthfulness and authority boundary

The guest workbench merely arranges existing local Directory inspection,
native-compatibility, and unsigned ToolLoop boundaries. It adds no identity,
Sign/session/provider/account/wallet/signer surface; no direct request
construction, API boundary, payment client, storage, configuration,
recipient/facilitator, persistence, result/receipt/evidence, external link,
live claim, or full-tree import. It never represents compatibility as consent
or a challenge as a completed payment.

## Acceptance evidence

- Focused source contracts cover static route semantics, labelled fixed-order
  composition, constrained local navigation, and the exclusion boundary.
- Desktop and narrow browser checks cover rendering, local sequential
  interaction, local navigation, keyboard focus, no horizontal overflow, and
  framework/browser diagnostics.
- Web/root quality, production build, queue, guard, independent review, and
  two clean module-review generations pass before acceptance.
