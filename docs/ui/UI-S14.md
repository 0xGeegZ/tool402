# UI-S14 route loading skeleton manifest

## Delivery boundary

No accepted route declares loading UI. Navigating between them holds the
previous page still, then replaces it. UI-S14 adds framework loading files so a
navigated-to segment reserves its shape while it renders.

It is presentation only. It changes no route behavior and no data flow.

The source material for this adaptation remains outside the repository. This
manifest records the local target boundary only; it stores no source
identifier, URL, checksum, or clone information.

## Local targets and exact structural order

A framework loading file covers its own segment and every descendant that does
not declare its own. The former four-file grouping would have joined routes
whose visible shells diverge, so this slice instead adds eight route-specific
files. Each child loader prevents its parent from standing in for a different
route shape.

Each loading file uses a fixed ordered list of structural
`data-skeleton-region` values. These are implementation-only layout labels,
not user-facing text or claims:

| File | Exact route | Regions in order |
| --- | --- | --- |
| `apps/web/src/app/explore/loading.tsx` | `/explore` | `heading`, `risk-scan-discovery`, `directory-inspection` |
| `apps/web/src/app/explore/riskscan/loading.tsx` | `/explore/riskscan` | `navigation`, `heading`, `inputs`, `result-boundary`, `configuration-boundary` |
| `apps/web/src/app/explore/riskscan/try/loading.tsx` | `/explore/riskscan/try` | `heading`, `request-boundary` |
| `apps/web/src/app/explore/riskscan/tool-loop/loading.tsx` | `/explore/riskscan/tool-loop` | `heading`, `tool-loop-boundary` |
| `apps/web/src/app/dashboard/loading.tsx` | `/dashboard` | `heading`, `guest-context`, `overview`, `navigation` |
| `apps/web/src/app/dashboard/riskscan/loading.tsx` | `/dashboard/riskscan` | `heading`, `intro`, `directory-step`, `compatibility-step`, `tool-loop-step` |
| `apps/web/src/app/dashboard/riskscan/compatibility/loading.tsx` | `/dashboard/riskscan/compatibility` | `heading`, `intro`, `compatibility-boundary` |
| `apps/web/src/app/dashboard/riskscan/preflight/loading.tsx` | `/dashboard/riskscan/preflight` | `heading`, `intro`, `preflight-boundary` |

The loaders for `/explore/riskscan`, `/explore/riskscan/try`,
`/explore/riskscan/tool-loop`, `/dashboard/riskscan/compatibility`, and
`/dashboard/riskscan/preflight` mirror centered `article` shells. Their `main`
element must therefore carry both `mx-auto` and `max-w-3xl`; a left-aligned
placeholder would create a visible horizontal jump on wide screens.

The root route `/` is deliberately excluded: it is a static landing page with
nothing to await, so a skeleton there would flash a placeholder over content
that is already ready.

The slice may also add `apps/web/src/components/ui/skeleton.tsx`, one
presentational placeholder block, and
`apps/web/tests/route-loading-skeletons.test.mjs`. It changes no existing
route, component, stylesheet, or shared UI source.

It reuses the accepted tokens and primitives and adds no dependency.

## Required skeleton behavior

Each loading file mirrors only its one route's fixed shell: the same structural
regions in the same order and at approximately the same size. The primitive
must render a text-free decorative block with `aria-hidden="true"`,
`motion-safe:animate-pulse`, and `motion-reduce:animate-none`. It has no
client state, no runtime input, and no behavior beyond static layout.

A placeholder count is fixed and structural. It may stand only for a region the
route always renders, never for a variable collection, so no skeleton can
imply how many items will arrive.

Skeletons are decorative. They carry no text, are hidden from assistive
technology, and honor the accepted reduced-motion preference: where motion is
reduced, the placeholder is static rather than animated.

## Truthfulness and authority boundary

A skeleton must not imply a count, a result, a price, a balance, an identity, a
payment, or a live state. Placeholder blocks stand for layout, never for
values. The slice adds no client state, fetch, storage, configuration read,
timer, environment read, dependency, route, or full-tree import.

## Acceptance evidence

- A focused source contract covers every exact path and the fixed region count
  and order above, the decorative and assistive-technology-hidden treatment,
  the reduced-motion behavior, and the absence of text, values, and forbidden
  runtime capabilities.
- The current routes are synchronous and this slice owns no test-only pending
  trigger. It therefore makes no browser claim about replacement or layout
  shift. Browser replacement evidence belongs only to a later card that owns
  an asynchronous route boundary; this slice may verify static skeleton markup
  and narrow-layout-safe classes only.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
