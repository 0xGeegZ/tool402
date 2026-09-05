# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M03 product delivery (accepted)
- CURRENT_TASK: M03-T020 (60-done)
- ACTIVE_LANES: none
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md, docs/specs/m02-riskscan-backend-projection.md, docs/specs/m02-riskscan-quick.md, docs/specs/m02-riskscan-x402-api.md, docs/specs/m03-riskscan-receipt-evidence.md, docs/specs/m03-riskscan-payment-state-provenance.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/UI-S01.md, docs/ui/UI-S02.md, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: none. The root may record the next dependency-satisfied local M03 card after its own ready checks; external settlement mapping, API/UI work, and live evidence remain separate local work.
- LAST_QUEUE_VALIDATION: M03-T020 is accepted after its pure core issued-state provenance RED/GREEN contract, root Node 22.21.1 workspace typecheck/test/lint, queue/reference checks, independent task review, and two final fresh clean module-review generations. External settlement mapping, evidence, and deployment remain separate human-authorized work.

No secrets, account keys, or private evidence belong in this file.
