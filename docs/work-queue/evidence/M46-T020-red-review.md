# M46-T020 RED review

## Scope

Independent RED review at clean pushed
`860eab43e2a1c5e6487b86c24b1d823565d8ca76` of the M46-T020 card,
clarified local specification, Core type boundary, and durable source-adapter
test contract.

## Findings

- `HEAD` and `origin/main` were equal and the worktree was clean. The declared
  source module remained absent.
- The focused Node 22.21.1 test reports exactly one intended failure for the
  absent `apps/web/src/lib/entity-check-sources.ts` module. Its twelve
  source-dependent assertions skip; no incidental failure occurs.
- The contract fixes fail-closed configuration, injected dependencies, fixed
  bounded registry and sanctions reads, fixture mappings, RFC 4180 CSV,
  raw-byte SHA-256, closed failures, clock validation, and the strict
  twenty-four-hour cache boundary.
- The strengthened fixture covers LF and CRLF CSV, the exact one and sixteen
  MiB caps, malformed registry values, malformed SDN data and metadata,
  canonical-equivalent cache URLs, and clock rollback. It introduces no live
  source call, configuration value, key, wallet, provider, payment,
  transaction, deployment, or other external action.

## Verdict

CLEAR — authorize only `apps/web/src/lib/entity-check-sources.ts` for minimal
local GREEN implementation. All live, provider, wallet, payment, transaction,
deployment, and human-action boundaries remain unchanged.
