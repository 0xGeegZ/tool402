# M01-T010 — Root workspace boundary

## Purpose

Establish the smallest local monorepo boundary as the first technical foundation, without starting product behavior.

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependency: P00-T010 accepted
- Owner: root integrator owns queue records and integration; an implementer may modify only the constrained root workspace records, then an independent reviewer validates the task.

## Scope

The committed local foundation specification is [M01 root workspace](../../../specs/m01-root-workspace.md). The implementation plan is [M01 root workspace plan](../../../superpowers/plans/2026-09-04-m01-root-workspace.md).

The constrained scaffold may create only the root manifest, root lockfile, root npm configuration, and a root README update. It must declare the apps/* and packages/* workspace layout, Node 22/npm 10 toolchain boundary, and root quality-command entry points. It must not create application or package directories, product behavior, backend/UI routes, payment/wallet/account/deployment code, a queue validator, credentials, package dependencies, or live interactions.

The root queue:check command is an intentionally failing deferred contract until M01-T090 creates the validator. No stub is allowed.

## Acceptance criteria

1. The minimum local foundation specification is committed before any root-workspace scaffold is created.
2. The root boundary declares exactly apps/* and packages/*, requires Node 22/npm 10, and exposes typecheck, lint, test, build, and queue-validation command entry points.
3. The scaffold smoke evidence records the missing-root-boundary RED condition and the declared-workspace GREEN condition.
4. The queue-validation command remains visibly unavailable until M01-T090 rather than silently reporting success.
5. No product behavior, installed dependency, or external side effect is introduced.
6. Targeted validation and an independent review are accepted before the card moves to 60-done.

## Validation

- Node 22 and npm 10 runtime check
- npm pkg get workspaces
- npm run --workspaces --if-present typecheck
- Nonzero unknown-workspace check
- Exact-version manifest check
- Expected nonzero npm run queue:check before M01-T090
- git diff --check
- Local reference guard before each non-empty commit

## Completion transition

After accepted review, move this card to docs/work-queue/queue/60-done/. M01-T090 remains the next foundation gate; no broader M01 scaffold lane may begin before that gate is accepted.
