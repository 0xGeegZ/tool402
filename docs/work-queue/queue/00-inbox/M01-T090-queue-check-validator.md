# M01-T090 — Queue validation gate

## Purpose

Create the local queue-validation gate that prevents dependency, ownership, state, and reference-boundary violations before broader M01 scaffolds may become ready.

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependency: M01-T010 accepted
- Owner: root integrator owns queue state and integration; an implementer may modify only the later validator records named in its committed local specification.

## Scope

Before implementation, commit the minimum local validation specification and an executable RED contract. The validator must assess only committed local queue records and must fail closed on invalid or ambiguous state. Exact implementation paths, test paths, and ownership are recorded only in the commits that create them.

The task must not create product behavior, application/package implementation, external integration, credentials, deployment, account, wallet, or payment activity. It does not make any broader M01 scaffold task eligible until its own independent review is accepted.

## Acceptance criteria

1. A minimum local validation specification and RED executable contract are committed before validator implementation.
2. A local queue-validation command returns zero only for a coherent committed queue state and returns nonzero with actionable local diagnostics for invalid state.
3. The validator has targeted positive and negative test coverage for its local rules.
4. No source material, external identifier, or runtime/product behavior is imported by this foundation card.
5. Targeted validation and an independent review are accepted before the card moves to 60-done.

## Validation

- The local queue-validation command
- Targeted positive and negative validator tests
- npm root quality commands
- git diff --check
- Local reference guard before each non-empty commit

## Completion transition

After accepted review, move this card to 60-done. Only then may dependency-satisfied M01 scaffold cards be evaluated for readiness.
