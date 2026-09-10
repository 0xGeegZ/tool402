# M46-T010 activation review

## Scope

Independent activation review at clean pushed `c0c05b0` of the ready M46 card,
accepted predecessor, Core baseline, active lanes, and exact declared targets.

## Findings

- M02-T050 is accepted and the M46 ready authority is resolvable.
- `packages/core/src/entity-check.ts`,
  `packages/core/test/entity-check.test.mjs`, and
  `packages/core/test/entity-check.types.ts` are absent.
- M45 and blocked M44 are Web-only; no active path owns the Core target set.
- Under Node 22.21.1, Core typecheck, 136 tests, lint, and queue validation
  pass.

## Verdict

CLEAR — activate M46 only for the two declared test-only RED fixtures. The
source module, public barrel, I/O, source adapter, API, Directory, UI,
configuration, and live behavior remain prohibited pending RED acceptance.
