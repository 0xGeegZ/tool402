# Runtime task catalog

This catalog starts empty. It contains only cards committed in this clean repository.

Record each local card before moving it to 10-ready. A local predecessor satisfies a dependency only after its accepted completion is recorded here and in the queue state.

| Task ID | Module | Tier | State | Local record | Dependencies | Owned paths/resources | Human actions | Validation |
|---|---|---|---|---|---|---|---|---|
| M00-T070 | G0 controls | CORE_P0 | 50-blocked | docs/work-queue/queue/50-blocked/M00-T070-partner-revalidation.md | none | Card, qualification matrix, HUMAN-ACTIONS.md, DECISIONS.md | HA-M00-T070-01 | Dated-evidence matrix review; unsupported claims are CUT. |
| M00-T080 | G0 controls | CORE_P0 | 00-inbox | docs/work-queue/queue/00-inbox/M00-T080-clean-repository-controls.md | M00-T070 accepted | Card, STATE.md, FILE-OWNERSHIP.md, TASK-CATALOG.md, DECISIONS.md, HUMAN-ACTIONS.md | none | Clean local queue, ownership, and guard review. |
