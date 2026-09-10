# M46-T040 RED review

## Scope

Independent root review of the delegated RED-only commit
`bc1ab6c12fd3b54ade03989898699c49a9489356` in the human-requested
`.worktrees/entitycheck` worktree, against its parent
`9b650f53bfdefc681f8f19a7c1e58defeba0a6c9`, the M46-T040 card, the local
EntityCheck Tool Directory v2 specification, the compatibility amendment, and
the root FILE-OWNERSHIP reservation.

## Reviewed boundary

- The diff changes exactly the eleven activated M46-T040 test paths. It adds
  no source, route, queue, catalog, ownership, evidence, manifest, lockfile,
  product, or judge-facing documentation change.
- `git diff --check` is clear. The delegated worktree is clean at the reviewed
  commit.
- The focused RED suite reports 86 tests: 43 pass, 37 fail as intended, and
  6 skip. The unchanged RiskScan API/challenge assertions pass 41/41.
- The failing assertions are limited to the absent EntityCheck descriptor and
  the still-v1 canonical Directory/decoder. No unrelated RiskScan regression
  surfaced.

## Required RED contract correction

The descriptor test proves valid native-Hedera metadata, but does not yet prove
the required fail-closed behavior for each of these native configuration
failures:

- missing `ENTITYCHECK_X402_HEDERA_ASSET`;
- malformed `ENTITYCHECK_X402_HEDERA_ASSET`;
- missing `ENTITYCHECK_X402_HEDERA_AMOUNT`; and
- malformed `ENTITYCHECK_X402_HEDERA_AMOUNT`.

The existing `apps/web/tests/entity-check-tool-descriptor.test.mjs` is the
only path authorized for this RED-contract amendment. The amendment must stay
test-only and must not add a descriptor source file, Directory source change,
Agent source change, route, manifest, configuration value, source read,
payment, wallet/provider, transaction, deployment, or live behavior.

## Verdict

BLOCKED — M46-T040 remains `20-active` for the exact test-only correction
above. The reviewed RED commit is not accepted for GREEN, and no GREEN source
path is authorized. After the delegated lane records the additional RED cases,
root must rerun the focused RED review before deciding whether to authorize the
three already-reserved source paths.
