# S14-T010 — Route loading skeletons

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: M02-T020 accepted, M02-T040 accepted, M11-T020 accepted, M29-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  `loading.tsx` files beside the accepted route files under
  `apps/web/src/app/explore/`, `apps/web/src/app/explore/riskscan/`, and
  `apps/web/src/app/dashboard/`, one presentational skeleton component under
  `apps/web/src/components/ui/`, and their focused tests.
- Human actions: none. This presentation card grants no authority over
  configuration, identity, providers, payments, transactions, deployment, or
  submission.

## Scope

No accepted route declares loading UI, so navigation holds the previous page
still and then replaces it. Add four framework loading files so a navigated-to
segment reserves its shape while it renders. The manifest records which routes
each file covers, and why the static root route is excluded.

The local contract is the [UI-S14 route loading skeleton manifest](../../../ui/UI-S14.md).
The accepted slice history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The four `loading.tsx` paths are additions beside accepted routes rather than
  edits to them, so they are disjoint from every accepted card's owned paths.
  The named skeleton component is a new file, disjoint from the sibling status
  card, which names its own two files.
- Each loading file's shared region count and order are read from every route
  in its coverage set before code, so no skeleton can promise content a covered
  route does not render.

## Verification

- A durable RED test precedes the source change and fails because the skeleton
  component does not exist.
- Focused tests prove each loading file's shared region count and order against
  every route in its coverage set, the decorative and assistive-technology-hidden treatment, the reduced-motion
  behavior, and the absence of text or implied values.
- `npm run typecheck --workspace @tool402/web`, `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Desktop and narrow browser checks confirm no layout shift when a skeleton is
  replaced and no horizontal overflow.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

Skeletons stand for layout, never for values. Its exclusions are the manifest's
truthfulness and authority boundary, which governs; this card does not restate
them.
