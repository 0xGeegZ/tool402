# Tool402 ETHOnline implementation agent rules

This clean repository is the implementation, runtime-queue, evidence, and submission authority. Committed local specifications and later in-event amendments are the local authority for behavior.

- Begin with the local CP-S00 queue authorities and resume from committed docs/work-queue/STATE.md, never chat history.
- The root alone mutates queue state; humans add new runtime tasks to docs/work-queue/queue/00-inbox.
- Record only local tasks, specifications, and UI slices that exist in this repository at the time of their commit.
- Use TDD, isolated worktrees for eligible module work, independent review, and targeted verification for each local task.
- Preserve human authority over wallets, accounts, funded/live actions, deployments, demo narration, and submission.
- No agent may treat uncommitted material, mock UI state, or copied artifact as runtime/evidence truth.

## Spec-driven delivery

Before meaningful product behavior lands, create and commit a runtime-local product overview through 00-inbox and the local task catalog. It is a current product brief, not a detailed system design.

Before implementing behavioral work, commit the minimum implementation-local specification. Use the sequence: eligible task, minimum local specification commit, RED executable contract where applicable, minimal implementation, targeted verification, independent review, and integration. Amend intended behavior in the specification before implementing it.

Only dependency-satisfied cards with disjoint ownership may run in parallel. Do not begin product work until the local queue records the accepted foundation, validation, workspace, and reproducibility/integration gates required by that card.

## Local-reference boundary

Every tracked document reference must resolve to a file committed in this repository at the same commit. Before each non-empty commit, keep the local Git-metadata guard enabled. Do not disable or bypass it.
