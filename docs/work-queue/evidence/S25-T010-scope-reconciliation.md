# S25-T010 scope reconciliation

## Basis

- Control head: `266c786` (`docs: accept static shell test correction`)
- Task state: `00-inbox`; this record grants no source or test authority.
- Accepted neighbouring presentation slices: S22-T010, S24-T010, S31-T010,
  and S32-T010.
- Active unrelated lane: M48-T010 is limited to its declared Backend RED test
  paths and is disjoint from every S25 candidate path.

## Corrections to the intake record

- The S22/S24 active-reservation wording is stale. Their former presentation
  paths are released by their accepted records.
- The current navigation label is `For providers`, not `Provider`; the S25
  migration target is `Campaign` without changing `/provider`.
- The current dashboard eyebrow is `Guest dashboard`, not `Guest workspace`.
- The Provider page reads one accepted local offering projection inside its
  existing `Suspense` boundary. Its S25 description must therefore describe
  current local records without implying that an admitted record exists.
- The accepted UI button primitive is sufficient. S25 adds no dependency,
  client state, route, data read, or behaviour.

## Fixed future scope

The reconciled UI-S25 manifest names the only future source/header blocks,
fixed `PageHeader` anatomy and classes, the two Provider action targets, four
closed outcome sentences, and the exact twelve focused assertion paths. The
following remain verification-only: `riskscan-try.test.mjs`, Provider deploy
behaviour/state tests, and every test not explicitly listed by UI-S25.

The `PageHeader` primitive must import only `Badge`, `buttonVariants`, and
`next/link`; it has no client directive, state, effect, icon, or external
link. Complex route content remains a sibling of the single migrated header.

## Required next control

An independent readiness review must recheck the reconciled controls, source
target presence, new-target absence, exact test ownership, focused baseline,
and M48 disjointness before S25 may move to `10-ready`. A later separate
activation is required before durable RED. Until then, no S25 source or test
path may change.
