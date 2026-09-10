# M46-T020 activation review

## Scope

Independent activation review at clean pushed
`0223f7b8a787e0a903b00d3c958674d3f39ae082` of the ready M46-T020 card,
accepted dependencies, ownership reservation, active lanes, declared
test/source paths, queue, and local-reference guard.

## Findings

- HEAD, `origin/main`, and the refreshed remote head are equal, and the
  worktree is clean.
- M01-T040, M02-T050, and M46-T010 are accepted. The card, specification,
  catalog, State, ownership, and ready evidence remain resolvable.
- The pending `HA-ENTITYCHECK-LIVE-001` row is explicitly optional and does
  not block the injected-fetch local delivery.
- `apps/web/tests/entity-check-sources.test.mjs` and
  `apps/web/src/lib/entity-check-sources.ts` are absent and disjoint from
  active paths. Queue validation, whitespace checks, and the enabled
  local-reference guard pass.

## Verdict

CLEAR — activate M46-T020 only for the durable test-only RED contract at
`apps/web/tests/entity-check-sources.test.mjs`. The source adapter,
configuration, source reads, payment, wallet, provider, transaction,
deployment, and live behavior remain prohibited pending RED acceptance.
