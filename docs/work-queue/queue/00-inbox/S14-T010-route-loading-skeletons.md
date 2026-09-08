# S14-T010 — Route loading skeletons

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: M02-T020 accepted, M02-T040 accepted, M11-T020 accepted, M29-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly eight `loading.tsx` files named by the local UI manifest, one
  presentational skeleton component at
  `apps/web/src/components/ui/skeleton.tsx`, and one focused test at
  `apps/web/tests/route-loading-skeletons.test.mjs`.
- Human actions: none. This presentation card grants no authority over
  configuration, identity, providers, payments, transactions, deployment, or
  submission.

## Scope

No accepted route declares loading UI, so navigation holds the previous page
still and then replaces it. Add eight route-specific framework loading files so
each navigated-to segment reserves only its own truthful shape while it renders.
The manifest records each exact route, fixed region order, and why the static
root route is excluded.

The local contract is the [UI-S14 route loading skeleton manifest](../../../ui/UI-S14.md).
The accepted slice history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The eight `loading.tsx` paths are additions beside accepted routes rather
  than edits to them, so they are disjoint from every accepted card's owned
  paths. The named skeleton component and focused test are new files, disjoint
  from the sibling status card, which names its own two files.
- The local UI manifest fixes every loading file's exact region count and
  order before code, so no skeleton can promise a route shape it does not
  render.

## Verification

- A durable RED test precedes the source change and fails because the nine
  declared source paths do not exist.
- Focused tests prove each loading file's exact region count and order, the
  decorative and assistive-technology-hidden treatment, the reduced-motion
  behavior, and the absence of text, implied values, and runtime behavior.
- `npm run typecheck --workspace @tool402/web`, `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- This slice has no owned asynchronous pending trigger and therefore cannot
  claim replacement or layout-shift browser evidence. A later card that owns
  that trigger must prove it; this card's source contract limits its classes
  to narrow-layout-safe static markup.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

Skeletons stand for layout, never for values. Its exclusions are the manifest's
truthfulness and authority boundary, which governs; this card does not restate
them.
