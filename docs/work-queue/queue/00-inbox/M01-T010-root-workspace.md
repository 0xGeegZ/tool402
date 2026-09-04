# M01-T010 — Root workspace boundary

## Purpose

Establish the smallest local monorepo boundary as the first technical foundation, without starting product behavior.

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependency: P00-T010 accepted
- Owner: root integrator creates the task specification and integrates the foundation; independent review is required before acceptance.

## Scope

Before scaffold implementation, create and commit the minimum local foundation specification and a reviewable scaffold-smoke expectation. The eventual root workspace boundary must declare `apps/*` and `packages/*`, support the root quality commands, and remain free of application, backend, UI-route, payment, wallet, account, deployment, or external-integration behavior.

Exact tracked implementation paths and their ownership are recorded only in the commit that creates them. No package installation, credential, funded action, or live interaction is part of this card.

## Acceptance criteria

1. A minimum local foundation specification is committed before any root-workspace scaffold is created.
2. The root boundary declares the intended `apps/*` and `packages/*` workspace layout and exposes concrete quality-command entry points.
3. The scaffold smoke expectation distinguishes the missing-root-boundary failure from the passing declared-workspace case.
4. No product behavior or external side effect is introduced.
5. Targeted validation and an independent review are accepted before the card moves to 60-done.

## Validation

- `npm pkg get workspaces`
- `npm run --workspaces --if-present typecheck`
- `git diff --check`
- Local reference guard before each non-empty commit

## Completion transition

After accepted review, move this card to 60-done. M01-T090 remains the next foundation gate; no broader M01 scaffold lane may begin before that gate is accepted.
