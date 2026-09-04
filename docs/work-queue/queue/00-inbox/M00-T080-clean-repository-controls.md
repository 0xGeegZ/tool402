# M00-T080 — Local clean-repository controls

## Purpose

Confirm the local G0 posture and responsibility boundaries after M00-T070, so that later foundation work starts from an auditable local queue.

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependency: M00-T070 accepted
- Owner: root integrator

## Scope

This card may update local queue state, ownership, catalog, decision, and human-action records. It does not create product code, packages, credentials, accounts, deployments, or runtime claims.

## Acceptance criteria

1. M00-T070 is accepted locally and all conditional claims have a supported GO or CUT.
2. The clean local history, root ownership, local-reference boundary, and local guard are independently reviewed.
3. Every later foundation card names its local dependencies, owned paths, validation, workspace boundary, reproducibility/integration proof, and required human actions before entering 10-ready.
4. Missing mandatory local facts block dependent product-code dispatch; optional unresolved decisions block only their dependent cards.

## Validation

- `git status --short --branch` is clean.
- The local guard passes on the staged change.
- `git diff --check` passes.
- An independent operations review confirms queue, ownership, and state consistency.

## Completion transition

After acceptance, move this file to `docs/work-queue/queue/60-done/`, update the catalog and state, and create the runtime-local Product Overview item before any technical foundation card.
