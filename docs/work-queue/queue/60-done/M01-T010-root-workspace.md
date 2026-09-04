# M01-T010 — Root workspace boundary

## Purpose

Establish the smallest local monorepo boundary as the first technical foundation, without starting product behavior.

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependency: P00-T010 accepted
- Owner: root integrator accepted the independent task review.

## Scope

The committed local foundation specification is [M01 root workspace](../../../specs/m01-root-workspace.md). The implementation plan is [M01 root workspace plan](../../../superpowers/plans/2026-09-04-m01-root-workspace.md).

The accepted scaffold contains only the root manifest, root lockfile, root npm configuration, and a root README update. It declares the apps/* and packages/* workspace layout, Node 22/npm 10 toolchain boundary, and root quality-command entry points. Quality commands no-op only while both workspace roots are absent, then fan out to declared workspaces when either root exists. The later M01-T090 controlled parser exception is governed by its own local specification; it does not authorize product or workspace dependencies.

The root queue:check command remains an intentionally failing deferred contract until M01-T090 creates the validator. No stub or product behavior landed with this card.

## Accepted evidence

1. The root boundary declares exactly apps/* and packages/*, requires Node 22/npm 10, and exposes typecheck, lint, test, build, and queue-validation command entry points.
2. The missing-root-boundary RED condition and declared-workspace GREEN condition were recorded.
3. Fresh Node 22/npm 10 checks passed for the workspace query, root quality commands, exact-version rule, and whitespace.
4. The unknown-workspace and deferred queue-validation commands each exited nonzero as required.
5. An independent task review found no Critical, Important, or Minor finding.

## Completion transition

Accepted after independent task review. M01-T090 is now the only next technical foundation gate; no broader M01 scaffold lane may begin before it is accepted.
