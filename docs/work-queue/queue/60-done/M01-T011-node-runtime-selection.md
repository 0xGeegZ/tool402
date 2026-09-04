# M01-T011 — Node runtime selection

## Purpose

Prevent routine local commands from silently running under a Node major outside the accepted root workspace boundary.

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependency: M01-T010 accepted
- Owner: root integrator accepted the independent task review.

## Scope

The local foundation specification is [M01 Node runtime selection](../../../specs/m01-node-runtime-selection.md). The implementation plan is [M01 Node runtime selection plan](../../../superpowers/plans/2026-09-04-m01-node-runtime-selection.md).

This card adds only the versioned local runtime selector and the concise local setup instruction needed to use it. It does not modify applications, packages, dependencies, product behavior, queue-validator behavior, external systems, accounts, wallets, payments, deployments, or live activity.

## Readiness criteria

1. M01-T010 is accepted locally.
2. The local specification and plan are committed.
3. The owned paths are disjoint from the active validator implementation paths.
4. The Node release named by the selector is available locally for reproducible verification.

## Validation

- Version-selector RED/GREEN smoke
- nvm use and Node/npm version check
- npm run queue:check
- npm root quality commands
- git diff --check
- Local reference guard before each non-empty commit

## Accepted evidence

1. `.nvmrc` contains exactly `v22.21.1` followed by one newline, and the root README directs contributors to run `nvm use` before npm commands.
2. Fresh `nvm use` selected Node 22.21.1 and npm 10.9.4 without installation or download output.
3. The queue check, root typecheck, lint, test, build, and whitespace validation passed under that selected runtime.
4. An independent task review found no Critical, Important, or Minor finding.

## Completion transition

Accepted after independent task review. It does not make a broader M01 scaffold lane eligible; M01-T090 remains the required queue-validation gate.
