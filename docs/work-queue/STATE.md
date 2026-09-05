# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M03 product delivery (accepted)
- CURRENT_TASK: M03-T030 (00-inbox)
- ACTIVE_LANES: none
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md, docs/specs/m02-riskscan-backend-projection.md, docs/specs/m02-riskscan-quick.md, docs/specs/m02-riskscan-x402-api.md, docs/specs/m03-riskscan-receipt-evidence.md, docs/specs/m03-riskscan-payment-state-provenance.md, docs/specs/m03-riskscan-settlement-observer.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/UI-S01.md, docs/ui/UI-S02.md, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: M03-T030 is recorded in 00-inbox. The root must complete its own ready checks before dispatch; durable state, external settlement assurance, API/UI changes, and live evidence remain separate local work.
- LAST_QUEUE_VALIDATION: M03-T020 remains accepted. M03-T030 now has a local contract and plan for an optional single-process observer; it cannot enter 10-ready until the root rechecks accepted dependencies, disjoint web ownership, the transient-data boundary, human actions, and concrete validation.

No secrets, account keys, or private evidence belong in this file.
