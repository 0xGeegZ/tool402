# Runtime task catalog

This catalog starts empty. It contains only cards committed in this clean repository.

Record each local card before moving it to 10-ready. A local predecessor satisfies a dependency only after its accepted completion is recorded here and in the queue state.

| Task ID | Module | Tier | State | Local record | Dependencies | Owned paths/resources | Human actions | Validation |
|---|---|---|---|---|---|---|---|---|
| M00-T070 | G0 controls | CORE_P0 | 60-done | docs/work-queue/queue/60-done/M00-T070-eligibility-revalidation.md | none | Card, qualification matrix, STATE.md, HUMAN-ACTIONS.md, DECISIONS.md, TASK-CATALOG.md, AI_USAGE.md | none | Dated primary-evidence matrix accepted after independent review; unsupported claims are CUT. |
| M00-T080 | G0 controls | CORE_P0 | 60-done | docs/work-queue/queue/60-done/M00-T080-clean-repository-controls.md | M00-T070 accepted | Card, STATE.md, FILE-OWNERSHIP.md, TASK-CATALOG.md, DECISIONS.md, HUMAN-ACTIONS.md, AI_USAGE.md, ORCHESTRATOR-RUNBOOK.md, WORKTREE-POLICY.md | none | Clean history, local queue, ownership, guard, and workspace-policy review accepted after independent operations review. |
| P00-T010 | Product brief | CORE_P0 | 60-done | docs/work-queue/queue/60-done/P00-T010-product-overview.md | M00-T080 accepted | Card, docs/product/OVERVIEW.md, STATE.md, TASK-CATALOG.md, FILE-OWNERSHIP.md, DECISIONS.md, AI_USAGE.md | none | Local brief content, word-count range, local-reference boundary, and independent review accepted. |
| M01-T010 | M01 foundation | CORE_P0 | 00-inbox | docs/work-queue/queue/00-inbox/M01-T010-root-workspace.md | P00-T010 accepted | Card and root-integrator queue records | none | Minimum local foundation specification, scaffold smoke expectations, targeted workspace validation, and independent review. |
