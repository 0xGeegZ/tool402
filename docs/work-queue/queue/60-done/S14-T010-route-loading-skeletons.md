# S14-T010 — Route loading skeletons

## State

- Tier: POLISH
- Queue state: 60-done
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

## Ready transition

Ready at 2026-09-08T16:51:17Z after a fresh root rescan at pushed
`7d3361379b9ede5210bebc3e1628621d86b410d6`. The independent
[ready review](../../evidence/S14-T010-ready-review.md) found all dependencies
accepted, exact new paths absent and disjoint, no active ownership conflict,
resolved local records, and no human gate. The amended UI-S14 contract fixes
the exact region order for eight route-specific loaders and makes no
unreproducible browser replacement claim.

This ready state authorizes only a fresh root activation followed by the
declared durable RED contract. It does not authorize loader or skeleton source,
existing route edits, client state, network behavior, configuration,
identity/provider/payment surfaces, deployment, or submission.

## Activation

Activated at 2026-09-08T16:54:35Z after a fresh root rescan and independent
[activation audit](../../evidence/S14-T010-activation-review.md) at pushed
`d7949b462e27c833b823134b34cfb0128aa5206b`. S14 was the sole ready card;
every dependency remained accepted, the working tree and origin/main baseline
were exact, the guard and queue checks passed, and all declared loader,
skeleton, and focused-test paths remained absent and disjoint.

This activation authorizes only the durable RED contract at
`apps/web/tests/route-loading-skeletons.test.mjs`. It does not authorize any
loader or skeleton source, existing route edits, client state, network behavior,
configuration, identity/provider/payment surface, deployment, or submission.

## RED acceptance

The independent [RED review](../../evidence/S14-T010-red-review.md) accepted
the durable contract at pushed `2865fc619bec5f205438fa4e8609fc1b43be1003`.
Under Node 22.21.1 it fails exactly once because all nine declared source paths
remain absent; the GREEN assertions skip without a secondary failure.

Only the eight route-specific `loading.tsx` files and the shared decorative
`skeleton.tsx` named in this card are now authorized for GREEN. Existing route
edits, client state, data access, configuration, identity/provider/payment
surfaces, deployment, submission, and browser replacement claims remain
outside this card.

## Final acceptance

Accepted at 2026-09-08T17:45:53Z after independent final task and module
reviews of source commit `3dc9a4d1b05c5f9b8a96806ca64699b6779bef8c`.

- The eight declared loaders and shared decorative primitive satisfy the exact
  static region contract, including the five centered article-shell loaders.
- The focused S14 contract passed 3/3; the full Web suite passed 100/100;
  Web/root typecheck, test, lint, queue/reference/whitespace checks, and the
  enabled local guard passed under Node 22.21.1.
- The Webpack production build with Cache Components passed. The normal local
  Turbopack production command remains separately blocked by the host denying
  its required port bind; this card makes no deployment or browser replacement
  claim from that host constraint.
- The final [task review](../../evidence/S14-T010-task-review.md) and
  [module review](../../evidence/S14-T010-module-review.md) are clear.

S14-T010 is complete. It adds static presentational loading layouts only; it
does not create a pending trigger, client behavior, data access, identity,
payment, transaction, deployment, or submission capability.
