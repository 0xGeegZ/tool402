# M01-T090 — Queue validation gate

## Purpose

Create the local queue-validation gate that prevents dependency, ownership, state, and reference-boundary violations before broader M01 scaffolds may become ready.

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependency: M01-T010 accepted
- Owner: root integrator accepted the recorded delivery cap after root verification.

## Scope

The committed local validation specification is [M01 queue check](../../../specs/m01-queue-check.md). The implementation plan is [M01 queue check plan](../../../superpowers/plans/2026-09-04-m01-queue-check.md).

The validator checks only committed local package boundary, catalog/card/state coherence, accepted dependencies, local specification paths, and local Markdown-link resolution. A user-authorized, exact local Markdown parser is limited to this command; the root integrator alone owns its manifest and lockfile update. It fails closed with stable local diagnostics. It must not validate or infer product claims, deployments, accounts, wallets, payments, external systems, or external-source truth.

Exact validator implementation and test paths are `scripts/queue-check.mjs` and `tests/queue-check.test.mjs`. The controlled parser is a developer-only foundation dependency, not product behavior. No application/package implementation, credential, deployment, or live interaction is part of this card.

## Acceptance criteria

1. The minimum local validation specification and RED executable contract are committed before validator implementation.
2. The local queue-validation command returns zero only for a coherent committed queue state and returns nonzero with actionable local diagnostics for invalid state.
3. The validator has targeted positive and negative test coverage for package drift, catalog/card mismatch, dependency state, local specification path, and local Markdown-link failures.
4. No product behavior, external identifier, or runtime behavior is imported by this foundation card.
5. Targeted validation and either an independent review or a recorded human-directed delivery cap are accepted before the card moves to 60-done.

## Validation

- npm run queue:check
- Targeted Node native tests
- npm root quality commands
- git diff --check
- Local reference guard before each non-empty commit

## Accepted evidence

1. The initial independent review found four concrete defects; each has a targeted RED/GREEN regression covering package-boundary drift, GFM table links, diagnostic ordering, or a dangling outward symlink component.
2. The corrective implementation passes 35 targeted Node native tests, `npm run queue:check`, and whitespace validation under Node 22.21.1.
3. The user directed that the corrective pass is the last review gate for this card; that delivery cap is recorded in D-M01-090-003 rather than represented as an unperformed clean review.

## Completion transition

Accepted under the recorded user-directed delivery cap. Dependency-satisfied M01 scaffold cards may now be evaluated for readiness.
