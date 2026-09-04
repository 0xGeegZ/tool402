# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M02 product delivery
- CURRENT_TASK: M02-T010 (10-ready)
- ACTIVE_LANES: none
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: M02-T010 and M02-T020 are ready with disjoint core and web ownership. Move each independently to 20-active for RED/GREEN implementation; UI-S01 may be registered after the shell contract is accepted.
- LAST_QUEUE_VALIDATION: M01-T020, M01-T030, and M01-T040 passed targeted RED/GREEN checks, root test/typecheck/lint/build, queue:check, local-reference guard, and independent review; the web typecheck generates local Next route types before TypeScript

No secrets, account keys, or private evidence belong in this file.
