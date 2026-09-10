# M46-T040 RED acceptance review

## Scope

Independent re-review of the durable RED commits
`d8a96a888d58b6a0048e125fd298cc2ad411542b` and
`ca1d1bfee99fc53e1844dd52237b73fefd8088f3`, against the activated M46-T040
card, the local EntityCheck Tool Directory v2 specification, the compatibility
amendment, and the root FILE-OWNERSHIP reservation.

## Reviewed boundary

- The aggregate diff changes exactly the eleven activated M46-T040 test paths.
  It adds no source, route, queue, catalog, ownership, evidence, manifest,
  lockfile, product, or judge-facing documentation change.
- `git diff --check` is clear. The corrected RED worktree is clean.
- The focused Node 22.21.1 RED suite reports 87 tests: 43 pass, 37 fail as
  intended, and 7 skip. The unchanged RiskScan API/challenge assertions remain
  covered by the focused suite.
- The failing assertions are limited to the absent EntityCheck descriptor and
  the still-v1 canonical Directory/decoder. No unrelated RiskScan regression
  surfaced.
- The correction explicitly covers each required native configuration failure:

- missing `ENTITYCHECK_X402_HEDERA_ASSET`;
- malformed `ENTITYCHECK_X402_HEDERA_ASSET`;
- missing `ENTITYCHECK_X402_HEDERA_AMOUNT`; and
- malformed `ENTITYCHECK_X402_HEDERA_AMOUNT`.

## Verdict

CLEAR — M46-T040 remains `20-active` and may implement minimal local GREEN
only in `apps/web/src/lib/entity-check-tool-descriptor.ts`,
`apps/web/src/lib/tool-directory.ts`, and
`apps/agent/src/riskscan-tool-directory.ts`. The eleven declared test paths
remain reserved for matching test-to-GREEN amendments. The route, active view,
UI, package, lockfile, configuration/environment reads, source reads, payment,
wallet/provider, transaction, deployment, and live behavior remain prohibited.
