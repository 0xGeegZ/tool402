# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M02 product delivery
- CURRENT_TASK: M02-T030 (00-inbox)
- ACTIVE_LANES: none
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/IMPORT-LEDGER.md; M02-T040 is registered in 00-inbox and has no committed UI-S01 manifest yet
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: M02-T030 and M02-T040 are registered in 00-inbox. Commit their minimum local contracts and owned-path preflight before moving either to 10-ready; detail and paid-state UI remain blocked by typed domain states.
- LAST_QUEUE_VALIDATION: M02-T010 and M02-T020 passed their focused RED/GREEN checks, local-reference guard, independent review convergence, and targeted runtime verification; UI browser evidence covers desktop and narrow widths, and the production webpack build completed with Cache Components enabled.

No secrets, account keys, or private evidence belong in this file.
