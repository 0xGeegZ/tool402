# S14 implementation plan — Route loading skeletons

Execution plan for
[S14-T010](../../work-queue/queue/20-active/S14-T010-route-loading-skeletons.md)
against the [UI-S14 route loading skeleton manifest](../../ui/UI-S14.md).

## Goal

Add truthful route-specific static loading layouts without changing any route
behavior, data flow, shared stylesheet, or runtime capability. Each loader
stands only for a fixed layout region of its one route and never for a value,
collection size, result, payment, identity, or live status.

## Sequence

1. Keep this scope amendment, UI ledger row, exact ownership reservation, and
   plan committed. Obtain a fresh independent ready-state review before moving
   S14-T010 from `00-inbox`.
2. Create `apps/web/tests/route-loading-skeletons.test.mjs` first. Its RED
   state must fail only because the eight named loader files and one skeleton
   primitive are absent.
3. Add the server-only `Skeleton` primitive at
   `apps/web/src/components/ui/skeleton.tsx`. It is a text-free decorative
   block with `aria-hidden="true"`,
   `motion-safe:animate-pulse`, and `motion-reduce:animate-none`; it takes
   no runtime input beyond local styling.
4. Add the eight exact loader files listed in UI-S14. Each composes only its
   fixed `data-skeleton-region` order from the manifest. Use a single block
   for each structural region; do not render per-item placeholders, labels,
   buttons, forms, numbers, prices, or values.
5. Make the focused contract GREEN. It must assert exact file ownership,
   server-only imports, the region order/count for every loader, hidden
   decorative treatment, reduced-motion classes, absence of rendered text and
   value-bearing/form elements, and absence of client, fetch, storage, timer,
   environment, provider, payment, and network capabilities.
6. Run focused and full Web validation, root quality, production build,
   queue/local-reference/whitespace checks, the enabled guard, and independent
   review before acceptance.

## Acceptance boundary

The existing pages are synchronous, and this card owns no pending trigger.
Therefore it does not claim a browser-observed replacement or layout-shift
result. It may validate static markup only. A later card that owns an
asynchronous boundary must prove replacement behavior separately.

## Explicit exclusions

Existing route, component, stylesheet, package, lockfile, configuration,
client state, fetch, storage, timer, environment, identity/provider/wallet,
payment, transaction, deployment, and submission changes are excluded.
