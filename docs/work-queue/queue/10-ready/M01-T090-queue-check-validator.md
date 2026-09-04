# M01-T090 — Queue validation gate

## Purpose

Create the local queue-validation gate that prevents dependency, ownership, state, and reference-boundary violations before broader M01 scaffolds may become ready.

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependency: M01-T010 accepted
- Owner: root integrator owns queue state and integration; an implementer may modify only the validator records named in the committed local specification.

## Scope

The committed local validation specification is [M01 queue check](../../../specs/m01-queue-check.md). The implementation plan is [M01 queue check plan](../../../superpowers/plans/2026-09-04-m01-queue-check.md).

The validator checks only committed local package boundary, catalog/card/state coherence, accepted dependencies, local specification paths, and local Markdown-link resolution. It fails closed with stable local diagnostics. It must not validate or infer product claims, deployments, accounts, wallets, payments, external systems, or external-source truth.

Exact validator implementation and test paths are recorded only in the commit that creates them. No dependency, application/package implementation, credential, deployment, or live interaction is part of this card.

## Acceptance criteria

1. The minimum local validation specification and RED executable contract are committed before validator implementation.
2. The local queue-validation command returns zero only for a coherent committed queue state and returns nonzero with actionable local diagnostics for invalid state.
3. The validator has targeted positive and negative test coverage for package drift, catalog/card mismatch, dependency state, local specification path, and local Markdown-link failures.
4. No product behavior, external identifier, or runtime behavior is imported by this foundation card.
5. Targeted validation and an independent review are accepted before the card moves to 60-done.

## Validation

- npm run queue:check
- Targeted Node native tests
- npm root quality commands
- git diff --check
- Local reference guard before each non-empty commit

## Completion transition

After accepted review, move this card to docs/work-queue/queue/60-done/. Only then may dependency-satisfied M01 scaffold cards be evaluated for readiness.
