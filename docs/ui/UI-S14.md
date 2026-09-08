# UI-S14 route loading skeleton manifest

## Delivery boundary

No accepted route declares loading UI. Navigating between them holds the
previous page still, then replaces it. UI-S14 adds framework loading files so a
navigated-to segment reserves its shape while it renders.

It is presentation only. It changes no route behavior and no data flow.

The source material for this adaptation remains outside the repository. This
manifest records the local target boundary only; it stores no source
identifier, URL, checksum, or clone information.

## Local targets and what each covers

A framework loading file covers its own segment and every descendant segment
that does not declare its own. The slice may add exactly four, chosen so that
each one covers a set of routes that share a shell:

| File | Routes it covers |
| --- | --- |
| `apps/web/src/app/explore/loading.tsx` | `/explore` |
| `apps/web/src/app/explore/riskscan/loading.tsx` | `/explore/riskscan`, `/explore/riskscan/try`, `/explore/riskscan/tool-loop` |
| `apps/web/src/app/dashboard/loading.tsx` | `/dashboard` |
| `apps/web/src/app/dashboard/riskscan/loading.tsx` | `/dashboard/riskscan`, `/dashboard/riskscan/compatibility`, `/dashboard/riskscan/preflight` |

The root route `/` is deliberately excluded: it is a static landing page with
nothing to await, so a skeleton there would flash a placeholder over content
that is already ready.

The slice may also add `apps/web/src/components/ui/skeleton.tsx`, one
presentational placeholder block, and focused tests for each loading file.

It reuses the accepted tokens and primitives and adds no dependency.

## Required skeleton behavior

Each loading file mirrors the shell that every route it covers shares: the same
heading block and the same content regions, in the same order, at approximately
the same size. Where the covered routes diverge below that shared shell, the
skeleton stops at the shared part rather than inventing a shape for one of
them.

A placeholder count is fixed and structural. It may stand only for a region the
covered routes always render, never for a variable collection, so no skeleton
can imply how many items will arrive.

Skeletons are decorative. They carry no text, are hidden from assistive
technology, and honor the accepted reduced-motion preference: where motion is
reduced, the placeholder is static rather than animated.

## Truthfulness and authority boundary

A skeleton must not imply a count, a result, a price, a balance, an identity, a
payment, or a live state. Placeholder blocks stand for layout, never for
values. The slice adds no client state, fetch, storage, configuration read,
timer, environment read, dependency, route, or full-tree import.

## Acceptance evidence

- Focused contracts cover, for each loading file, the shared region count and
  order against every route in its coverage set, the decorative and
  assistive-technology-hidden treatment, the reduced-motion behavior, and the
  absence of text or implied values.
- Desktop and narrow browser checks cover each skeleton, no layout shift when a
  skeleton is replaced, and no horizontal overflow.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
