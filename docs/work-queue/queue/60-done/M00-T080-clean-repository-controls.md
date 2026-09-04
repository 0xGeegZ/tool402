# M00-T080 — Local clean-repository controls

## Purpose

Confirm the local G0 posture and responsibility boundaries after M00-T070, so that later foundation work starts from an auditable local queue.

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependency: M00-T070 accepted
- Owner: root integrator; independent operations review accepted at 2026-09-04T18:27:06Z

## Scope

This card may update local queue state, ownership, catalog, decision, human-action, orchestration, and workspace-policy records. It does not create product code, packages, credentials, accounts, deployments, or runtime claims.

## Acceptance criteria

1. M00-T070 is accepted locally and all conditional claims have a supported GO or CUT.
2. The clean local history, root ownership, local-reference boundary, local guard, and current-workspace policy are independently reviewed.
3. Every later foundation card names its local dependencies, owned paths, validation, workspace boundary, reproducibility/integration proof, and required human actions before entering 10-ready.
4. Missing mandatory local facts block dependent product-code dispatch; optional unresolved decisions block only their dependent cards.

## Validation

- Before commit, `git status --short --branch` contains only staged root-controlled queue paths for M00-T080 and its immediately created direct successor P00-T010, with no unstaged or untracked changes; after commit, it is clean.
- The fresh-history boundary has no committed paths and the reachable tree contains only local runtime-control files.
- The local guard passes on the staged change.
- `git diff --check` passes.
- An independent operations review confirms queue, ownership, and state consistency.

## Completion transition

Accepted at 2026-09-04T18:27:06Z. The catalog and state now point to the runtime-local Product Overview item, which must complete before any technical foundation card.
